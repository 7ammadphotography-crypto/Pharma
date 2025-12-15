import React from 'react';
import { Card } from "@/components/ui/card";
import { History, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function RecentActivity({ attempts = [] }) {
    if (attempts.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    Recent Activity
                </h3>
                <Link to={createPageUrl('MyAccount')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    View All
                </Link>
            </div>

            <div className="space-y-2">
                {attempts.slice(0, 3).map((attempt, idx) => (
                    <Link key={attempt.id || idx} to={createPageUrl(`QuizResults?attemptId=${attempt.id}`)}>
                        <Card className="bg-white/5 border-white/5 p-3 hover:bg-white/10 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${attempt.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                        attempt.percentage >= 60 ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-red-500/20 text-red-400'
                                    }`}>
                                    {attempt.percentage}%
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium line-clamp-1">
                                        {attempt.topic_id ? attempt.topic_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'General Quiz'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {moment(attempt.created_date).fromNow()}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
