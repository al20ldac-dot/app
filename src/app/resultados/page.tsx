"use client";

import { useQuiz } from '@/components/quiz/QuizProvider';
import { ResultDashboard } from '@/components/results/ResultDashboard';
import { Button } from '@/components/ui/button';

export default function ResultadosPage() {
  const { state, restartQuiz } = useQuiz();

  if (state.status !== 'completed' && state.questions.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <h2 className="text-2xl font-bold">No has completado ningún examen</h2>
          <Button onClick={restartQuiz}>Ir al inicio</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-10">
      <div className="max-w-5xl mx-auto px-6">
        <ResultDashboard />
      </div>
    </main>
  );
}
