import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, RotateCcw, Home, Loader2, Sparkles, Check, X, Clock, ChevronDown, ChevronUp, History, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const attemptId = urlParams.get('attemptId');

  const [user, setUser] = useState(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: attempt, isLoading: loadingAttempt } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: async () => {
      const list = await base44.entities.QuizAttempt.filter({ id: attemptId });
      return list[0];
    },
    enabled: !!attemptId
  });

  const { data: allQuestions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: previousAttempts = [] } = useQuery({
    queryKey: ['previous-attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ created_by: user?.email, is_completed: true }, '-created_date', 10),
    enabled: !!user
  });

  const score = attempt?.score || 0;
  const total = attempt?.total_questions || 1;
  const percentage = attempt?.percentage || 0;
  const timeSpent = attempt?.time_spent_seconds || 0;
  const answers = attempt?.answers || [];

  // Map questions by ID
  const questionsMap = {};
  allQuestions.forEach(q => { questionsMap[q.id] = q; });

  useEffect(() => {
    if (attempt) {
      generateAIFeedback();
    }
  }, [attempt]);

  const generateAIFeedback = async () => {
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a wise and encouraging AI study assistant. A student just completed a quiz with the following results:
        - Score: ${score} out of ${total} (${percentage}%)
        - Time spent: ${Math.floor(timeSpent / 60)} minutes ${timeSpent % 60} seconds
        
        Provide a brief, personalized feedback message (2-3 sentences) that:
        1. Acknowledges their performance appropriately
        2. Gives encouragement or constructive advice
        3. Motivates them to continue learning
        
        Keep the tone supportive and professional. Reply in English.`,
        response_json_schema: {
          type: "object",
          properties: {
            feedback: { type: "string" }
          }
        }
      });
      setAiFeedback(response.feedback);
    } catch (e) {
      setAiFeedback("Great job completing this quiz! Keep practicing to improve your knowledge and confidence.");
    }
    setLoadingFeedback(false);
  };

  const getPerformanceLevel = () => {
    if (percentage >= 90) return { label: "Excellent!", color: "text-emerald-400", bg: "from-emerald-500/20" };
    if (percentage >= 70) return { label: "Very Good!", color: "text-blue-400", bg: "from-blue-500/20" };
    if (percentage >= 50) return { label: "Keep Practicing", color: "text-yellow-400", bg: "from-yellow-500/20" };
    return { label: "Needs More Study", color: "text-red-400", bg: "from-red-500/20" };
  };

  const performance = getPerformanceLevel();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loadingAttempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className={`bg-gradient-to-br ${performance.bg} to-zinc-950 border-zinc-800 overflow-hidden`}>
          <div className="p-6 text-center">
            {/* Trophy Icon */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <h2 className={`text-2xl font-bold ${performance.color} mb-4`}>
              {performance.label}
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
                <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{score}/{total}</p>
                <p className="text-zinc-500 text-xs">Correct Answers</p>
              </div>

              {/* Points Card */}
              <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
                <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">
                  {(score * 20) + (total * 10) + (score === total && total > 0 ? 100 : 0)}
                </p>
                <p className="text-zinc-500 text-xs">Points Earned</p>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
                <div className="text-2xl font-bold text-white">{percentage}%</div>
                <p className="text-zinc-500 text-xs">Percentage</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{formatTime(timeSpent)}</p>
                <p className="text-zinc-500 text-xs">Time Spent</p>
              </div>
            </div>

            {/* AI Feedback */}
            <div className="bg-zinc-800/30 rounded-xl p-4 mb-4 border border-zinc-700/50 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-indigo-400 font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Feedback
                  </h3>
                  {loadingFeedback ? (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <p className="text-zinc-300 text-sm leading-relaxed">{aiFeedback}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link to={createPageUrl('Questions')} className="flex-1">
                <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                  <RotateCcw className="w-4 h-4 ml-2" />
                  New Quiz
                </Button>
              </Link>
              <Link to={createPageUrl('Home')} className="flex-1">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Home className="w-4 h-4 ml-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Detailed Answers Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full glass-card border-0 text-white hover:bg-white/10 justify-between py-4"
        >
          <span className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Answer Details ({answers.filter(a => a.is_correct).length} correct / {answers.filter(a => !a.is_correct).length} wrong)
          </span>
          {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mt-3"
            >
              {answers.map((answer, idx) => {
                const question = questionsMap[answer.question_id];
                if (!question) return null;

                return (
                  <Card key={idx} className={`glass-card border-0 p-4 ${answer.is_correct ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${answer.is_correct ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                        {answer.is_correct ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm mb-2">{question.question_text}</p>

                        <div className="space-y-1 mb-2">
                          {question.options?.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              className={`text-xs px-3 py-1.5 rounded-lg ${optIdx === question.correct_answer
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : optIdx === answer.selected_answer && !answer.is_correct
                                  ? 'bg-rose-500/20 text-rose-300 line-through'
                                  : 'bg-zinc-800/50 text-zinc-400'
                                }`}
                            >
                              {String.fromCharCode(65 + optIdx)}. {option}
                              {optIdx === question.correct_answer && ' ✓'}
                            </div>
                          ))}
                        </div>

                        {question.explanation && (
                          <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                            <p className="text-amber-300 text-xs">
                              💡 {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Previous Attempts Toggle */}
      {previousAttempts.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full glass-card border-0 text-white hover:bg-white/10 justify-between py-4"
          >
            <span className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Previous Attempts ({previousAttempts.length})
            </span>
            {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 mt-3"
              >
                {previousAttempts.map((att, idx) => (
                  <Card key={att.id} className={`glass-card border-0 p-3 ${att.id === attemptId ? 'ring-2 ring-indigo-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${att.percentage >= 70 ? 'bg-emerald-500/20' : att.percentage >= 50 ? 'bg-amber-500/20' : 'bg-rose-500/20'
                          }`}>
                          <span className={`text-sm font-bold ${att.percentage >= 70 ? 'text-emerald-400' : att.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                            }`}>{att.percentage}%</span>
                        </div>
                        <div>
                          <p className="text-white text-sm">{att.score}/{att.total_questions} correct answers</p>
                          <p className="text-zinc-500 text-xs">
                            {new Date(att.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatTime(att.time_spent_seconds || 0)}
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}