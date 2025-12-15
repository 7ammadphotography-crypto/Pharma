import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileJson, FileSpreadsheet, Check, AlertTriangle, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BulkImportQuestions({ open, onOpenChange, topics, competencies }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload, preview, importing
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [importProgress, setImportProgress] = useState(0);

  const importMutation = useMutation({
    mutationFn: async (questions) => {
      let imported = 0;
      for (const q of questions) {
        const question = await base44.entities.Question.create({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          tags: q.tags || []
        });
        
        if (selectedTopicId) {
          await base44.entities.TopicQuestion.create({
            topic_id: selectedTopicId,
            question_id: question.id
          });
        }
        
        imported++;
        setImportProgress(Math.round((imported / questions.length) * 100));
      }
      return imported;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['topic-questions']);
      setTimeout(() => handleClose(), 1500);
    }
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const questions = [];
    const parseErrors = [];

    if (file.name.endsWith('.json')) {
      // Parse JSON
      try {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : data.questions || [];
        arr.forEach((q, i) => {
          if (validateQuestion(q)) {
            questions.push(normalizeQuestion(q));
          } else {
            parseErrors.push(`Row ${i + 1}: Invalid question format`);
          }
        });
      } catch (err) {
        parseErrors.push('Invalid JSON format');
      }
    } else if (file.name.endsWith('.csv')) {
      // Parse CSV
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const q = {};
        headers.forEach((h, idx) => {
          q[h] = values[idx]?.trim();
        });
        
        if (q.question_text || q.question) {
          questions.push({
            question_text: q.question_text || q.question,
            options: [
              q.option_a || q.option1 || '',
              q.option_b || q.option2 || '',
              q.option_c || q.option3 || '',
              q.option_d || q.option4 || ''
            ],
            correct_answer: parseInt(q.correct_answer || q.correct || '0'),
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            tags: q.tags ? q.tags.split(';') : []
          });
        } else {
          parseErrors.push(`Row ${i + 1}: Missing question text`);
        }
      }
    }

    setParsedQuestions(questions);
    setErrors(parseErrors);
    if (questions.length > 0) setStep('preview');
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const validateQuestion = (q) => {
    return q.question_text && q.options && Array.isArray(q.options) && q.options.length >= 4;
  };

  const normalizeQuestion = (q) => ({
    question_text: q.question_text,
    options: q.options.slice(0, 4),
    correct_answer: q.correct_answer || 0,
    explanation: q.explanation || '',
    difficulty: q.difficulty || 'medium',
    tags: q.tags || []
  });

  const handleImport = () => {
    setStep('importing');
    importMutation.mutate(parsedQuestions);
  };

  const handleClose = () => {
    setStep('upload');
    setParsedQuestions([]);
    setErrors([]);
    setImportProgress(0);
    onOpenChange(false);
  };

  const downloadTemplate = (format) => {
    if (format === 'json') {
      const template = {
        questions: [
          {
            question_text: "What is the mechanism of action of aspirin?",
            options: ["COX inhibition", "ACE inhibition", "Beta blockade", "Calcium channel blockade"],
            correct_answer: 0,
            explanation: "Aspirin irreversibly inhibits cyclooxygenase (COX) enzymes...",
            difficulty: "medium",
            tags: ["pharmacology", "NSAIDs"]
          }
        ]
      };
      downloadFile('questions_template.json', JSON.stringify(template, null, 2));
    } else {
      const csv = `question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,tags
"What is the mechanism of action of aspirin?","COX inhibition","ACE inhibition","Beta blockade","Calcium channel blockade",0,"Aspirin irreversibly inhibits cyclooxygenase (COX) enzymes...","medium","pharmacology;NSAIDs"`;
      downloadFile('questions_template.csv', csv);
    }
  };

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            Bulk Import Questions
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
            >
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-1">Click to upload file</h3>
              <p className="text-slate-400 text-sm">Supports CSV and JSON formats</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Download Templates */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-zinc-800">
              <span className="text-slate-400 text-sm">Download template:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('csv')}
                className="border-zinc-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('json')}
                className="border-zinc-700"
              >
                <FileJson className="w-4 h-4 mr-2" /> JSON
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex gap-4">
              <Card className="flex-1 bg-emerald-900/20 border-emerald-500/30 p-4">
                <div className="text-2xl font-bold text-emerald-400">{parsedQuestions.length}</div>
                <div className="text-sm text-slate-400">Questions Found</div>
              </Card>
              {errors.length > 0 && (
                <Card className="flex-1 bg-amber-900/20 border-amber-500/30 p-4">
                  <div className="text-2xl font-bold text-amber-400">{errors.length}</div>
                  <div className="text-sm text-slate-400">Warnings</div>
                </Card>
              )}
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Parse Warnings</span>
                </div>
                <ul className="text-sm text-amber-300/80 space-y-1">
                  {errors.slice(0, 3).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {errors.length > 3 && <li>• ... and {errors.length - 3} more</li>}
                </ul>
              </div>
            )}

            {/* Preview */}
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {parsedQuestions.slice(0, 5).map((q, i) => (
                <Card key={i} className="bg-zinc-800/50 border-zinc-700 p-3">
                  <p className="text-white text-sm line-clamp-1">{q.question_text}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={
                      q.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                      q.difficulty === 'hard' ? 'bg-red-900/50 text-red-300' :
                      'bg-amber-900/50 text-amber-300'
                    }>
                      {q.difficulty}
                    </Badge>
                  </div>
                </Card>
              ))}
              {parsedQuestions.length > 5 && (
                <p className="text-slate-500 text-sm text-center">... and {parsedQuestions.length - 5} more</p>
              )}
            </div>

            {/* Topic Selection */}
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

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="flex-1 border-zinc-700"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                Import {parsedQuestions.length} Questions
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center">
            {importProgress < 100 ? (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">Importing Questions...</h3>
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-slate-400 text-sm">{importProgress}% complete</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-medium">Import Complete!</h3>
                <p className="text-slate-400 text-sm">{parsedQuestions.length} questions imported successfully</p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}