import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Crown, Award, Zap, Flame, Target, Brain, Rocket, Shield, Heart, Sparkles, Gem, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { fetchUserAnalytics } from '@/utils/analytics';

export default function Badges() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list()
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: user?.id }),
    enabled: !!user
  });

  // Use unified analytics
  const { data: analytics } = useQuery({
    queryKey: ['user-analytics', user?.id],
    queryFn: () => fetchUserAnalytics(user?.id),
    enabled: !!user?.id
  });

  const getIconComponent = (iconName) => {
    const icons = {
      trophy: Trophy,
      medal: Medal,
      star: Star,
      crown: Crown,
      award: Award,
      zap: Zap,
      flame: Flame,
      target: Target,
      brain: Brain,
      rocket: Rocket,
      shield: Shield,
      heart: Heart,
      sparkles: Sparkles,
      gem: Gem
    };
    return icons[iconName] || Star;
  };

  const getColorGradient = (color) => {
    const gradients = {
      gold: 'from-yellow-500 to-amber-600',
      silver: 'from-slate-400 to-slate-500',
      bronze: 'from-amber-700 to-orange-700',
      blue: 'from-blue-500 to-indigo-600',
      purple: 'from-purple-500 to-pink-600',
      red: 'from-red-500 to-rose-600',
      green: 'from-green-500 to-emerald-600',
      pink: 'from-pink-500 to-rose-600',
      orange: 'from-orange-500 to-amber-600'
    };
    return gradients[color] || gradients.gold;
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-slate-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-amber-400'
    };
    return colors[rarity] || colors.common;
  };

  const checkBadgeProgress = (badge, stats) => {
    if (!stats) return 0;

    // Map badge requirement types to analytics properties
    // This allows backend/admin to define new badges without code changes if they map to these keys
    const mapping = {
      'quizzes_completed': stats.total_quizzes,
      'topics_mastered': stats.topics_mastered,
      'perfect_score': stats.perfect_scores,
      'study_streak': stats.streak_days,
      'total_points': stats.total_points,
      'avg_score': stats.avg_score,
      'messages_sent': stats.messages_sent,
      'questions_answered': stats.total_questions_answered
    };

    return mapping[badge.requirement_type] || 0;
  };

  const isUnlocked = (badgeId) => userBadges.some(ub => ub.badge_id === badgeId);

  const unlockedBadges = badges.filter(b => isUnlocked(b.id));
  const lockedBadges = badges.filter(b => !isUnlocked(b.id));

  return (
    <SubscriptionGuard>
      <div className="p-4 space-y-4 pb-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Award className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Achievement Badges</h1>
          <p className="text-slate-400 text-sm">
            {unlockedBadges.length} of {badges.length} unlocked
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass-card border-0 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Overall Progress</span>
              <span className="text-white font-bold">
                {badges.length > 0 ? Math.round((unlockedBadges.length / badges.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${badges.length > 0 ? (unlockedBadges.length / badges.length) * 100 : 0}%` }}
              />
            </div>
          </Card>
        </motion.div>

        {/* Unlocked Badges */}
        {unlockedBadges.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-400" />
              Unlocked Badges
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {unlockedBadges.map((badge, idx) => {
                const Icon = getIconComponent(badge.icon);
                const userBadge = userBadges.find(ub => ub.badge_id === badge.id);

                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-card border-0 p-4 relative overflow-hidden">
                      <div className="absolute top-2 right-2">
                        <Badge className={getRarityColor(badge.rarity)}>
                          {badge.rarity}
                        </Badge>
                      </div>

                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getColorGradient(badge.color)} 
                      flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-white font-semibold text-sm text-center mb-1">
                        {badge.name}
                      </h3>
                      <p className="text-slate-500 text-xs text-center mb-2">
                        {badge.description}
                      </p>

                      {badge.points_reward > 0 && (
                        <div className="flex items-center justify-center gap-1 text-amber-400 text-xs">
                          <Zap className="w-3 h-3" />
                          <span>+{badge.points_reward} points</span>
                        </div>
                      )}

                      {userBadge && (
                        <p className="text-slate-600 text-[10px] text-center mt-2">
                          Earned {new Date(userBadge.earned_date).toLocaleDateString()}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-500" />
              Locked Badges
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {lockedBadges.map((badge, idx) => {
                const Icon = getIconComponent(badge.icon);
                const progress = checkBadgeProgress(badge, analytics);
                const percentage = Math.min(100, Math.round((progress / badge.requirement_value) * 100));

                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-card border-0 p-4 relative overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-slate-600" />
                      </div>

                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getColorGradient(badge.color)} 
                      flex items-center justify-center mx-auto mb-3 shadow-lg opacity-50`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-white font-semibold text-sm text-center mb-1">
                        {badge.name}
                      </h3>
                      <p className="text-slate-500 text-xs text-center mb-3">
                        {badge.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{progress} / {badge.requirement_value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {badge.points_reward > 0 && (
                        <div className="flex items-center justify-center gap-1 text-slate-600 text-xs">
                          <Zap className="w-3 h-3" />
                          <span>+{badge.points_reward} points</span>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {badges.length === 0 && (
          <Card className="glass-card border-0 p-12 text-center">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No badges available yet</p>
            <p className="text-slate-600 text-sm mt-1">Check back soon for achievements!</p>
          </Card>
        )}
      </div>
    </SubscriptionGuard>
  );
}