import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Settings2, Zap } from 'lucide-react';
import { toast } from "sonner";

const FEATURE_LABELS = {
  question_generation: 'Question Generation',
  explanation_generation: 'Explanation Generation',
  study_plan: 'Study Plan',
  text_to_questions: 'Text to Questions',
  ai_assistant: 'AI Assistant'
};

const MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Most Advanced)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o-mini (Recommended)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast & Cheap)' }
  ],
  google_gemini: [
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' }
  ],
  anthropic: [
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
  ]
};

export default function FeatureConfigManager({ featureType, config, templates }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ai_provider: 'openai',
    model_name: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    active_template_id: '',
    is_enabled: true,
    rate_limit_per_hour: 100,
    quality_threshold: 0.8,
    ...config
  });

  useEffect(() => {
    if (config) {
      setFormData({ ...formData, ...config });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config?.id) {
        return base44.entities.AIFeatureConfig.update(config.id, data);
      } else {
        return base44.entities.AIFeatureConfig.create({
          feature_type: featureType,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-feature-configs']);
      toast.success('Configuration saved successfully');
    },
    onError: () => {
      toast.error('Failed to save configuration');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const activeTemplates = templates.filter(t => t.feature_type === featureType && t.status === 'active');

  return (
    <Card className="glass-card border-0 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{FEATURE_LABELS[featureType]}</h3>
            <p className="text-xs text-slate-400">Configure AI settings for this feature</p>
          </div>
        </div>
        <Switch 
          checked={formData.is_enabled}
          onCheckedChange={(val) => setFormData({ ...formData, is_enabled: val })}
        />
      </div>

      <div className="space-y-4">
        {/* AI Provider */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white mb-2 block">AI Provider</label>
            <Select 
              value={formData.ai_provider} 
              onValueChange={(val) => setFormData({ 
                ...formData, 
                ai_provider: val,
                model_name: MODEL_OPTIONS[val]?.[0]?.value || ''
              })}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="openai" className="text-white hover:bg-white/10">OpenAI</SelectItem>
                <SelectItem value="google_gemini" className="text-white hover:bg-white/10">Google Gemini</SelectItem>
                <SelectItem value="anthropic" className="text-white hover:bg-white/10">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-white mb-2 block">Model</label>
            <Select 
              value={formData.model_name} 
              onValueChange={(val) => setFormData({ ...formData, model_name: val })}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {(MODEL_OPTIONS[formData.ai_provider] || []).map(model => (
                  <SelectItem key={model.value} value={model.value} className="text-white hover:bg-white/10">
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Template */}
        <div>
          <label className="text-sm text-white mb-2 block">Active Prompt Template</label>
          <Select 
            value={formData.active_template_id} 
            onValueChange={(val) => setFormData({ ...formData, active_template_id: val })}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-700">
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              {activeTemplates.map(template => (
                <SelectItem key={template.id} value={template.id} className="text-white hover:bg-white/10">
                  {template.template_name} v{template.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white mb-2 block">
              Temperature: {formData.temperature}
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={formData.temperature}
              onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-sm text-white mb-2 block">Max Tokens</label>
            <Input 
              type="number"
              value={formData.max_tokens}
              onChange={e => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-white mb-2 block">Top P</label>
            <Input 
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={formData.top_p}
              onChange={e => setFormData({ ...formData, top_p: parseFloat(e.target.value) })}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>

          <div>
            <label className="text-sm text-white mb-2 block">Frequency Penalty</label>
            <Input 
              type="number"
              step="0.1"
              min="-2"
              max="2"
              value={formData.frequency_penalty}
              onChange={e => setFormData({ ...formData, frequency_penalty: parseFloat(e.target.value) })}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>

          <div>
            <label className="text-sm text-white mb-2 block">Presence Penalty</label>
            <Input 
              type="number"
              step="0.1"
              min="-2"
              max="2"
              value={formData.presence_penalty}
              onChange={e => setFormData({ ...formData, presence_penalty: parseFloat(e.target.value) })}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>
        </div>

        {/* Rate Limiting & Quality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white mb-2 block">Rate Limit (per hour)</label>
            <Input 
              type="number"
              value={formData.rate_limit_per_hour}
              onChange={e => setFormData({ ...formData, rate_limit_per_hour: parseInt(e.target.value) })}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>

          <div>
            <label className="text-sm text-white mb-2 block">
              Quality Threshold: {formData.quality_threshold}
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={formData.quality_threshold}
              onChange={e => setFormData({ ...formData, quality_threshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Configuration
        </Button>
      </div>
    </Card>
  );
}