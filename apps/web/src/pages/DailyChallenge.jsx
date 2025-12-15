import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Check, X, Loader2, Zap, Gift, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function DailyChallenge() {
  const [user, setUser] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: questions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.email],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.filter({ user_id: user?.id });
      return points[0];
    },
    enabled: !!user
  });

  const alreadyCompleted = userPoints?.daily_challenges_completed?.includes(today);

  // Get a random question for today (seeded by date)
  const todayQuestion = questions.length > 0
    ? questions[new Date().getDate() % questions.length]
    : null;

  const currentCase = todayQuestion?.case_id ? cases.find(c => c.id === todayQuestion.case_id) : null;

  const updatePointsMutation = useMutation({
    mutationFn: async (isCorrect) => {
      const pointsToAdd = isCorrect ? 10 : 2;
      if (userPoints) {
        await base44.entities.UserPoints.update(userPoints.id, {
          total_points: (userPoints.total_points || 0) + pointsToAdd,
          daily_challenges_completed: [...(userPoints.daily_challenges_completed || []), today],
          last_activity_date: today,
          streak_days: (userPoints.streak_days || 0) + 1
        });
      } else {
        await base44.entities.UserPoints.create({
          total_points: pointsToAdd,
          daily_challenges_completed: [today],
          last_activity_date: today,
          streak_days: 1,
          level: 1
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['user-points'])
  });

  const handleAnswer = (idx) => {
    if (showResult || alreadyCompleted) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    const isCorrect = idx === todayQuestion.correct_answer;
    updatePointsMutation.mutate(isCorrect);
  };

  if (!todayQuestion || casesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Daily Challenge</h1>
              <p className="text-slate-500 text-xs">{format(new Date(), 'EEEE, MMM d')}</p>
            </div>
          </div>
        </div>

        {/* Points Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-amber-600 to-orange-600 border-0 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-white" />
                <div>
                  <p className="text-white/80 text-sm">Complete for</p>
                  <p className="text-white font-bold text-xl">+10 Points</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs">Your Points</p>
                <p className="text-white font-bold text-2xl">{userPoints?.total_points || 0}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {alreadyCompleted ? (
          <Card className="glass-card border-0 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Challenge Completed!</h2>
            <p className="text-slate-400">Come back tomorrow for a new challenge</p>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Case Scenario */}
            {currentCase && (
              <Card className="glass-card border-0 p-5 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20 glow-effect">
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

            <Card className="glass-card border-0 p-6 glow-effect">
              <h2 className="text-lg font-semibold text-white mb-6 leading-relaxed">
                {todayQuestion.question_text}
              </h2>

              <div className="space-y-3">
                {todayQuestion.options?.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === todayQuestion.correct_answer;
                  const showCorrectStyle = showResult && isCorrect;
                  const showWrongStyle = showResult && isSelected && !isCorrect;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={showResult}
                      className={`
                      w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4
                      ${!showResult ? 'glass-card hover:bg-white/10' : ''}
                      ${showCorrectStyle ? 'bg-emerald-600/30 border-2 border-emerald-500' : ''}
                      ${showWrongStyle ? 'bg-rose-600/30 border-2 border-rose-500' : ''}
                      ${showResult && !showCorrectStyle && !showWrongStyle ? 'opacity-40' : ''}
                    `}
                    >
                      <span className={`
                      w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                      ${!showResult ? 'bg-slate-700/50 text-slate-300' : ''}
                      ${showCorrectStyle ? 'bg-emerald-500 text-white' : ''}
                      ${showWrongStyle ? 'bg-rose-500 text-white' : ''}
                    `}>
                        {showCorrectStyle ? <Check className="w-5 h-5" /> :
                          showWrongStyle ? <X className="w-5 h-5" /> :
                            String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-white text-sm">{option}</span>
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${selectedAnswer === todayQuestion.correct_answer
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                    }`}>
                    {selectedAnswer === todayQuestion.correct_answer ? (
                      <>
                        <Trophy className="w-5 h-5" />
                        <span className="font-medium">+10 Points Earned!</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5" />
                        <span className="font-medium">+2 Points for trying!</span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </SubscriptionGuard>
  );
}