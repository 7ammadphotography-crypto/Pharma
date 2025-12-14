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
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-600 to-amber-600';
    if (rank === 2) return 'bg-gradient-to-r from-slate-500 to-slate-600';
    if (rank === 3) return 'bg-gradient-to-r from-amber-700 to-orange-700';
    return 'glass-card';
  };

  const currentUserRank = pointsLeaderboard.findIndex(p => p.email === user?.email) + 1;
  const currentUserStreakRank = streakLeaderboard.findIndex(p => p.email === user?.email) + 1;
  const currentUserScoreRank = scoresLeaderboard.findIndex(s => s.email === user?.email) + 1;

  const tabs = [
    { id: 'points', label: 'Total Points', icon: Zap },
    { id: 'scores', label: 'Avg Score', icon: Target },
    { id: 'streaks', label: 'Streaks', icon: Flame }
  ];

  const renderLeaderboard = () => {
    const data = activeTab === 'points' ? pointsLeaderboard :
      activeTab === 'scores' ? scoresLeaderboard :
        streakLeaderboard;

    const currentRank = activeTab === 'points' ? currentUserRank :
      activeTab === 'scores' ? currentUserScoreRank :
        currentUserStreakRank;

    return (
      <>
        {/* Current User Rank */}
        {currentRank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">#{currentRank}</span>
                  </div>
                  <div>
                    <p className="text-white font-bold">Your Rank</p>
                    <p className="text-white/70 text-sm">
                      {activeTab === 'points' && `${pointsLeaderboard.find(p => p.email === user?.email)?.total_points || 0} points`}
                      {activeTab === 'scores' && `${scoresLeaderboard.find(s => s.email === user?.email)?.avgScore || 0}% average`}
                      {activeTab === 'streaks' && `${streakLeaderboard.find(p => p.email === user?.email)?.streak_days || 0} days`}
                    </p>
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-white/50" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-3">
          {data.map((entry, idx) => {
            const rank = idx + 1;
            const isCurrentUser = entry.email === user?.email;

            return (
              <motion.div
                key={entry.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`${getRankBg(rank)} border-0 p-4 ${isCurrentUser ? 'ring-2 ring-indigo-400' : ''
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rank <= 3 ? 'bg-white/20' : 'bg-slate-700'
                        }`}>
                        {getRankIcon(rank) || (
                          <span className="text-white font-bold">#{rank}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold">{entry.name}</p>
                          {activeTab === 'points' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/5">
                              {calculateLevel(entry.total_points || 0).title}
                            </span>
                          )}
                        </div>
                        {activeTab === 'scores' && (
                          <p className="text-white/60 text-xs">{entry.quizCount} quizzes</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {activeTab === 'points' && (
                        <>
                          <p className="text-white font-bold text-lg">{entry.total_points}</p>
                          <p className="text-white/60 text-xs">points</p>
                        </>
                      )}
                      {activeTab === 'scores' && (
                        <>
                          <p className="text-white font-bold text-lg">{entry.avgScore}%</p>
                          <p className="text-white/60 text-xs">average</p>
                        </>
                      )}
                      {activeTab === 'streaks' && (
                        <>
                          <p className="text-white font-bold text-lg">{entry.streak_days}</p>
                          <p className="text-white/60 text-xs">days</p>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {data.length === 0 && (
            <Card className="glass-card border-0 p-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No entries yet</p>
              <p className="text-slate-600 text-sm mt-1">Be the first to appear on the leaderboard!</p>
            </Card>
          )}
        </div>
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