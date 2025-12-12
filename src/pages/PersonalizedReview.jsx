import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Loader2, Target, TrendingUp, BookOpen, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function PersonalizedReview() {
  const [user, setUser] = useState(null);
  const [review, setReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ created_by: user?.email }, '-created_date', 20),
    enabled: !!user
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list()
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list()
  });

  useEffect(() => {
    if (attempts.length > 0 && questions.length > 0 && competencies.length > 0) {
      generateReview();
    } else if (attempts.length === 0 && user) {
      setIsLoading(false);
    }
  }, [attempts, questions, competencies, user]);

  const generateReview = async () => {
    setIsLoading(true);

    // Analyze incorrect answers
    const incorrectQuestionIds = new Set();
    const competencyScores = {};

    attempts.forEach(attempt => {
      if (attempt.competency_id) {
        if (!competencyScores[attempt.competency_id]) {
          competencyScores[attempt.competency_id] = { total: 0, correct: 0 };
        }
        competencyScores[attempt.competency_id].total += attempt.total_questions || 0;
        competencyScores[attempt.competency_id].correct += attempt.score || 0;
      }

      attempt.answers?.forEach(ans => {
        if (!ans.is_correct) {
          incorrectQuestionIds.add(ans.question_id);
        }
      });
    });

    // Find weak competencies
    const weakAreas = Object.entries(competencyScores)
      .map(([id, data]) => ({
        id,
        percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        name: competencies.find(c => c.id === id)?.title || 'Unknown'
      }))
      .filter(c => c.percentage < 70)
      .sort((a, b) => a.percentage - b.percentage);

    // Get incorrect question details
    const incorrectQuestions = questions
      .filter(q => incorrectQuestionIds.has(q.id))
      .slice(0, 5)
      .map(q => q.question_text);

    // Generate AI review
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this pharmacy student's quiz performance and provide personalized study recommendations:

Weak Areas (Competencies with <70% score):
${weakAreas.map(w => `- ${w.name}: ${w.percentage}%`).join('\n') || 'None identified yet'}

Sample of incorrectly answered questions:
${incorrectQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') || 'No incorrect answers yet'}

Total quizzes completed: ${attempts.length}

Provide:
1. A brief analysis of their strengths and weaknesses (2-3 sentences)
2. Top 3 specific study recommendations
3. A motivational message

Keep it concise and actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          analysis: { type: "string" },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          motivation: { type: "string" }
        }
      }
    });

    setReview({
      ...response,
      weakAreas,
      totalAttempts: attempts.length,
      incorrectCount: incorrectQuestionIds.size
    });
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <p className="text-white font-medium">Analyzing your performance...</p>
          <p className="text-slate-500 text-sm">Creating personalized recommendations</p>
        </div>
      </div>
    );
  }

  if (!review || attempts.length === 0) {
    return (
      <div className="p-4 min-h-screen flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-indigo-400" />
        </div>
        <p className="text-white font-medium mb-2">No Data Yet</p>
        <p className="text-slate-500 text-sm mb-6 text-center">Complete some quizzes first to get personalized recommendations</p>
        <Link to={createPageUrl('Questions')}>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
            Start Learning
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="p-4 space-y-5 pb-28">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Review</h1>
            <p className="text-slate-500 text-xs">Personalized for you</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="glass-card border-0 p-4 text-center">
          <p className="text-2xl font-bold text-white">{review.totalAttempts}</p>
          <p className="text-slate-500 text-xs">Quizzes</p>
        </Card>
        <Card className="glass-card border-0 p-4 text-center">
          <p className="text-2xl font-bold text-white">{review.weakAreas.length}</p>
          <p className="text-slate-500 text-xs">Weak Areas</p>
        </Card>
        <Card className="glass-card border-0 p-4 text-center">
          <p className="text-2xl font-bold text-white">{review.incorrectCount}</p>
          <p className="text-slate-500 text-xs">To Review</p>
        </Card>
      </motion.div>

      {/* AI Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card glow-effect border-0 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-semibold">AI Analysis</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{review.analysis}</p>
        </Card>
      </motion.div>

      {/* Weak Areas */}
      {review.weakAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-semibold">Focus Areas</h3>
          </div>
          <div className="space-y-2">
            {review.weakAreas.slice(0, 3).map((area, idx) => (
              <Card key={idx} className="glass-card border-0 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{area.name}</span>
                  <span className={`text-sm font-bold ${
                    area.percentage < 50 ? 'text-rose-400' : 'text-amber-400'
                  }`}>{area.percentage}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      area.percentage < 50 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${area.percentage}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-white font-semibold">Recommendations</h3>
        </div>
        <div className="space-y-3">
          {review.recommendations?.map((rec, idx) => (
            <Card key={idx} className="glass-card border-0 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-bold text-sm">{idx + 1}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{rec.title}</p>
                  <p className="text-slate-400 text-xs mt-1">{rec.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Motivation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-slate-200 text-sm leading-relaxed flex-1">{review.motivation}</p>
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <Link to={createPageUrl('IncorrectAnswers')}>
          <Button className="w-full bg-gradient-to-r from-rose-600 to-pink-600 py-5">
            Review Mistakes
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
        <Link to={createPageUrl('Questions')}>
          <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-white/5 py-5">
            Practice More
          </Button>
        </Link>
      </motion.div>
    </div>
    </SubscriptionGuard>
  );
}