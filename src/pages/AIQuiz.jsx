import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Check, X, Loader2, Sparkles, Brain, Zap, Volume2, VolumeX } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { awardUserPoints } from '@/utils/gamification';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIQuiz() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get('topicId');
  const competencyId = urlParams.get('competencyId');
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const { isEnabled: voiceEnabled, toggle: toggleVoice, speak, stop: stopVoice } = useSpeech();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const createAttemptMutation = useMutation({
    mutationFn: (data) => base44.entities.QuizAttempt.create(data),
    onSuccess: () => queryClient.invalidateQueries(['attempts'])
  });

  const { data: topic } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      if (!topicId) return null;
      const topics = await base44.entities.Topic.filter({ id: topicId });
      return topics[0];
    },
    enabled: !!topicId
  });

  const { data: competency } = useQuery({
    queryKey: ['competency', competencyId],
    queryFn: async () => {
      const id = competencyId || topic?.competency_id;
      if (!id) return null;
      const comps = await base44.entities.Competency.filter({ id });
      return comps[0];
    },
    enabled: !!(competencyId || topic?.competency_id)
  });

  useEffect(() => {
    // Start generating questions when we have competency or topic data
    if (competency || topic) {
      generateQuestions();
    }
  }, [competency, topic]);

  useEffect(() => {
    if (voiceEnabled && currentQuestion && !showResult) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        speak(`${currentQuestion.question_text}. ${currentQuestion.options.map((o, i) => `Option ${String.fromCharCode(65 + i)}. ${o}`).join('. ')}`);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      stopVoice();
    }
  }, [currentIndex, currentQuestion, voiceEnabled, showResult, speak, stopVoice]);

  const generateQuestions = async () => {
    setIsGenerating(true);
    const context = topic?.title || competency?.title || 'Pharmacy';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 5 multiple choice questions about "${context}" for pharmacy students.
      
      Requirements:
      - Questions should be educational and relevant to pharmacy practice
      - Each question should have 4 options (A, B, C, D)
      - Include the correct answer index (0-3)
      - Make questions progressively harder
      - Focus on practical knowledge`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question_text: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_answer: { type: "number" },
                difficulty: { type: "string" }
              }
            }
          }
        }
      }
    });

    setQuestions(response.questions || []);
    setIsGenerating(false);
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleAnswer = async (answerIndex) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === currentQuestion.correct_answer;
    setAnswers([...answers, {
      question: currentQuestion.question_text,
      selected_answer: answerIndex,
      correct_answer: currentQuestion.correct_answer,
      is_correct: isCorrect
    }]);

    // Generate AI explanation for wrong answers
    if (!isCorrect) {
      setLoadingExplanation(true);
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `A pharmacy student answered this question incorrectly:
        
Question: ${currentQuestion.question_text}
Options: ${currentQuestion.options.map((o, i) => `${i}: ${o}`).join(', ')}
Student's answer: ${currentQuestion.options[answerIndex]}
Correct answer: ${currentQuestion.options[currentQuestion.correct_answer]}

Provide a helpful, encouraging explanation (2-3 sentences) that:
1. Explains why the correct answer is right
2. Clarifies the misconception
3. Gives a memory tip if helpful`,
        response_json_schema: {
          type: "object",
          properties: {
            explanation: { type: "string" }
          }
        }
      });
      setAiExplanation(response.explanation);
      setLoadingExplanation(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAiExplanation('');
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const score = answers.filter(a => a.is_correct).length;

    // Create attempt record
    const attempt = await createAttemptMutation.mutateAsync({
      competency_id: competencyId || topic?.competency_id || 'general',
      topic_id: topicId || '',
      mode: 'ai_generated',
      answers: answers.map(a => ({
        question_text: a.question,
        selected_answer: a.selected_answer,
        is_correct: a.is_correct
      })),
      score: score,
      total_questions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      time_spent_seconds: 0, // AI quiz doesn't track time yet, default to 0
      is_completed: true,
      completed_at: new Date().toISOString()
    });

    // GENIUS REWARD SYSTEM
    const participationPoints = questions.length * 10;
    const accuracyPoints = score * 20;
    let totalReward = participationPoints + accuracyPoints;

    if (score === questions.length && questions.length > 0) {
      totalReward += 100; // Perfect score bonus
    }

    if (user?.id) {
      await awardUserPoints(user.id, totalReward);
    }

    navigate(createPageUrl(`QuizResults?attemptId=${attempt.id}`));
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <p className="text-white font-medium">AI is generating questions...</p>
          <p className="text-slate-500 text-sm">Tailored for {topic?.title || competency?.title || 'you'}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
          <X className="w-10 h-10 text-rose-400" />
        </div>
        <p className="text-white font-medium mb-2">Couldn't generate questions</p>
        <p className="text-slate-500 text-sm mb-6">Please try again</p>
        <Button onClick={generateQuestions} className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <Zap className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={createPageUrl('Questions')}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-full">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-white text-sm font-medium">AI Quiz</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={`rounded-full ${voiceEnabled ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <div className="glass-card px-3 py-1.5 rounded-full">
            <span className="text-white text-sm font-medium">
              {currentIndex + 1}<span className="text-slate-500">/{questions.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card className="glass-card border-0 p-6 glow-effect relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full ${currentQuestion.difficulty === 'hard' ? 'bg-rose-500/20 text-rose-400' :
                  currentQuestion.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                  {currentQuestion.difficulty || 'medium'}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options?.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correct_answer;
                  const showCorrectStyle = showResult && isCorrect;
                  const showWrongStyle = showResult && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={showResult}
                      whileTap={{ scale: showResult ? 1 : 0.98 }}
                      className={`
                        w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4
                        ${!showResult && !isSelected ? 'glass-card hover:bg-white/10' : ''}
                        ${!showResult && isSelected ? 'bg-indigo-600/30 border-2 border-indigo-500' : ''}
                        ${showCorrectStyle ? 'bg-emerald-600/30 border-2 border-emerald-500' : ''}
                        ${showWrongStyle ? 'bg-rose-600/30 border-2 border-rose-500' : ''}
                        ${showResult && !showCorrectStyle && !showWrongStyle ? 'glass-card opacity-40' : ''}
                      `}
                    >
                      <span className={`
                        w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                        ${!showResult ? 'bg-slate-700/50 text-slate-300' : ''}
                        ${showCorrectStyle ? 'bg-emerald-500 text-white' : ''}
                        ${showWrongStyle ? 'bg-rose-500 text-white' : ''}
                      `}>
                        {showCorrectStyle ? <Check className="w-5 h-5" /> :
                          showWrongStyle ? <X className="w-5 h-5" /> :
                            String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-white text-sm">{option}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* AI Explanation for wrong answers */}
              {showResult && selectedAnswer !== currentQuestion.correct_answer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-indigo-400 font-semibold text-sm mb-1">AI Explanation</p>
                      {loadingExplanation ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing your answer...
                        </div>
                      ) : (
                        <p className="text-slate-300 text-sm leading-relaxed">{aiExplanation}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {showResult && selectedAnswer === currentQuestion.correct_answer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
                >
                  <p className="text-emerald-400 text-sm font-medium">✨ Excellent! You got it right!</p>
                </motion.div>
              )}
            </div>
          </Card>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-6 text-lg font-semibold shadow-xl shadow-indigo-500/20"
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div >
  );
}