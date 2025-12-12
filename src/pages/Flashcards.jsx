import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Loader2, Layers, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: flashcards = [], isLoading } = useQuery({
    queryKey: ['flashcards'],
    queryFn: () => base44.entities.Flashcard.list()
  });

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Flashcards</h1>
            <p className="text-slate-500 text-xs">{flashcards.length} cards available</p>
          </div>
        </div>
      </div>

      {flashcards.length > 0 ? (
        <>
          {/* Progress */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Card {currentIndex + 1} of {flashcards.length}</span>
            <span className="text-slate-500">Tap to flip</span>
          </div>

          {/* Flashcard */}
          <div className="relative h-80" onClick={handleFlip}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentIndex}-${isFlipped}`}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Card className={`h-full glass-card border-0 p-6 flex flex-col items-center justify-center cursor-pointer ${
                  isFlipped 
                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' 
                    : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
                }`}>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full mb-4 ${
                    isFlipped ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {isFlipped ? 'Answer' : 'Question'}
                  </span>
                  <p className="text-white text-xl text-center font-medium leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                  <RotateCcw className="w-5 h-5 text-slate-500 mt-6" />
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              variant="outline"
              className="flex-1 border-slate-700 text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </>
      ) : (
        <Card className="glass-card border-0 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Flashcards Yet</h2>
          <p className="text-slate-400">Flashcards will be added soon to help you study!</p>
        </Card>
      )}
    </div>
  );
}