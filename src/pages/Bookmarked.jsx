import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Bookmarked() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: bookmarks = [], isLoading: loadingBookmarks } = useQuery({
    queryKey: ['bookmarks', user?.email],
    queryFn: () => base44.entities.BookmarkedQuestion.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const bookmarkedQuestions = questions.filter(q => 
    bookmarks.some(b => b.question_id === q.id)
  );

  if (loadingBookmarks) {
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
        <h1 className="text-xl font-bold text-white">Bookmarked Questions</h1>
      </div>

      {bookmarkedQuestions.length > 0 ? (
        <div className="space-y-3">
          {bookmarkedQuestions.map((question, idx) => (
            <Card key={question.id} className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-start gap-3">
                <Bookmark className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white">{question.question_text}</p>
                  <p className="text-green-400 text-sm mt-2">
                    Answer: {question.options?.[question.correct_answer]}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
          <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No bookmarked questions yet</p>
          <p className="text-zinc-500 text-sm mt-2">Bookmark questions during quizzes to review them later</p>
        </Card>
      )}
    </div>
  );
}