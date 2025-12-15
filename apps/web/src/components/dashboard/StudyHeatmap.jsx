import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, X, Clock, Target, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, startOfDay, addDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudyHeatmap({ attempts }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'week' or 'month'
  const [weekOffset, setWeekOffset] = useState(0);

  const daysToShow = viewMode === 'month' ? 28 : 7;
  const startOffset = viewMode === 'month' ? 27 : (6 + weekOffset * 7);

  // Generate days based on view mode
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const date = subDays(new Date(), startOffset - i);
    const dayAttempts = attempts.filter(a => {
      const attemptDate = startOfDay(new Date(a.created_date));
      return attemptDate.getTime() === startOfDay(date).getTime();
    });
    
    const totalTime = dayAttempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
    const avgScore = dayAttempts.length > 0 
      ? Math.round(dayAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / dayAttempts.length)
      : 0;

    return {
      date,
      count: dayAttempts.length,
      day: format(date, 'd'),
      attempts: dayAttempts,
      totalTime,
      avgScore,
      isToday: isSameDay(date, new Date())
    };
  });

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const hasActivity = attempts.some(a => 
        isSameDay(startOfDay(new Date(a.created_date)), startOfDay(date))
      );
      if (hasActivity) streak++;
      else if (i > 0) break; // Allow today to be empty
    }
    return streak;
  };

  const streak = calculateStreak();

  const getIntensity = (count, isToday) => {
    const base = count === 0 ? 'bg-slate-800/50' :
                 count === 1 ? 'bg-indigo-900/60' :
                 count === 2 ? 'bg-indigo-700/70' :
                 count <= 4 ? 'bg-indigo-500/80' : 'bg-indigo-400';
    
    return `${base} ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#0a0a0f]' : ''}`;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Split into weeks for month view
  const weeks = viewMode === 'month' 
    ? [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21), days.slice(21, 28)]
    : [days];

  const handleDayClick = (day) => {
    if (day.count > 0) {
      setSelectedDay(day);
    }
  };

  return (
    <>
      <Card className="glass-card border-0 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Study Activity</h3>
          </div>
          
          {/* Streak Badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-2.5 py-1 rounded-full">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-xs font-bold">{streak} day streak!</span>
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex bg-slate-800/50 rounded-lg p-0.5">
            <button
              onClick={() => { setViewMode('week'); setWeekOffset(0); }}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                viewMode === 'week' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                viewMode === 'month' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>

          {/* Week Navigation */}
          {viewMode === 'week' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500 px-2">
                {weekOffset === 0 ? 'This Week' : `${weekOffset} week${weekOffset > 1 ? 's' : ''} ago`}
              </span>
              <button
                onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                disabled={weekOffset === 0}
                className={`p-1 rounded-md ${weekOffset === 0 ? 'text-slate-700' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1.5">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex gap-1.5">
              {week.map((day, dayIdx) => (
                <motion.button
                  key={dayIdx}
                  whileHover={{ scale: day.count > 0 ? 1.1 : 1 }}
                  whileTap={{ scale: day.count > 0 ? 0.95 : 1 }}
                  onClick={() => handleDayClick(day)}
                  className={`flex-1 aspect-square rounded-lg ${getIntensity(day.count, day.isToday)} 
                    flex flex-col items-center justify-center relative group transition-all
                    ${day.count > 0 ? 'cursor-pointer hover:ring-2 hover:ring-white/20' : 'cursor-default'}`}
                >
                  <span className={`text-[10px] ${day.isToday ? 'text-white font-bold' : 'text-white/50'}`}>
                    {day.day}
                  </span>
                  
                  {/* Tooltip on hover */}
                  {day.count > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                      bg-slate-900 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 
                      transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      <p className="text-white text-xs font-medium">{day.count} session{day.count > 1 ? 's' : ''}</p>
                      <p className="text-slate-400 text-[10px]">{format(day.date, 'MMM d')}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-slate-800/50" />
            <div className="w-3 h-3 rounded bg-indigo-900/60" />
            <div className="w-3 h-3 rounded bg-indigo-700/70" />
            <div className="w-3 h-3 rounded bg-indigo-500/80" />
            <div className="w-3 h-3 rounded bg-indigo-400" />
          </div>
          <span>More</span>
        </div>

        {/* Tap hint */}
        <p className="text-center text-slate-600 text-[10px] mt-3">
          Tap on colored days to see details
        </p>
      </Card>

      {/* Day Details Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Activity on</p>
                    <h3 className="text-white text-xl font-bold">
                      {format(selectedDay.date, 'EEEE, MMM d')}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 p-4">
                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-white font-bold text-lg">{selectedDay.count}</p>
                  <p className="text-slate-500 text-xs">Sessions</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-lg">{formatTime(selectedDay.totalTime)}</p>
                  <p className="text-slate-500 text-xs">Study Time</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    selectedDay.avgScore >= 80 ? 'bg-emerald-500/20' :
                    selectedDay.avgScore >= 60 ? 'bg-amber-500/20' : 'bg-rose-500/20'
                  }`}>
                    <Target className={`w-4 h-4 ${
                      selectedDay.avgScore >= 80 ? 'text-emerald-400' :
                      selectedDay.avgScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`} />
                  </div>
                  <p className={`font-bold text-lg ${
                    selectedDay.avgScore >= 80 ? 'text-emerald-400' :
                    selectedDay.avgScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>{selectedDay.avgScore}%</p>
                  <p className="text-slate-500 text-xs">Avg Score</p>
                </div>
              </div>

              {/* Session List */}
              <div className="px-4 pb-4">
                <p className="text-slate-400 text-sm mb-2">Sessions</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDay.attempts.map((attempt, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-zinc-800/30 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          (attempt.percentage || 0) >= 80 ? 'bg-emerald-400' :
                          (attempt.percentage || 0) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        <div>
                          <p className="text-white text-sm">Quiz Session</p>
                          <p className="text-slate-500 text-xs">
                            {format(new Date(attempt.created_date), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        (attempt.percentage || 0) >= 80 ? 'text-emerald-400' :
                        (attempt.percentage || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {attempt.percentage || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}