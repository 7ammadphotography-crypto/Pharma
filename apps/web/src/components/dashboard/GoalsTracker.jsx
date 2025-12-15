import React from 'react';
import { Card } from "@/components/ui/card";
import { Target, CheckCircle2 } from 'lucide-react';
import { startOfDay, isToday } from 'date-fns';

export default function GoalsTracker({ attempts, userPoints }) {
  const todayAttempts = attempts.filter(a => isToday(new Date(a.created_date)));
  const todayCompleted = todayAttempts.filter(a => a.is_completed).length;
  
  const goals = [
    { 
      title: 'Complete 3 quizzes today', 
      current: todayCompleted, 
      target: 3,
      color: 'from-indigo-500 to-purple-500'
    },
    { 
      title: 'Daily challenge', 
      current: userPoints?.daily_challenges_completed?.some(d => {
        const today = new Date().toISOString().split('T')[0];
        return d === today;
      }) ? 1 : 0, 
      target: 1,
      color: 'from-amber-500 to-orange-500'
    },
    { 
      title: 'Score 80%+ on a quiz', 
      current: todayAttempts.some(a => (a.percentage || 0) >= 80) ? 1 : 0, 
      target: 1,
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <Card className="glass-card border-0 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-amber-400" />
        <h3 className="text-white font-semibold">Daily Goals</h3>
      </div>

      <div className="space-y-3">
        {goals.map((goal, idx) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const isComplete = goal.current >= goal.target;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                  )}
                  <span className={`text-sm ${isComplete ? 'text-emerald-400 line-through' : 'text-white'}`}>
                    {goal.title}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{goal.current}/{goal.target}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${goal.color} transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}