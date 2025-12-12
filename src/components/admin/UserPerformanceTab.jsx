import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, Target, TrendingUp, CheckCircle, XCircle, 
  Calendar, Flame, BookOpen, ChevronDown, ChevronUp,
  Trophy, BarChart3, Timer, Brain
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function UserPerformanceTab({ user }) {
  const [expandedAttempt, setExpandedAttempt] = useState(null);

  // Fetch user's quiz attempts
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['user-attempts', user.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user.email
  });

  // Fetch user's points
  const { data: userPoints } = useQuery({
    queryKey: ['user-points', user.email],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.filter({ created_by: user.email });
      return points[0] || null;
    },
    enabled: !!user.email
  });

  // Fetch all questions for reference
  const { data: questions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  // Fetch topics and competencies
  const { data: topics = [] } = useQuery({
    queryKey: ['all-topics'],
    queryFn: () => base44.entities.Topic.list()
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['all-competencies'],
    queryFn: () => base44.entities.Competency.list()
  });

  // Calculate statistics
  const completedAttempts = attempts.filter(a => a.is_completed);
  const totalStudyTime = attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
  const totalQuestions = completedAttempts.reduce((sum, a) => sum + (a.total_questions || 0), 0);
  const totalCorrect = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const avgScore = completedAttempts.length > 0 
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0;

  // Get all incorrect answers
  const allIncorrectAnswers = [];
  completedAttempts.forEach(attempt => {
    if (attempt.answers) {
      attempt.answers.forEach(answer => {
        if (!answer.is_correct) {
          const question = questions.find(q => q.id === answer.question_id);
          if (question) {
            allIncorrectAnswers.push({
              ...answer,
              question,
              attemptDate: attempt.created_date
            });
          }
        }
      });
    }
  });

  // Get all correct answers
  const allCorrectAnswers = [];
  completedAttempts.forEach(attempt => {
    if (attempt.answers) {
      attempt.answers.forEach(answer => {
        if (answer.is_correct) {
          const question = questions.find(q => q.id === answer.question_id);
          if (question) {
            allCorrectAnswers.push({
              ...answer,
              question,
              attemptDate: attempt.created_date
            });
          }
        }
      });
    }
  });

  // Format time
  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getQuestionById = (id) => questions.find(q => q.id === id);

  if (attemptsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300">Total Study Time</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatTime(totalStudyTime)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-300">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgScore}%</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">Quizzes Completed</span>
          </div>
          <p className="text-2xl font-bold text-white">{completedAttempts.length}</p>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{userPoints?.streak_days || 0} days</p>
        </Card>
      </div>

      {/* Accuracy Stats */}
      <Card className="bg-zinc-800/50 border-zinc-700 p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Answer Accuracy
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-400">Correct: {totalCorrect}</span>
              <span className="text-red-400">Incorrect: {totalQuestions - totalCorrect}</span>
            </div>
            <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                style={{ width: `${totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400">Overall</p>
          </div>
        </div>
      </Card>

      {/* Tabs for Answers */}
      <Tabs defaultValue="incorrect" className="w-full">
        <TabsList className="bg-zinc-800 border-zinc-700 w-full">
          <TabsTrigger value="incorrect" className="flex-1 gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            Incorrect ({allIncorrectAnswers.length})
          </TabsTrigger>
          <TabsTrigger value="correct" className="flex-1 gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Correct ({allCorrectAnswers.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Incorrect Answers Tab */}
        <TabsContent value="incorrect">
          <ScrollArea className="h-[400px]">
            {allIncorrectAnswers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
                <p>No incorrect answers yet!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allIncorrectAnswers.map((item, idx) => (
                  <Card key={idx} className="bg-zinc-800/50 border-zinc-700 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-white text-sm flex-1">{item.question.question_text}</p>
                      <Badge variant="outline" className="text-xs text-slate-400 shrink-0">
                        {format(new Date(item.attemptDate), 'MMM d')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-red-300 text-xs">Student's Answer:</span>
                          <p className="text-white">{item.question.options?.[item.selected_answer] || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-green-300 text-xs">Correct Answer:</span>
                          <p className="text-white">{item.question.options?.[item.question.correct_answer] || 'N/A'}</p>
                        </div>
                      </div>

                      {item.question.explanation && (
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <span className="text-blue-300 text-xs">Explanation:</span>
                          <p className="text-slate-300 text-xs mt-1">{item.question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Correct Answers Tab */}
        <TabsContent value="correct">
          <ScrollArea className="h-[400px]">
            {allCorrectAnswers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-slate-500/50" />
                <p>No answers yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allCorrectAnswers.slice(0, 50).map((item, idx) => (
                  <Card key={idx} className="bg-zinc-800/50 border-zinc-700 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-white text-sm">{item.question.question_text}</p>
                          <p className="text-green-400 text-xs mt-1">
                            ✓ {item.question.options?.[item.question.correct_answer]}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs text-slate-400 shrink-0">
                        {format(new Date(item.attemptDate), 'MMM d')}
                      </Badge>
                    </div>
                  </Card>
                ))}
                {allCorrectAnswers.length > 50 && (
                  <p className="text-center text-slate-500 text-sm py-2">
                    Showing first 50 of {allCorrectAnswers.length} correct answers
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Quiz History Tab */}
        <TabsContent value="history">
          <ScrollArea className="h-[400px]">
            {attempts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-500/50" />
                <p>No quiz attempts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => {
                  const isExpanded = expandedAttempt === attempt.id;
                  const topic = topics.find(t => t.id === attempt.topic_id);
                  const competency = competencies.find(c => c.id === attempt.competency_id);
                  
                  return (
                    <Card key={attempt.id} className="bg-zinc-800/50 border-zinc-700 overflow-hidden">
                      <button
                        onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              attempt.percentage >= 80 ? 'bg-green-500/20' :
                              attempt.percentage >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'
                            }`}>
                              <span className={`font-bold ${
                                attempt.percentage >= 80 ? 'text-green-400' :
                                attempt.percentage >= 50 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {attempt.percentage || 0}%
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">
                                {topic?.title || competency?.title || (attempt.mode === 'mock_test' ? 'Mock Exam' : 'Quiz')}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>{attempt.score || 0}/{attempt.total_questions || 0} correct</span>
                                <span>•</span>
                                <span>{formatTime(attempt.time_spent_seconds)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(attempt.created_date), { addSuffix: true })}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {isExpanded && attempt.answers && (
                        <div className="px-4 pb-4 border-t border-zinc-700 pt-3">
                          <p className="text-xs text-slate-400 mb-2">Questions:</p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {attempt.answers.map((answer, idx) => {
                              const question = getQuestionById(answer.question_id);
                              if (!question) return null;
                              
                              return (
                                <div 
                                  key={idx}
                                  className={`p-2 rounded-lg text-xs ${
                                    answer.is_correct 
                                      ? 'bg-green-500/10 border border-green-500/20' 
                                      : 'bg-red-500/10 border border-red-500/20'
                                  }`}
                                >
                                  <p className="text-white mb-1">{question.question_text}</p>
                                  <div className="flex items-center gap-2">
                                    {answer.is_correct ? (
                                      <CheckCircle className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-400" />
                                    )}
                                    <span className={answer.is_correct ? 'text-green-300' : 'text-red-300'}>
                                      {question.options?.[answer.selected_answer]}
                                    </span>
                                    {!answer.is_correct && (
                                      <span className="text-green-300 ml-2">
                                        (Correct: {question.options?.[question.correct_answer]})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Activity Info */}
      <Card className="bg-zinc-800/50 border-zinc-700 p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          Activity Timeline
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Account Created</span>
            <p className="text-white">{format(new Date(user.created_date), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <span className="text-slate-400">Last Login</span>
            <p className="text-white">
              {user.last_login_date 
                ? formatDistanceToNow(new Date(user.last_login_date), { addSuffix: true })
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Last Activity</span>
            <p className="text-white">
              {userPoints?.last_activity_date 
                ? formatDistanceToNow(new Date(userPoints.last_activity_date), { addSuffix: true })
                : attempts.length > 0 
                  ? formatDistanceToNow(new Date(attempts[0].created_date), { addSuffix: true })
                  : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Total Points</span>
            <p className="text-white flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              {userPoints?.total_points || 0} (Level {userPoints?.level || 1})
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}