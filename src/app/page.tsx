
"use client";

import React, { useState, useEffect } from 'react';
import { useQuiz } from '@/components/quiz/QuizProvider';
import { Play, Trophy, Clock, GraduationCap, Code2, UserCircle, ShieldCheck, ChevronRight, X, Terminal, Target, Timer, AlertCircle, Trash2, CheckCircle2, XCircle, Activity, BookOpen, Cpu, Lightbulb, Zap, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore } from '@/firebase';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, or } from 'firebase/firestore';

export default function Home() {
  const { history, ranking, isLoadingHistory, identifyUser, startQuiz, identifiedName, deleteResult } = useQuiz();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [mounted, setMounted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [fullName, setFullName] = useState("");

  const cleanDisplayName = (name?: string | null) => {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ');
  };

  const normalizedDisplayName = cleanDisplayName(identifiedName || user?.displayName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSubject, setPendingSubject] = useState<'general' | 'is' | 'prog' | null>(null);

  // Perfil de Compañero
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartAttempt = (subject: 'general' | 'is' | 'prog' = 'general') => {
    if (subject === 'prog') {
      toast({ title: "Módulo en Desarrollo", description: "El simulador de Programación estará disponible próximamente." });
      return;
    }

    setPendingSubject(subject);
    if (!identifiedName && !user?.displayName) {
      setAuthOpen(true);
      return;
    }
    
    if (subject === 'is') {
      setModeOpen(true);
    } else {
      startQuiz(identifiedName || user?.displayName || "", subject);
    }
  };

  const handleIdentity = async () => {
    if (!fullName.trim()) return;
    setIsProcessing(true);
    try {
      const name = fullName.trim();
      if (pendingSubject === 'is') {
        // Sólo identificamos/registramos al usuario — NO iniciamos el quiz todavía
        await identifyUser(name);
        setAuthOpen(false);
        setModeOpen(true); // Ahora sí se elige el modo
      } else if (pendingSubject === 'general') {
        await startQuiz(name, 'general');
        setAuthOpen(false);
        setPendingSubject(null);
      } else {
        // Sin sujeto pendiente: identificar al usuario para ver su historial
        await identifyUser(name);
        setAuthOpen(false);
        setPendingSubject(null);
      }
    } catch (err: any) {
      console.error("Error capturado durante handleIdentity:", err);
      toast({ variant: "destructive", title: "Error de Acceso", description: "No pudimos conectar con tu perfil académico." });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectMode = (mode: 'teorico' | 'practico') => {
    setModeOpen(false);
    // identifiedName fue seteado por identifyUser; fullName como fallback de seguridad
    const resolvedName = identifiedName || user?.displayName || fullName.trim();
    startQuiz(resolvedName, 'is', mode);
  };

  const viewStudentProfile = async (student: any) => {
    if (!firestore || !student) return;
    setSelectedStudent(student);
    setStudentHistory([]);
    
    setIsLoadingProfile(true);
    try {
      const studentName = student?.displayName?.trim() || '';
      const studentNameLower = studentName.toLowerCase();
      const q = query(
        collection(firestore, 'resultados'),
        or(
          where('displayNameLower', '==', studentNameLower),
          where('displayName', '==', student.displayName)
        )
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentHistory(results.sort((a: any, b: any) => (b.lastUpdate?.toMillis?.() || 0) - (a.lastUpdate?.toMillis?.() || 0)));
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === undefined || seconds === null || seconds < 0) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteResult(id);
      toast({ title: "Registro eliminado", description: "Tu historial ha sido actualizado correctamente." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el registro." });
    }
  };

  const displayName = normalizedDisplayName;
  const generalRanking = ranking.filter(entry => entry.subjectKey === 'general');

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[10px] md:text-base text-slate-900 tracking-tight leading-none uppercase">CARRERA DE TIC</h1>
              <span className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5 md:mt-1">UTELVT • 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {displayName && (
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Perfil Activo</p>
                <p className="text-xs font-black text-slate-900">{displayName}</p>
              </div>
            )}
            {displayName ? (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 flex items-center justify-center text-primary bg-slate-50 overflow-hidden shrink-0">
                <span className="text-xs font-black">{getInitials(displayName)}</span>
              </div>
            ) : (
              <button 
                onClick={() => setAuthOpen(true)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 bg-slate-50 overflow-hidden shrink-0 hover:border-primary transition-colors"
              >
                <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 w-full space-y-8 md:space-y-20">
        <section className="animate-fade-in">
          <div className="bg-[#0f172a] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-primary/10 blur-[80px] md:blur-[120px] rounded-full -mr-20 -mt-20 md:-mr-40 md:-mt-40" />
            <div className="relative z-10 space-y-6 md:space-y-8 max-w-4xl text-center lg:text-left">
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-center lg:justify-start">
                  <Badge className="bg-white/10 text-white border-none font-bold text-[8px] md:text-[10px] uppercase tracking-widest px-3 md:px-4 py-1.5">CONVOCATORIA 2026</Badge>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                  Simulador de Examen <br />
                  <span className="text-primary italic">Complexivo</span> para TIC
                </h2>
                <p className="text-slate-400 text-sm md:text-xl font-medium max-w-2xl mx-auto lg:mx-0 text-balance">
                  Espacio diseñado para practicar, reforzar conocimientos y prepararse de forma efectiva antes del examen.
                </p>
              </div>
              <div className="flex flex-col gap-4">
              <div className="flex justify-center lg:justify-start">
                <Button onClick={() => handleStartAttempt('general')} size="lg" className="h-12 md:h-16 px-8 md:px-10 text-sm md:text-lg font-bold rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all gap-3 w-full sm:w-auto">
                  <Play className="w-5 h-5 fill-current" /> INICIAR PRÁCTICA GENERAL
                </Button>
              </div>
              {!displayName && (
                <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4 md:p-6 text-sm md:text-base text-slate-700">
                  <p className="font-black uppercase tracking-[0.2em] text-blue-700 text-[10px] md:text-xs mb-2">Primeros pasos</p>
                  <p>Identifícate con tu nombre completo o solo tu nombre. El apellido es opcional y las mayúsculas/minúsculas no importan.</p>
                  <p className="mt-3 font-semibold">Si no estás registrado, el sistema te registrará automáticamente al acceder.</p>
                </div>
              )}
            </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 md:space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
            <div className="space-y-2">
              <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Simuladores por Asignatura</h3>
              <p className="text-slate-500 text-xs md:text-base font-medium">Refuerzo intensivo enfocado en áreas clave de la carrera.</p>
            </div>
            <div className="h-1 w-20 bg-primary/20 rounded-full hidden md:block mb-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <Card className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl academic-shadow transition-all hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-4 md:p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                <BookOpen className="w-16 h-16 md:w-24 md:h-24 rotate-12" />
              </div>
              <div className="p-6 md:p-12 space-y-4 md:space-y-6 relative z-10">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <BookOpen className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Ingeniería de Software</h4>
                  <p className="text-slate-500 text-xs md:text-base leading-relaxed">Ciclo de vida, metodologías ágiles, UML, calidad y gestión de proyectos de software.</p>
                </div>
                <Button onClick={() => handleStartAttempt('is')} variant="outline" className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-primary border-primary/20 hover:bg-primary hover:text-white transition-all gap-3 text-xs md:text-sm">
                  SELECCIONAR MATERIA <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>
            </Card>

            <Card className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl academic-shadow transition-all opacity-70 grayscale-[0.5]">
              <div className="absolute top-0 right-0 p-4 md:p-8 text-slate-300 transition-colors">
                <Lock className="w-16 h-16 md:w-24 md:h-24 -rotate-12" />
              </div>
              <div className="p-6 md:p-12 space-y-4 md:space-y-6 relative z-10">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                  <Cpu className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl md:text-2xl font-black text-slate-400 tracking-tight uppercase">Programación</h4>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-500 font-bold uppercase text-[7px] md:text-[8px]">Próximamente</Badge>
                  </div>
                  <p className="text-slate-400 text-xs md:text-base leading-relaxed">Algoritmos, estructuras de datos, POO, concurrencia y desarrollo avanzado.</p>
                </div>
                <Button disabled variant="outline" className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-slate-300 border-slate-200 cursor-not-allowed gap-3 text-xs md:text-sm">
                  MÓDULO DESACTIVADO <Lock className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start pt-6 md:pt-10 border-t border-slate-100">
          <div className="lg:col-span-8 space-y-6 md:space-y-8 animate-fade-in">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm md:text-lg font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                <Activity className="w-5 h-5 text-primary" /> Historial de Práctica
              </h3>
            </div>

            {isLoadingHistory ? (
              <div className="h-48 md:h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</span>
              </div>
            ) : !displayName ? (
              <div className="p-10 md:p-20 text-center bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <UserCircle className="w-12 h-12 md:w-14 md:h-14 text-slate-200 mx-auto" />
                <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-widest">Identifícate para gestionar tu historial académico</p>
                <Button variant="outline" onClick={() => setAuthOpen(true)} className="rounded-xl font-bold h-11">INGRESAR NOMBRE</Button>
              </div>
            ) : history.length === 0 ? (
              <div className="p-10 md:p-24 text-center bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <ShieldCheck className="w-12 h-12 md:w-14 md:h-14 text-slate-200 mx-auto" />
                <p className="text-slate-400 text-xs md:text-sm font-medium italic">No se han detectado intentos registrados aún.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6">
                {history.map((item) => (
                  <Card key={item.id} className="group p-4 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] border-none bg-white flex flex-col sm:flex-row items-center gap-4 md:gap-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden academic-shadow">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-50/50 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shrink-0 text-primary font-black text-lg md:text-2xl shadow-sm border border-blue-100">
                      {getInitials(displayName)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.lastUpdate?.toDate ? new Date(item.lastUpdate.toDate()).toLocaleString('es-ES') : 'Sesión Reciente'}
                      </p>
                      <h4 className="font-black text-slate-800 text-base md:text-xl tracking-tight truncate leading-tight uppercase">
                        {item.subjectKey === 'is' ? 'Ing. de Software' : item.subjectKey === 'prog' ? 'Programación' : 'Práctica General'}
                      </h4>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 md:gap-x-4 gap-y-1 pt-1">
                        <span className="text-[8px] md:text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-primary/60" /> {formatDuration(item.duration)}
                        </span>
                        <span className="text-[8px] md:text-[11px] font-bold text-green-500 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {item.correctAnswersCount || 0} OK
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6 shrink-0 w-full sm:w-auto justify-center sm:justify-end pr-0 sm:pr-2 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                      <div className="text-center sm:text-right min-w-[60px] md:min-w-[70px]">
                        <p className="text-2xl md:text-4xl font-black text-slate-900 leading-none tabular-nums tracking-tighter">{item.percentage}%</p>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">ÉXITO</p>
                      </div>
                      
                      <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm group-hover:scale-110"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6 animate-fade-in">
            <Card className="bg-[#0f172a] text-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-primary/10 blur-[60px] rounded-full" />
              <div className="relative space-y-6 md:space-y-8">
                <div className="space-y-2">
                  <h3 className="text-sm md:text-base font-black flex items-center gap-3 uppercase tracking-tight">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Top Estudiantes
                  </h3>
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Basado en Récord General</p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {generalRanking.length > 0 ? generalRanking.map((entry, i) => (
                    <button 
                      key={entry.id || i} 
                      onClick={() => viewStudentProfile(entry)}
                      className="w-full flex items-center justify-between p-4 md:p-5 bg-white/5 rounded-xl md:rounded-[1.2rem] border border-white/5 hover:bg-white/10 transition-all group shadow-inner"
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <span className={cn(
                          "text-[9px] md:text-[12px] font-black w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0",
                          i === 0 ? "bg-yellow-500 text-slate-900" : 
                          i === 1 ? "bg-slate-300 text-slate-900" :
                          i === 2 ? "bg-amber-600 text-white" : "bg-white/10 text-white/50"
                        )}>{i + 1}</span>
                        <div className="text-left min-w-0">
                          <span className="font-bold text-xs md:text-sm truncate block group-hover:text-primary transition-colors">{entry.displayName}</span>
                          <span className="text-[7px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-primary text-xs md:text-base block leading-none">{entry.percentage}%</span>
                      </div>
                    </button>
                  )) : (
                    <div className="py-10 text-center">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] italic">Esperando primeros resultados...</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <footer className="bg-white py-8 md:py-12 border-t border-slate-100 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
          <div className="text-center md:text-left">
            <h4 className="text-slate-900 font-black text-base md:text-lg uppercase">Simulador TIC 2026</h4>
            <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">Leonardo David Alvarado Cornejo</p>
          </div>
          <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-[2rem] border border-slate-100 flex items-center gap-4 md:gap-5 w-full md:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Code2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <p className="text-[7px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em]">Carrera de TIC</p>
              <p className="font-black text-xs md:text-base text-slate-900 tracking-tight leading-tight">Facultad de Ingeniería</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Perfil de Estudiante */}
      <Dialog open={!!selectedStudent} onOpenChange={() => { setSelectedStudent(null); setStudentHistory([]); }}>
        <DialogContent hideClose className="rounded-[2rem] md:rounded-[3.5rem] p-0 border-none shadow-2xl max-w-[95vw] md:max-w-xl bg-[#0f172a] overflow-hidden text-white flex flex-col animate-in fade-in zoom-in duration-300">
          <DialogHeader className="sr-only">
            <DialogTitle>Perfil de Estudiante</DialogTitle>
            <DialogDescription>Detalle de rendimiento académico individual.</DialogDescription>
          </DialogHeader>
          
          <div className="p-6 md:p-14 space-y-8 md:space-y-10 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogClose className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 z-50 shadow-xl group">
              <X className="w-5 h-5 md:w-7 md:h-7 text-white transition-transform group-hover:rotate-90" />
            </DialogClose>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-8 pt-10 sm:pt-0">
              <div className="w-20 h-20 bg-blue-600/20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-3xl font-black text-blue-400 shrink-0 border border-blue-500/30">
                {getInitials(selectedStudent?.displayName || "")}
              </div>
              <div className="space-y-1 min-w-0">
                <Badge className="bg-blue-900/40 text-blue-400 border-none text-[8px] md:text-[9px] font-black px-4 py-1 mb-2 uppercase tracking-widest mx-auto sm:mx-0 w-fit">ESTUDIANTE TIC</Badge>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-none truncate uppercase">{selectedStudent?.displayName}</h3>
                <p className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] mt-1">MAYOR RÉCORD: {selectedStudent?.percentage || 0}% ÉXITO</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="p-6 md:p-8 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 text-center space-y-1 md:space-y-2">
                <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">RENDIMIENTO</p>
                <p className="text-2xl md:text-4xl font-black tabular-nums">{selectedStudent?.percentage || 0}%</p>
              </div>
              
              <div className="p-6 md:p-8 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 text-center space-y-1 md:space-y-2">
                <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">ESTATUS</p>
                <p className={cn(
                  "text-lg md:text-2xl font-black", 
                  (selectedStudent?.percentage || 0) >= 70 ? 'text-green-400' : 'text-red-400'
                )}>
                  {(selectedStudent?.percentage || 0) >= 70 ? 'APROBADO' : 'PENDIENTE'}
                </p>
              </div>
            </div>

            <div className="space-y-5 md:space-y-6 pt-4">
              <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3 px-2">
                <Clock className="w-3.5 h-3.5" /> HISTORIAL DE PRÁCTICA
              </h4>
              
              <div className="space-y-3 md:space-y-4">
                {isLoadingProfile ? (
                  <div className="py-10 text-center animate-pulse text-[9px] font-bold text-slate-500 uppercase">Cargando registros...</div>
                ) : studentHistory.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 italic">No hay intentos registrados aún.</div>
                ) : studentHistory.map((item) => (
                  <div key={item.id} className="p-5 md:p-6 bg-white/5 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 flex flex-col gap-2 relative group hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          {item.lastUpdate?.toDate ? new Date(item.lastUpdate.toDate()).toLocaleString('es-ES') : 'Reciente'}
                        </p>
                        <h4 className="text-base md:text-xl font-black tracking-tight text-white uppercase">
                          {item.subjectKey === 'is' ? 'Ing. Software' : item.subjectKey === 'prog' ? 'Programación' : 'General'}
                        </h4>
                      </div>
                      
                      {selectedStudent?.displayName === (identifiedName || user?.displayName) && (
                        <button 
                          onClick={(e) => handleDelete(e, item.id)}
                          className="w-9 h-9 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Timer className="w-3 h-3 text-blue-400" /> {formatDuration(item.duration)}
                      </span>
                      <span className="text-[9px] font-black text-green-500/80 uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Identificación Académica */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent hideClose className="rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 border-none shadow-2xl max-w-[90vw] md:max-w-sm bg-white overflow-hidden">
          <DialogClose className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-90 z-50">
            <X className="w-5 h-5" />
          </DialogClose>
          
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black text-center tracking-tight uppercase">Identificación</DialogTitle>
            <DialogDescription className="text-center text-[9px] md:text-[11px] font-bold text-slate-400 uppercase mt-2">
              Ingresa tu nombre para gestionar tu historial. Si eres nuevo, te registramos automáticamente. El apellido es opcional; mayúsculas/minúsculas no generan duplicados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 md:space-y-8 mt-6">
            <div className="space-y-2">
              <Label className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Completo</Label>
              <Input placeholder="Ej: Leonardo Alvarado" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 md:h-14 rounded-xl md:rounded-2xl text-sm md:text-base font-bold bg-slate-50 border-none shadow-inner" />
            </div>
            <Button onClick={handleIdentity} disabled={isProcessing || !fullName.trim()} className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black bg-primary shadow-xl shadow-primary/20 transition-all text-sm md:text-base group">
              {isProcessing ? "SINCRONIZANDO..." : "ACCEDER"}
              {!isProcessing && <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuración de Simulación (IS) */}
      <Dialog open={modeOpen} onOpenChange={setModeOpen}>
        <DialogContent hideClose className="rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 border-none shadow-2xl max-w-[90vw] md:max-w-xl bg-white overflow-hidden">
          <DialogClose className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90 z-50 border border-slate-100">
            <X className="w-5 h-5 md:w-7 md:h-7" />
          </DialogClose>

          <DialogHeader className="space-y-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mx-auto">
              <BookOpen className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <DialogTitle className="text-xl md:text-4xl font-black text-center tracking-tighter uppercase text-slate-900">Configurar</DialogTitle>
            <DialogDescription className="text-center text-xs md:text-base font-medium text-slate-500 max-w-sm mx-auto">
              Selecciona el enfoque de tu práctica académica.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-10">
            <button 
              onClick={() => selectMode('teorico')}
              className="group p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left space-y-4 relative overflow-hidden"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <Lightbulb className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg md:text-xl text-slate-900 uppercase tracking-tight">Teórico</h4>
                <p className="text-[10px] md:text-xs font-medium text-slate-500 leading-relaxed">65 reactivos de fundamentos y metodologías.</p>
              </div>
            </button>

            <button 
              onClick={() => selectMode('practico')}
              className="group p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left space-y-4 relative overflow-hidden"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <Zap className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg md:text-xl text-slate-900 uppercase tracking-tight">Práctico</h4>
                <p className="text-[10px] md:text-xs font-medium text-slate-500 leading-relaxed">35 reactivos técnicos y resolución de casos.</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
