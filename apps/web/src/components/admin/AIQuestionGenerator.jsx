import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, Check, X, Plus, Wand2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function AIQuestionGenerator({ chapters = [], topics = [], open, onOpenChange }) {
  const [step, setStep] = useState('config'); // config, generating, review
  const [config, setConfig] = useState({
    mode: 'topic', // topic or custom
    topicId: '',
    chapterId: '',
    customPrompt: '',
    count: 5,
    difficulty: 'mixed'
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (questions) => {
      await base44.entities.Question.bulkCreate(questions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      onOpenChange(false);
      resetState();
    }
  });

  const resetState = () => {
    setStep('config');
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
    setConfig({ mode: 'topic', topicId: '', chapterId: '', customPrompt: '', count: 5, difficulty: 'mixed' });
  };

  const generateQuestions = async () => {
    setIsGenerating(true);
    setStep('generating');

    try {
      let prompt = '';
      const selectedTopic = topics.find(t => t.id === config.topicId);
      const selectedChapter = chapters.find(c => c.id === config.chapterId);

      if (config.mode === 'topic' && selectedTopic) {
        prompt = `You are an expert in creating medical and pharmaceutical exam questions.

Create ${config.count} multiple choice questions about the following topic:
- Topic: ${selectedTopic.title}
- Description: ${selectedTopic.description || 'Not available'}
- Chapter: ${selectedChapter?.title || 'Not specified'}
${config.difficulty !== 'mixed' ? `- Difficulty level: ${config.difficulty}` : '- Mixed difficulty levels (easy, medium, hard)'}

Question requirements:
1. Each question must have 4 options
2. Only one correct answer
3. Detailed explanation of why the answer is correct and why other options are wrong
4. Diverse questions covering different aspects of the topic`;
      } else {
        prompt = `You are an expert in creating medical and pharmaceutical exam questions.

Create ${config.count} multiple choice questions about:
${config.customPrompt}

${config.difficulty !== 'mixed' ? `Difficulty level: ${config.difficulty}` : 'Mixed difficulty levels'}

Question requirements:
1. Each question must have 4 options
2. Only one correct answer
3. Detailed explanation of why the answer is correct and why other options are wrong`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer: { type: "number" },
                  explanation: { type: "string" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const questions = response.questions || [];
      setGeneratedQuestions(questions);
      setSelectedQuestions(new Set(questions.map((_, i) => i)));
      setStep('review');
    } catch (error) {
      console.error('Error generating questions:', error);
      setStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const questionsToSave = generatedQuestions
      .filter((_, i) => selectedQuestions.has(i))
      .map(q => ({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        tags: q.tags || []
      }));
    
    if (questionsToSave.length > 0) {
      saveMutation.mutate(questionsToSave);
    }
  };

  const toggleQuestion = (index) => {
    const newSet = new Set(selectedQuestions);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedQuestions(newSet);
  };

  const filteredTopics = config.chapterId 
    ? topics.filter(t => t.competency_id === config.chapterId)
    : topics;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Question Generator
          </DialogTitle>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={config.mode === 'topic' ? 'default' : 'outline'}
                onClick={() => setConfig({...config, mode: 'topic'})}
                className={config.mode === 'topic' ? 'bg-indigo-600' : 'border-zinc-700'}
              >
                From Topic
              </Button>
              <Button 
                variant={config.mode === 'custom' ? 'default' : 'outline'}
                onClick={() => setConfig({...config, mode: 'custom'})}
                className={config.mode === 'custom' ? 'bg-indigo-600' : 'border-zinc-700'}
              >
                Custom Topic
              </Button>
            </div>

            {config.mode === 'topic' ? (
              <>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Chapter</label>
                  <Select value={config.chapterId} onValueChange={v => setConfig({...config, chapterId: v, topicId: ''})}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Topic</label>
                  <Select value={config.topicId} onValueChange={v => setConfig({...config, topicId: v})}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select Topic" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {filteredTopics.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Describe the topic you want questions about</label>
                <Textarea 
                  value={config.customPrompt}
                  onChange={e => setConfig({...config, customPrompt: e.target.value})}
                  placeholder="Example: Questions about drug interactions between anticoagulants and analgesics..."
                  className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Number of Questions</label>
                <Select value={String(config.count)} onValueChange={v => setConfig({...config, count: Number(v)})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {[3, 5, 10, 15, 20].map(n => <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Difficulty Level</label>
                <Select value={config.difficulty} onValueChange={v => setConfig({...config, difficulty: v})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={generateQuestions}
              disabled={(config.mode === 'topic' && !config.topicId) || (config.mode === 'custom' && !config.customPrompt.trim())}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Questions
            </Button>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-white font-medium">Generating questions...</p>
            <p className="text-slate-500 text-sm mt-1">This may take a few seconds</p>
          </div>
        )}

        {step === 'review' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-400 text-sm">Generated {generatedQuestions.length} questions - select which to save</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedQuestions(new Set(generatedQuestions.map((_, i) => i)))}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedQuestions(new Set())}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {generatedQuestions.map((q, idx) => (
                <Card 
                  key={idx} 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedQuestions.has(idx) 
                      ? 'bg-indigo-900/30 border-indigo-500' 
                      : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'
                  }`}
                  onClick={() => toggleQuestion(idx)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedQuestions.has(idx) ? 'bg-indigo-500' : 'bg-zinc-700'
                    }`}>
                      {selectedQuestions.has(idx) ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs text-slate-400">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm mb-2">{q.question_text}</p>
                      <div className="space-y-1 mb-2">
                        {q.options?.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-2 py-1 rounded ${
                            oi === q.correct_answer ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-700/50 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + oi)}. {opt}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className={`text-xs ${
                          q.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                          q.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {q.difficulty}
                        </Badge>
                        {q.tags?.slice(0, 2).map((t, ti) => (
                          <Badge key={ti} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-slate-500 mt-2 border-t border-zinc-700 pt-2">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-3">
              <Button variant="outline" onClick={resetState} className="flex-1 border-zinc-700">
                Generate New
              </Button>
              <Button 
                onClick={handleSave}
                disabled={selectedQuestions.size === 0 || saveMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Save (${selectedQuestions.size})`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}