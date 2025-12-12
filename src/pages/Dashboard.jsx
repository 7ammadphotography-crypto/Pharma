import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Clock, Star, Loader2, Flame, Award, BarChart3, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

import WeeklyChart from '@/components/dashboard/WeeklyChart';
import StudyHeatmap from '@/components/dashboard/StudyHeatmap';
import GoalsTracker from '@/components/dashboard/GoalsTracker';
import CompetencyBreakdown from '@/components/dashboard/CompetencyBreakdown';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['user-attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list()
  });

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.email],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.filter({ created_by: user?.email });
      return points[0];
    },
    enabled: !!user
  });

  const completedAttempts = attempts.filter(a => a.is_completed);
  const totalStudyTime = attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
  const avgScore = completedAttempts.length > 0 
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0;

  const topicMastery = {};
  completedAttempts.forEach(attempt => {
    if (attempt.topic_id) {
      if (!topicMastery[attempt.topic_id]) {
        topicMastery[attempt.topic_id] = { scores: [], count: 0 };
      }
      topicMastery[attempt.topic_id].scores.push(attempt.percentage || 0);
      topicMastery[attempt.topic_id].count++;
    }
  });

  const masteredTopics = Object.entries(topicMastery).filter(([_, data]) => {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    return avgScore >= 80;
  });

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-pink-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-28">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-500 text-xs">{format(new Date(), 'EEEE, MMM d')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1.5 rounded-full">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold text-sm">{userPoints?.total_points || 0}</span>
        </div>
      </motion.div>

      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card glow-effect border-0 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getScoreColor(avgScore)} flex items-center justify-center shadow-xl`}>
              <span className="text-2xl font-bold text-white">{avgScore}%</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Overall Score</h2>
              <p className="text-slate-500 text-sm">{completedAttempts.length} quizzes completed</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(totalStudyTime)}
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <Star className="w-3.5 h-3.5" />
                  {masteredTopics.length} mastered
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Goals Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <GoalsTracker attempts={attempts} userPoints={userPoints} />
      </motion.div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <WeeklyChart attempts={completedAttempts} />
      </motion.div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <CompetencyBreakdown attempts={attempts} competencies={competencies} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="glass-card border-0 p-5 h-full">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-semibold text-sm">Streak</h3>
            </div>
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-white">{userPoints?.streak_days || 0}</p>
              <p className="text-slate-500 text-xs mt-1">Day Streak</p>
            </div>
            <div className="flex justify-center gap-1 mt-2">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${
                    i < (userPoints?.streak_days || 0) % 7 
                      ? 'bg-orange-500' 
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Study Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StudyHeatmap attempts={attempts} />
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-white font-semibold">Recent Activity</h3>
        </div>

        <Card className="glass-card border-0 overflow-hidden">
          {attempts.length > 0 ? (
            <div className="divide-y divide-slate-800/30">
              {attempts.slice(0, 5).map((attempt, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      (attempt.percentage || 0) >= 80 
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : (attempt.percentage || 0) >= 60
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Quiz Completed</p>
                      <p className="text-slate-500 text-xs">{format(new Date(attempt.created_date), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                  <span className={`text-base font-bold ${
                    (attempt.percentage || 0) >= 80 
                      ? 'text-emerald-400'
                      : (attempt.percentage || 0) >= 60
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {attempt.percentage || 0}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-white font-medium text-sm mb-1">No Activity Yet</p>
              <p className="text-slate-500 text-xs">Complete quizzes to see your progress</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}