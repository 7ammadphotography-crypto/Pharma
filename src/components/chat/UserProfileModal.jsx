import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Building2, Briefcase, Calendar, Trophy, Flame, Star, MessageSquare, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function UserProfileModal({ isOpen, onClose, user, currentUser }) {
    if (!user) return null;

    const { data: userStats } = useQuery({
        queryKey: ['user-stats', user.email],
        queryFn: async () => {
            // Fetch user points/stats
            const points = await base44.entities.UserPoints.filter({ created_by: user.email });
            return points[0] || { total_points: 0, streak_days: 0 };
        },
        enabled: !!user.email && isOpen
    });

    const { data: attempts = [] } = useQuery({
        queryKey: ['user-public-attempts', user.email],
        queryFn: () => base44.entities.QuizAttempt.filter({ created_by: user.email }),
        enabled: !!user.email && isOpen
    });

    const completedAttempts = attempts.filter(a => a.is_completed);
    const avgScore = completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
        : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0a0a0f] border-zinc-800 p-0 overflow-hidden max-w-md">
                {/* Header / Cover */}
                <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6 relative">
                    {/* Avatar */}
                    <div className="absolute -top-12 left-6">
                        <div className="w-24 h-24 rounded-full bg-zinc-900 p-1">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4 gap-2">
                        {currentUser?.email !== user.email && (
                            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message
                            </Button>
                        )}
                    </div>

                    {/* Name & Bio */}
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold text-white">{user.full_name || 'User'}</h2>
                        <p className="text-slate-400 text-sm">{user.email}</p>

                        <div className="flex flex-wrap gap-3 mt-4">
                            {user.university && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-zinc-800/50 px-2.5 py-1 rounded-full border border-zinc-700">
                                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                    {user.university}
                                </div>
                            )}
                            {user.workplace && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-zinc-800/50 px-2.5 py-1 rounded-full border border-zinc-700">
                                    <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                                    {user.workplace}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
                            <div className="flex justify-center mb-1">
                                <Trophy className="w-5 h-5 text-amber-400" />
                            </div>
                            <p className="text-lg font-bold text-white">{userStats?.total_points || 0}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Points</p>
                        </div>
                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
                            <div className="flex justify-center mb-1">
                                <Flame className="w-5 h-5 text-orange-500" />
                            </div>
                            <p className="text-lg font-bold text-white">{userStats?.streak_days || 0}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Day Streak</p>
                        </div>
                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
                            <div className="flex justify-center mb-1">
                                <Star className="w-5 h-5 text-indigo-400" />
                            </div>
                            <p className="text-lg font-bold text-white">{avgScore}%</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Score</p>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
