import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Settings2, FileText, BarChart3, Sliders } from 'lucide-react';
import FeatureConfigManager from '@/components/admin/ai/FeatureConfigManager';
import PromptTemplateManager from '@/components/admin/ai/PromptTemplateManager';
import AdvancedAnalytics from '@/components/admin/ai/AdvancedAnalytics';

const FEATURES = [
  'question_generation',
  'explanation_generation',
  'study_plan',
  'text_to_questions',
  'ai_assistant'
];

export default function AdminAISettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('configs');

  // Fetch all data
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['ai-feature-configs'],
    queryFn: () => base44.entities.AIFeatureConfig.list()
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['ai-prompt-templates'],
    queryFn: () => base44.entities.AIPromptTemplate.list('-created_date')
  });

  const { data: usageLogs = [] } = useQuery({
    queryKey: ['ai-usage-logs'],
    queryFn: () => base44.entities.AIUsageLog.list('-created_date', 500)
  });

  const isLoading = configsLoading || templatesLoading;

  if (isLoading) {
    return (
      <AdminLayout currentPage="AdminAISettings">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="AdminAISettings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Advanced AI Settings</h2>
            <p className="text-slate-400 text-sm">
              Configure AI providers, models, prompts, and monitor performance
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries(['ai-feature-configs']);
              queryClient.invalidateQueries(['ai-prompt-templates']);
              queryClient.invalidateQueries(['ai-usage-logs']);
            }}
            className="border-zinc-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900/50 border border-zinc-800">
            <TabsTrigger value="configs" className="data-[state=active]:bg-indigo-600">
              <Sliders className="w-4 h-4 mr-2" />
              Feature Configs
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-purple-600">
              <FileText className="w-4 h-4 mr-2" />
              Prompt Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configs">
            <div className="space-y-6">
              <div className="grid gap-6">
                {FEATURES.map(feature => {
                  const config = configs.find(c => c.feature_type === feature);
                  return (
                    <FeatureConfigManager 
                      key={feature}
                      featureType={feature}
                      config={config}
                      templates={templates}
                    />
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <PromptTemplateManager templates={templates} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedAnalytics usageLogs={usageLogs} configs={configs} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}