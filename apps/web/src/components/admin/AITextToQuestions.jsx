import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, FileText, Check, X, ChevronRight, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AITextToQuestions({ open, onOpenChange, topics, competencies }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('input'); // input, generating, review
  const [sourceText, setSourceText] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('mixed');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (questions) => {
      for (const q of questions) {
        const question = await base44.entities.Question.create({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          tags: q.tags || []
        });
        
        if (selectedTopicId) {
          await base44.entities.TopicQuestion.create({
            topic_id: selectedTopicId,
            question_id: question.id
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['topic-questions']);
      handleClose();
    }
  });

  const generateQuestions = async () => {
    if (!sourceText.trim()) return;
    
    setIsGenerating(true);
    setStep('generating');

    const difficultyPrompt = difficulty === 'mixed' 
      ? 'Mix of easy, medium, and hard questions'
      : `All questions should be ${difficulty} difficulty`;

    const prompt = `Based on the following educational text, generate ${questionCount} multiple-choice questions for pharmacy students preparing for PEBC exam.

TEXT:
${sourceText}

REQUIREMENTS:
- Generate exactly ${questionCount} questions
- ${difficultyPrompt}
- Each question must have exactly 4 options (A, B, C, D)
- Questions should test understanding, not just memorization
- Include clinical application questions where appropriate
- Provide detailed explanations for correct answers
- Suggest relevant tags for each question

Return the questions in the exact JSON format specified.`;

    const result = await base44.integrations.Core.InvokeLLM({
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

    setGeneratedQuestions(result.questions || []);
    setSelectedQuestions(new Set(result.questions?.map((_, i) => i) || []));
    setIsGenerating(false);
    setStep('review');
  };

  const handleSave = () => {
    const questionsToSave = generatedQuestions.filter((_, i) => selectedQuestions.has(i));
    saveMutation.mutate(questionsToSave);
  };

  const toggleQuestion = (index) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const handleClose = () => {
    setStep('input');
    setSourceText('');
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Generate Questions from Text
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Input */}
            {step === 'input' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Paste your educational text here</label>
                  <Textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste a chapter, article, or any educational content here. The AI will analyze it and generate relevant exam questions..."
                    className="bg-zinc-800 border-zinc-700 min-h-[200px]"
                  />
                  <p className="text-xs text-slate-500 mt-1">{sourceText.length} characters</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Number of Questions</label>
                    <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {[3, 5, 10, 15, 20].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} Questions</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Difficulty Level</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="mixed">Mixed Difficulty</SelectItem>
                        <SelectItem value="easy">Easy Only</SelectItem>
                        <SelectItem value="medium">Medium Only</SelectItem>
                        <SelectItem value="hard">Hard Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Assign to Topic (Optional)</label>
                  <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select a topic..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[200px]">
                      <SelectItem value={null}>No Topic</SelectItem>
                      {competencies?.map(comp => (
                        <React.Fragment key={comp.id}>
                          <SelectItem value={`comp-${comp.id}`} disabled className="text-slate-500 font-medium">
                            {comp.title}
                          </SelectItem>
                          {topics?.filter(t => t.competency_id === comp.id).map(t => (
                            <SelectItem key={t.id} value={t.id} className="pl-6">
                              {t.title}
                            </SelectItem>
                          ))}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateQuestions}
                  disabled={!sourceText.trim() || sourceText.length < 100}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Questions from Text
                </Button>

                {sourceText.length > 0 && sourceText.length < 100 && (
                  <p className="text-amber-400 text-sm text-center">Please enter at least 100 characters</p>
                )}
              </motion.div>
            )}

            {/* Step 2: Generating */}
            {step === 'generating' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-16 text-center"
              >
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-ping opacity-20" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Text & Generating Questions</h3>
                <p className="text-slate-400">AI is reading your content and creating relevant exam questions...</p>
                <div className="mt-6 flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Generated Questions</h3>
                    <p className="text-slate-400 text-sm">{selectedQuestions.size} of {generatedQuestions.length} selected</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedQuestions.size === generatedQuestions.length) {
                        setSelectedQuestions(new Set());
                      } else {
                        setSelectedQuestions(new Set(generatedQuestions.map((_, i) => i)));
                      }
                    }}
                    className="border-zinc-700"
                  >
                    {selectedQuestions.size === generatedQuestions.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {generatedQuestions.map((q, idx) => (
                    <Card
                      key={idx}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedQuestions.has(idx)
                          ? 'bg-emerald-900/20 border-emerald-500/50'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      }`}
                      onClick={() => toggleQuestion(idx)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedQuestions.has(idx)}
                          className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium line-clamp-2">{q.question_text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={
                              q.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                              q.difficulty === 'hard' ? 'bg-red-900/50 text-red-300' :
                              'bg-amber-900/50 text-amber-300'
                            }>
                              {q.difficulty}
                            </Badge>
                            {q.tags?.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-slate-400 border-slate-600 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            <span className="text-emerald-400">✓ Correct:</span> {q.options[q.correct_answer]}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    variant="outline"
                    onClick={() => setStep('input')}
                    className="flex-1 border-zinc-700"
                  >
                    Back to Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={selectedQuestions.size === 0 || saveMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Save {selectedQuestions.size} Questions
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}