import React from 'react';
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

export default function CompetencyBreakdown({ attempts, competencies }) {
  const completedAttempts = attempts.filter(a => a.is_completed);
  
  // Use PEBC weights for pie chart
  const competencyData = competencies
    .filter(comp => comp.weight > 0)
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .map(comp => {
      const compAttempts = completedAttempts.filter(a => a.competency_id === comp.id);
      const avgScore = compAttempts.length > 0
        ? Math.round(compAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / compAttempts.length)
        : 0;
      
      return {
        name: comp.title,
        value: comp.weight || 0,
        score: avgScore,
        weight: comp.weight || 0,
        color: getCompColor(comp.color)
      };
    });

  function getCompColor(color) {
    const colors = {
      cyan: '#06b6d4',
      purple: '#a855f7',
      pink: '#ec4899',
      orange: '#f97316',
      blue: '#3b82f6',
      red: '#ef4444',
      green: '#22c55e',
      amber: '#f59e0b'
    };
    return colors[color] || '#6366f1';
  }

  if (competencyData.length === 0) {
    return (
      <Card className="glass-card border-0 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-violet-400" />
          <h3 className="text-white font-semibold text-sm">PEBC Weights</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-slate-500 text-sm">No competencies</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-violet-400" />
        <h3 className="text-white font-semibold text-sm">PEBC Weights</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={competencyData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {competencyData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1">
          {competencyData.slice(0, 5).map((comp, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: comp.color }}
                />
                <span className="text-[9px] text-slate-300 truncate max-w-[70px]">
                  {comp.name}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-white">{comp.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}