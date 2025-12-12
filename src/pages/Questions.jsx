import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, GraduationCap, Play, ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

const COLORS = {
  blue: 'from-blue-600 to-blue-800',
  red: 'from-rose-600 to-rose-800',
  pink: 'from-pink-600 to-pink-800',
  purple: 'from-purple-600 to-purple-800',
  green: 'from-emerald-600 to-emerald-800',
  orange: 'from-orange-600 to-orange-800',
  cyan: 'from-cyan-600 to-cyan-800',
  amber: 'from-amber-600 to-amber-800'
};

export default function Questions() {
  const [expandedCompetency, setExpandedCompetency] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: competencies = [], isLoading: loadingComp } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: topicQuestions = [] } = useQuery({
    queryKey: ['topic-questions'],
    queryFn: () => base44.entities.TopicQuestion.list()
  });

  const getTopicsForCompetency = (compId) => topics.filter(t => t.competency_id === compId);
  
  const getQuestionsForTopic = (topicId) => {
    const linkedIds = topicQuestions.filter(tq => tq.topic_id === topicId).map(tq => tq.question_id);
    let qs = questions.filter(q => linkedIds.includes(q.id));
    if (selectedDifficulty) qs = qs.filter(q => q.difficulty === selectedDifficulty);
    
    // Filter by subscription - only easy for free users
    const isSubscribed = user?.subscription_status === 'active';
    if (!isSubscribed) {
      qs = qs.filter(q => q.difficulty === 'easy');
    }
    
    return qs;
  };

  const getQuestionsForCompetency = (compId) => {
    const topicIds = topics.filter(t => t.competency_id === compId).map(t => t.id);
    const linkedIds = topicQuestions.filter(tq => topicIds.includes(tq.topic_id)).map(tq => tq.question_id);
    // Use Set to avoid duplicates when a question is linked to multiple topics
    const uniqueIds = [...new Set(linkedIds)];
    let qs = questions.filter(q => uniqueIds.includes(q.id));
    if (selectedDifficulty) qs = qs.filter(q => q.difficulty === selectedDifficulty);
    
    // Filter by subscription - only easy for free users
    const isSubscribed = user?.subscription_status === 'active';
    if (!isSubscribed) {
      qs = qs.filter(q => q.difficulty === 'easy');
    }
    
    return qs;
  };

  const totalQuestions = questions.length;

  if (isLoading || loadingComp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-28">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-500/30">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Question Bank</h1>
        <p className="text-slate-500 text-sm mt-1">PEBC Competencies & Topics</p>
        <Badge className="mt-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30 px-4 py-2">
          {totalQuestions} Questions Available
        </Badge>
      </motion.div>

      {/* Difficulty Filter */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-2">
          {['', 'easy', 'medium', 'hard'].map(diff => {
            const isSubscribed = user?.subscription_status === 'active';
            const isLocked = !isSubscribed && (diff === 'medium' || diff === 'hard');
            
            return (
              <button
                key={diff}
                onClick={() => !isLocked && setSelectedDifficulty(diff)}
                disabled={isLocked}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : isLocked
                    ? 'glass-card text-slate-600 cursor-not-allowed opacity-50'
                    : 'glass-card text-slate-400 hover:text-white'
                }`}
              >
                {isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                {diff === '' ? 'All' : diff === 'easy' ? 'Easy' : diff === 'medium' ? 'Medium' : 'Hard'}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Competencies List */}
      <div className="space-y-3">
        {competencies.map((comp, idx) => {
          const compTopics = getTopicsForCompetency(comp.id);
          const compQuestions = getQuestionsForCompetency(comp.id);
          const isExpanded = expandedCompetency === comp.id;
          const gradient = COLORS[comp.color] || COLORS.blue;

          return (
            <motion.div
              key={comp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.03 }}
            >
              <Card className={`bg-gradient-to-r ${gradient} border-0 overflow-hidden`}>
                {/* Competency Header */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedCompetency(isExpanded ? null : comp.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{comp.title}</h3>
                        <Badge className="bg-white/20 text-white text-xs">{comp.weight}%</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-white/70 text-xs">
                        <span>{compTopics.length} Topics</span>
                        <span>•</span>
                        <span>{compQuestions.length} Questions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {compQuestions.length > 0 && (
                        <Link to={createPageUrl(`Quiz?competency=${comp.id}&difficulty=${selectedDifficulty}`)} onClick={e => e.stopPropagation()}>
                          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs">
                            <Play className="w-3 h-3 mr-1" /> Start
                          </Button>
                        </Link>
                      )}
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronRight className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                </div>

                {/* Topics List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-black/30"
                    >
                      <div className="p-3 space-y-2">
                        {compTopics.length === 0 ? (
                          <p className="text-white/50 text-center py-3 text-sm">No topics yet</p>
                        ) : (
                          compTopics.map(topic => {
                            const topicQs = getQuestionsForTopic(topic.id);
                            return (
                              <div 
                                key={topic.id} 
                                className="bg-white/10 rounded-xl p-3 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium text-sm">{topic.title}</h4>
                                    <p className="text-white/50 text-xs">{topicQs.length} questions</p>
                                  </div>
                                </div>
                                {topicQs.length > 0 && (
                                  <Link to={createPageUrl(`Quiz?topic=${topic.id}&difficulty=${selectedDifficulty}`)}>
                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                      <Play className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {competencies.length === 0 && (
        <Card className="glass-card border-0 p-8 text-center">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-white font-medium">No competencies found</p>
          <p className="text-slate-500 text-sm mt-2">Add competencies from admin panel</p>
        </Card>
      )}
    </div>
  );
}