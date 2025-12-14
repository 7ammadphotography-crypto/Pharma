import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, BookmarkCheck, ChevronRight, Check, X, Loader2, Sparkles, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { awardUserPoints } from '@/utils/gamification';
import { motion, AnimatePresence } from 'framer-motion';

export default function Quiz() {
  const urlParams = new URLSearchParams(window.location.search);
  const tag = urlParams.get('tag') || '';
  const difficulty = urlParams.get('difficulty') || '';
  const competencyId = urlParams.get('competency') || '';
  const topicId = urlParams.get('topic') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [user, setUser] = useState(null);
  const [startTime] = useState(Date.now());
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: allQuestions = [], isLoading } = useQuery({
    queryKey: ['quiz-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list()
  });

  const { data: topicQuestions = [] } = useQuery({
    queryKey: ['topic-questions'],
    queryFn: () => base44.entities.TopicQuestion.list()
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter questions based on competency, topic, tag and difficulty using TopicQuestion join
  const questions = React.useMemo(() => {
    let filtered = allQuestions;

    if (topicId) {
      // Filter by specific topic using TopicQuestion join
      const linkedIds = topicQuestions.filter(tq => tq.topic_id === topicId).map(tq => tq.question_id);
      filtered = filtered.filter(q => linkedIds.includes(q.id));
    } else if (competencyId) {
      // Filter by competency - get all topics in this competency, then get all questions linked to those topics
      const compTopicIds = topics.filter(t => t.competency_id === competencyId).map(t => t.id);
      const linkedIds = topicQuestions.filter(tq => compTopicIds.includes(tq.topic_id)).map(tq => tq.question_id);
      // Use Set to avoid duplicates when a question is linked to multiple topics
      const uniqueIds = [...new Set(linkedIds)];
      filtered = filtered.filter(q => uniqueIds.includes(q.id));
    } else if (tag) {
      // Legacy tag-based filtering
      filtered = filtered.filter(q => (q.tags || []).includes(tag));
    }

    if (difficulty) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    return filtered;
  }, [allQuestions, topicQuestions, topics, topicId, competencyId, tag, difficulty]);

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', user?.email],
    queryFn: () => base44.entities.BookmarkedQuestion.filter({ user_id: user?.id }),
    enabled: !!user
  });

  useEffect(() => {
    setBookmarkedIds(new Set(bookmarks.map(b => b.question_id)));
  }, [bookmarks]);

  const createAttemptMutation = useMutation({
    mutationFn: (data) => base44.entities.QuizAttempt.create(data),
    onSuccess: () => queryClient.invalidateQueries(['attempts'])
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (questionId) => {
      const existing = bookmarks.find(b => b.question_id === questionId);
      if (existing) {
        await base44.entities.BookmarkedQuestion.delete(existing.id);
      } else {
        await base44.entities.BookmarkedQuestion.create({ question_id: questionId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['bookmarks'])
  });

  const currentQuestion = questions[currentIndex];
  const currentCase = currentQuestion?.case_id ? cases.find(c => c.id === currentQuestion.case_id) : null;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const updateQuestionStats = async (questionId, isCorrect) => {
    try {
      const stats = await base44.entities.QuestionStats.filter({ question_id: questionId });
      if (stats.length > 0) {
        const stat = stats[0];
        const newCorrect = (stat.correct_count || 0) + (isCorrect ? 1 : 0);
        const newIncorrect = (stat.incorrect_count || 0) + (isCorrect ? 0 : 1);
        const newTotal = newCorrect + newIncorrect;
        await base44.entities.QuestionStats.update(stat.id, {
          correct_count: newCorrect,
          incorrect_count: newIncorrect,
          total_attempts: newTotal,
          success_rate: Math.round((newCorrect / newTotal) * 100)
        });
      } else {
        await base44.entities.QuestionStats.create({
          question_id: questionId,
          correct_count: isCorrect ? 1 : 0,
          incorrect_count: isCorrect ? 0 : 1,
          total_attempts: 1,
          success_rate: isCorrect ? 100 : 0
        });
      }
    } catch (e) {
      console.error('Failed to update question stats', e);
    }
  };

  const handleAnswer = (answerIndex) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === currentQuestion.correct_answer;
    setAnswers([...answers, {
      question_id: currentQuestion.id,
      selected_answer: answerIndex,
      is_correct: isCorrect
    }]);

    // Update question stats
    updateQuestionStats(currentQuestion.id, isCorrect);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const score = answers.filter(a => a.is_correct).length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // Get competency_id from topic or use the one from URL
    let compId = competencyId;
    if (!compId && topicId) {
      const topic = topics.find(t => t.id === topicId);
      compId = topic?.competency_id || '';
    }

    const attempt = await createAttemptMutation.mutateAsync({
      competency_id: compId || 'general',
      topic_id: topicId || '',
      mode: 'study',
      answers: answers,
      score: score,
      total_questions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      time_spent_seconds: timeSpent,
      is_completed: true,
      completed_at: new Date().toISOString()
    });

    // GENIUS REWARD SYSTEM
    // +10 points for every question answered
    // +20 points bonus for every correct answer
    // +100 points bonus for perfect score (100%)
    const participationPoints = questions.length * 10;
    const accuracyPoints = score * 20;
    let totalReward = participationPoints + accuracyPoints;

    if (score === questions.length && questions.length > 0) {
      totalReward += 100; // Perfect score bonus
    }

    if (user?.email) {
      await awardUserPoints(user.email, totalReward);
    }

    navigate(createPageUrl(`QuizResults?attemptId=${attempt.id}`));
  };

  const toggleBookmark = (questionId) => {
    toggleBookmarkMutation.mutate(questionId);
    if (bookmarkedIds.has(questionId)) {
      bookmarkedIds.delete(questionId);
    } else {
      bookmarkedIds.add(questionId);
    }
    setBookmarkedIds(new Set(bookmarkedIds));
  };

  if (isLoading || casesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </div>
        <p className="text-white font-medium mb-2">No Questions Found</p>
        <p className="text-slate-500 text-sm mb-6">No questions found for this category</p>
        <Link to={createPageUrl('Questions')}>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">Back to Questions</Button>
        </Link>
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
        <div className="glass-card px-4 py-2 rounded-full">
          <span className="text-white text-sm font-medium">
            {currentIndex + 1} <span className="text-slate-500">/ {questions.length}</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/10"
          onClick={() => toggleBookmark(currentQuestion.id)}
        >
          {bookmarkedIds.has(currentQuestion.id) ? (
            <BookmarkCheck className="w-5 h-5 text-amber-400" />
          ) : (
            <Bookmark className="w-5 h-5 text-slate-400" />
          )}
        </Button>
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

      {/* Case Scenario - if question is linked to a case */}
      {currentCase && (
        <Card className="glass-card border-0 p-5 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20 mb-4 glow-effect">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-cyan-400 font-bold text-sm">
                {currentCase.case_type === 'management' ? 'Management Case' : 'Clinical Case'}
              </h3>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {currentCase.case_text}
            </p>
            {currentCase.image_url && (
              <div className="mt-4">
                <img
                  src={currentCase.image_url}
                  alt="Case related"
                  className="w-full rounded-lg border border-slate-700"
                />
              </div>
            )}
          </div>
        </Card>
      )}

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
              {/* Tags */}
              {currentQuestion.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentQuestion.tags.map(t => (
                    <span key={t} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}

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
                        ${!showResult && isSelected ? 'bg-indigo-600/30 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20' : ''}
                        ${showCorrectStyle ? 'bg-emerald-600/30 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20' : ''}
                        ${showWrongStyle ? 'bg-rose-600/30 border-2 border-rose-500 shadow-lg shadow-rose-500/20' : ''}
                        ${showResult && !showCorrectStyle && !showWrongStyle ? 'glass-card opacity-40' : ''}
                      `}
                    >
                      <span className={`
                        w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
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

              {showResult && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20"
                >
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-amber-400 font-semibold">💡 Explanation: </span>
                    {currentQuestion.explanation}
                  </p>
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
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-6 text-lg font-semibold shadow-xl shadow-indigo-500/20"
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}