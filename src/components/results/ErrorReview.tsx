
"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuiz } from '../quiz/QuizProvider';
import { AlertCircle, CheckCircle, Info, BookOpen, Terminal } from 'lucide-react';

export function ErrorReview() {
  const { state } = useQuiz();
  const incorrectResponses = state.responses.filter(r => !r.isCorrect);
  
  if (incorrectResponses.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5 mb-10">
        <div className="p-4 bg-red-100 rounded-[2rem] shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Análisis de Errores</h2>
          <p className="text-slate-500 font-bold text-sm tracking-wide">Revisión profunda de los ítems con intentos agotados.</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-6">
        {incorrectResponses.map((response, idx) => {
          const question = state.questions.find(q => q.id === response.questionId);
          if (!question) return null;

          return (
            <AccordionItem key={question.id} value={question.id} className="border-none rounded-[2rem] px-8 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden academic-shadow">
              <AccordionTrigger className="hover:no-underline py-10 group">
                <div className="flex items-start text-left gap-6 pr-8">
                  <span className="shrink-0 w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </span>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em]">{question.categoria}</span>
                    <h3 className="font-black text-lg md:text-xl leading-snug pr-6 text-slate-800 tracking-tight">{question.pregunta}</h3>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-12 pt-4">
                <div className="grid gap-10 pl-4 md:pl-16">
                  <div className="grid gap-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Distribución de Opciones Técnicas:
                    </p>
                    <div className="grid gap-3">
                      {Object.entries(question.opciones).filter(([_, val]) => val && val !== "N/A").map(([key, val]) => (
                        <div key={key} className={`p-5 rounded-2xl border-2 text-sm flex justify-between items-center transition-all ${key === question.correcta ? 'bg-green-50 border-green-200 text-green-800 font-bold shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          <span className="leading-relaxed"><span className="mr-3 font-black opacity-50">{key}</span> {val}</span>
                          {key === question.correcta && <CheckCircle className="w-6 h-6 text-green-600" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border-2 border-blue-100 rounded-[2.5rem] p-8 space-y-8">
                    <div className="flex gap-5">
                      <div className="p-3 bg-blue-100 rounded-2xl h-fit shadow-sm">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-3">
                        <p className="font-black text-blue-900 uppercase text-[10px] tracking-[0.2em]">Justificación Técnica Completa</p>
                        <p className="text-blue-800 leading-relaxed text-sm md:text-base font-medium whitespace-normal break-words">{question.justificacion}</p>
                      </div>
                    </div>
                    
                    <div className="pt-8 border-t border-blue-200/50">
                      <div className="flex gap-5">
                        <div className="p-3 bg-indigo-100 rounded-2xl h-fit shadow-sm">
                          <Terminal className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="space-y-3">
                          <p className="font-black text-indigo-900 uppercase text-[10px] tracking-[0.2em]">Análisis Pedagógico de Distractores</p>
                          <p className="text-indigo-800 leading-relaxed text-sm md:text-base font-medium italic whitespace-normal break-words">{question.explicacionError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
