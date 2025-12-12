import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Clock, ChevronLeft, ChevronRight, Flag, 
  CheckCircle2, XCircle, Loader2, AlertTriangle,
  Bookmark, BookmarkCheck, FileText
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MockExam() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  
  const questionCount = parseInt(urlParams.get('count')) || 20;
  const selectedCategories = urlParams.get('categories')?.split(',').filter(Boolean) || [];
  const selectedDifficulties = urlParams.get('difficulties')?.split(',') || ['easy', 'medium', 'hard'];
  const timeLimitMinutes = parseInt(urlParams.get('timeLimit')) || 30;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [examQuestions, setExamQuestions] = useState([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allQuestions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
    staleTime: 5 * 60 * 1000,
  });

  // Initialize exam questions
  useEffect(() => {
    if (allQuestions.length > 0 && examQuestions.length === 0) {
      let filtered = allQuestions.filter(q => 
        selectedDifficulties.includes(q.difficulty)
      );
      
      // Shuffle and pick questions
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      setExamQuestions(shuffled.slice(0, questionCount));
    }
  }, [allQuestions, questionCount, selectedDifficulties]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const createAttemptMutation = useMutation({
    mutationFn: (data) => base44.entities.QuizAttempt.create(data),
    onSuccess: (attempt) => {
      queryClient.invalidateQueries(['attempts']);
      navigate(createPageUrl(`MockExamResults?attemptId=${attempt.id}`));
    }
  });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = examQuestions[currentIndex];
  const currentCase = currentQuestion?.case_id ? cases.find(c => c.id === currentQuestion.case_id) : null;
  const progress = examQuestions.length > 0 ? ((currentIndex + 1) / examQuestions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (answerIndex) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: answerIndex
    });
  };

  const goToQuestion = (index) => {
    setCurrentIndex(index);
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    const answersArray = examQuestions.map(q => ({
      question_id: q.id,
      selected_answer: answers[q.id] ?? -1,
      is_correct: answers[q.id] === q.correct_answer
    }));

    const score = answersArray.filter(a => a.is_correct).length;
    const timeSpent = (timeLimitMinutes * 60) - timeLeft;

    await createAttemptMutation.mutateAsync({
      mode: 'mock_test',
      answers: answersArray,
      score: score,
      total_questions: examQuestions.length,
      percentage: Math.round((score / examQuestions.length) * 100),
      time_spent_seconds: timeSpent,
      is_completed: true,
      completed_at: new Date().toISOString()
    });
  }, [answers, examQuestions, timeLeft, timeLimitMinutes]);

  if (isLoading || casesLoading || examQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Preparing exam...</p>
        </div>
      </div>
    );
  }

  const isLowTime = timeLeft < 60;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              isLowTime ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-white'
            }`}>
              <Clock className={`w-5 h-5 ${isLowTime ? 'animate-pulse' : ''}`} />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>

            {/* Progress */}
            <div className="flex-1 mx-4">
              <div className="text-center text-sm text-slate-400 mb-1">
                {answeredCount} / {examQuestions.length} answered
              </div>
              <Progress value={(answeredCount / examQuestions.length) * 100} className="h-2" />
            </div>

            {/* Submit Button */}
            <Button
              onClick={() => setShowSubmitDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              End Exam
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Question Navigator */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <Card className="glass-card border-0 p-4 sticky top-24">
                <h3 className="text-white font-semibold mb-3 text-sm">Questions</h3>
                <div className="grid grid-cols-5 gap-2">
                  {examQuestions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isFlagged = flagged.has(q.id);
                    const isCurrent = idx === currentIndex;
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => goToQuestion(idx)}
                        className={`
                          w-full aspect-square rounded-lg text-sm font-medium relative
                          transition-all
                          ${isCurrent ? 'ring-2 ring-indigo-500' : ''}
                          ${isAnswered ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}
                          ${isFlagged ? 'ring-2 ring-amber-500' : ''}
                          hover:opacity-80
                        `}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <Flag className="w-3 h-3 absolute -top-1 -right-1 text-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-600" />
                    <span className="text-slate-400">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-700" />
                    <span className="text-slate-400">Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-700 ring-2 ring-amber-500" />
                    <span className="text-slate-400">Flagged for review</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Question Area */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    {/* Case Scenario */}
                    {currentCase && (
                      <Card className="glass-card border-0 p-5 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20 glow-effect">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-cyan-400 font-bold text-sm">
                              {currentCase.case_type === 'management' ? 'Management Case' : 'Clinical Case'}
                            </h3>
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {currentCase.case_text}
                          </p>
                          {currentCase.image_url && (
                            <div className="mt-4">
                              <img 
                                src={currentCase.image_url} 
                                alt="Case related" 
                                className="w-full rounded-lg border border-slate-700"
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    <Card className="glass-card border-0 p-6">
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-slate-400 text-sm">
                          Question {currentIndex + 1} of {examQuestions.length}
                        </span>
                        <button
                          onClick={toggleFlag}
                          className={`p-2 rounded-lg transition-colors ${
                            flagged.has(currentQuestion.id)
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {flagged.has(currentQuestion.id) ? (
                            <BookmarkCheck className="w-5 h-5" />
                          ) : (
                            <Bookmark className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Question Text */}
                      <h2 className="text-xl text-white font-medium mb-6 leading-relaxed">
                        {currentQuestion.question_text}
                      </h2>

                    {/* Options */}
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option, idx) => {
                        const isSelected = answers[currentQuestion.id] === idx;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className={`
                              w-full p-4 rounded-xl text-right flex items-center gap-4
                              transition-all
                              ${isSelected 
                                ? 'bg-indigo-600/30 border-2 border-indigo-500' 
                                : 'bg-slate-800/50 border-2 border-transparent hover:bg-slate-700/50'
                              }
                            `}
                          >
                            <span className={`
                              w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                              ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}
                            `}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-white flex-1">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    </Card>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="border-slate-700"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Submit Exam
                </Button>
                <Button
                  onClick={() => setCurrentIndex(Math.min(examQuestions.length - 1, currentIndex + 1))}
                  disabled={currentIndex === examQuestions.length - 1}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">End Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {answeredCount < examQuestions.length ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>You have {examQuestions.length - answeredCount} unanswered questions</span>
                </div>
              ) : (
                <span>Are you sure you want to end the exam and submit your answers?</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Continue Exam
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Exam
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}