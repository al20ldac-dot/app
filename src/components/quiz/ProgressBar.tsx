"use client";

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { useQuiz } from './QuizProvider';

export function ProgressBar() {
  const { state } = useQuiz();
  const total = state.questions.length;
  const current = state.currentQuestionIndex + 1;
  const progressValue = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-semibold">
        <span className="text-primary">Progreso del Examen</span>
        <span className="text-muted-foreground">{current} de {total} preguntas</span>
      </div>
      <Progress value={progressValue} className="h-3 bg-primary/10" />
    </div>
  );
}