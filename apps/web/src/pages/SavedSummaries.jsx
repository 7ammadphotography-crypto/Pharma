import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SavedSummaries() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['summaries', user?.email],
    queryFn: () => base44.entities.SavedSummary.filter({ user_id: user?.id }, '-created_at'),
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Saved Summaries</h1>
      </div>

      {summaries.length > 0 ? (
        <div className="space-y-3">
          {summaries.map((summary) => (
            <Card key={summary.id} className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-medium">{summary.title}</h3>
                  <p className="text-zinc-400 text-sm mt-2 line-clamp-3">{summary.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No saved summaries yet</p>
          <p className="text-zinc-500 text-sm mt-2">Use the AI Assistant to generate and save study summaries</p>
        </Card>
      )}
    </div>
  );
}