import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ImportQuestions({ isOpen, onClose }) {
  const [mode, setMode] = useState('ai'); // 'ai' or 'file'
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (questions) => base44.entities.Question.bulkCreate(questions),
    onSuccess: () => queryClient.invalidateQueries(['questions'])
  });

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert question generator for pharmacy education. 
Generate ${aiCount} multiple choice questions about: "${aiPrompt}"

Each question must have:
- question_text: The question in Arabic
- options: Array of exactly 4 answer options in Arabic
- correct_answer: Index of correct answer (0-3)
- explanation: Brief explanation of the correct answer in Arabic
- difficulty: "easy", "medium", or "hard"
- tags: Array of relevant tags in Arabic

Make questions educational and appropriate for pharmacy students preparing for PEBC exam.`,
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
                  difficulty: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const questions = response.questions || [];
      if (questions.length > 0) {
        await createMutation.mutateAsync(questions);
        setResult({ success: true, count: questions.length });
      } else {
        setResult({ success: false, error: 'لم يتم توليد أي أسئلة' });
      }
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question_text: { type: "string" },
              option_a: { type: "string" },
              option_b: { type: "string" },
              option_c: { type: "string" },
              option_d: { type: "string" },
              correct_answer: { type: "string" },
              explanation: { type: "string" },
              difficulty: { type: "string" },
              tags: { type: "string" }
            }
          }
        }
      });

      if (extracted.status === 'success' && extracted.output) {
        const questions = extracted.output.map(row => ({
          question_text: row.question_text,
          options: [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean),
          correct_answer: ['a', 'b', 'c', 'd', '0', '1', '2', '3'].indexOf(String(row.correct_answer).toLowerCase()) % 4,
          explanation: row.explanation || '',
          difficulty: row.difficulty || 'medium',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
        })).filter(q => q.question_text && q.options.length === 4);

        if (questions.length > 0) {
          await createMutation.mutateAsync(questions);
          setResult({ success: true, count: questions.length });
        } else {
          setResult({ success: false, error: 'لم يتم استخراج أي أسئلة صالحة' });
        }
      } else {
        setResult({ success: false, error: extracted.details || 'فشل في قراءة الملف' });
      }
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setResult(null);
    setAiPrompt('');
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>استيراد أسئلة</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'ai' ? 'default' : 'outline'}
            onClick={() => setMode('ai')}
            className={mode === 'ai' ? 'bg-indigo-600 flex-1' : 'border-zinc-700 flex-1'}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            توليد بالذكاء الاصطناعي
          </Button>
          <Button
            variant={mode === 'file' ? 'default' : 'outline'}
            onClick={() => setMode('file')}
            className={mode === 'file' ? 'bg-indigo-600 flex-1' : 'border-zinc-700 flex-1'}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            رفع ملف
          </Button>
        </div>

        {result ? (
          <Card className={`p-6 text-center ${result.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            {result.success ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-300 font-medium">تم إضافة {result.count} سؤال بنجاح!</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-300 font-medium">حدث خطأ</p>
                <p className="text-red-400/70 text-sm mt-1">{result.error}</p>
              </>
            )}
            <Button onClick={resetAndClose} className="mt-4 bg-zinc-700">
              إغلاق
            </Button>
          </Card>
        ) : mode === 'ai' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">الموضوع</label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="مثال: أدوية علاج ارتفاع ضغط الدم وآثارها الجانبية"
                className="bg-zinc-800 border-zinc-700 min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">عدد الأسئلة</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={aiCount}
                onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button
              onClick={handleAIGenerate}
              disabled={loading || !aiPrompt.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جارٍ التوليد...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> توليد الأسئلة</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="border-2 border-dashed border-zinc-700 p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-white font-medium">
                  {file ? file.name : 'اضغط لاختيار ملف'}
                </p>
                <p className="text-slate-500 text-xs mt-1">CSV أو Excel</p>
              </label>
            </Card>
            <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-slate-400">
              <p className="font-medium text-slate-300 mb-1">صيغة الملف:</p>
              <p>question_text, option_a, option_b, option_c, option_d, correct_answer (a/b/c/d), explanation, difficulty, tags</p>
            </div>
            <Button
              onClick={handleFileUpload}
              disabled={loading || !file}
              className="w-full bg-gradient-to-r from-cyan-600 to-teal-600"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> جارٍ الاستيراد...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> استيراد الأسئلة</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}