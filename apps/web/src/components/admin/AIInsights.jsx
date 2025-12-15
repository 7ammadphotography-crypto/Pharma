import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, BookOpen, Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function AIInsights({ open, onOpenChange }) {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: attempts = [] } = useQuery({
    queryKey: ['all-attempts'],
    queryFn: () => base44.entities.QuizAttempt.list('-created_date', 500)
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list()
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list()
  });

  useEffect(() => {
    if (open && !insights && attempts.length > 0) {
      generateInsights();
    }
  }, [open, attempts.length]);

  const generateInsights = async () => {
    setIsLoading(true);
    
    try {
      // Analyze performance data
      const completedAttempts = attempts.filter(a => a.is_completed);
      
      // Question performance analysis
      const questionPerformance = {};
      completedAttempts.forEach(attempt => {
        (attempt.answers || []).forEach(ans => {
          if (!questionPerformance[ans.question_id]) {
            questionPerformance[ans.question_id] = { correct: 0, total: 0 };
          }
          questionPerformance[ans.question_id].total++;
          if (ans.is_correct) questionPerformance[ans.question_id].correct++;
        });
      });

      // Find hard questions (low success rate)
      const hardQuestions = Object.entries(questionPerformance)
        .map(([qid, stats]) => ({
          id: qid,
          question: questions.find(q => q.id === qid),
          successRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          attempts: stats.total
        }))
        .filter(q => q.attempts >= 3 && q.successRate < 50)
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 5);

      // Topic performance
      const topicPerformance = {};
      topics.forEach(t => {
        topicPerformance[t.id] = { title: t.title, correct: 0, total: 0, chapterId: t.competency_id };
      });

      // Calculate topic stats from question performance
      questions.forEach(q => {
        const perf = questionPerformance[q.id];
        if (perf && q.topic_id && topicPerformance[q.topic_id]) {
          topicPerformance[q.topic_id].correct += perf.correct;
          topicPerformance[q.topic_id].total += perf.total;
        }
      });

      const weakTopics = Object.entries(topicPerformance)
        .map(([tid, stats]) => ({
          id: tid,
          ...stats,
          successRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        }))
        .filter(t => t.total >= 5 && t.successRate < 60)
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 5);

      // Generate AI recommendations
      const analysisPrompt = `بناءً على تحليل أداء الطلاب في منصة تعليمية للصيدلة:

المواضيع الضعيفة (نسبة نجاح أقل من 60%):
${weakTopics.map(t => `- ${t.title}: ${t.successRate.toFixed(1)}% نجاح من ${t.total} محاولة`).join('\n')}

الأسئلة الصعبة (نسبة نجاح أقل من 50%):
${hardQuestions.map(q => `- "${q.question?.question_text?.substring(0, 50)}...": ${q.successRate.toFixed(1)}%`).join('\n')}

قدم:
1. تحليل موجز للمشكلات الرئيسية
2. اقتراحات لمواضيع جديدة يجب إضافتها لتحسين الفهم
3. توصيات لتحسين المحتوى التعليمي`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            analysis: { type: "string" },
            suggestedTopics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights({
        hardQuestions,
        weakTopics,
        aiAnalysis: aiResponse.analysis,
        suggestedTopics: aiResponse.suggestedTopics || [],
        recommendations: aiResponse.recommendations || []
      });

    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            تحليلات الذكاء الاصطناعي واقتراحات التحسين
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-white font-medium">جارٍ تحليل بيانات الأداء...</p>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* AI Analysis */}
            <Card className="bg-indigo-900/20 border-indigo-500/30 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white mb-2">تحليل الذكاء الاصطناعي</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{insights.aiAnalysis}</p>
                </div>
              </div>
            </Card>

            {/* Weak Topics */}
            {insights.weakTopics.length > 0 && (
              <div>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  المواضيع التي تحتاج تحسين
                </h3>
                <div className="space-y-2">
                  {insights.weakTopics.map((topic, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                      <span className="text-slate-300">{topic.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/20 text-red-300">{topic.successRate.toFixed(0)}%</Badge>
                        <span className="text-xs text-slate-500">{topic.total} محاولة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hard Questions */}
            {insights.hardQuestions.length > 0 && (
              <div>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  أسئلة صعبة على الطلاب
                </h3>
                <div className="space-y-2">
                  {insights.hardQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                      <p className="text-slate-300 text-sm line-clamp-2 mb-2">{q.question?.question_text}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-300">{q.successRate.toFixed(0)}% نجاح</Badge>
                        <span className="text-xs text-slate-500">{q.attempts} محاولة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Topics */}
            {insights.suggestedTopics.length > 0 && (
              <div>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  مواضيع مقترحة للإضافة
                </h3>
                <div className="space-y-2">
                  {insights.suggestedTopics.map((topic, idx) => (
                    <Card key={idx} className="p-3 bg-emerald-900/10 border-emerald-500/20">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-emerald-300">{topic.title}</h4>
                          <p className="text-slate-400 text-sm mt-1">{topic.description}</p>
                          <p className="text-xs text-slate-500 mt-1">💡 {topic.reason}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <div>
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  توصيات للتحسين
                </h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={generateInsights} variant="outline" className="w-full border-zinc-700">
              <Sparkles className="w-4 h-4 mr-2" />
              تحديث التحليل
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>لا تتوفر بيانات كافية للتحليل</p>
            <p className="text-sm mt-1">يحتاج النظام لمزيد من محاولات الطلاب</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}