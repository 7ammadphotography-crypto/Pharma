import React, { useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, MoreVertical, BookOpen, ChevronDown, ChevronUp, Link2, Unlink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminLayout from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';

// Icons list from before
import { Pill, Beaker, Heart, Brain, Stethoscope, Scale, Users, Shield, Activity } from 'lucide-react';
const icons = [
  { value: 'pill', label: 'Pill', Icon: Pill },
  { value: 'beaker', label: 'Beaker', Icon: Beaker },
  { value: 'heart', label: 'Heart', Icon: Heart },
  { value: 'brain', label: 'Brain', Icon: Brain },
  { value: 'stethoscope', label: 'Stethoscope', Icon: Stethoscope },
  { value: 'scale', label: 'Scale', Icon: Scale },
  { value: 'users', label: 'Users', Icon: Users },
  { value: 'shield', label: 'Shield', Icon: Shield },
  { value: 'activity', label: 'Activity', Icon: Activity },
];

const colors = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
];

export default function ManageChapters() {
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', description: '', icon: 'pill', color: 'blue', weight: 0, order: 0 });
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [selectedChapterForTopic, setSelectedChapterForTopic] = useState(null);
  const [newTopicForm, setNewTopicForm] = useState({ title: '', description: '' });
  const queryClient = useQueryClient();

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });

  const getTopicsForChapter = (chapterId) => topics.filter(t => t.competency_id === chapterId);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Competency.create({ ...data, name: data.title }),
    onSuccess: () => {
      queryClient.invalidateQueries(['competencies']);
      resetForm();
      toast.success('Chapter created successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to create chapter');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Competency.update(id, { ...data, name: data.title }),
    onSuccess: () => {
      queryClient.invalidateQueries(['competencies']);
      resetForm();
      toast.success('Chapter updated successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to update chapter');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Competency.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['competencies']);
      toast.success('Chapter deleted');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to delete chapter');
    }
  });

  const createTopicMutation = useMutation({
    mutationFn: (data) => base44.entities.Topic.create({ ...data, name: data.name || data.title || 'Untitled Chapter' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      setNewTopicForm({ title: '', description: '' });
      setTopicDialogOpen(false);
      toast.success('Topic created');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to create topic');
    }
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Topic.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      toast.success('Topic updated');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to update topic');
    }
  });

  const deleteTopicMutation = useMutation({
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

  const unlinkTopicMutation = useMutation({
    mutationFn: ({ topicId }) => base44.entities.Topic.update(topicId, { competency_id: null }),
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      toast.success('Topic unlinked');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'Failed to unlink topic');
    }
  });

  const resetForm = () => {
    setForm({ title: '', description: '', icon: 'pill', color: 'blue', weight: 0, order: 0 });
    setEditItem(null);
    setIsOpen(false);
  };

  const handleEdit = (chapter) => {
    setEditItem(chapter);
    setForm({
      title: chapter.title || '',
      description: chapter.description || '',
      icon: chapter.icon || 'pill',
      color: chapter.color || 'blue',
      weight: chapter.weight || 0,
      order: chapter.order || 0
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filteredChapters = chapters.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout currentPage="ManageChapters">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Chapters</h2>
            <p className="text-slate-400 text-sm">Manage chapters and competencies</p>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        </div>

        <div className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search chapters..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 pr-10"
            />
          </div>
        </div>

        <Card className="glass-card border-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-left text-slate-300 w-16">Order</TableHead>
                <TableHead className="text-left text-slate-300 w-16">Icon</TableHead>
                <TableHead className="text-left text-slate-300">Title</TableHead>
                <TableHead className="text-left text-slate-300 w-24">Topics</TableHead>
                <TableHead className="text-left text-slate-300 w-20">Weight</TableHead>
                <TableHead className="text-left text-slate-300 w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredChapters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No matching chapters
                  </TableCell>
                </TableRow>
              ) : (
                filteredChapters.map((chapter) => {
                  const IconComp = icons.find(i => i.value === chapter.icon)?.Icon || Pill;
                  const colorClass = colors.find(c => c.value === chapter.color)?.class || 'bg-blue-500';
                  const chapterTopics = getTopicsForChapter(chapter.id);
                  const isExpanded = expandedChapter === chapter.id;

                  return (
                    <React.Fragment key={chapter.id}>
                      <TableRow className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-medium text-slate-400">{chapter.order}</TableCell>
                        <TableCell>
                          <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                            <IconComp className="w-4 h-4 text-white" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          {chapter.title}
                          {chapter.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{chapter.description}</p>}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                            className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                          >
                            <BookOpen className="w-4 h-4" />
                            {chapterTopics.length}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        </TableCell>
                        <TableCell className="text-slate-300">{chapter.weight}%</TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem onClick={() => handleEdit(chapter)} className="text-slate-300 focus:bg-zinc-800">
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedChapterForTopic(chapter); setTopicDialogOpen(true); }} className="text-slate-300 focus:bg-zinc-800">
                                <Plus className="w-4 h-4 mr-2" /> Add Topic
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteMutation.mutate(chapter.id)} className="text-red-400 focus:bg-red-500/10">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Topics Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <TableRow className="border-white/5">
                            <TableCell colSpan={6} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-zinc-800/30 p-4 space-y-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-slate-300">Topics in {chapter.title}</h4>
                                    <Button
                                      size="sm"
                                      onClick={() => { setSelectedChapterForTopic(chapter); setTopicDialogOpen(true); }}
                                      className="bg-indigo-600 hover:bg-indigo-700 h-7 text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" /> Add Topic
                                    </Button>
                                  </div>

                                  {chapterTopics.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-4">No topics linked to this chapter</p>
                                  ) : (
                                    <div className="grid gap-2">
                                      {chapterTopics.map(topic => (
                                        <div key={topic.id} className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3 group">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                              <BookOpen className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <div>
                                              <p className="text-white text-sm font-medium">{topic.title}</p>
                                              {topic.description && <p className="text-slate-500 text-xs">{topic.description}</p>}
                                            </div>
                                          </div>
                                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => unlinkTopicMutation.mutate({ topicId: topic.id })}
                                              className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                              title="Unlink from chapter"
                                            >
                                              <Unlink className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => deleteTopicMutation.mutate(topic.id)}
                                              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Add/Edit Chapter Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Chapter Name *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Icon</label>
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {icons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <icon.Icon className="w-4 h-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Color</label>
                  <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${color.class}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Weight (%)</label>
                  <Input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Order</label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetForm} className="flex-1 border-zinc-700">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!form.title.trim() || createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-indigo-600"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editItem ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Topic to Chapter Dialog */}
        <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-400" />
                Add Topic to {selectedChapterForTopic?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Link existing unlinked topics */}
              {topics.filter(t => !t.competency_id).length > 0 && (
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Link Existing Topic</label>
                  <div className="max-h-[150px] overflow-y-auto space-y-2 bg-zinc-800/50 rounded-lg p-2">
                    {topics.filter(t => !t.competency_id).map(topic => (
                      <div
                        key={topic.id}
                        onClick={() => {
                          updateTopicMutation.mutate({ id: topic.id, data: { competency_id: selectedChapterForTopic?.id } });
                          setTopicDialogOpen(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-500/20 cursor-pointer transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span className="text-white text-sm">{topic.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-zinc-900 px-2 text-slate-500">Or create new</span>
                </div>
              </div>

              {/* Create new topic */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Topic Name *</label>
                <Input
                  value={newTopicForm.title}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                  placeholder="Enter topic name"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Description</label>
                <Textarea
                  value={newTopicForm.description}
                  onChange={(e) => setNewTopicForm({ ...newTopicForm, description: e.target.value })}
                  placeholder="Optional description"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setTopicDialogOpen(false)} className="flex-1 border-zinc-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newTopicForm.title.trim()) {
                      createTopicMutation.mutate({
                        ...newTopicForm,
                        competency_id: selectedChapterForTopic?.id,
                        order: getTopicsForChapter(selectedChapterForTopic?.id).length
                      });
                    }
                  }}
                  disabled={!newTopicForm.title.trim() || createTopicMutation.isPending}
                  className="flex-1 bg-indigo-600"
                >
                  {createTopicMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" /> Create Topic
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}