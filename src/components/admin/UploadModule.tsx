
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, FileJson, Loader2, Database, AlertCircle } from "lucide-react";
import { uploadDocxQuestions } from "@/ai/flows/admin-upload-docx-questions";
import { useQuiz } from '../quiz/QuizProvider';
import { validateQuestion, generateId } from '@/lib/quiz-utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import officialQuestions from '@/data/official-questions.json';

export function UploadModule() {
  const [isUploading, setIsUploading] = useState(false);
  const { startQuiz } = useQuiz();
  const { toast } = useToast();

  const handleLoadOfficial = () => {
    const validQuestions = (officialQuestions as any[])
      .filter(q => validateQuestion(q))
      .map(q => ({ ...q, id: q.id || generateId() }));

    if (validQuestions.length > 0) {
      toast({ title: "Motor Inicializado", description: "Banco oficial de 100 preguntas cargado correctamente." });
      startQuiz(validQuestions);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const questionsRaw = Array.isArray(json) ? json : [json];
        const validQuestions = questionsRaw
          .filter(q => validateQuestion(q))
          .map(q => ({ ...q, id: generateId() }));

        if (validQuestions.length > 0) {
          toast({ title: "Ingesta Exitosa", description: `${validQuestions.length} preguntas validadas y cargadas.` });
          startQuiz(validQuestions);
        } else {
          toast({ variant: "destructive", title: "Error de Validación", description: "El archivo no contiene preguntas estructuradas válidas." });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Fallo de Estructura", description: "El archivo JSON está mal formado." });
      }
    };
    reader.readAsText(file);
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const result = await uploadDocxQuestions({ docxBase64: base64 });
      if (result.questions.length > 0) {
        const questionsWithIds = result.questions.map(q => ({ ...q, id: generateId() }));
        toast({ title: "Procesamiento IA Completado", description: `${questionsWithIds.length} preguntas extraídas de Word.` });
        startQuiz(questionsWithIds);
      } else {
        toast({ variant: "destructive", title: "Fallo de Ingesta", description: "La IA no pudo estructurar preguntas desde este documento." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error Crítico", description: "Fallo en el servicio de procesamiento de documentos." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-[32px] flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Database className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h4 className="text-xl font-black text-slate-800 tracking-tight">Banco Institucional</h4>
          <p className="text-slate-500 font-medium max-w-sm">Utilice las preguntas oficiales validadas para la carrera de TIC.</p>
        </div>
        <Button onClick={handleLoadOfficial} size="lg" className="h-14 px-12 text-lg font-black rounded-2xl shadow-xl hover:scale-105 transition-all">
          CARGAR BANCO OFICIAL
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative group">
          <Input type="file" accept=".json" onChange={handleJsonUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="bg-white border-2 border-dashed border-slate-200 group-hover:border-primary group-hover:bg-primary/5 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all">
            <FileJson className="w-6 h-6 text-slate-400 group-hover:text-primary" />
            <span className="font-bold text-slate-600 group-hover:text-primary">Subir JSON</span>
          </div>
        </div>
        <div className="relative group">
          <Input type="file" accept=".docx" disabled={isUploading} onChange={handleDocxUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="bg-white border-2 border-dashed border-slate-200 group-hover:border-primary group-hover:bg-primary/5 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all">
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <FileUp className="w-6 h-6 text-slate-400 group-hover:text-primary" />}
            <span className="font-bold text-slate-600 group-hover:text-primary">{isUploading ? "Analizando..." : "Subir Word"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
