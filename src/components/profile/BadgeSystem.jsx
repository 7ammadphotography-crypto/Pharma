import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateBadges } from '@/utils/gamification';

export default function BadgeSystem({ userStats }) {
    const earnedBadges = calculateBadges(userStats || {});

    if (earnedBadges.length === 0) {
        return (
            <div className="p-4 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                <p className="text-slate-500 text-sm">No badges earned yet. Keep studying!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-3">
            {earnedBadges.map((badge) => (
                <TooltipProvider key={badge.id}>
                    <Tooltip>
                        <TooltipTrigger>
                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 rounded-xl transition-all group">
                                <div className="text-3xl mb-2 filter drop-shadow-lg group-hover:scale-110 transition-transform">
                                    {badge.icon}
                                </div>
                                <span className="text-[10px] font-medium text-slate-400 group-hover:text-white text-center leading-tight">
                                    {badge.name}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                            <p className="font-bold">{badge.name}</p>
                            <p className="text-slate-400">{badge.description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    );
}
