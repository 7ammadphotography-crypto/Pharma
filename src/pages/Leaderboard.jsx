import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/utils/gamification';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Trophy, Crown, Medal, Flame, Target, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('points');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: userPoints = [] } = useQuery({
    queryKey: ['all-user-points'],
    queryFn: () => base44.entities.UserPoints.list('-total_points', 100)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: allAttempts = [] } = useQuery({
    queryKey: ['all-attempts'],
    queryFn: () => base44.entities.QuizAttempt.list('-created_at', 1000),
    enabled: activeTab === 'scores'
  });

  // Points Leaderboard
  const pointsLeaderboard = userPoints
    .map(up => {
      const userData = users.find(u => u.id === up.user_id);
      return {
        ...up,
        name: userData?.full_name || 'Unknown',
        email: up.created_by
      };
    })
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 50);

  // Streak Leaderboard
  const streakLeaderboard = [...pointsLeaderboard]
    .sort((a, b) => (b.streak_days || 0) - (a.streak_days || 0))
    .filter(p => (p.streak_days || 0) > 0);

  // Scores Leaderboard
  const scoresLeaderboard = users
    .map(user => {
      const userAttempts = allAttempts.filter(a => a.created_by === user.email && a.is_completed);
      const avgScore = userAttempts.length > 0
        ? Math.round(userAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / userAttempts.length)
        : 0;
      return {
        name: user.full_name,
        email: user.email,
        avgScore,
        quizCount: userAttempts.length
      };
    })
    .filter(u => u.quizCount > 0)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 50);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
      </>
    );
};

return (
  <SubscriptionGuard>
    <div className="p-4 space-y-4 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-500/30">
          <Trophy className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-slate-400 text-sm">Compete with top learners</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'glass-card text-slate-400 hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Content */}
      {renderLeaderboard()}
    </div>
  </SubscriptionGuard>
);
}