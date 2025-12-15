import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Copy, Archive, Check, Star, Loader2, FileText, TrendingUp } from 'lucide-react';
import { toast } from "sonner";

const FEATURE_LABELS = {
  question_generation: 'Question Generation',
  explanation_generation: 'Explanation Generation',
  study_plan: 'Study Plan',
  text_to_questions: 'Text to Questions',
  ai_assistant: 'AI Assistant'
};

export default function PromptTemplateManager({ templates }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterFeature, setFilterFeature] = useState('all');
  const [form, setForm] = useState({
    feature_type: 'question_generation',
    template_name: '',
    template_content: '',
    version: '1.0',
    status: 'draft',
    is_default: false,
    variables: [],
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AIPromptTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-prompt-templates']);
      toast.success('Template created successfully');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AIPromptTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-prompt-templates']);
      toast.success('Template updated successfully');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AIPromptTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-prompt-templates']);
      toast.success('Template deleted');
    }
  });

  const resetForm = () => {
    setForm({
      feature_type: 'question_generation',
      template_name: '',
      template_content: '',
      version: '1.0',
      status: 'draft',
      is_default: false,
      variables: [],
      notes: ''
    });
    setEditItem(null);
    setIsOpen(false);
  };

  const handleEdit = (template) => {
    setEditItem(template);
    setForm({
      feature_type: template.feature_type,
      template_name: template.template_name,
      template_content: template.template_content,
      version: template.version,
      status: template.status,
      is_default: template.is_default,
      variables: template.variables || [],
      notes: template.notes || ''
    });
    setIsOpen(true);
  };

  const handleDuplicate = (template) => {
    createMutation.mutate({
      ...template,
      template_name: `${template.template_name} (Copy)`,
      version: '1.0',
      status: 'draft',
      is_default: false
    });
  };

  const handleSetDefault = (template) => {
    updateMutation.mutate({
      id: template.id,
      data: { is_default: true }
    });
  };

  const handleSubmit = () => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = filterFeature === 'all' 
    ? templates 
    : templates.filter(t => t.feature_type === filterFeature);

  return (
    <div className="space-y-4">
      <Card className="glass-card border-0 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Prompt Templates</h3>
              <p className="text-xs text-slate-400">{templates.length} templates configured</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterFeature} onValueChange={setFilterFeature}>
              <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Features</SelectItem>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-white/10">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setIsOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-slate-300">Template</TableHead>
              <TableHead className="text-slate-300">Feature</TableHead>
              <TableHead className="text-slate-300">Version</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Performance</TableHead>
              <TableHead className="text-slate-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(template => (
              <TableRow key={template.id} className="border-white/5">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {template.is_default && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    <span className="text-white font-medium">{template.template_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-indigo-600">{FEATURE_LABELS[template.feature_type]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-slate-400">v{template.version}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={
                    template.status === 'active' ? 'bg-green-600' :
                    template.status === 'archived' ? 'bg-gray-600' :
                    'bg-amber-600'
                  }>
                    {template.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {template.performance_metrics?.usage_count > 0 ? (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-slate-400">
                        {template.performance_metrics.usage_count} uses • {(template.performance_metrics.success_rate * 100).toFixed(0)}% success
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No data yet</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(template)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(template)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    {!template.is_default && template.status === 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => handleSetDefault(template)}>
                        <Star className="w-3 h-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(template.id)} className="text-red-400">
                      <Archive className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white mb-2 block">Feature</label>
                <Select value={form.feature_type} onValueChange={v => setForm({ ...form, feature_type: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-white/10">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-white mb-2 block">Template Name</label>
                <Input 
                  value={form.template_name}
                  onChange={e => setForm({ ...form, template_name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="e.g., Advanced Question Generator"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-white mb-2 block">Prompt Template</label>
              <Textarea 
                value={form.template_content}
                onChange={e => setForm({ ...form, template_content: e.target.value })}
                className="bg-zinc-800 border-zinc-700 min-h-[300px] font-mono text-sm"
                placeholder="Enter your prompt template here. Use variables like {topic}, {difficulty}, {count}..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Available variables: {'{topic}'}, {'{difficulty}'}, {'{count}'}, {'{language}'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-white mb-2 block">Version</label>
                <Input 
                  value={form.version}
                  onChange={e => setForm({ ...form, version: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="1.0"
                />
              </div>

              <div>
                <label className="text-sm text-white mb-2 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="draft" className="text-white hover:bg-white/10">Draft</SelectItem>
                    <SelectItem value="active" className="text-white hover:bg-white/10">Active</SelectItem>
                    <SelectItem value="archived" className="text-white hover:bg-white/10">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={form.is_default}
                    onChange={e => setForm({ ...form, is_default: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-white">Set as Default</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm text-white mb-2 block">Notes (Optional)</label>
              <Textarea 
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Add any notes about this template..."
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending || !form.template_name || !form.template_content}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {editItem ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}