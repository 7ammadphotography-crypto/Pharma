import React from 'react';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

export default function QuestionAnalytics({ questions, attempts }) {
  // Calculate question difficulty based on actual performance
  const questionStats = questions.map(q => {
    const questionAttempts = attempts.flatMap(a => a.answers || []).filter(ans => ans.question_id === q.id);
    const correctCount = questionAttempts.filter(a => a.is_correct).length;
    const totalAttempts = questionAttempts.length;
    const successRate = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null;
    
    return {
      ...q,
      totalAttempts,
      successRate,
      isHard: successRate !== null && successRate < 40,
      isEasy: successRate !== null && successRate > 80
    };
  });

  const hardQuestions = questionStats.filter(q => q.isHard);
  const easyQuestions = questionStats.filter(q => q.isEasy);
  const unattempted = questionStats.filter(q => q.totalAttempts === 0);

  // Difficulty distribution
  const difficultyData = [
    { name: 'سهل', value: questions.filter(q => q.difficulty === 'easy').length, color: '#10b981' },
    { name: 'متوسط', value: questions.filter(q => q.difficulty === 'medium').length, color: '#f59e0b' },
    { name: 'صعب', value: questions.filter(q => q.difficulty === 'hard').length, color: '#ef4444' },
  ];

  // Tags distribution
  const tagCounts = {};
  questions.forEach(q => {
    (q.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const tagsData = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-0 p-3 text-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{hardQuestions.length}</p>
          <p className="text-slate-500 text-xs">أسئلة صعبة جداً</p>
        </Card>
        <Card className="glass-card border-0 p-3 text-center">
          <Target className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{unattempted.length}</p>
          <p className="text-slate-500 text-xs">لم تُجرب بعد</p>
        </Card>
        <Card className="glass-card border-0 p-3 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{easyQuestions.length}</p>
          <p className="text-slate-500 text-xs">سهلة جداً</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Difficulty Pie */}
        <Card className="glass-card border-0 p-3">
          <p className="text-white text-sm font-medium mb-2">توزيع الصعوبة</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  dataKey="value"
                >
                  {difficultyData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            {difficultyData.map((d, idx) => (
              <span key={idx} className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Card>

        {/* Tags Bar */}
        <Card className="glass-card border-0 p-3">
          <p className="text-white text-sm font-medium mb-2">أكثر التصنيفات</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagsData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Hard Questions Alert */}
      {hardQuestions.length > 0 && (
        <Card className="bg-red-500/10 border border-red-500/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-medium">أسئلة تحتاج مراجعة</p>
              <p className="text-red-400/70 text-xs mt-1">
                {hardQuestions.slice(0, 2).map(q => q.question_text?.substring(0, 40) + '...').join(' • ')}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}