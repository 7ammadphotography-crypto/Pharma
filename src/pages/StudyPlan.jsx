import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, Target, TrendingUp, Sparkles, CheckCircle2,
  Book, Brain, Zap, Trophy, AlertCircle, ChevronRight, RotateCcw,
  BookOpen, ClipboardCheck, Loader2, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function StudyPlan() {
  const [user, setUser] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: studyPlans = [], isLoading } = useQuery({
    queryKey: ['study-plans', user?.email],
    queryFn: () => base44.entities.StudyPlan.filter({ created_by: user?.email, is_active: true }, '-created_date', 1),
    enabled: !!user
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateStudyPlan', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      toast.success('Study plan generated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to generate study plan');
      console.error(error);
    }
  });

  const activePlan = studyPlans[0];
  const planData = activePlan?.plan_data;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'study': return BookOpen;
      case 'practice': return Target;
      case 'review': return RotateCcw;
      case 'assessment': return ClipboardCheck;
      default: return Book;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'study': return 'from-blue-500 to-indigo-600';
      case 'practice': return 'from-green-500 to-emerald-600';
      case 'review': return 'from-amber-500 to-orange-600';
      case 'assessment': return 'from-purple-500 to-pink-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="p-4 space-y-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Calendar className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Study Plan</h1>
          <p className="text-slate-400 text-sm">Personalized learning schedule</p>
        </motion.div>

        <Card className="glass-card border-0 p-8 text-center">
          <Sparkles className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">No Study Plan Yet</h2>
          <p className="text-slate-400 mb-6">
            Generate a personalized 30-day study plan based on your performance and goals
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Study Plan
              </>
            )}
          </Button>
        </Card>

        <Card className="glass-card border-0 p-5">
          <h3 className="text-white font-semibold mb-3">What's Included:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Personalized Schedule</p>
                <p className="text-zinc-400">You haven&apos;t started any study plans yet.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Topic Prioritization</p>
                <p className="text-slate-500 text-xs">Focus on areas that need work</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Daily Tasks</p>
                <p className="text-slate-500 text-xs">Study, practice, and review activities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Progress Checkpoints</p>
                <p className="text-slate-500 text-xs">Track your improvement over time</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="p-4 space-y-4 pb-28">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Calendar className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Your Study Plan</h1>
          <p className="text-slate-400 text-sm">
            {planData?.total_duration_days || 30} day personalized schedule
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-white mt-1" />
              <div className="flex-1">
                <h2 className="text-white font-bold mb-2">Plan Overview</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  {planData?.summary}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          variant="outline"
          className="w-full glass-card border-slate-700 text-white hover:bg-white/5"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate Plan
            </>
          )}
        </Button>

        {planData?.focus_areas && planData.focus_areas.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-400" />
              Focus Areas
            </h2>
            <div className="space-y-2">
              {planData.focus_areas.map((area, idx) => (
                <Card key={idx} className="glass-card border-0 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm">{area.topic}</h3>
                        <Badge className={getPriorityColor(area.priority)}>
                          {area.priority}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs">{area.reason}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {planData?.weeks && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Weekly Schedule
            </h2>
            <div className="space-y-3">
              {planData.weeks.map((week, weekIdx) => (
                <Card key={weekIdx} className="glass-card border-0 overflow-hidden">
                  <button
                    onClick={() => setExpandedWeek(expandedWeek === weekIdx ? null : weekIdx)}
                    className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold">Week {week.week_number}</h3>
                          <Badge variant="outline" className="text-indigo-400 border-indigo-500/30">
                            {week.theme}
                          </Badge>
                        </div>
                        <p className="text-slate-500 text-xs">
                          {week.goals?.length || 0} goals • {week.days?.length || 0} days
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedWeek === weekIdx ? 'rotate-90' : ''
                        }`} />
                    </div>
                  </button>

                  {expandedWeek === weekIdx && (
                    <div className="border-t border-white/5 p-4 space-y-4">
                      {week.goals && week.goals.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs mb-2">Weekly Goals:</p>
                          <ul className="space-y-1">
                            {week.goals.map((goal, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                <Star className="w-4 h-4 text-amber-400 mt-0.5" />
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-3">
                        {week.days?.map((day, dayIdx) => (
                          <div key={dayIdx} className="bg-slate-800/30 rounded-lg p-3">
                            <h4 className="text-white font-semibold text-sm mb-2">
                              Day {day.day}
                            </h4>
                            <div className="space-y-2">
                              {day.tasks?.map((task, taskIdx) => {
                                const Icon = getTypeIcon(task.type);
                                return (
                                  <div key={taskIdx} className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTypeColor(task.type)} 
                                    flex items-center justify-center flex-shrink-0`}>
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white text-sm font-medium">{task.topic}</p>
                                        {task.duration_minutes && (
                                          <div className="flex items-center gap-1 text-slate-500 text-xs">
                                            <Clock className="w-3 h-3" />
                                            {task.duration_minutes}m
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-slate-400 text-xs">{task.description}</p>
                                      {task.topic_id && (
                                        <Link to={createPageUrl(`Quiz?topic=${task.topic_id}`)}>
                                          <Button
                                            size="sm"
                                            className="mt-2 h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                                          >
                                            Start Quiz
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {planData?.checkpoints && planData.checkpoints.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Progress Checkpoints
            </h2>
            <div className="space-y-2">
              {planData.checkpoints.map((checkpoint, idx) => (
                <Card key={idx} className="glass-card border-0 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 font-bold text-sm">D{checkpoint.day}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{checkpoint.description}</p>
                      {checkpoint.target_score && (
                        <p className="text-slate-500 text-xs">Target: {checkpoint.target_score}%</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {planData?.tips && planData.tips.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Study Tips
            </h2>
            <Card className="glass-card border-0 p-4">
              <ul className="space-y-2">
                {planData.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </SubscriptionGuard>
  );
}