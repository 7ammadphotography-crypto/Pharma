import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ChevronRight, Loader2, BookOpen, Play, Layers, Brain, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function CompetencyDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const competencyId = urlParams.get('id');
  const mode = urlParams.get('mode') || 'study';

  const { data: competency, isLoading: loadingCompetency } = useQuery({
    queryKey: ['competency', competencyId],
    queryFn: async () => {
      const list = await base44.entities.Competency.filter({ id: competencyId });
      return list[0];
    },
    enabled: !!competencyId
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics', competencyId],
    queryFn: () => base44.entities.Topic.filter({ competency_id: competencyId }, 'order'),
    enabled: !!competencyId
  });

  const { data: allQuestions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  // Filter questions by topics that belong to this competency
  const topicIds = topics.map(t => t.id);
  const questions = allQuestions.filter(q => topicIds.includes(q.topic_id));

  const getQuestionCount = (topicId) => {
    return questions.filter(q => q.topic_id === topicId).length;
  };

  if (loadingCompetency) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link to={createPageUrl('Questions')}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{competency?.title}</h1>
            <p className="text-slate-500 text-xs">{topics.length} topics • {questions.length} questions</p>
          </div>
        </div>
      </motion.div>

      {competency?.description && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-sm glass-card p-4 rounded-xl"
        >
          {competency.description}
        </motion.p>
      )}

      {/* Topics List */}
      <div className="space-y-3">
        {topics.map((topic, index) => {
          const questionCount = getQuestionCount(topic.id);
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={createPageUrl(`Quiz?topicId=${topic.id}&mode=${mode}`)}>
                <Card className="glass-card border-0 p-4 hover:bg-white/5 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{topic.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                            <FileText className="w-3.5 h-3.5" />
                            {questionCount} questions
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}

        {topics.length === 0 && (
          <Card className="glass-card border-0 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-white font-medium mb-1">No topics yet</p>
            <p className="text-slate-500 text-sm">Topics will appear here once added</p>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      {topics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <Link to={createPageUrl(`Quiz?competencyId=${competencyId}&mode=${mode}`)}>
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-5 font-semibold shadow-xl shadow-indigo-500/20">
              <Play className="w-5 h-5 mr-2" />
              Start All Questions ({questions.length})
            </Button>
          </Link>
          
          <Link to={createPageUrl(`AIQuiz?competencyId=${competencyId}`)}>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 py-5 font-semibold shadow-xl shadow-violet-500/20 mt-3">
              <Brain className="w-5 h-5 mr-2" />
              AI Generated Quiz
              <Sparkles className="w-4 h-4 ml-2 text-amber-300" />
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}