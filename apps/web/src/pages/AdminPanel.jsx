import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Layers, BookOpen, HelpCircle, Users, AlertTriangle, 
  TrendingUp, ChevronRight, Loader2, Link2, Unlink,
  BarChart3, CheckCircle, Clock, Sparkles
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminPanel() {
  // Fetch all data
  const { data: chapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });

  const { data: topics = [], isLoading: loadingTopics } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });

  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: topicQuestions = [] } = useQuery({
    queryKey: ['topic-questions'],
    queryFn: () => base44.entities.TopicQuestion.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: () => base44.entities.QuizAttempt.list('-created_date', 100)
  });

  const isLoading = loadingChapters || loadingTopics || loadingQuestions;

  // Calculate stats
  const unlinkedTopics = topics.filter(t => !t.competency_id);
  const linkedQuestionIds = new Set(topicQuestions.map(tq => tq.question_id));
  const unlinkedQuestions = questions.filter(q => !linkedQuestionIds.has(q.id));
  
  const questionsWithExplanation = questions.filter(q => q.explanation && q.explanation.trim().length > 0);
  const questionsWithoutExplanation = questions.filter(q => !q.explanation || q.explanation.trim().length === 0);

  const totalAttempts = quizAttempts.length;
  const completedAttempts = quizAttempts.filter(a => a.is_completed);
  const avgScore = completedAttempts.length > 0 
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0;

  // Stats cards data
  const statsCards = [
    { 
      title: 'Chapters', 
      value: chapters.length, 
      icon: Layers, 
      color: 'from-blue-600 to-blue-800',
      link: 'ManageChapters',
      description: 'Total chapters'
    },
    { 
      title: 'Topics', 
      value: topics.length, 
      icon: BookOpen, 
      color: 'from-purple-600 to-purple-800',
      link: 'ManageTopics',
      description: `${unlinkedTopics.length} unlinked`
    },
    { 
      title: 'Questions', 
      value: questions.length, 
      icon: HelpCircle, 
      color: 'from-emerald-600 to-emerald-800',
      link: 'ManageQuestions',
      description: `${unlinkedQuestions.length} uncategorized`
    },
    { 
      title: 'Students', 
      value: users.length, 
      icon: Users, 
      color: 'from-amber-600 to-amber-800',
      link: 'AdminUsers',
      description: 'Registered users'
    },
  ];

  // Quick actions
  const quickActions = [
    { title: 'Add Chapter', icon: Layers, link: 'ManageChapters', color: 'bg-blue-600' },
    { title: 'Add Topic', icon: BookOpen, link: 'ManageTopics', color: 'bg-purple-600' },
    { title: 'Add Question', icon: HelpCircle, link: 'ManageQuestions', color: 'bg-emerald-600' },
    { title: 'AI Generate', icon: Sparkles, link: 'ManageQuestions', color: 'bg-pink-600' },
  ];

  if (isLoading) {
    return (
      <AdminLayout currentPage="AdminPanel">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="AdminPanel">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm">Overview of your learning platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={createPageUrl(stat.link)}>
                <Card className={`bg-gradient-to-br ${stat.color} border-0 p-4 hover:scale-105 transition-transform cursor-pointer group`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/70 text-sm">{stat.title}</p>
                      <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                      <p className="text-white/50 text-xs mt-1">{stat.description}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map(action => (
              <Link key={action.title} to={createPageUrl(action.link)}>
                <Card className="glass-card border-0 p-4 hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">{action.title}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Alerts & Issues */}
        {(unlinkedTopics.length > 0 || unlinkedQuestions.length > 0 || questionsWithoutExplanation.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Needs Attention
            </h2>
            <div className="grid gap-3">
              {unlinkedTopics.length > 0 && (
                <Link to={createPageUrl('ManageTopics')}>
                  <Card className="glass-card border-0 p-4 hover:bg-white/5 transition-all cursor-pointer border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <Unlink className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{unlinkedTopics.length} Unlinked Topics</p>
                          <p className="text-slate-400 text-sm">Topics not assigned to any chapter</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </Card>
                </Link>
              )}

              {unlinkedQuestions.length > 0 && (
                <Link to={createPageUrl('ManageQuestions')}>
                  <Card className="glass-card border-0 p-4 hover:bg-white/5 transition-all cursor-pointer border-l-4 border-l-rose-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                          <HelpCircle className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{unlinkedQuestions.length} Uncategorized Questions</p>
                          <p className="text-slate-400 text-sm">Questions not linked to any topic</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </Card>
                </Link>
              )}

              {questionsWithoutExplanation.length > 0 && (
                <Link to={createPageUrl('ManageQuestions')}>
                  <Card className="glass-card border-0 p-4 hover:bg-white/5 transition-all cursor-pointer border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{questionsWithoutExplanation.length} Questions Need Explanation</p>
                          <p className="text-slate-400 text-sm">Use AI to generate explanations</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </Card>
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Platform Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card border-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalAttempts}</p>
                  <p className="text-slate-400 text-sm">Total Attempts</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card border-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completedAttempts.length}</p>
                  <p className="text-slate-400 text-sm">Completed Quizzes</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card border-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{avgScore}%</p>
                  <p className="text-slate-400 text-sm">Average Score</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Content Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Content Structure
          </h2>
          <Card className="glass-card border-0 overflow-hidden">
            <div className="divide-y divide-white/5">
              {chapters.map(chapter => {
                const chapterTopics = topics.filter(t => t.competency_id === chapter.id);
                const chapterTopicIds = chapterTopics.map(t => t.id);
                const chapterQuestionIds = topicQuestions
                  .filter(tq => chapterTopicIds.includes(tq.topic_id))
                  .map(tq => tq.question_id);
                const uniqueQuestionCount = new Set(chapterQuestionIds).size;

                return (
                  <div key={chapter.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${chapter.color || 'blue'}-500`} />
                        <div>
                          <p className="text-white font-medium">{chapter.title}</p>
                          <div className="flex gap-3 mt-1">
                            <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                              {chapterTopics.length} topics
                            </Badge>
                            <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                              {uniqueQuestionCount} questions
                            </Badge>
                            <Badge variant="outline" className="text-xs text-indigo-400 border-indigo-700">
                              {chapter.weight}% weight
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Link to={createPageUrl('ManageChapters')}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {chapters.length === 0 && (
                <div className="p-8 text-center">
                  <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No chapters yet</p>
                  <Link to={createPageUrl('ManageChapters')}>
                    <Button className="mt-3 bg-indigo-600">Create First Chapter</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}