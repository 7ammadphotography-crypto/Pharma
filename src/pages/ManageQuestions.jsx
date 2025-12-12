import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, MoreVertical, Check, Sparkles, Lightbulb, Filter, FileText, Upload, Wand2, Copy, Layers } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from '@/components/admin/AdminLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AIQuestionGenerator from '@/components/admin/AIQuestionGenerator';
import AIExplanationEditor from '@/components/admin/AIExplanationEditor';
import TopicMultiSelect from '@/components/admin/TopicMultiSelect';
import AITextToQuestions from '@/components/admin/AITextToQuestions';
import BulkImportQuestions from '@/components/admin/BulkImportQuestions';
import BulkQuestionCreator from '@/components/admin/BulkQuestionCreator';

export default function ManageQuestions() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCaseId = urlParams.get('case') || '';
  
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterCase, setFilterCase] = useState('all');
  const [groupByCase, setGroupByCase] = useState(false);
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const [form, setForm] = useState({
    question_text: '', options: ['', '', '', ''], correct_answer: 0,
    explanation: '', difficulty: 'medium', tags: [], case_id: ''
  });
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showTextToQuestions, setShowTextToQuestions] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [explanationQuestion, setExplanationQuestion] = useState(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [caseForm, setCaseForm] = useState({
    title: '', case_text: '', image_url: '', difficulty: 'medium',
    competency_id: '', topic_id: '', tags: []
  });
  
  const queryClient = useQueryClient();

  // Data fetching
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list('-created_date')
  });
  const { data: chapters = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });
  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });
  const { data: topicQuestions = [] } = useQuery({
    queryKey: ['topic-questions'],
    queryFn: () => base44.entities.TopicQuestion.list()
  });
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date')
  });

  // Auto-open form with preselected case
  useEffect(() => {
    if (preselectedCaseId && cases.length > 0) {
      setShowBulkCreator(true);
    }
  }, [preselectedCaseId, cases]);

  // Get topics for a question
  const getTopicsForQuestion = (questionId) => {
    const topicIds = topicQuestions.filter(tq => tq.question_id === questionId).map(tq => tq.topic_id);
    return topics.filter(t => topicIds.includes(t.id));
  };

  // When editing, load current topic links
  useEffect(() => {
    if (editItem) {
      const currentTopicIds = topicQuestions
        .filter(tq => tq.question_id === editItem.id)
        .map(tq => tq.topic_id);
      setSelectedTopicIds(currentTopicIds);
    }
  }, [editItem, topicQuestions]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const question = await base44.entities.Question.create(data.questionData);
      // Create topic links
      if (data.topicIds.length > 0) {
        const links = data.topicIds.map(topicId => ({
          topic_id: topicId,
          question_id: question.id
        }));
        await base44.entities.TopicQuestion.bulkCreate(links);
      }
      return question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['topic-questions']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, questionData, topicIds }) => {
      // Update question
      await base44.entities.Question.update(id, questionData);
      
      // Sync topic links
      const currentLinks = topicQuestions.filter(tq => tq.question_id === id);
      const currentTopicIds = currentLinks.map(tq => tq.topic_id);
      
      // Delete removed links
      const toDelete = currentLinks.filter(tq => !topicIds.includes(tq.topic_id));
      for (const link of toDelete) {
        await base44.entities.TopicQuestion.delete(link.id);
      }
      
      // Add new links
      const toAdd = topicIds.filter(tid => !currentTopicIds.includes(tid));
      if (toAdd.length > 0) {
        const newLinks = toAdd.map(topicId => ({
          topic_id: topicId,
          question_id: id
        }));
        await base44.entities.TopicQuestion.bulkCreate(newLinks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['topic-questions']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Delete topic links first
      const links = topicQuestions.filter(tq => tq.question_id === id);
      for (const link of links) {
        await base44.entities.TopicQuestion.delete(link.id);
      }
      await base44.entities.Question.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['topic-questions']);
    }
  });

  const resetForm = () => {
    setForm({ question_text: '', options: ['', '', '', ''], correct_answer: 0, explanation: '', difficulty: 'medium', tags: [], case_id: preselectedCaseId || '' });
    setSelectedTopicIds([]);
    setEditItem(null);
    setIsOpen(false);
    setTagInput('');
  };

  const duplicateQuestion = (q) => {
    setForm({ ...q, options: q.options || ['', '', '', ''], tags: q.tags || [], case_id: q.case_id || '' });
    setEditItem(null);
    const currentTopicIds = topicQuestions
      .filter(tq => tq.question_id === q.id)
      .map(tq => tq.topic_id);
    setSelectedTopicIds(currentTopicIds);
    setIsOpen(true);
  };

  const resetCaseForm = () => {
    setCaseForm({ title: '', case_text: '', image_url: '', difficulty: 'medium', competency_id: '', topic_id: '', tags: [] });
    setShowCaseDialog(false);
  };

  const createCaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cases']);
      resetCaseForm();
    }
  });

  const handleCaseSubmit = () => {
    if (!caseForm.title || !caseForm.case_text) return;
    createCaseMutation.mutate(caseForm);
  };

  const handleEdit = (q) => {
    setEditItem(q);
    setForm({ ...q, options: q.options || ['', '', '', ''], tags: q.tags || [], case_id: q.case_id || '' });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!form.question_text) return;
    const questionData = { ...form };
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, questionData, topicIds: selectedTopicIds });
    } else {
      createMutation.mutate({ questionData, topicIds: selectedTopicIds });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  // Filtering
  const filtered = useMemo(() => {
    return questions.filter(q => {
      const matchSearch = q.question_text.toLowerCase().includes(search.toLowerCase());
      const matchDiff = filterDiff === 'all' || q.difficulty === filterDiff;
      
      // Filter by topic
      let matchTopic = true;
      if (filterTopic !== 'all') {
        const qTopicIds = topicQuestions.filter(tq => tq.question_id === q.id).map(tq => tq.topic_id);
        matchTopic = qTopicIds.includes(filterTopic);
      }

      // Filter by case
      let matchCase = true;
      if (filterCase === 'no-case') {
        matchCase = !q.case_id;
      } else if (filterCase !== 'all') {
        matchCase = q.case_id === filterCase;
      }
      
      return matchSearch && matchDiff && matchTopic && matchCase;
    });
  }, [questions, search, filterDiff, filterTopic, filterCase, topicQuestions]);

  // Group by case if enabled
  const groupedQuestions = useMemo(() => {
    if (!groupByCase) return { ungrouped: filtered };
    
    const groups = { 'No Case': [], };
    filtered.forEach(q => {
      if (!q.case_id) {
        groups['No Case'].push(q);
      } else {
        const caseItem = cases.find(c => c.id === q.case_id);
        const caseName = caseItem?.title || 'Unknown Case';
        if (!groups[caseName]) groups[caseName] = [];
        groups[caseName].push(q);
      }
    });
    return groups;
  }, [filtered, groupByCase, cases]);

  return (
    <AdminLayout currentPage="ManageQuestions">
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Questions</h2>
            <p className="text-slate-400 text-sm">
              {questions.length} total • {questions.filter(q => q.case_id).length} with cases • {filtered.length} showing
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowBulkCreator(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600">
              <Layers className="w-4 h-4 mr-2" /> Bulk Add
            </Button>
            <Button onClick={() => setShowTextToQuestions(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600">
              <FileText className="w-4 h-4 mr-2" /> From Text
            </Button>
            <Button onClick={() => setShowAIGenerator(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Sparkles className="w-4 h-4 mr-2" /> AI Generate
            </Button>
            <Button onClick={() => setShowBulkImport(true)} variant="outline" className="border-zinc-700">
              <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Add Single
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search questions..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 pr-10"
            />
          </div>
          <Select value={filterDiff} onValueChange={setFilterDiff}>
            <SelectTrigger className="w-[130px] bg-zinc-900/50 border-zinc-800">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Difficulties</SelectItem>
              <SelectItem value="easy" className="text-white hover:bg-white/10">Easy</SelectItem>
              <SelectItem value="medium" className="text-white hover:bg-white/10">Medium</SelectItem>
              <SelectItem value="hard" className="text-white hover:bg-white/10">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCase} onValueChange={setFilterCase}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800">
              <FileText className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Case" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[300px] text-white">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Cases</SelectItem>
              <SelectItem value="no-case" className="text-white hover:bg-white/10">No Case</SelectItem>
              {cases.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-white hover:bg-white/10">{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTopic} onValueChange={setFilterTopic}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Topic" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[300px] text-white">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Topics</SelectItem>
              {chapters.map(ch => (
                <React.Fragment key={ch.id}>
                  <SelectItem value={`ch-${ch.id}`} disabled className="text-slate-300 font-medium bg-zinc-800/50">
                    {ch.title}
                  </SelectItem>
                  {topics.filter(t => t.competency_id === ch.id).map(t => (
                    <SelectItem key={t.id} value={t.id} className="pl-6 text-white hover:bg-white/10">
                      {t.title}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={groupByCase ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupByCase(!groupByCase)}
            className={groupByCase ? "bg-cyan-600" : "border-zinc-700"}
          >
            <Layers className="w-4 h-4 mr-2" />
            Group by Case
          </Button>
        </div>

        {/* Table */}
        {groupByCase ? (
          // Grouped View
          <div className="space-y-4">
            {Object.entries(groupedQuestions).map(([caseName, questions]) => {
              if (questions.length === 0) return null;
              const caseItem = cases.find(c => c.title === caseName);
              
              return (
                <Card key={caseName} className="glass-card border-0 overflow-hidden">
                  <div className="bg-cyan-900/20 border-b border-cyan-500/20 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h3 className="text-white font-semibold">{caseName}</h3>
                        <p className="text-slate-400 text-xs">{questions.length} questions</p>
                      </div>
                    </div>
                    {caseItem && (
                      <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400">
                        View Case
                      </Button>
                    )}
                  </div>
                  <Table>
                    <TableBody>
                      {questions.map(q => {
                        const qTopics = getTopicsForQuestion(q.id);
                        return (
                          <TableRow key={q.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="font-medium text-white max-w-[400px]">
                              <span className="line-clamp-2">{q.question_text}</span>
                            </TableCell>
                            <TableCell className="w-[200px]">
                              <div className="flex gap-1 flex-wrap">
                                {qTopics.slice(0, 2).map(t => (
                                  <Badge key={t.id} className="bg-indigo-900/50 text-indigo-300 text-[10px]">{t.title}</Badge>
                                ))}
                                {qTopics.length > 2 && (
                                  <Badge variant="outline" className="text-slate-400 text-[10px]">+{qTopics.length - 2}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[100px]">
                              <Badge variant="outline" className={
                                q.difficulty === 'easy' ? 'text-green-400 border-green-500/20' : 
                                q.difficulty === 'hard' ? 'text-red-400 border-red-500/20' : 
                                'text-amber-400 border-amber-500/20'
                              }>
                                {q.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-left w-[80px]">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                  <DropdownMenuItem onClick={() => handleEdit(q)} className="text-white hover:bg-white/10 cursor-pointer"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateQuestion(q)} className="text-white hover:bg-white/10 cursor-pointer"><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setExplanationQuestion(q)} className="text-white hover:bg-white/10 cursor-pointer"><Lightbulb className="w-4 h-4 mr-2" /> AI Explanation</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deleteMutation.mutate(q.id)} className="text-red-400 hover:bg-red-500/10 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              );
            })}
          </div>
        ) : (
          // Regular Table View
          <Card className="glass-card border-0 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-left text-slate-300">Question</TableHead>
                  <TableHead className="text-left text-slate-300">Case</TableHead>
                  <TableHead className="text-left text-slate-300">Topics</TableHead>
                  <TableHead className="text-left text-slate-300">Difficulty</TableHead>
                  <TableHead className="text-left text-slate-300 w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No results found</TableCell></TableRow>
                ) : (
                  filtered.map(q => {
                    const qTopics = getTopicsForQuestion(q.id);
                    const qCase = q.case_id ? cases.find(c => c.id === q.case_id) : null;
                    
                    return (
                      <TableRow key={q.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-medium text-white max-w-[300px]">
                          <span className="line-clamp-2">{q.question_text}</span>
                        </TableCell>
                        <TableCell>
                          {qCase ? (
                            <Badge className="bg-cyan-900/50 text-cyan-300 text-[10px]">
                              <FileText className="w-3 h-3 mr-1" />
                              {qCase.title}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 text-[10px]">No case</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {qTopics.length === 0 ? (
                              <Badge variant="outline" className="text-amber-400 border-amber-500/20 text-[10px]">Uncategorized</Badge>
                            ) : (
                              qTopics.slice(0, 2).map(t => (
                                <Badge key={t.id} className="bg-indigo-900/50 text-indigo-300 text-[10px]">{t.title}</Badge>
                              ))
                            )}
                            {qTopics.length > 2 && (
                              <Badge variant="outline" className="text-slate-400 text-[10px]">+{qTopics.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            q.difficulty === 'easy' ? 'text-green-400 border-green-500/20' : 
                            q.difficulty === 'hard' ? 'text-red-400 border-red-500/20' : 
                            'text-amber-400 border-amber-500/20'
                          }>
                            {q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'hard' ? 'Hard' : 'Medium'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem onClick={() => handleEdit(q)} className="text-white hover:bg-white/10 cursor-pointer"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateQuestion(q)} className="text-white hover:bg-white/10 cursor-pointer"><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExplanationQuestion(q)} className="text-white hover:bg-white/10 cursor-pointer"><Lightbulb className="w-4 h-4 mr-2" /> AI Explanation</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteMutation.mutate(q.id)} className="text-red-400 hover:bg-red-500/10 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editItem ? 'Edit Question' : 'Add New Question'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* Case Selection */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Related Case (Optional)</label>
                <Select value={form.case_id || ''} onValueChange={v => setForm({ ...form, case_id: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select a case or leave blank" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[200px] text-white">
                    <SelectItem value={null} className="text-white hover:bg-white/10">No Case</SelectItem>
                    {cases.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-white hover:bg-white/10">{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.case_id && cases.find(c => c.id === form.case_id) && (
                  <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <p className="text-xs text-slate-400 mb-1">Case Scenario:</p>
                    <p className="text-sm text-slate-300 line-clamp-3">{cases.find(c => c.id === form.case_id).case_text}</p>
                  </div>
                )}
              </div>

              {/* Topics Multi-Select */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Related Topics</label>
                <TopicMultiSelect 
                  topics={topics}
                  competencies={chapters}
                  selectedTopicIds={selectedTopicIds}
                  onChange={setSelectedTopicIds}
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Question Text</label>
                <Textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Options (select correct answer)</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border ${form.correct_answer === i ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}
                        onClick={() => setForm({ ...form, correct_answer: i })}
                      >
                        {form.correct_answer === i && <Check className="w-4 h-4 text-black" />}
                      </div>
                      <Input value={opt} onChange={e => {
                        const newOpts = [...form.options]; newOpts[i] = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }} className="bg-zinc-800 border-zinc-700 flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Difficulty</label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="easy" className="text-white hover:bg-white/10">Easy</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-white/10">Medium</SelectItem>
                    <SelectItem value="hard" className="text-white hover:bg-white/10">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-400">Tags</label>
                <div className="flex gap-2 mt-1 mb-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="bg-zinc-800 border-zinc-700" placeholder="Type and press Enter" />
                  <Button onClick={addTag} type="button" className="bg-zinc-700"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {form.tags.map(t => (
                    <Badge key={t} className="bg-zinc-700 text-slate-200 hover:bg-zinc-600 cursor-pointer" onClick={() => setForm({ ...form, tags: form.tags.filter(tag => tag !== t) })}>
                      {t} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-slate-400">Explanation</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!form.question_text || isGeneratingExplanation}
                    onClick={async () => {
                      setIsGeneratingExplanation(true);
                      const result = await base44.integrations.Core.InvokeLLM({
                        prompt: `Generate a detailed explanation for this pharmacy exam question:

Question: ${form.question_text}
Options: ${form.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}
Correct Answer: ${String.fromCharCode(65 + form.correct_answer)}) ${form.options[form.correct_answer]}

Provide a clear, educational explanation of why this answer is correct and why the other options are incorrect. Keep it concise but informative.`,
                        response_json_schema: {
                          type: "object",
                          properties: {
                            explanation: { type: "string" }
                          }
                        }
                      });
                      setForm({ ...form, explanation: result.explanation });
                      setIsGeneratingExplanation(false);
                    }}
                    className="text-purple-400 hover:text-purple-300 h-7 px-2"
                  >
                    {isGeneratingExplanation ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    AI Generate
                  </Button>
                </div>
                <Textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} className="bg-zinc-800 border-zinc-700" placeholder="Explain the correct answer..." />
              </div>

              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="w-full bg-indigo-600">
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editItem ? 'Update Question' : 'Add Question'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Question Generator */}
        <AIQuestionGenerator 
          chapters={chapters}
          topics={topics}
          open={showAIGenerator}
          onOpenChange={setShowAIGenerator}
        />

        {/* AI Explanation Editor */}
        <AIExplanationEditor
          question={explanationQuestion}
          open={!!explanationQuestion}
          onOpenChange={(open) => !open && setExplanationQuestion(null)}
        />

        {/* AI Text to Questions */}
        <AITextToQuestions
          open={showTextToQuestions}
          onOpenChange={setShowTextToQuestions}
          topics={topics}
          competencies={chapters}
        />

        {/* Bulk Import */}
        <BulkImportQuestions
          open={showBulkImport}
          onOpenChange={setShowBulkImport}
          topics={topics}
          competencies={chapters}
        />

        {/* Bulk Question Creator */}
        <BulkQuestionCreator
          open={showBulkCreator}
          onOpenChange={setShowBulkCreator}
          caseId={preselectedCaseId || ''}
          cases={cases}
          topics={topics}
          competencies={chapters}
        />

        {/* Add Case Dialog */}
        <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Case Scenario</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Case Title</label>
                <Input 
                  value={caseForm.title} 
                  onChange={e => setCaseForm({ ...caseForm, title: e.target.value })} 
                  className="bg-zinc-800 border-zinc-700 mt-1" 
                  placeholder="e.g., Patient with Hypertension and Diabetes"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Clinical Scenario Text</label>
                <Textarea 
                  value={caseForm.case_text} 
                  onChange={e => setCaseForm({ ...caseForm, case_text: e.target.value })} 
                  className="bg-zinc-800 border-zinc-700 mt-1 min-h-[200px]" 
                  placeholder="A 55-year-old male patient presents to the pharmacy with..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Related Competency</label>
                  <Select value={caseForm.competency_id} onValueChange={v => setCaseForm({ ...caseForm, competency_id: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                      <SelectValue placeholder="Select competency" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value={null} className="text-white hover:bg-white/10">None</SelectItem>
                      {chapters.map(ch => (
                        <SelectItem key={ch.id} value={ch.id} className="text-white hover:bg-white/10">{ch.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-400">Related Topic</label>
                  <Select value={caseForm.topic_id} onValueChange={v => setCaseForm({ ...caseForm, topic_id: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value={null} className="text-white hover:bg-white/10">None</SelectItem>
                      {topics.map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-white hover:bg-white/10">{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Difficulty</label>
                <Select value={caseForm.difficulty} onValueChange={v => setCaseForm({ ...caseForm, difficulty: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="easy" className="text-white hover:bg-white/10">Easy</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-white/10">Medium</SelectItem>
                    <SelectItem value="hard" className="text-white hover:bg-white/10">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-400">Image URL (Optional)</label>
                <Input 
                  value={caseForm.image_url} 
                  onChange={e => setCaseForm({ ...caseForm, image_url: e.target.value })} 
                  className="bg-zinc-800 border-zinc-700 mt-1" 
                  placeholder="https://example.com/lab-results.png"
                />
              </div>

              <Button 
                onClick={handleCaseSubmit} 
                disabled={createCaseMutation.isPending || !caseForm.title || !caseForm.case_text} 
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {createCaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Case
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}