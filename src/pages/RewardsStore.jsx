import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Zap, Check, Lock, Sparkles, Crown, Palette, Frame, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function RewardsStore() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.email],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.filter({ user_id: user?.id });
      return points[0];
    },
    enabled: !!user
  });

  const { data: rewardItems = [] } = useQuery({
    queryKey: ['reward-items'],
    queryFn: () => base44.entities.RewardItem.filter({ is_available: true })
  });

  const { data: userRewards = [] } = useQuery({
    queryKey: ['user-rewards', user?.email],
    queryFn: () => base44.entities.UserReward.filter({ user_id: user?.id }),
    enabled: !!user
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ rewardId, cost }) => {
      // Create user reward
      await base44.entities.UserReward.create({
        reward_id: rewardId,
        purchased_date: new Date().toISOString(),
        is_equipped: false
      });

      // Update user points
      const currentPoints = userPoints?.total_points || 0;
      if (userPoints?.id) {
        await base44.entities.UserPoints.update(userPoints.id, {
          total_points: currentPoints - cost
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-rewards'] });
      toast.success('Reward purchased successfully!');
    },
    onError: () => {
      toast.error('Failed to purchase reward');
    }
  });

  const equipMutation = useMutation({
    mutationFn: async ({ rewardId, type }) => {
      // Unequip all rewards of the same type
      const sameTypeRewards = userRewards.filter(ur => {
        const item = rewardItems.find(ri => ri.id === ur.reward_id);
        return item?.type === type;
      });

      for (const reward of sameTypeRewards) {
        if (reward.is_equipped) {
          await base44.entities.UserReward.update(reward.id, { is_equipped: false });
        }
      }

      // Equip selected reward
      const selectedReward = userRewards.find(ur => ur.reward_id === rewardId);
      if (selectedReward) {
        await base44.entities.UserReward.update(selectedReward.id, { is_equipped: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-rewards'] });
      toast.success('Reward equipped!');
    }
  });

  const handlePurchase = (reward) => {
    const currentPoints = userPoints?.total_points || 0;
    if (currentPoints < reward.cost) {
      toast.error('Not enough points!');
      return;
    }
    purchaseMutation.mutate({ rewardId: reward.id, cost: reward.cost });
  };

  const handleEquip = (reward) => {
    equipMutation.mutate({ rewardId: reward.id, type: reward.type });
  };

  const isOwned = (rewardId) => userRewards.some(ur => ur.reward_id === rewardId);
  const isEquipped = (rewardId) => userRewards.some(ur => ur.reward_id === rewardId && ur.is_equipped);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'avatar_frame': return Frame;
      case 'profile_background': return Palette;
      case 'hint_pack': return Lightbulb;
      case 'theme': return Sparkles;
      case 'title': return Crown;
      default: return ShoppingBag;
    }
  };

  const categories = [
    { type: 'avatar_frame', label: 'Avatar Frames' },
    { type: 'profile_background', label: 'Backgrounds' },
    { type: 'hint_pack', label: 'Hint Packs' },
    { type: 'theme', label: 'Themes' },
    { type: 'title', label: 'Titles' }
  ];

  return (
    <SubscriptionGuard>
      <div className="p-4 space-y-4 pb-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
            <ShoppingBag className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Rewards Store</h1>
          <p className="text-slate-400 text-sm">Redeem your points</p>
        </motion.div>

        {/* Points Balance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-r from-amber-600 to-orange-600 border-0 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Your Balance</p>
                  <p className="text-white text-2xl font-bold">{userPoints?.total_points || 0}</p>
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-white/30" />
            </div>
          </Card>
        </motion.div>

        {/* Categories */}
        {categories.map((category, catIdx) => {
          const items = rewardItems.filter(item => item.type === category.type);
          if (items.length === 0) return null;

          const Icon = getTypeIcon(category.type);

          return (
            <motion.div
              key={category.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-white font-semibold">{category.label}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {items.map((item, idx) => {
                  const owned = isOwned(item.id);
                  const equipped = isEquipped(item.id);
                  const canAfford = (userPoints?.total_points || 0) >= item.cost;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className={`glass-card border-0 p-4 relative overflow-hidden ${equipped ? 'ring-2 ring-green-500' : ''
                        }`}>
                        {equipped && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500/20 text-green-400 text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Equipped
                            </Badge>
                          </div>
                        )}

                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color || 'from-indigo-500 to-purple-500'
                          } flex items-center justify-center mx-auto mb-3`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        <h3 className="text-white font-semibold text-sm text-center mb-1">
                          {item.name}
                        </h3>
                        <p className="text-slate-500 text-xs text-center mb-3">
                          {item.description}
                        </p>

                        {owned ? (
                          <Button
                            onClick={() => handleEquip(item)}
                            disabled={equipped || equipMutation.isPending}
                            className={`w-full ${equipped
                                ? 'bg-green-600 hover:bg-green-600'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                            size="sm"
                          >
                            {equipped ? 'Equipped' : 'Equip'}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePurchase(item)}
                            disabled={!canAfford || purchaseMutation.isPending}
                            className="w-full bg-amber-600 hover:bg-amber-700"
                            size="sm"
                          >
                            {!canAfford && <Lock className="w-4 h-4 mr-1" />}
                            <Zap className="w-4 h-4 mr-1" />
                            {item.cost}
                          </Button>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {rewardItems.length === 0 && (
          <Card className="glass-card border-0 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No rewards available yet</p>
            <p className="text-slate-600 text-sm mt-1">Check back soon for new items!</p>
          </Card>
        )}
      </div>
    </SubscriptionGuard>
  );
}