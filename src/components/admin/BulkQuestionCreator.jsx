import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Check, Copy, X, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TopicMultiSelect from './TopicMultiSelect';

export default function BulkQuestionCreator({ open, onOpenChange, caseId, cases, topics, competencies }) {
  const [sharedScenario, setSharedScenario] = useState('');
  const [questions, setQuestions] = useState([
    { 
      question_text: '', 
      options: ['', '', '', ''], 
      correct_answer: 0, 
      explanation: '', 
      difficulty: 'medium',
      selectedTopics: []
    }
  ]);

  const queryClient = useQueryClient();

  const createBulkMutation = useMutation({
    mutationFn: async ({ questions, sharedScenario, existingCaseId }) => {
      let finalCaseId = existingCaseId || '';
      
      // If shared scenario exists and no case selected, create a new case
      if (sharedScenario && sharedScenario.trim() && !existingCaseId) {
        const newCase = await base44.entities.Case.create({
          title: `Case - ${new Date().toLocaleDateString()}`,
          case_text: sharedScenario,
          difficulty: 'medium'
        });
        finalCaseId = newCase.id;
      }
      
      const results = [];
      for (const q of questions) {
        // Create question
        const { selectedTopics, ...questionData } = q;
        
        const questionPayload = { ...questionData };
        if (finalCaseId) {
          questionPayload.case_id = finalCaseId;
        }
        
        const created = await base44.entities.Question.create(questionPayload);
        
        // Create topic links
        if (selectedTopics && selectedTopics.length > 0) {
          for (const topicId of selectedTopics) {
            await base44.entities.TopicQuestion.create({
              topic_id: topicId,
              question_id: created.id
            });
          }
        }
        
        results.push(created);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['topic-questions']);
      queryClient.invalidateQueries(['cases']);
      toast.success('Questions created successfully!');
      resetAndClose();
    }
  });

  const resetAndClose = () => {
    setSharedScenario('');
    setQuestions([
      { 
        question_text: '', 
        options: ['', '', '', ''], 
        correct_answer: 0, 
        explanation: '', 
        difficulty: 'medium',
        selectedTopics: []
      }
    ]);
    onOpenChange(false);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '', 
      options: ['', '', '', ''], 
      correct_answer: 0, 
      explanation: '', 
      difficulty: 'medium',
      selectedTopics: []
    }]);
  };

  const addOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options.push('');
    setQuestions(updated);
  };

  const removeOption = (qIdx, optIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length > 2) {
      updated[qIdx].options.splice(optIdx, 1);
      if (updated[qIdx].correct_answer >= updated[qIdx].options.length) {
        updated[qIdx].correct_answer = updated[qIdx].options.length - 1;
      }
      setQuestions(updated);
    }
  };

  const duplicateQuestion = (idx) => {
    const newQ = { ...questions[idx] };
    setQuestions([...questions.slice(0, idx + 1), newQ, ...questions.slice(idx + 1)]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const toggleTopic = (qIdx, topicId) => {
    const updated = [...questions];
    const currentTopics = updated[qIdx].selectedTopics || [];
    
    if (currentTopics.includes(topicId)) {
      updated[qIdx].selectedTopics = currentTopics.filter(id => id !== topicId);
    } else {
      updated[qIdx].selectedTopics = [...currentTopics, topicId];
    }
    
    setQuestions(updated);
  };

  const handleSubmit = () => {
    // Validation
    const invalid = questions.find((q, idx) => {
      if (!q.question_text.trim()) {
        toast.error(`Question ${idx + 1}: Question text is required`);
        return true;
      }
      if (!q.options.every(o => o.trim())) {
        toast.error(`Question ${idx + 1}: All options must be filled`);
        return true;
      }
      return false;
    });

    if (invalid) return;

    const questionsToCreate = questions.map(q => ({
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      tags: q.tags || [],
      selectedTopics: q.selectedTopics || []
    }));

    createBulkMutation.mutate({ 
      questions: questionsToCreate, 
      sharedScenario,
      existingCaseId: caseId 
    });
  };

  const selectedCase = caseId ? cases.find(c => c.id === caseId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Questions {selectedCase && `to "${selectedCase.title}"`}</DialogTitle>
        </DialogHeader>

        {selectedCase && (
          <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/20 mb-4">
            <p className="text-xs text-cyan-400 mb-1">Case Scenario:</p>
            <p className="text-sm text-slate-300 line-clamp-2">{selectedCase.case_text}</p>
          </div>
        )}

        {!selectedCase && (
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 mb-4">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
              <span>Shared Scenario (Optional)</span>
              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                Will be added to all questions
              </Badge>
            </label>
            <Textarea
              value={sharedScenario}
              onChange={e => setSharedScenario(e.target.value)}
              className="bg-zinc-900 border-zinc-700 min-h-[100px]"
              placeholder="Enter clinical scenario or context that applies to all questions below..."
            />
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-indigo-600">Question {qIdx + 1}</Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicateQuestion(qIdx)}
                    className="h-7 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Duplicate
                  </Button>
                  {questions.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeQuestion(qIdx)}
                      className="h-7 text-xs text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Question Text</label>
                <Textarea
                  value={q.question_text}
                  onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)}
                  className="bg-zinc-900 border-zinc-700 mt-1 min-h-[80px]"
                  placeholder="Enter question..."
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Answer Options (click circle to mark as correct)</label>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border flex-shrink-0 ${
                          q.correct_answer === optIdx ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-green-500'
                        }`}
                        onClick={() => updateQuestion(qIdx, 'correct_answer', optIdx)}
                      >
                        {q.correct_answer === optIdx && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <Input
                        value={opt}
                        onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                        className="bg-zinc-900 border-zinc-700 flex-1"
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      />
                      {q.options.length > 2 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeOption(qIdx, optIdx)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(qIdx)}
                    className="w-full border-zinc-700 text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Option
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Topics (Select multiple with search)</label>
                <TopicMultiSelect
                  topics={topics}
                  competencies={competencies}
                  selectedTopicIds={q.selectedTopics || []}
                  onChange={(newTopics) => {
                    const updated = [...questions];
                    updated[qIdx].selectedTopics = newTopics;
                    setQuestions(updated);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Difficulty</label>
                  <Select value={q.difficulty} onValueChange={v => updateQuestion(qIdx, 'difficulty', v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="easy" className="text-white hover:bg-white/10">Easy</SelectItem>
                      <SelectItem value="medium" className="text-white hover:bg-white/10">Medium</SelectItem>
                      <SelectItem value="hard" className="text-white hover:bg-white/10">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Explanation (Optional)</label>
                <Textarea
                  value={q.explanation}
                  onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)}
                  className="bg-zinc-900 border-zinc-700 mt-1"
                  placeholder="Explain the correct answer..."
                />
              </div>
            </div>
          ))}

          <Button
            onClick={addQuestion}
            variant="outline"
            className="w-full border-zinc-700 text-slate-300"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Another Question
          </Button>

          {/* Summary Before Submit */}
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-indigo-400 mb-1">Ready to create:</p>
                <ul className="space-y-1 text-xs">
                  <li>• {questions.length} question{questions.length > 1 ? 's' : ''}</li>
                  {selectedCase && <li>• Linked to case: "{selectedCase.title}"</li>}
                  {!selectedCase && sharedScenario && sharedScenario.trim() && <li>• Will create new case with shared scenario</li>}
                  <li>• Total topics selected: {questions.reduce((sum, q) => sum + (q.selectedTopics?.length || 0), 0)}</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createBulkMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
          >
            {createBulkMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Create {questions.length} Question{questions.length > 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}