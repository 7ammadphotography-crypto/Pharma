import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Search, Sparkles, Loader2, ChevronLeft, Save, 
  CheckCircle2, FileText, Brain, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function TopicSummary() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => base44.entities.Topic.list('order')
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedSummary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-summaries'] });
      toast.success('Summary saved successfully!');
    }
  });

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateSummary = async (topic) => {
    setGenerating(true);
    setSelectedTopic(topic);
    setSummary(null);

    try {
      const competency = competencies.find(c => c.id === topic.competency_id);
      
      const prompt = `You are an expert pharmacy educator. Create a comprehensive study summary for the following topic:

Topic: ${topic.title}
Chapter: ${competency?.title || 'Unknown'}
Description: ${topic.description || 'No description provided'}

Provide a detailed study summary that includes:
1. Key Concepts (main ideas and definitions)
2. Important Details (facts, mechanisms, processes)
3. Clinical Applications (real-world relevance)
4. Common Misconceptions (what students often get wrong)
5. Memory Tips (mnemonics or strategies to remember)
6. Practice Questions Suggestions (what type of questions to expect)

Make it comprehensive yet easy to understand, suitable for pharmacy students preparing for PEBC exams.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            key_concepts: { type: "array", items: { type: "string" } },
            important_details: { type: "array", items: { type: "string" } },
            clinical_applications: { type: "array", items: { type: "string" } },
            common_misconceptions: { type: "array", items: { type: "string" } },
            memory_tips: { type: "array", items: { type: "string" } },
            practice_suggestions: { type: "string" },
            overview: { type: "string" }
          }
        }
      });

      setSummary(response);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!summary || !selectedTopic) return;

    const content = `## ${selectedTopic.title}

${summary.overview}

### Key Concepts
${summary.key_concepts?.map(c => `- ${c}`).join('\n') || ''}

### Important Details
${summary.important_details?.map(d => `- ${d}`).join('\n') || ''}

### Clinical Applications
${summary.clinical_applications?.map(a => `- ${a}`).join('\n') || ''}

### Common Misconceptions
${summary.common_misconceptions?.map(m => `- ${m}`).join('\n') || ''}

### Memory Tips
${summary.memory_tips?.map(t => `- ${t}`).join('\n') || ''}

### Practice Suggestions
${summary.practice_suggestions || ''}`;

    saveMutation.mutate({
      title: selectedTopic.title,
      content,
      topic_id: selectedTopic.id,
      competency_id: selectedTopic.competency_id
    });
  };

  return (
    <SubscriptionGuard>
    <div className="p-4 space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <Link to={createPageUrl('AIAssistant')}>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Topic Summary</h1>
          <p className="text-slate-400 text-sm">AI-generated study material</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass-card border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Topic List */}
      {!selectedTopic && (
        <div className="space-y-2">
          {filteredTopics.map((topic, idx) => {
            const competency = competencies.find(c => c.id === topic.competency_id);
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="glass-card border-0 p-4 hover:bg-white/5 transition-all cursor-pointer"
                  onClick={() => generateSummary(topic)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">{topic.title}</h3>
                      <p className="text-slate-500 text-xs">{competency?.title || 'Unknown'}</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-slate-500" />
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {filteredTopics.length === 0 && (
            <Card className="glass-card border-0 p-8 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No topics found</p>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {generating && (
        <Card className="glass-card border-0 p-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Generating Summary...</p>
            <p className="text-slate-400 text-sm">This may take a few moments</p>
          </div>
        </Card>
      )}

      {/* Summary Display */}
      {summary && selectedTopic && !generating && (
        <div className="space-y-4">
          {/* Topic Header */}
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 p-5">
            <h2 className="text-white font-bold text-xl mb-1">{selectedTopic.title}</h2>
            <p className="text-white/70 text-sm">
              {competencies.find(c => c.id === selectedTopic.competency_id)?.title}
            </p>
          </Card>

          {/* Overview */}
          {summary.overview && (
            <Card className="glass-card border-0 p-5">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Overview</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{summary.overview}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Key Concepts */}
          {summary.key_concepts && summary.key_concepts.length > 0 && (
            <Card className="glass-card border-0 p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Key Concepts
              </h3>
              <ul className="space-y-2">
                {summary.key_concepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {concept}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Important Details */}
          {summary.important_details && summary.important_details.length > 0 && (
            <Card className="glass-card border-0 p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Important Details
              </h3>
              <ul className="space-y-2">
                {summary.important_details.map((detail, idx) => (
                  <li key={idx} className="text-slate-300 text-sm">• {detail}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Clinical Applications */}
          {summary.clinical_applications && summary.clinical_applications.length > 0 && (
            <Card className="glass-card border-0 p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Clinical Applications
              </h3>
              <ul className="space-y-2">
                {summary.clinical_applications.map((app, idx) => (
                  <li key={idx} className="text-slate-300 text-sm">• {app}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Common Misconceptions */}
          {summary.common_misconceptions && summary.common_misconceptions.length > 0 && (
            <Card className="glass-card border-0 p-5 border-l-4 border-l-rose-500">
              <h3 className="text-white font-semibold mb-3">⚠️ Common Misconceptions</h3>
              <ul className="space-y-2">
                {summary.common_misconceptions.map((misc, idx) => (
                  <li key={idx} className="text-slate-300 text-sm">• {misc}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Memory Tips */}
          {summary.memory_tips && summary.memory_tips.length > 0 && (
            <Card className="glass-card border-0 p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <h3 className="text-white font-semibold mb-3">💡 Memory Tips</h3>
              <ul className="space-y-2">
                {summary.memory_tips.map((tip, idx) => (
                  <li key={idx} className="text-slate-300 text-sm">• {tip}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Practice Suggestions */}
          {summary.practice_suggestions && (
            <Card className="glass-card border-0 p-5">
              <h3 className="text-white font-semibold mb-2">📝 Practice Suggestions</h3>
              <p className="text-slate-300 text-sm">{summary.practice_suggestions}</p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTopic(null);
                setSummary(null);
              }}
              className="glass-card border-slate-700 text-white"
            >
              Back to Topics
            </Button>
          </div>
        </div>
      )}
    </div>
    </SubscriptionGuard>
  );
}