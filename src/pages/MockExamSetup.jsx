import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  GraduationCap, Clock, Target, Shuffle, 
  ChevronRight, Loader2, CheckCircle2, Circle,
  Zap, Brain, Trophy
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion } from 'framer-motion';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function MockExamSetup() {
  const navigate = useNavigate();
  
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState(['easy', 'medium', 'hard']);
  const [timeLimit, setTimeLimit] = useState(30); // minutes

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('order')
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list()
  });

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const toggleDifficulty = (diff) => {
    if (selectedDifficulties.includes(diff)) {
      setSelectedDifficulties(selectedDifficulties.filter(d => d !== diff));
    } else {
      setSelectedDifficulties([...selectedDifficulties, diff]);
    }
  };

  const selectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  // Filter available questions based on criteria
  const availableQuestions = questions.filter(q => {
    const diffMatch = selectedDifficulties.includes(q.difficulty);
    // If no categories selected, include all
    if (selectedCategories.length === 0) return diffMatch;
    // For now, include all if categories selected (will filter by topic later)
    return diffMatch;
  });

  const maxQuestions = Math.min(availableQuestions.length, 100);

  const startExam = () => {
    const params = new URLSearchParams({
      count: questionCount,
      categories: selectedCategories.join(','),
      difficulties: selectedDifficulties.join(','),
      timeLimit: timeLimit
    });
    navigate(createPageUrl(`MockExam?${params.toString()}`));
  };

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'bg-emerald-500', icon: Zap },
    { value: 'medium', label: 'Medium', color: 'bg-amber-500', icon: Brain },
    { value: 'hard', label: 'Hard', color: 'bg-rose-500', icon: Trophy }
  ];

  if (loadingCats) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-[#0a0a0f] p-4 pb-28">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Mock Exam</h1>
          <p className="text-slate-400">Create your custom exam to prepare for PEBC</p>
        </motion.div>

        {/* Question Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-0 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Target className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Number of Questions</h3>
                <p className="text-slate-500 text-sm">Set the number of exam questions</p>
              </div>
            </div>
            <div className="space-y-4">
              <Slider
                value={[questionCount]}
                onValueChange={(val) => setQuestionCount(val[0])}
                min={5}
                max={maxQuestions || 50}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">5 questions</span>
                <span className="text-2xl font-bold text-white">{questionCount}</span>
                <span className="text-slate-400 text-sm">{maxQuestions || 50} questions</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Time Limit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="glass-card border-0 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Time Limit</h3>
                <p className="text-slate-500 text-sm">Set the exam duration in minutes</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[15, 30, 45, 60, 90, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => setTimeLimit(mins)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    timeLimit === mins
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Difficulty */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-0 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Shuffle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Difficulty Level</h3>
                <p className="text-slate-500 text-sm">Select difficulty levels</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map(diff => {
                const Icon = diff.icon;
                const isSelected = selectedDifficulties.includes(diff.value);
                return (
                  <button
                    key={diff.value}
                    onClick={() => toggleDifficulty(diff.value)}
                    className={`p-4 rounded-xl text-center transition-all border-2 ${
                      isSelected
                        ? `${diff.color} border-transparent text-white`
                        : 'bg-zinc-800/50 border-zinc-700 text-slate-400 hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{diff.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="glass-card border-0 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <GraduationCap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Categories</h3>
                  <p className="text-slate-500 text-sm">Select required categories</p>
                </div>
              </div>
              <button
                onClick={selectAllCategories}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/50'
                        : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                    <div className="flex-1">
                      <span className="text-white text-sm">{cat.title}</span>
                      <span className="text-slate-500 text-xs mr-2">({cat.weight}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={startExam}
            disabled={selectedDifficulties.length === 0 || availableQuestions.length < 5}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/20"
          >
            <span>Start Exam</span>
            <ChevronRight className="w-5 h-5 mr-2" />
          </Button>
          {availableQuestions.length < 5 && (
            <p className="text-rose-400 text-sm text-center mt-2">
              Not enough questions with these criteria
            </p>
          )}
        </motion.div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}