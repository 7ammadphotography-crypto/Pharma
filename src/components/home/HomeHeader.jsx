import React from 'react';
import { Card } from "@/components/ui/card";
import { Sun, Moon, Sunrise, Trophy, Shield, Crown } from 'lucide-react';
import { calculateLevel, getNextLevel } from '@/utils/gamification';

export default function HomeHeader({ user, userPoints }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good morning', icon: Sunrise, gradient: 'from-amber-500 to-orange-500' };
        if (hour < 18) return { text: 'Good afternoon', icon: Sun, gradient: 'from-yellow-400 to-amber-500' };
        return { text: 'Good evening', icon: Moon, gradient: 'from-indigo-500 to-purple-600' };
    };

    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;

    const currentLevel = calculateLevel(userPoints?.total_points || 0);
    const nextLevel = getNextLevel(currentLevel.level);
    const progressToNext = nextLevel
        ? ((userPoints?.total_points || 0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP) * 100
        : 100;

    return (
        <Card className="glass-card glow-effect border-0 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* User Info & Greeting */}
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${greeting.gradient} flex items-center justify-center shadow-lg shadow-orange-500/20`}>
                        <GreetingIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-0.5">{greeting.text},</p>
                        <h2 className="text-2xl font-bold text-white">{user?.full_name || 'Champion'}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/5 text-[10px] text-white/80">
                                {user?.role === 'admin' ? 'Administrator' : 'Student'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rank & Progress */}
                <div className="flex-1 md:max-w-xs bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            {currentLevel.level >= 6 ? (
                                <Crown className="w-4 h-4 text-amber-400" />
                            ) : (
                                <Shield className="w-4 h-4 text-indigo-400" />
                            )}
                            <span className={`text-sm font-bold ${currentLevel.level >= 6 ? 'text-amber-400' : 'text-indigo-100'}`}>
                                {currentLevel.title}
                            </span>
                        </div>
                        <span className="text-xs text-slate-400">{Math.floor(userPoints?.total_points || 0)} XP</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${currentLevel.level >= 6
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                }`}
                            style={{ width: `${Math.min(progressToNext, 100)}%` }}
                        />
                    </div>

                    {nextLevel && (
                        <p className="text-[10px] text-slate-500 mt-1.5 text-right">
                            {nextLevel.minXP - (userPoints?.total_points || 0)} pts to {nextLevel.title}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
