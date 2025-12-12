import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, MoreVertical, FileText, HelpCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from '@/components/admin/AdminLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ManageCases() {
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '', case_type: 'clinical', case_text: '', image_url: '', difficulty: 'medium',
    competency_id: '', topic_id: '', tags: []
  });
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date')
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const getQuestionsForCase = (caseId) => {
    return questions.filter(q => q.case_id === caseId);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cases']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cases']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Check if case has questions
      const caseQuestions = questions.filter(q => q.case_id === id);
      if (caseQuestions.length > 0) {
        // Remove case_id from all questions
        for (const q of caseQuestions) {
          await base44.entities.Question.update(q.id, { case_id: '' });
        }
      }
      await base44.entities.Case.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cases']);
      queryClient.invalidateQueries(['questions']);
    }
  });

  const resetForm = () => {
    setForm({ title: '', case_type: 'clinical', case_text: '', image_url: '', difficulty: 'medium', competency_id: '', topic_id: '', tags: [] });
    setEditItem(null);
    setIsOpen(false);
  };

  const handleEdit = (c) => {
    setEditItem(c);
    setForm(c);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.case_text) return;
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleAddQuestions = (caseItem) => {
    navigate(createPageUrl(`ManageQuestions?case=${caseItem.id}`));
  };

  const filtered = cases.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.case_text.toLowerCase().includes(search.toLowerCase())
  );

  const getDifficultyColor = (diff) => {
    if (diff === 'easy') return 'text-green-400 border-green-500/20';
    if (diff === 'hard') return 'text-red-400 border-red-500/20';
    return 'text-amber-400 border-amber-500/20';
  };

  return (
    <AdminLayout currentPage="ManageCases">
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Clinical Cases</h2>
            <p className="text-slate-400 text-sm">Manage case scenarios • {cases.length} cases • {questions.filter(q => q.case_id).length} questions linked</p>
          </div>
          <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-gradient-to-r from-cyan-600 to-blue-600">
            <Plus className="w-4 h-4 mr-2" /> Add Case
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search cases..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800 pr-10"
          />
        </div>

        {/* Table */}
        <Card className="glass-card border-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-left text-slate-300">Case Title</TableHead>
                <TableHead className="text-left text-slate-300">Topics</TableHead>
                <TableHead className="text-left text-slate-300">Difficulty</TableHead>
                <TableHead className="text-left text-slate-300">Questions</TableHead>
                <TableHead className="text-left text-slate-300 w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No cases found</TableCell></TableRow>
              ) : (
                filtered.map(c => {
                  const caseQuestions = getQuestionsForCase(c.id);
                  const topic = topics.find(t => t.id === c.topic_id);
                  const chapter = chapters.find(ch => ch.id === c.competency_id);
                  
                  return (
                    <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-white max-w-[300px]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <div>
                            <p className="line-clamp-1">{c.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{c.case_text}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {chapter && (
                            <Badge className="bg-purple-900/50 text-purple-300 text-[10px] w-fit">
                              {chapter.title}
                            </Badge>
                          )}
                          {topic && (
                            <Badge className="bg-indigo-900/50 text-indigo-300 text-[10px] w-fit">
                              {topic.title}
                            </Badge>
                          )}
                          {!chapter && !topic && (
                            <Badge variant="outline" className="text-slate-500 text-[10px]">No topic</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getDifficultyColor(c.difficulty)}>
                          {c.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-900/50 text-emerald-300">
                            {caseQuestions.length} Q
                          </Badge>
                          {caseQuestions.length === 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleAddQuestions(c)}
                              className="bg-indigo-600/50 hover:bg-indigo-600 h-7 text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem onClick={() => handleEdit(c)} className="text-white hover:bg-white/10 cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddQuestions(c)} className="text-white hover:bg-white/10 cursor-pointer">
                              <HelpCircle className="w-4 h-4 mr-2" /> Add Questions
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm(`Delete "${c.title}"? This will unlink ${caseQuestions.length} questions.`)) {
                                  deleteMutation.mutate(c.id);
                                }
                              }} 
                              className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
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

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Case' : 'Add New Case'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Case Title</label>
                <Input 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  className="bg-zinc-800 border-zinc-700 mt-1" 
                  placeholder="e.g., Patient with Hypertension and Diabetes"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Case Type</label>
                <Select value={form.case_type} onValueChange={v => setForm({ ...form, case_type: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="clinical" className="text-white hover:bg-white/10">Clinical Case</SelectItem>
                    <SelectItem value="management" className="text-white hover:bg-white/10">Management Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-400">Scenario Text</label>
                <Textarea 
                  value={form.case_text} 
                  onChange={e => setForm({ ...form, case_text: e.target.value })} 
                  className="bg-zinc-800 border-zinc-700 mt-1 min-h-[200px]" 
                  placeholder="A 55-year-old male patient presents to the pharmacy with..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Related Competency</label>
                  <Select value={form.competency_id} onValueChange={v => setForm({ ...form, competency_id: v })}>
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
                  <Select value={form.topic_id} onValueChange={v => setForm({ ...form, topic_id: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value={null} className="text-white hover:bg-white/10">None</SelectItem>
                      {topics.filter(t => !form.competency_id || t.competency_id === form.competency_id).map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-white hover:bg-white/10">{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Difficulty</label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
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
                  value={form.image_url} 
                  onChange={e => setForm({ ...form, image_url: e.target.value })} 
                  className="bg-zinc-800 border-zinc-700 mt-1" 
                  placeholder="https://example.com/lab-results.png"
                />
                {form.image_url && (
                  <div className="mt-2">
                    <img src={form.image_url} alt="Preview" className="w-full max-h-40 object-contain rounded border border-zinc-700" />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending || updateMutation.isPending || !form.title || !form.case_text} 
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {editItem ? 'Update Case' : 'Create Case'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}