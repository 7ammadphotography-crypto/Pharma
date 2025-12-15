import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/utils/gamification';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Trophy, Crown, Medal, Flame, Target, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import moment from 'moment';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('scores');

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
    enabled: activeTab === 'activity'
  });

  // Points Leaderboard
  const pointsLeaderboard = userPoints
    .map(up => {
      const userData = users.find(u => u.id === up.user_id);

      // Calculate avg score for this user
      const userAttempts = allAttempts.filter(a => a.user_id === up.user_id && a.is_completed);
      const avgScore = userAttempts.length > 0
        ? Math.round(userAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / userAttempts.length)
        : 0;

      return {
        id: up.user_id,
        name: userData?.full_name || 'Unknown',
        email: userData?.email || '',
        points: up.total_points,
        level: up.level,
        quizzes: userAttempts.length,
        avgScore
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 50);

  // Recent Activity Calculation
  const recentActivity = allAttempts
    .filter(a => a.is_completed)
    .slice(0, 20)
    .map(attempt => {
      const u = users.find(user => user.id === attempt.user_id);
      return {
        id: attempt.id,
        user: u?.full_name || 'Unknown User',
        user_id: attempt.user_id,
        action: `completed ${attempt.quiz_title || 'a quiz'}`,
        score: attempt.percentage,
        time: moment(attempt.created_at).fromNow()
      };
    });

  const getMedalColor = (index) => {
    switch (index) {
      case 0: return 'text-yellow-400';
      case 1: return 'text-gray-300';
      case 2: return 'text-amber-600';
      default: return 'text-zinc-600';
    }
  };

  // Get current user stats
  const userRankIndex = pointsLeaderboard.findIndex(p => p.id === user?.id);
  const currentUserStats = userRankIndex !== -1 ? {
    rank: userRankIndex + 1,
    ...pointsLeaderboard[userRankIndex]
  } : null;

  return (
    <SubscriptionGuard>
      <div className="p-4 space-y-6 pb-28">
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

        {/* Current User Stats Bar */}
        {currentUserStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-indigo-500/30 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500/50 text-2xl font-bold text-white">
                  #{currentUserStats.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Rank</h3>
                  <p className="text-zinc-400">Top {Math.round((currentUserStats.rank / (pointsLeaderboard.length || 1)) * 100)}% of learners</p>
                </div>
              </div>
              <div className="flex gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-indigo-400">{currentUserStats.points}</div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{currentUserStats.level}</div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Level</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{currentUserStats.avgScore}%</div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Avg Score</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="scores" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50">
            <TabsTrigger value="scores">🏆 Top Students</TabsTrigger>
            <TabsTrigger value="activity">⚡ Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="scores" className="mt-6">
            <div className="space-y-4">
              {pointsLeaderboard.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all ${student.id === user?.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-zinc-900/40 hover:bg-zinc-800/60'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center font-bold ${getMedalColor(index)}`}>
                      {index < 3 ? <Trophy className="w-6 h-6" /> : `#${index + 1}`}
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-white/10">
                      <AvatarFallback className="bg-zinc-800 text-zinc-300">
                        {student.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className={`font-medium ${student.id === user?.id ? 'text-indigo-300' : 'text-zinc-200'}`}>
                        {student.name} {student.id === user?.id && '(You)'}
                      </h4>
                      <p className="text-xs text-zinc-500">Level {student.level} • {student.quizzes} Quizzes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{student.points} pts</div>
                    <div className="text-xs text-zinc-500">{student.avgScore}% avg</div>
                  </div>
                </motion.div>
              ))}

              {pointsLeaderboard.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No leaderboard data yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/20 border border-white/5"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">
                      <span className="font-medium text-white">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-zinc-500">{activity.time}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${activity.score >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                      activity.score >= 70 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                    }`}>
                    {activity.score}%
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SubscriptionGuard>
  );
}