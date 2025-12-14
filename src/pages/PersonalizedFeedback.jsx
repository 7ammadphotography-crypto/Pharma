import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2,
  Brain, Zap, Trophy, Clock, Loader2, ChevronLeft, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function PersonalizedFeedback() {
  const [user, setUser] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_id: user?.id }),
    enabled: !!user
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });

  useEffect(() => {
    if (!user || attempts.length === 0 || competencies.length === 0) {
      setLoading(false);
      return;
    }

    generateFeedback();
  }, [user, attempts, competencies, topics]);

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const completedAttempts = attempts.filter(a => a.is_completed);

      if (completedAttempts.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate performance metrics
      const avgScore = Math.round(
        completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
      );

      const recentAttempts = completedAttempts.slice(0, 10);
      const recentAvg = Math.round(
        recentAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / recentAttempts.length
      );

      // Analyze by competency
      const competencyPerf = {};
      completedAttempts.forEach(attempt => {
        const topic = topics.find(t => t.id === attempt.topic_id);
        if (topic?.competency_id) {
          if (!competencyPerf[topic.competency_id]) {
            competencyPerf[topic.competency_id] = { scores: [], total: 0 };
          }
          competencyPerf[topic.competency_id].scores.push(attempt.percentage || 0);
          competencyPerf[topic.competency_id].total++;
        }
      });

      const competencyAnalysis = competencies.map(comp => {
        const perf = competencyPerf[comp.id];
        if (!perf) return null;
        const avg = Math.round(perf.scores.reduce((a, b) => a + b, 0) / perf.total);
        return {
          name: comp.title,
          score: avg,
          attempts: perf.total
        };
      }).filter(Boolean);

      const weakAreas = competencyAnalysis.filter(c => c.score < 70).slice(0, 3);
      const strongAreas = competencyAnalysis.filter(c => c.score >= 80).slice(0, 3);

      // Call AI for detailed feedback
      const prompt = `You are an expert pharmacy educator analyzing student performance.

Student Performance Summary:
- Total Quizzes: ${completedAttempts.length}
- Overall Average: ${avgScore}%
- Recent Average (last 10): ${recentAvg}%
- Trend: ${recentAvg > avgScore ? 'Improving' : recentAvg < avgScore ? 'Declining' : 'Stable'}

Weak Areas (need focus):
${weakAreas.map(a => `- ${a.name}: ${a.score}% (${a.attempts} attempts)`).join('\n')}

Strong Areas:
${strongAreas.map(a => `- ${a.name}: ${a.score}% (${a.attempts} attempts)`).join('\n')}

Provide personalized feedback with:
1. Overall performance assessment (2-3 sentences)
2. Specific strengths to maintain
3. Key areas for improvement with actionable advice
4. Study strategy recommendations
5. Motivational message`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            areas_for_improvement: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  advice: { type: "string" }
                }
              }
            },
            study_strategies: { type: "array", items: { type: "string" } },
            motivation: { type: "string" }
          }
        }
      });

      setFeedback({
        ...response,
        stats: {
          totalQuizzes: completedAttempts.length,
          avgScore,
          recentAvg,
          trend: recentAvg > avgScore ? 'improving' : recentAvg < avgScore ? 'declining' : 'stable'
        },
        weakAreas,
        strongAreas
      });
    } catch (error) {
      console.error('Error generating feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analyzing your performance...</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="p-4 space-y-6 pb-28">
        <div className="flex items-center gap-3 pt-4">
          <Link to={createPageUrl('AIAssistant')}>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Personalized Feedback</h1>
            <p className="text-slate-400 text-sm">AI-powered performance analysis</p>
          </div>
        </div>

        <Card className="glass-card border-0 p-8 text-center">
          <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">No Data Available</h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            Select a quiz attempt and click &quot;Generate Feedback&quot; to get an AI-powered analysis of your performance.
          </p>
          <Link to={createPageUrl('Questions')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Start Quiz
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (feedback.stats.trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (feedback.stats.trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Target className="w-5 h-5 text-slate-400" />;
  };

  return (
    <SubscriptionGuard>
      <div className="p-4 space-y-4 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <Link to={createPageUrl('AIAssistant')}>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Personalized Feedback</h1>
            <p className="text-slate-400 text-sm">AI-powered analysis</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="glass-card border-0 p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Quizzes</p>
            <p className="text-2xl font-bold text-white">{feedback.stats.totalQuizzes}</p>
          </Card>
          <Card className="glass-card border-0 p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Avg Score</p>
            <p className="text-2xl font-bold text-white">{feedback.stats.avgScore}%</p>
          </Card>
          <Card className="glass-card border-0 p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Trend</p>
            <div className="flex justify-center mt-1">
              {getTrendIcon()}
            </div>
          </Card>
        </div>

        {/* Overall Assessment */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 p-5">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-white mt-1" />
            <div>
              <h2 className="text-white font-bold mb-2">Overall Assessment</h2>
              <p className="text-white/90 text-sm leading-relaxed">
                {feedback.overall_assessment}
              </p>
            </div>
          </div>
        </Card>

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Your Strengths
            </h2>
            <Card className="glass-card border-0 p-4">
              <ul className="space-y-2">
                {feedback.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.areas_for_improvement && feedback.areas_for_improvement.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-400" />
              Areas for Improvement
            </h2>
            <div className="space-y-3">
              {feedback.areas_for_improvement.map((item, idx) => (
                <Card key={idx} className="glass-card border-0 p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    {item.area}
                  </h3>
                  <p className="text-slate-400 text-sm">{item.advice}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Study Strategies */}
        {feedback.study_strategies && feedback.study_strategies.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Recommended Strategies
            </h2>
            <Card className="glass-card border-0 p-4">
              <ul className="space-y-2">
                {feedback.study_strategies.map((strategy, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    {strategy}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Motivation */}
        {feedback.motivation && (
          <Card className="bg-gradient-to-r from-amber-600 to-orange-600 border-0 p-5">
            <p className="text-white text-sm italic leading-relaxed text-center">
              "{feedback.motivation}"
            </p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('Questions')}>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              Practice More
            </Button>
          </Link>
          <Link to={createPageUrl('StudyPlan')}>
            <Button variant="outline" className="w-full glass-card border-slate-700 text-white">
              View Study Plan
            </Button>
          </Link>
        </div>
      </div>
    </SubscriptionGuard>
  );
}