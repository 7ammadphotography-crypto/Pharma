import React from 'react';
import { Card } from "@/components/ui/card";
import { Layers, FileText, X, Bookmark, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActions() {
    const actions = [
        {
            title: 'Flashcards',
            desc: 'Quick memorization',
            icon: Layers,
            color: 'from-cyan-500 to-teal-500',
            shadow: 'shadow-cyan-500/20',
            link: 'Flashcards'
        },
        {
            title: 'Saved Summaries',
            desc: 'Review AI insights',
            icon: FileText,
            color: 'from-blue-500 to-indigo-500',
            shadow: 'shadow-blue-500/20',
            link: 'SavedSummaries'
        },
        {
            title: 'Incorrect Answers',
            desc: 'Learn from mistakes',
            icon: X,
            color: 'from-rose-500 to-pink-500',
            shadow: 'shadow-rose-500/20',
            link: 'IncorrectAnswers'
        },
        {
            title: 'Bookmarked',
            desc: 'Saved questions',
            icon: Bookmark,
            color: 'from-violet-500 to-purple-500',
            shadow: 'shadow-violet-500/20',
            link: 'Bookmarked'
        },
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, idx) => (
                    <Link key={idx} to={createPageUrl(action.link)}>
                        <Card className="glass-card border-0 p-4 h-full hover:bg-white/5 transition-all duration-300 group">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg ${action.shadow}`}>
                                <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-white text-sm">{action.title}</h3>
                            <p className="text-slate-500 text-xs mt-1">{action.desc}</p>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
