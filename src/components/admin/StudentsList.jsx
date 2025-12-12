import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Target, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export default function StudentsList({ users, attempts, userPoints }) {
  // Calculate stats for each user
  const studentsWithStats = users
    .filter(u => u.role !== 'admin')
    .map(user => {
      const userAttempts = attempts.filter(a => a.created_by === user.email && a.is_completed);
      const points = userPoints.find(p => p.created_by === user.email);
      
      const totalQuizzes = userAttempts.length;
      const avgScore = totalQuizzes > 0 
        ? Math.round(userAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalQuizzes)
        : 0;
      const totalTime = userAttempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
      const lastActivity = userAttempts.length > 0 
        ? new Date(Math.max(...userAttempts.map(a => new Date(a.created_date))))
        : null;

      return {
        ...user,
        totalQuizzes,
        avgScore,
        totalTime,
        lastActivity,
        totalPoints: points?.total_points || 0,
        level: points?.level || 1
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-3">
      {studentsWithStats.length === 0 ? (
        <Card className="glass-card border-0 p-6 text-center">
          <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">لا يوجد طلاب مسجلين</p>
        </Card>
      ) : (
        studentsWithStats.map((student, idx) => (
          <Card key={student.id} className="glass-card border-0 p-3">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                idx === 0 ? 'bg-amber-500 text-white' :
                idx === 1 ? 'bg-slate-400 text-white' :
                idx === 2 ? 'bg-amber-700 text-white' :
                'bg-zinc-700 text-slate-400'
              }`}>
                {idx + 1}
              </div>

              {/* Avatar & Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">{student.full_name || student.email}</p>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-xs">
                    Lv.{student.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {student.totalQuizzes} اختبار
                  </span>
                  <span className={`flex items-center gap-1 ${getScoreColor(student.avgScore)}`}>
                    {student.avgScore >= 60 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {student.avgScore}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(student.totalTime)}
                  </span>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-400">
                  <Trophy className="w-4 h-4" />
                  <span className="font-bold">{student.totalPoints}</span>
                </div>
                {student.lastActivity && (
                  <p className="text-slate-600 text-xs mt-1">
                    {new Date(student.lastActivity).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}