import React from 'react';
import { Card } from "@/components/ui/card";
import { Flame, Target, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomeStats({ streak, avgScore, dailyProgress = 0, dailyGoal = 20 }) {
    const goalPercentage = Math.min((dailyProgress / dailyGoal) * 100, 100);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Daily Goal - New Feature */}
            <Card className="glass-card border-0 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        Daily Goal
                    </h3>
                    <span className="text-xs text-blue-300 font-mono">{dailyProgress}/{dailyGoal}</span>
                </div>
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div className="text-right w-full">
                            <span className="text-xs font-semibold inline-block text-blue-400">
                                {Math.round(goalPercentage)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-zinc-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goalPercentage}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        {dailyProgress >= dailyGoal ? "Goal completed! 🎉" : `${dailyGoal - dailyProgress} questions left`}
                    </p>
                </div>
            </Card>

            {/* Streak */}
            <Card className="glass-card border-0 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
                <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{streak}</p>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Day Streak</p>
                    </div>
                </div>
            </Card>

            {/* Avg Score */}
            <Card className="glass-card border-0 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{avgScore}%</p>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Avg. Accuracy</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
