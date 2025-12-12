import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Card } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

export default function WeeklyChart({ attempts }) {
  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayAttempts = attempts.filter(a => {
      const attemptDate = startOfDay(new Date(a.created_date));
      return attemptDate.getTime() === startOfDay(date).getTime();
    });
    
    const avgScore = dayAttempts.length > 0
      ? Math.round(dayAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / dayAttempts.length)
      : 0;

    return {
      day: format(date, 'EEE'),
      score: avgScore,
      count: dayAttempts.length
    };
  });

  const getBarColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score > 0) return '#ef4444';
    return '#1e293b';
  };

  return (
    <Card className="glass-card border-0 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white font-semibold">Weekly Progress</h3>
      </div>
      
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days} barRadius={[6, 6, 0, 0]}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis hide domain={[0, 100]} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {last7Days.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-400">80%+</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-400">60-79%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-400">&lt;60%</span>
        </span>
      </div>
    </Card>
  );
}