import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Camera, Building2, Briefcase, Calendar, Settings, ChevronRight,
  Crown, Loader2, CreditCard, CheckCircle, TrendingUp, Target, Clock,
  Star, Flame, Award, BarChart3, Zap, Shield, MapPin, Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LocationTracker from '@/components/LocationTracker';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import WeeklyChart from '@/components/dashboard/WeeklyChart';
import StudyHeatmap from '@/components/dashboard/StudyHeatmap';
import GoalsTracker from '@/components/dashboard/GoalsTracker';
import CompetencyBreakdown from '@/components/dashboard/CompetencyBreakdown';
import BadgeSystem from '@/components/profile/BadgeSystem';
import { calculateLevel, getNextLevel } from '@/utils/gamification';

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);

  // Check if in development mode
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    setLoading(true);
    base44.auth.me().then(u => {
      setUser(u);
      setEditData({
        university: u.university || '',
        workplace: u.workplace || '',
        birth_date: u.birth_date || '',
        bio: u.bio || '',
        location: u.location || ''
      });
      setLoading(false);
    }).catch((err) => {
      console.error("Auth failed:", err);
      // If auth fails, we probably shouldn't stay on this page or show empty state
      setLoading(false);
    });
  }, []);

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['user-attempts', user?.id],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list()
  });

  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      // Fetch by user_id
      const points = await base44.entities.UserPoints.filter({ user_id: user?.id });
      return points[0] || { total_points: 0, streak_days: 0 };
    },
    enabled: !!user?.id
  });

  const completedAttempts = attempts.filter(a => a.is_completed);
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0;

  // Gamification Stats
  const currentLevel = calculateLevel(userPoints?.total_points || 0);
  const nextLevel = getNextLevel(currentLevel.level);
  const progressToNext = nextLevel
    ? ((userPoints?.total_points || 0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP) * 100
    : 100;

  // Mock extended stats for Badges (in real app, calculate/fetch these)
  // Extended stats for Badges
  // In a real app, you might want to fetch 'chat_messages' count or store it in 'user_points' logic
  // For now, we will default 'messages_sent' to 0 if not tracked, or we can fetch it.
  // To keep it performant, we'll just set defaults that don't rely on heavy queries unless needed.
  const extendedStats = {
    ...userPoints,
    early_morning_quizzes: attempts.filter(a => {
      const h = new Date(a.created_date).getHours();
      return h >= 5 && h < 9;
    }).length,
    perfect_scores: completedAttempts.filter(a => a.percentage === 100).length,
    messages_sent: userPoints?.messages_sent || 0, // Ensure this field exists in DB or default to 0
    total_questions_answered: attempts.reduce((acc, curr) => acc + (curr.total_questions || 0), 0)
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe(editData);
      setUser({ ...user, ...editData });
      setShowEditDialog(false);
    } catch (e) {
      console.error(e);
      // Dev mode fallback
      if (isDev) {
        setUser({ ...user, ...editData });
        setShowEditDialog(false);
      }
    }
    setLoading(false);
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const response = await base44.functions.invoke('manageSubscription');
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (e) {
      console.error(e);
    }
    setManagingSubscription(false);
  };

  const isSubscribed = user?.subscription_status === 'active';

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24 text-white">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>
      </div>

      <div className="px-4 -mt-20 relative">
        <div className="flex justify-between items-end mb-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl bg-zinc-900 p-1.5 shadow-2xl relative overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-inner">
                  {(user.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload Overlay */}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const toastId = toast.loading('Uploading avatar...');
                    try {
                      // Use the working storage API
                      const result = await base44.storage.upload({ file, bucket: 'avatars' });

                      if (result?.file_url) {
                        // Update profile in DB
                        const { error } = await base44.entities.User.update(user.id, { avatar_url: result.file_url });
                        if (error) throw error;

                        // Update local state
                        setUser(prev => ({ ...prev, avatar_url: result.file_url }));
                        toast.success('Profile picture updated', { id: toastId });
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to upload image', { id: toastId });
                    }
                  }}
                />
                <Camera className="w-8 h-8 text-white drop-shadow-lg" />
              </label>
            </div>

            <div className="absolute -bottom-2 -right-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800 z-10">
              <div className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-md text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                {currentLevel.title}
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowEditDialog(true)}
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">{user.full_name}</h1>
          <p className="text-slate-400 text-sm mb-2">{user.email}</p>
          {user.bio && (
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">{user.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {user.location}
              </div>
            )}
            {user.university && (
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {user.university}
              </div>
            )}
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-6 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Current Rank</p>
              <p className="text-2xl font-bold text-white flex items-center gap-2">
                {currentLevel.level >= 6 ? <Crown className="w-6 h-6 text-amber-400" /> : <Shield className="w-6 h-6 text-indigo-400" />}
                {currentLevel.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">
                {Math.floor(userPoints?.total_points || 0)} <span className="text-slate-600">/</span> {nextLevel?.minXP || '∞'} XP
              </p>
              {nextLevel && (
                <p className="text-[10px] text-indigo-400 mt-0.5">
                  {nextLevel.minXP - (userPoints?.total_points || 0)} points to {nextLevel.title}
                </p>
              )}
            </div>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${currentLevel.level >= 6 ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-bold">Achievements</h3>
          </div>
          <BadgeSystem userStats={extendedStats} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-zinc-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card border-0 p-4 bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{userPoints?.streak_days || 0}</p>
                    <p className="text-xs text-slate-500">Day Streak</p>
                  </div>
                </div>
              </Card>
              <Card className="glass-card border-0 p-4 bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{avgScore}%</p>
                    <p className="text-xs text-slate-500">Avg Score</p>
                  </div>
                </div>
              </Card>
            </div>

            <GoalsTracker attempts={attempts} userPoints={userPoints} />

            {/* Subscription Card */}
            <Card className={`relative overflow-hidden border-0 p-5 ${isSubscribed ? 'bg-gradient-to-br from-emerald-900/20 to-zinc-900' : 'bg-gradient-to-br from-purple-900/20 to-zinc-900'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Crown className={`w-6 h-6 ${isSubscribed ? 'text-emerald-400' : 'text-purple-400'}`} />
                <div>
                  <h3 className="text-white font-bold">Subscription Status</h3>
                  <p className={`text-sm ${isSubscribed ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {isSubscribed ? 'Premium Member' : 'Free Plan'}
                  </p>
                </div>
              </div>

              {isSubscribed ? (
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={managingSubscription} className="w-full border-zinc-700 hover:bg-zinc-800">
                  Manage Subscription
                </Button>
              ) : (
                <Link to={createPageUrl('Pricing')}>
                  <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                    Upgrade to Premium
                  </Button>
                </Link>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 mt-4">
            <WeeklyChart attempts={completedAttempts} />
            <StudyHeatmap attempts={attempts} />
            <CompetencyBreakdown attempts={attempts} competencies={competencies} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Bio</Label>
              <Textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">University</Label>
                <Input
                  value={editData.university}
                  onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Workplace</Label>
                <Input
                  value={editData.workplace}
                  onChange={(e) => setEditData({ ...editData, workplace: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400">Location</Label>
              <Input
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="e.g. Cairo, Egypt"
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <LocationTracker user={user} onLocationUpdate={(loc) => setUser({ ...user, location: loc })} />
    </div>
  );
}