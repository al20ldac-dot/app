
"use client";

import { useQuiz } from '@/components/quiz/QuizProvider';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, LayoutGrid, Clock, LogOut, Activity, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function SimuladorPage() {
  const { state, finishQuizEarly, restartQuiz, completeQuiz } = useQuiz();
  const [timeLeft, setTimeLeft] = useState(7200); // 2 horas estrictas (7200 segundos)
  const [isExiting, setIsProcessingExit] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAutoFinish = useCallback(async () => {
    if (state.status === 'in_progress') {
      await completeQuiz();
    }
  }, [state.status, completeQuiz]);

  useEffect(() => {
    if (timeLeft === 0 && state.status === 'in_progress') {
      handleAutoFinish();
    }
  }, [timeLeft, state.status, handleAutoFinish]);

  const handleExit = async () => {
    setIsProcessingExit(true);
    try {
      await finishQuizEarly();
    } finally {
      setIsProcessingExit(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (state.questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Activity className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">Sesión no Iniciada</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Por favor regresa al inicio para identificarte.</p>
        <Button onClick={restartQuiz} className="h-11 px-8 rounded-lg font-bold bg-primary uppercase">Ir al inicio</Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-primary text-[10px] md:text-[12px] uppercase tracking-widest">
              <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
              TIC 2026
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold text-[11px] md:text-[13px] tracking-tight">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-black text-[10px] md:text-[12px] tracking-widest h-9 px-3 rounded-lg group">
                <LogOut className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-0.5" /> <span className="hidden sm:inline">FINALIZAR</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 border-none shadow-2xl bg-white max-w-[90vw] md:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-2xl md:text-3xl text-slate-900 uppercase tracking-tighter text-center">¿FINALIZAR SESIÓN?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 font-medium text-center text-sm md:text-base mt-4">
                  Se guardará tu progreso actual hasta la pregunta #{state.currentQuestionIndex + 1}. Tu resultado se registrará en tu historial académico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-10">
                <AlertDialogCancel disabled={isExiting} className="flex-1 h-12 md:h-14 rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-sm transition-all uppercase tracking-widest">CANCELAR</AlertDialogCancel>
                <AlertDialogAction onClick={handleExit} disabled={isExiting} className="flex-1 h-12 md:h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm shadow-xl shadow-red-200 transition-all uppercase tracking-widest">
                  {isExiting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "GUARDAR Y SALIR"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-9 order-first">
          <QuestionCard />
        </div>

        <aside className="lg:col-span-3 order-last">
          <Card className="border-none shadow-sm rounded-[1.5rem] md:rounded-[2rem] bg-white overflow-hidden academic-shadow">
            <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/50">
              <h4 className="font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-primary" /> Navegación
              </h4>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-6 xs:grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-1.5">
                {state.questions.map((_, idx) => {
                  const response = state.responses.find(r => r.questionId === state.questions[idx].id);
                  const isCurrent = state.currentQuestionIndex === idx;
                  
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "aspect-square rounded-lg border flex items-center justify-center font-bold text-[10px] md:text-[11px] transition-all",
                        isCurrent ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm" : 
                        response ? (response.isCorrect ? "bg-green-500 border-green-500 text-white" : "bg-red-500 border-red-500 text-white") : "border-slate-100 bg-white text-slate-300"
                      )}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-2.5">
                  <span className="text-slate-400">Progreso Real</span>
                  <span className="text-primary">{Math.round(((state.responses.length) / state.questions.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-700 ease-out" 
                    style={{ width: `${(state.responses.length / state.questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
