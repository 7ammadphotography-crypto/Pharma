import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function AIExplanationEditor({ question, open, onOpenChange }) {
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Question.update(question.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      onOpenChange(false);
    }
  });

  const generateExplanation = async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are an expert in pharmacy and medical education. Provide a detailed and educational explanation for the following question:

Question: ${question.question_text}

Options:
${question.options?.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + question.correct_answer)}. ${question.options?.[question.correct_answer]}

Provide an explanation that includes:
1. Why the correct answer is correct (with scientific details)
2. Why each of the other options is wrong
3. Additional useful information for the student
4. Memory tips

Make the explanation clear and helpful for students.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            explanation: { type: "string" }
          }
        }
      });

      setExplanation(response.explanation || '');
    } catch (error) {
      console.error('Error generating explanation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ explanation });
  };

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Explanation Editor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question Preview */}
          <Card className="p-4 bg-zinc-800/50 border-zinc-700">
            <p className="text-white font-medium mb-3">{question.question_text}</p>
            <div className="space-y-1">
              {question.options?.map((opt, idx) => (
                <div 
                  key={idx} 
                  className={`text-sm px-3 py-1.5 rounded ${
                    idx === question.correct_answer 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-zinc-700/50 text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                  {idx === question.correct_answer && <Check className="w-4 h-4 inline ml-2" />}
                </div>
              ))}
            </div>
          </Card>

          {/* Generate Button */}
          <Button 
            onClick={generateExplanation} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating explanation...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Explanation
              </>
            )}
          </Button>

          {/* Explanation Editor */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Explanation</label>
            <Textarea 
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Explanation will appear here..."
              className="bg-zinc-800 border-zinc-700 min-h-[200px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-zinc-700">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!explanation.trim() || updateMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Explanation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}