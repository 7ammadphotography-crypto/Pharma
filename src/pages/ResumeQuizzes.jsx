import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function ResumeQuizzes() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['incomplete-attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({
      user_id: user?.id,
      is_completed: false
    }, '-created_date'),
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
        <h1 className="text-xl font-bold text-white">Resume Quizzes</h1>
      </div>

      {attempts.length > 0 ? (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <Link
              key={attempt.id}
              to={createPageUrl(`Quiz?competencyId=${attempt.competency_id}&mode=${attempt.mode === 'mock_test' ? 'mock' : 'study'}`)}
            >
              <Card className="bg-zinc-900 border-zinc-800 p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {attempt.mode === 'mock_test' ? 'Mock Test' : 'Study Session'}
                      </p>
                      <p className="text-zinc-500 text-sm">
                        Started {format(new Date(attempt.created_date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-zinc-400 text-xs">
                        {attempt.answers?.length || 0} / {attempt.total_questions || '?'} questions answered
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
          <RotateCcw className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No incomplete quizzes</p>
          <p className="text-zinc-500 text-sm mt-2">Start a new quiz from the Questions page</p>
        </Card>
      )}
    </div>
  );
}