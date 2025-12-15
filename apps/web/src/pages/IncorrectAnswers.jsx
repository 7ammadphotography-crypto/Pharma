import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function IncorrectAnswers() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['user-attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_id: user?.id }, '-created_at'),
    enabled: !!user
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list()
  });

  // Get all incorrect answer question IDs
  const incorrectQuestionIds = new Set();
  attempts.forEach(attempt => {
    attempt.answers?.forEach(answer => {
      if (!answer.is_correct) {
        incorrectQuestionIds.add(answer.question_id);
      }
    });
  });

  const incorrectQuestions = questions.filter(q => incorrectQuestionIds.has(q.id));

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
        <h1 className="text-xl font-bold text-white">Incorrect Answers</h1>
      </div>

      {incorrectQuestions.length > 0 ? (
        <div className="space-y-3">
          {incorrectQuestions.map((question) => (
            <Card key={question.id} className="bg-zinc-900 border-zinc-800 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-white">{question.question_text}</p>
                  <p className="text-green-400 text-sm mt-2">
                    Correct Answer: {question.options?.[question.correct_answer]}
                  </p>
                  {question.explanation && (
                    <p className="text-zinc-500 text-sm mt-2 italic">
                      {question.explanation}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
          <X className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No incorrect answers yet</p>
          <p className="text-zinc-500 text-sm mt-2">Complete quizzes to see questions you got wrong</p>
        </Card>
      )}
    </div>
  );
}