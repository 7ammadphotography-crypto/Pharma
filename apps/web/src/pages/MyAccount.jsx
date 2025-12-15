import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Camera, Building2, Briefcase, Calendar, Settings, ChevronRight,
  Crown, Loader2, CreditCard, CheckCircle, TrendingUp, Target, Clock,
  Star, Flame, Award, BarChart3, Zap, Shield, MapPin, Edit3,
  Linkedin, Github, Twitter, Brain, Share2
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
import { fetchUserAnalytics } from '@/utils/analytics';

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const queryClient = useQueryClient();

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
        location: u.location || '',
        linkedin: u.linkedin || '',
        github: u.github || '',
        twitter: u.twitter || ''
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
    queryFn: () => base44.entities.QuizAttempt.filter({ user_id: user?.id }, '-created_at'),
    enabled: !!user?.id
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list()
  });

  // Use the new analytics utility
  const { data: analytics } = useQuery({
    queryKey: ['user-analytics', user?.id],
    queryFn: () => fetchUserAnalytics(user?.id),
    enabled: !!user?.id,
    refetchInterval: 30000 // Refresh every 30s
  });

  // Fallback to basic points if analytics fails or loading
  const userPoints = analytics || { total_points: 0, streak_days: 0 };

  const completedAttempts = attempts.filter(a => a.is_completed);
  const avgScore = analytics?.avg_score || (completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0);

  // Gamification Stats
  const currentLevel = calculateLevel(userPoints.total_points || 0);
  const nextLevel = getNextLevel(currentLevel.level);
  const progressToNext = nextLevel
    ? ((userPoints.total_points || 0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP) * 100
    : 100;

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe(editData);
      setUser({ ...user, ...editData });
      setShowEditDialog(false);
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries(['user-analytics']);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
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

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24 text-white">
      {/* Hero Section */}
      <div className="relative h-56 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>

        {/* Cognitive Score Display (Top Right) */}
        <div className="absolute top-6 right-6 flex flex-col items-end">
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 mb-2">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold text-pink-100">COGNITIVE SCORE</span>
          </div>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-lg filter">
            {analytics?.cognitive_score || 0}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-24 relative">
        <div className="flex justify-between items-end mb-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-zinc-900 p-1.5 shadow-2xl relative overflow-hidden ring-4 ring-[#0a0a0f]">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-bold text-white shadow-inner">
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
                      const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;

                      // 1. Direct Supabase Upload
                      const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, file, { upsert: true });

                      if (uploadError) {
                        console.error('Supabase Upload Error:', uploadError);
                        throw new Error(`Upload failed: ${uploadError.message}`);
                      }

                      // 2. Get Public URL
                      const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                      // 3. Update DB
                      const { error: dbError } = await base44.auth.updateMe({ avatar_url: publicUrl });

                      if (dbError) {
                        console.error('DB Update Error:', dbError);
                        throw new Error(`Profile save failed: ${dbError.message}`);
                      }

                      setUser(prev => ({ ...prev, avatar_url: publicUrl }));
                      toast.success('Profile picture updated', { id: toastId });

                    } catch (err) {
                      console.error("Full Error:", err);
                      toast.error(err.message, { id: toastId, duration: 5000 });
                    }
                  }}
                />
                <Camera className="w-8 h-8 text-white drop-shadow-lg" />
              </label>
            </div>

            <div className="absolute -bottom-3 -right-3 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 z-10 shadow-lg">
              {currentLevel.level >= 6 ? <Crown className="w-5 h-5 text-amber-400" /> : <Shield className="w-5 h-5 text-indigo-400" />}
            </div>
          </div>
          <Button
            onClick={() => setShowEditDialog(true)}
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all hover:scale-105"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            {user.full_name}
          </h1>
          <p className="text-slate-400 text-sm mb-3 flex items-center gap-2">
            {user.email}
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span className="text-indigo-400 font-medium">{currentLevel.title}</span>
          </p>

          {user.bio && (
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl mb-4 p-3 bg-zinc-900/40 rounded-lg border border-white/5">
              {user.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
            {user.location && (
              <div className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800/50">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {user.location}
              </div>
            )}
            {user.university && (
              <div className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800/50">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {user.university}
              </div>
            )}
            {user.workplace && (
              <div className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800/50">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {user.workplace}
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 mt-4">
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-lg transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            {user.github && (
              <a href={user.github} target="_blank" rel="noreferrer" className="p-2 bg-zinc-700/30 hover:bg-zinc-700/50 text-white rounded-lg transition-colors">
                <Github className="w-4 h-4" />
              </a>
            )}
            {user.twitter && (
              <a href={user.twitter} target="_blank" rel="noreferrer" className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 rounded-lg transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-8 bg-gradient-to-r from-zinc-900 to-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Current Level</p>
              <p className="text-3xl font-black text-white">
                LVL {currentLevel.level}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-xl font-bold text-white">{Math.floor(userPoints.total_points || 0)}</span>
                <span className="text-sm text-slate-500">/ {nextLevel?.minXP || '∞'} XP</span>
              </div>
              {nextLevel && (
                <p className="text-[10px] text-indigo-400 mt-1 font-medium">
                  {nextLevel.minXP - (userPoints.total_points || 0)} XP to reach {nextLevel.title}
                </p>
              )}
            </div>
          </div>
          <div className="h-4 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
            <div
              className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${currentLevel.level >= 6 ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500'
                }`}
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            >
              <div className="absolute inset-0 bg-[url('/stripes.svg')] opacity-20 animate-slide"></div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-white font-bold text-lg">Achievements</h3>
            </div>
            <Link to={createPageUrl("Badges")} className="text-xs text-indigo-400 hover:text-indigo-300">
              View All
            </Link>
          </div>
          {/* Using new analytics data for badges */}
          <BadgeSystem userStats={analytics || {}} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-zinc-800 h-11 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">Overview</TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-zinc-800">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card border-0 p-4 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{userPoints.streak_days || 0}</p>
                    <p className="text-xs text-slate-500">Day Streak</p>
                  </div>
                </div>
              </Card>
              <Card className="glass-card border-0 p-4 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{avgScore}%</p>
                    <p className="text-xs text-slate-500">Avg Score</p>
                  </div>
                </div>
              </Card>
              <Card className="glass-card border-0 p-4 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20">
                    <Share2 className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{analytics?.social_impact || 0}</p>
                    <p className="text-xs text-slate-500">Social Impact</p>
                  </div>
                </div>
              </Card>
              <Card className="glass-card border-0 p-4 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{analytics?.total_quizzes || 0}</p>
                    <p className="text-xs text-slate-500">Quizzes Done</p>
                  </div>
                </div>
              </Card>
            </div>

            <GoalsTracker attempts={attempts} userPoints={userPoints} />

            {/* Subscription Card */}
            <Card className={`relative overflow-hidden border-0 p-6 ${isSubscribed ? 'bg-gradient-to-br from-emerald-900/20 to-zinc-900 border border-emerald-900/30' : 'bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-purple-900/30'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${isSubscribed ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
                  <Crown className={`w-6 h-6 ${isSubscribed ? 'text-emerald-400' : 'text-purple-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Subscription Status</h3>
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
                  <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 font-semibold shadow-lg shadow-purple-900/20">
                    Upgrade to Premium
                  </Button>
                </Link>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6 mt-6">
            <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Performance Trend
              </h3>
              <WeeklyChart attempts={completedAttempts} />
            </div>

            <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Study Habits
              </h3>
              <StudyHeatmap attempts={attempts} />
            </div>

            <CompetencyBreakdown attempts={attempts} competencies={competencies} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Edit Profile</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update your personal information and social links visible on your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="text-zinc-400 mb-1.5 block">Bio</Label>
              <Textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 text-white min-h-[100px] focus:ring-indigo-500"
                placeholder="Tell us about your medical interests..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 mb-1.5 block">University</Label>
                <Input
                  value={editData.university}
                  onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 mb-1.5 block">Workplace</Label>
                <Input
                  value={editData.workplace}
                  onChange={(e) => setEditData({ ...editData, workplace: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 mb-1.5 block">Location</Label>
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <Label className="text-zinc-400 mb-1.5 block">Birth Date</Label>
                <Input
                  type="date"
                  value={editData.birth_date}
                  onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <Label className="text-zinc-300 font-semibold mb-2 block">Social Links</Label>

              <div className="relative">
                <Linkedin className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <Input
                  value={editData.linkedin}
                  onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white pl-9"
                  placeholder="LinkedIn URL"
                />
              </div>

              <div className="relative">
                <Github className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <Input
                  value={editData.github}
                  onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white pl-9"
                  placeholder="GitHub URL"
                />
              </div>

              <div className="relative">
                <Twitter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <Input
                  value={editData.twitter}
                  onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white pl-9"
                  placeholder="Twitter/X URL"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
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