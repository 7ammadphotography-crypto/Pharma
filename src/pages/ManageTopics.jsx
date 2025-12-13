import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, Loader2, Search, Link2,
  CheckSquare, Square, ChevronDown, ChevronUp, MoreVertical,
  Heart, Brain, Pill, Syringe, Stethoscope, Microscope,
  FlaskConical, ClipboardList, Shield, Users, Scale, Activity,
  Thermometer, Eye, Ear, Hand, Wind, Bone, Droplet, Dna, HelpCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TOPIC_ICONS = {
  heart: Heart, brain: Brain, pill: Pill, syringe: Syringe,
  stethoscope: Stethoscope, microscope: Microscope, flask: FlaskConical,
  clipboard: ClipboardList, shield: Shield, users: Users, scale: Scale,
  activity: Activity, thermometer: Thermometer, eye: Eye, ear: Ear,
  hand: Hand, lungs: Wind, bone: Bone, droplet: Droplet, dna: Dna
};

const ICON_OPTIONS = Object.keys(TOPIC_ICONS);

export default function ManageTopics() {
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', competency_id: '', order: 0, icon: 'pill',
    tags: [], metadata: { subject: '', grade: '', domain: '' }
  });
  const [filterChapter, setFilterChapter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedTopic, setExpandedTopic] = useState(null);

  // For linking
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkingTopicId, setLinkingTopicId] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [questionSearch, setQuestionSearch] = useState('');

  const queryClient = useQueryClient();

  // Data
  const { data: chapters = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });
  const { data: allQuestions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });
  const { data: topicQuestions = [] } = useQuery({
    queryKey: ['topic-questions-all'],
    queryFn: () => base44.entities.TopicQuestion.list()
  });

  // Derived
  const getLinkedQuestions = (topicId) => {
    const linkedIds = topicQuestions.filter(tq => tq.topic_id === topicId).map(tq => tq.question_id);
    return allQuestions.filter(q => linkedIds.includes(q.id));
  };

  const getLinkedCount = (topicId) => topicQuestions.filter(tq => tq.topic_id === topicId).length;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Topic.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      resetForm();
      toast.success('Topic created successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to create topic');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Topic.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      resetForm();
      toast.success('Topic updated successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to update topic');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Topic.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      toast.success('Topic deleted');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to delete topic');
    }
  });

  const linkMutation = useMutation({
    mutationFn: async ({ topicId, questionIds }) => {
      const creates = questionIds.map(qid => ({ topic_id: topicId, question_id: qid }));
      await base44.entities.TopicQuestion.bulkCreate(creates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['topic-questions-all']);
      setShowLinkDialog(false);
      setSelectedQuestions(new Set());
      toast.success('Questions linked successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to link questions');
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: async ({ topicId, questionId }) => {
      const tq = topicQuestions.find(t => t.topic_id === topicId && t.question_id === questionId);
      if (tq) await base44.entities.TopicQuestion.delete(tq.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['topic-questions-all']);
      toast.success('Question unlinked');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to unlink question');
    }
  });

  // Handlers
  const resetForm = () => {
    setForm({ title: '', description: '', competency_id: '', order: 0, icon: 'pill', tags: [], metadata: { subject: '', grade: '', domain: '' } });
    setEditItem(null);
    setIsOpen(false);
  };
  const handleEdit = (topic) => {
    setEditItem(topic);
    setForm({ ...topic, icon: topic.icon || 'pill', tags: topic.tags || [], metadata: topic.metadata || { subject: '', grade: '', domain: '' } });
    setIsOpen(true);
  };
  const handleSubmit = () => {
    if (!form.title.trim() || !form.competency_id) return;
    const data = { ...form, metadata: Object.fromEntries(Object.entries(form.metadata).filter(([_, v]) => v && v.trim())) };
    if (editItem) updateMutation.mutate({ id: editItem.id, data });
    else createMutation.mutate(data);
  };
  const openLinkDialog = (topicId) => {
    setLinkingTopicId(topicId);
    setSelectedQuestions(new Set());
    setQuestionSearch('');
    setShowLinkDialog(true);
  };

  // Filter logic
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchChapter = filterChapter === 'all' || t.competency_id === filterChapter;
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      return matchChapter && matchSearch;
    });
  }, [topics, filterChapter, search]);

  // Link Dialog logic
  const getUnlinkedQuestions = (topicId) => {
    const linkedIds = new Set(topicQuestions.filter(tq => tq.topic_id === topicId).map(tq => tq.question_id));
    return allQuestions.filter(q => !linkedIds.has(q.id));
  };
  const filteredUnlinked = linkingTopicId ? getUnlinkedQuestions(linkingTopicId).filter(q =>
    q.question_text?.toLowerCase().includes(questionSearch.toLowerCase())
  ) : [];

  return (
    <AdminLayout currentPage="ManageTopics">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Topics</h2>
            <p className="text-slate-400 text-sm">Manage topics and link questions • {topics.length} topics</p>
          </div>
          <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Topic
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 pr-10"
            />
          </div>
          <Select value={filterChapter} onValueChange={setFilterChapter}>
            <SelectTrigger className="w-[200px] bg-zinc-900/50 border-zinc-800">
              <SelectValue placeholder="All Chapters" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Topics Table */}
        <Card className="glass-card border-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-left text-slate-300">Topic</TableHead>
                <TableHead className="text-left text-slate-300">Chapter</TableHead>
                <TableHead className="text-left text-slate-300">Questions</TableHead>
                <TableHead className="text-left text-slate-300 w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredTopics.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No topics found</TableCell></TableRow>
              ) : (
                filteredTopics.map(topic => {
                  const linkedCount = getLinkedCount(topic.id);
                  const Icon = TOPIC_ICONS[topic.icon] || Pill;
                  const chapter = chapters.find(c => c.id === topic.competency_id);

                  return (
                    <React.Fragment key={topic.id}>
                      <TableRow className="border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <span className="font-medium text-white">{topic.title}</span>
                              {topic.description && <p className="text-xs text-slate-500 line-clamp-1">{topic.description}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-slate-300 border-slate-600">
                            {chapter?.title || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={linkedCount > 0 ? 'bg-emerald-900/50 text-emerald-300' : 'bg-amber-900/50 text-amber-300'}
                          >
                            <HelpCircle className="w-3 h-3 mr-1" />
                            {linkedCount} questions
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem onClick={() => openLinkDialog(topic.id)}><Link2 className="w-4 h-4 mr-2" /> Link Questions</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(topic)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteMutation.mutate(topic.id)} className="text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Questions Section */}
                      {expandedTopic === topic.id && (
                        <TableRow className="bg-zinc-900/50">
                          <TableCell colSpan={4} className="p-0">
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                              <div className="p-4 border-t border-white/5">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="text-sm font-medium text-slate-300">Linked Questions ({linkedCount})</h4>
                                  <div className="flex gap-2">
                                    <Link to={createPageUrl(`ManageQuestions`)} onClick={(e) => e.stopPropagation()}>
                                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                        <Plus className="w-3 h-3 mr-1" /> Add New Question
                                      </Button>
                                    </Link>
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openLinkDialog(topic.id); }} className="border-dashed">
                                      <Link2 className="w-3 h-3 mr-1" /> Link Existing Questions
                                    </Button>
                                  </div>
                                </div>

                                {linkedCount === 0 ? (
                                  <p className="text-sm text-slate-500 text-center py-4">No questions linked to this topic</p>
                                ) : (
                                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                    {getLinkedQuestions(topic.id).map(q => (
                                      <div key={q.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg group">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-white line-clamp-1">{q.question_text}</p>
                                          <div className="flex gap-2 mt-1">
                                            <Badge variant="outline" className={
                                              q.difficulty === 'easy' ? 'text-green-400 border-green-500/20 text-[10px]' :
                                                q.difficulty === 'hard' ? 'text-red-400 border-red-500/20 text-[10px]' :
                                                  'text-amber-400 border-amber-500/20 text-[10px]'
                                            }>
                                              {q.difficulty}
                                            </Badge>
                                          </div>
                                        </div>
                                        <Button
                                          size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-400"
                                          onClick={(e) => { e.stopPropagation(); unlinkMutation.mutate({ topicId: topic.id, questionId: q.id }); }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Topic Form Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader><DialogTitle>{editItem ? 'Edit Topic' : 'Add New Topic'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.competency_id} onValueChange={v => setForm({ ...form, competency_id: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>

              <Input placeholder="Topic Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-zinc-800 border-zinc-700" />

              <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-zinc-700" />

              {/* Icon Selector */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Topic Icon</label>
                <div className="grid grid-cols-10 gap-1">
                  {ICON_OPTIONS.map(iconKey => {
                    const IconComp = TOPIC_ICONS[iconKey];
                    const isSelected = form.icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setForm({ ...form, icon: iconKey })}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-slate-400 hover:bg-zinc-700'
                          }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="w-full bg-indigo-600">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editItem ? 'Update' : 'Add'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Link Questions to Topic</DialogTitle>
              <p className="text-sm text-slate-400">Select questions to link</p>
            </DialogHeader>
            <Input
              placeholder="Search questions..."
              value={questionSearch}
              onChange={e => setQuestionSearch(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 border rounded-lg p-2 border-zinc-800">
              {filteredUnlinked.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No unlinked questions available</p>
              ) : (
                filteredUnlinked.map(q => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedQuestions.has(q.id) ? 'bg-indigo-600/20 ring-1 ring-indigo-500' : 'hover:bg-white/5'}`}
                    onClick={() => {
                      const newSet = new Set(selectedQuestions);
                      if (newSet.has(q.id)) newSet.delete(q.id); else newSet.add(q.id);
                      setSelectedQuestions(newSet);
                    }}
                  >
                    {selectedQuestions.has(q.id) ? <CheckSquare className="w-5 h-5 text-indigo-400 flex-shrink-0" /> : <Square className="w-5 h-5 text-slate-600 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white line-clamp-2">{q.question_text}</span>
                      <Badge variant="outline" className={`mt-1 text-[10px] ${q.difficulty === 'easy' ? 'text-green-400 border-green-500/20' :
                        q.difficulty === 'hard' ? 'text-red-400 border-red-500/20' :
                          'text-amber-400 border-amber-500/20'
                        }`}>
                        {q.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={() => linkMutation.mutate({ topicId: linkingTopicId, questionIds: [...selectedQuestions] })}
              disabled={selectedQuestions.size === 0 || linkMutation.isPending}
              className="bg-indigo-600"
            >
              {linkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Link {selectedQuestions.size} Questions
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}