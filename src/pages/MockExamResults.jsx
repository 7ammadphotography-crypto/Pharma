import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Trophy, Clock, Target, CheckCircle2, XCircle, 
  ChevronDown, ChevronUp, Home, RotateCcw, Share2,
  Loader2, Award, TrendingUp, AlertCircle
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function MockExamResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const attemptId = urlParams.get('attemptId');
  
  const [showDetails, setShowDetails] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const { data: attempt, isLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: async () => {
      const attempts = await base44.entities.QuizAttempt.filter({ id: attemptId });
      return attempts[0];
    },
    enabled: !!attemptId
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list()
  });

  // Celebration effect for good scores
  useEffect(() => {
    if (attempt && attempt.percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [attempt]);

  if (isLoading || !attempt) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (percentage >= 80) return { label: 'Very Good', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (percentage >= 70) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (percentage >= 60) return { label: 'Acceptable', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { label: 'Needs Improvement', color: 'text-rose-400', bg: 'bg-rose-500/20' };
  };

  const grade = getGrade(attempt.percentage);
  const correctAnswers = attempt.answers?.filter(a => a.is_correct).length || 0;
  const incorrectAnswers = attempt.total_questions - correctAnswers;

  // Get question details
  const getQuestionById = (id) => questions.find(q => q.id === id);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 pb-28">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Result Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center pt-8"
        >
          <div className={`w-24 h-24 rounded-full ${grade.bg} flex items-center justify-center mx-auto mb-4`}>
            {attempt.percentage >= 70 ? (
              <Trophy className={`w-12 h-12 ${grade.color}`} />
            ) : (
              <AlertCircle className={`w-12 h-12 ${grade.color}`} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Exam Complete!</h1>
          <div className={`inline-block px-4 py-2 rounded-full ${grade.bg}`}>
            <span className={`font-semibold ${grade.color}`}>{grade.label}</span>
          </div>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-0 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
            <div className="relative">
              <div className="text-6xl font-bold text-white mb-2">
                {attempt.percentage}%
              </div>
              <p className="text-slate-400">
                {attempt.score} of {attempt.total_questions} correct answers
              </p>
              <Progress value={attempt.percentage} className="h-3 mt-4" />
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          <Card className="glass-card border-0 p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{correctAnswers}</div>
            <p className="text-slate-500 text-xs">Correct</p>
          </Card>
          <Card className="glass-card border-0 p-4 text-center">
            <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{incorrectAnswers}</div>
            <p className="text-slate-500 text-xs">Wrong</p>
          </Card>
          <Card className="glass-card border-0 p-4 text-center">
            <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{Math.floor(attempt.time_spent_seconds / 60)}</div>
            <p className="text-slate-500 text-xs">Minutes</p>
          </Card>
        </motion.div>

        {/* Performance Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-0 p-5">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-white font-semibold">Performance Analysis</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Correct Answer Rate</span>
                <span className="text-white">{attempt.percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Spent</span>
                <span className="text-white">{formatTime(attempt.time_spent_seconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Time per Question</span>
                <span className="text-white">
                  {Math.round(attempt.time_spent_seconds / attempt.total_questions)} seconds
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detailed Answers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-0 overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-white font-semibold">Review Answers</span>
              {showDetails ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showDetails && (
              <div className="border-t border-white/10 max-h-[400px] overflow-y-auto">
                {attempt.answers?.map((answer, idx) => {
                  const question = getQuestionById(answer.question_id);
                  if (!question) return null;
                  
                  const isExpanded = expandedQuestion === idx;
                  
                  return (
                    <div key={idx} className="border-b border-white/5 last:border-0">
                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                        className="w-full p-4 flex items-start gap-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          answer.is_correct ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                        }`}>
                          {answer.is_correct ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{question.question_text}</p>
                          <p className="text-slate-500 text-xs mt-1">Question {idx + 1}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="space-y-2">
                            {question.options?.map((opt, optIdx) => {
                              const isCorrect = optIdx === question.correct_answer;
                              const wasSelected = optIdx === answer.selected_answer;
                              
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-lg text-sm ${
                                    isCorrect
                                      ? 'bg-emerald-500/20 border border-emerald-500/50'
                                      : wasSelected
                                        ? 'bg-rose-500/20 border border-rose-500/50'
                                        : 'bg-slate-800/50'
                                  }`}
                                >
                                  <span className={
                                    isCorrect ? 'text-emerald-400' : wasSelected ? 'text-rose-400' : 'text-slate-300'
                                  }>
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {question.explanation && (
                            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                              <p className="text-amber-300 text-sm">
                                <span className="font-semibold">Explanation: </span>
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          <Link to={createPageUrl('MockExamSetup')}>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 py-6">
              <RotateCcw className="w-5 h-5 ml-2" />
              New Exam
            </Button>
          </Link>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="w-full border-slate-700 py-6">
              <Home className="w-5 h-5 ml-2" />
              Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}