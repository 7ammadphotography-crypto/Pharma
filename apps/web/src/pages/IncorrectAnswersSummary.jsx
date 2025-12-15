import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, AlertCircle, TrendingDown, BookOpen, Brain, Loader2,
  ChevronLeft, Target, Lightbulb, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function IncorrectAnswersSummary() {
  const [user, setUser] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_id: user?.id }),
    enabled: !!user
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list()
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list()
  });

  useEffect(() => {
    if (!user || attempts.length === 0 || questions.length === 0) {
      setLoading(false);
      return;
    }

    analyzeIncorrectAnswers();
  }, [user, attempts, questions, topics, competencies]);

  const analyzeIncorrectAnswers = async () => {
    setLoading(true);
    try {
      // Collect all incorrect answers
      const incorrectAnswers = [];
      attempts.forEach(attempt => {
        if (attempt.answers) {
          attempt.answers.forEach(answer => {
            if (!answer.is_correct) {
              const question = questions.find(q => q.id === answer.question_id);
              if (question) {
                incorrectAnswers.push({
                  question: question.question_text,
                  correctAnswer: question.options[question.correct_answer],
                  userAnswer: question.options[answer.selected_answer],
                  explanation: question.explanation,
                  difficulty: question.difficulty,
                  tags: question.tags || []
                });
              }
            }
          });
        }
      });

      if (incorrectAnswers.length === 0) {
        setLoading(false);
        return;
      }

      // Analyze patterns
      const difficultyBreakdown = {
        easy: incorrectAnswers.filter(a => a.difficulty === 'easy').length,
        medium: incorrectAnswers.filter(a => a.difficulty === 'medium').length,
        hard: incorrectAnswers.filter(a => a.difficulty === 'hard').length
      };

      // Get sample questions for AI analysis
      const sampleQuestions = incorrectAnswers.slice(0, 5).map(a => ({
        question: a.question,
        correct: a.correctAnswer,
        user: a.userAnswer
      }));

      // Call AI for pattern analysis
      const prompt = `You are an expert pharmacy educator analyzing common mistakes in student answers.

Student has ${incorrectAnswers.length} incorrect answers total.

Difficulty Breakdown:
- Easy: ${difficultyBreakdown.easy}
- Medium: ${difficultyBreakdown.medium}
- Hard: ${difficultyBreakdown.hard}

Sample Incorrect Answers:
${sampleQuestions.map((q, i) => `${i + 1}. Question: ${q.question}
   Student answered: ${q.user}
   Correct answer: ${q.correct}`).join('\n\n')}

Analyze and provide:
1. Common mistake patterns (e.g., misreading questions, knowledge gaps, calculation errors)
2. Root causes of these mistakes
3. Specific recommendations to avoid these mistakes
4. Study focus areas`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  frequency: { type: "string" },
                  examples: { type: "string" }
                }
              }
            },
            root_causes: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            focus_areas: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis({
        ...response,
        stats: {
          total: incorrectAnswers.length,
          byDifficulty: difficultyBreakdown
        },
        sampleQuestions: incorrectAnswers.slice(0, 10)
      });
    } catch (error) {
      console.error('Error analyzing incorrect answers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analyzing your mistakes...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 space-y-6 pb-28">
        <div className="flex items-center gap-3 pt-4">
          <Link to={createPageUrl('AIAssistant')}>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Incorrect Answers</h1>
            <p className="text-slate-400 text-sm">AI analysis of your mistakes</p>
          </div>
        </div>

        <Card className="glass-card border-0 p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Perfect Score!</h2>
          <p className="text-slate-400 mb-6">
            You haven't made any mistakes yet. Keep up the great work!
          </p>
          <Link to={createPageUrl('Questions')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Continue Learning
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-white">Incorrect Answers Analysis</h1>
            <p className="text-slate-400 text-sm">Learn from your mistakes</p>
          </div>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-r from-red-600 to-rose-600 border-0 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Mistakes</p>
              <p className="text-4xl font-bold text-white">{analysis.stats.total}</p>
            </div>
            <X className="w-12 h-12 text-white/30" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white/70 text-xs">Easy</p>
              <p className="text-white font-bold">{analysis.stats.byDifficulty.easy}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white/70 text-xs">Medium</p>
              <p className="text-white font-bold">{analysis.stats.byDifficulty.medium}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-white/70 text-xs">Hard</p>
              <p className="text-white font-bold">{analysis.stats.byDifficulty.hard}</p>
            </div>
          </div>
        </Card>

        {/* Common Patterns */}
        {analysis.patterns && analysis.patterns.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" />
              Common Mistake Patterns
            </h2>
            <div className="space-y-3">
              {analysis.patterns.map((pattern, idx) => (
                <Card key={idx} className="glass-card border-0 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm">{pattern.pattern}</h3>
                        <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
                          {pattern.frequency}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs">{pattern.examples}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Root Causes */}
        {analysis.root_causes && analysis.root_causes.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Root Causes
            </h2>
            <Card className="glass-card border-0 p-4">
              <ul className="space-y-2">
                {analysis.root_causes.map((cause, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    {cause}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              How to Improve
            </h2>
            <Card className="glass-card border-0 p-4">
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Focus Areas */}
        {analysis.focus_areas && analysis.focus_areas.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Focus on These Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {analysis.focus_areas.map((area, idx) => (
                <Badge key={idx} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link to={createPageUrl('IncorrectAnswers')}>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
            <BookOpen className="w-4 h-4 mr-2" />
            Review All Incorrect Answers
          </Button>
        </Link>
      </div>
    </SubscriptionGuard>
  );
}