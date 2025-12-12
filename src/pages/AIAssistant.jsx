import React from 'react';
import { Card } from "@/components/ui/card";
import { ChevronRight, MessageCircle, X, FileText, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const features = [
  {
    icon: MessageCircle,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    title: 'Personalized Feedback',
    description: 'Get personalized feedback on your performance and study habits',
    page: 'PersonalizedFeedback'
  },
  {
    icon: X,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    title: 'Incorrect Answers Summary',
    description: 'Get AI analysis of your incorrect answers',
    page: 'IncorrectAnswersSummary'
  },
  {
    icon: FileText,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    title: 'Topic Summary',
    description: 'Get comprehensive study material for any topic',
    page: 'TopicSummary'
  },
  {
    icon: BookOpen,
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    title: 'Study Plan',
    description: 'AI Suggested Study Plan',
    page: 'StudyPlan'
  }
];

export default function AIAssistant() {
  return (
    <div className="p-4 space-y-6 pb-28">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="text-slate-400 text-sm">Powered by AI to enhance your learning</p>
      </div>

      {/* Feature List */}
      <div className="space-y-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={createPageUrl(feature.page)}>
              <Card className="glass-card border-0 p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center`}>
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-1">{feature.description}</p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-slate-600 text-sm">Powered by OpenAI (ChatGPT)</p>
      </div>
    </div>
  );
}