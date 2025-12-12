import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Sparkles, ChevronRight, List, Zap, Crown, Settings, Calendar, Medal, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

// New Components
import HomeHeader from '@/components/home/HomeHeader';
import HomeStats from '@/components/home/HomeStats';
import SmartTip from '@/components/home/SmartTip';
import RecentActivity from '@/components/home/RecentActivity';
import QuickActions from '@/components/home/QuickActions';

import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.id],
    queryFn: () => base44.entities.QuizAttempt.filter({ created_by: user?.email }, '-created_date', 10),
    enabled: !!user
  });

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      // Fetch points from real DB
      const points = await base44.entities.UserPoints.filter({ user_id: user?.id });
      return points[0] || { total_points: 0, streak_days: 0 };
    },
    enabled: !!user
  });

  const streak = userPoints?.streak_days || 0;

  const completedAttempts = attempts.filter(a => a.is_completed);
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0;

  // Calculate daily progress (mocked logic for now - could be real query later)
  const today = new Date().toISOString().split('T')[0];
  const dailyAttempts = completedAttempts.filter(a => a.created_date.startsWith(today));
  const dailyQuestionsAnswered = dailyAttempts.reduce((sum, a) => sum + (a.total_questions || 0), 0);

  // Dynamic Smart Tip Selection
  const getSmartTip = () => {
    if (avgScore < 50) return "It looks like you're struggling with some topics. Try using the 'Flashcards' to reinforce key concepts before your next quiz!";
    if (streak > 3) return "You're on fire! 🔥 Consistency is key. Keeping up this streak will boost your retention significantly.";
    return "Did you know? Reviewing your 'Incorrect Answers' is the most efficient way to improve your score.";
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header with Rank */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <HomeHeader user={user} userPoints={userPoints} />
      </motion.div>

      {/* Stats with Daily Goal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <HomeStats
          streak={streak}
          avgScore={avgScore}
          dailyProgress={dailyQuestionsAnswered}
          dailyGoal={20}
        />
      </motion.div>

      {/* Smart Tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <SmartTip tip={getSmartTip()} />
      </motion.div>

      {/* Main Actions Grid */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Continue Learning / Start Quiz */}
        <Link to={createPageUrl('Questions')}>
          <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-0 p-5 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {completedAttempts.length > 0 ? 'Continue Learning' : 'Start Journey'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {completedAttempts.length > 0 ? 'Pick up where you left off' : 'Begin your pharmacy mastery'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        {/* Mock Exam */}
        <Link to={createPageUrl('MockExamSetup')}>
          <Card className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 border-0 p-5 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 group h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Mock Exam</h3>
                  <p className="text-white/70 text-sm">Test your readiness</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Engagement Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Link to={createPageUrl('DailyChallenge')}>
          <Card className="bg-gradient-to-br from-amber-600 to-orange-600 border-0 p-3 h-full hover:shadow-2xl hover:shadow-amber-500/20 transition-all group flex flex-col items-center text-center">
            <Calendar className="w-6 h-6 text-white mb-2" />
            <h3 className="font-bold text-white text-xs">Daily Challenge</h3>
          </Card>
        </Link>

        <Link to={createPageUrl('Leaderboard')}>
          <Card className="bg-gradient-to-br from-violet-600 to-purple-600 border-0 p-3 h-full hover:shadow-2xl hover:shadow-violet-500/20 transition-all group flex flex-col items-center text-center">
            <Medal className="w-6 h-6 text-white mb-2" />
            <h3 className="font-bold text-white text-xs">Leaderboard</h3>
          </Card>
        </Link>

        <Link to={createPageUrl('Badges')}>
          <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 border-0 p-3 h-full hover:shadow-2xl hover:shadow-emerald-500/20 transition-all group flex flex-col items-center text-center">
            <Target className="w-6 h-6 text-white mb-2" />
            <h3 className="font-bold text-white text-xs">Badges</h3>
          </Card>
        </Link>

        <Link to={createPageUrl('RewardsStore')}>
          <Card className="bg-gradient-to-br from-pink-600 to-rose-600 border-0 p-3 h-full hover:shadow-2xl hover:shadow-pink-500/20 transition-all group flex flex-col items-center text-center">
            <Crown className="w-6 h-6 text-white mb-2" />
            <h3 className="font-bold text-white text-xs">Rewards</h3>
          </Card>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Quick Actions Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <QuickActions />
          </motion.div>
        </div>
        <div>
          {/* Recent Activity Component */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <RecentActivity attempts={attempts} />
          </motion.div>
        </div>
      </div>

      {/* Admin Link - Subtle */}
      <div className="flex justify-center pt-4">
        <Link to={createPageUrl('AdminPanel')} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors bg-white/5 px-4 py-2 rounded-full">
          <Settings className="w-3 h-3" />
          <span>Admin Access</span>
        </Link>
      </div>
    </div>
  );
}