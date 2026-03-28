
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { QuizState, UserResponse, Question } from '@/types/quiz';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, setDoc, getDoc, collection, serverTimestamp, query, limit, onSnapshot, where, deleteDoc, getDocs, orderBy } from 'firebase/firestore';
import { getAuth, updateProfile, signInAnonymously } from 'firebase/auth';
import officialQuestions from '@/data/official-questions.json';
import subjectIS from '@/data/subject-is.json';
import subjectProg from '@/data/subject-prog.json';

interface QuizContextType {
  state: QuizState;
  history: any[];
  ranking: any[];
  startQuiz: (fullName: string, subjectKey?: 'general' | 'is' | 'prog', subType?: 'teorico' | 'practico') => Promise<void>;
  submitAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  nextQuestion: () => void;
  restartQuiz: () => void;
  finishQuizEarly: () => Promise<void>;
  completeQuiz: () => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
  currentAttempts: number;
  maxAttempts: number;
  isLoadingHistory: boolean;
  activeSessionId: string | null;
  identifiedName: string | null;
  lastFeedback: { 
    isCorrect: boolean; 
    showCorrect: boolean; 
    selectedKey?: string;
    isFinished: boolean;
  } | null;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

const shuffleArray = <T,>(items: T[]) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const maxAttempts = 3;
  
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    responses: [],
    status: 'idle',
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<QuizContextType['lastFeedback']>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [identifiedName, setIdentifiedName] = useState<string | null>(null);

  // Listener en tiempo real para el Ranking (Solo General)
  // Optimizamos: traemos los datos y ordenamos en memoria para evitar errores de índice compuesto
  useEffect(() => {
    if (!firestore || !user) return;
    
    const q = query(
      collection(firestore, 'ranking'), 
      where('subjectKey', '==', 'general')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Ordenamiento Académico: 1. Porcentaje Desc, 2. Duración Asc
      const sorted = data.sort((a: any, b: any) => {
        const percA = a.percentage || 0;
        const percB = b.percentage || 0;
        if (percB !== percA) return percB - percA;
        
        const durA = a.duration || 999999;
        const durB = b.duration || 999999;
        return durA - durB;
      }).slice(0, 50);
      
      setRanking(sorted);
    }, (err) => {
      console.warn("Fallo de sincronización ranking:", err.message);
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Listener para Historial Personal
  useEffect(() => {
    const searchName = identifiedName || user?.displayName;
    if (!firestore || !searchName || !user) {
      if (!searchName) setHistoryData([]);
      return;
    }
    
    setIsLoadingHistory(true);
    const q = query(
      collection(firestore, 'resultados'),
      where('displayName', '==', searchName)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a: any, b: any) => {
        const timeA = a.lastUpdate?.toMillis?.() || 0;
        const timeB = b.lastUpdate?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setHistoryData(sorted);
      setIsLoadingHistory(false);
    }, (err) => {
      console.error("Fallo de sincronización historial:", err);
      setIsLoadingHistory(false);
    });
    
    return () => unsubscribe();
  }, [firestore, user, identifiedName]);

  const updateRankingEntry = useCallback(async (name: string, uid: string, perc: number, dur: number, aciertos: number) => {
    if (!firestore || !name) return;

    const rankingRef = doc(firestore, 'ranking', name);
    const rankingSnap = await getDoc(rankingRef);

    let shouldUpdate = false;

    if (!rankingSnap.exists()) {
      shouldUpdate = true;
    } else {
      const existingData = rankingSnap.data();
      const existingPerc = existingData.percentage || 0;
      const existingDur = existingData.duration || 999999;

      if (perc > existingPerc) {
        shouldUpdate = true;
      } else if (perc === existingPerc && dur < existingDur) {
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      await setDoc(rankingRef, {
        userId: uid,
        displayName: name,
        percentage: perc,
        correctAnswersCount: aciertos,
        duration: dur,
        lastUpdate: serverTimestamp(),
        subjectKey: 'general' 
      }, { merge: true });
    }
  }, [firestore]);

  const saveToCloud = useCallback(async (currentState: QuizState, sessionId: string, name: string, uid: string, subjectKey: string) => {
    if (!firestore || !name || !sessionId) return;

    const uniqueResponsesMap = new Map();
    currentState.responses.forEach(r => uniqueResponsesMap.set(r.questionId, r));
    const uniqueResponses = Array.from(uniqueResponsesMap.values());
    
    const correctCount = uniqueResponses.filter(r => r.isCorrect).length;
    const totalQuestions = currentState.questions.length || 100;
    const percentage = Math.min(Math.round((correctCount / totalQuestions) * 100), 100);
    
    const now = Date.now();
    const storedStart = parseInt(localStorage.getItem('tic_quiz_start_time') || now.toString());
    const duration = Math.floor((now - storedStart) / 1000);

    const resultData = {
      id: sessionId,
      userId: uid || 'anonymous',
      displayName: name,
      score: correctCount,
      percentage,
      correctAnswersCount: correctCount,
      totalAnswered: uniqueResponses.length,
      totalQuestions: totalQuestions,
      status: currentState.status,
      subjectKey: subjectKey,
      duration: duration > 0 ? duration : 0,
      lastUpdate: serverTimestamp()
    };

    try {
      await setDoc(doc(firestore, 'resultados', sessionId), resultData, { merge: true });
      
      if (subjectKey === 'general' && currentState.status === 'completed') {
        await updateRankingEntry(name, uid || 'anonymous', percentage, resultData.duration, correctCount);
      }
    } catch (e) {
      console.error("Error al guardar en la nube:", e);
    }
  }, [firestore, updateRankingEntry]);

  const startQuiz = useCallback(async (fullName: string, subjectKey: 'general' | 'is' | 'prog' = 'general', subType?: 'teorico' | 'practico') => {
    const auth = getAuth();
    const cleanName = fullName.trim();
    let currentUser = auth.currentUser;

    if (!currentUser) {
      const userCred = await signInAnonymously(auth);
      currentUser = userCred.user;
    }

    await updateProfile(currentUser, { displayName: cleanName });
    setIdentifiedName(cleanName);
    localStorage.setItem('tic_student_name', cleanName);
    localStorage.setItem('tic_active_subject', subjectKey);
    if (subType) localStorage.setItem('tic_active_subtype', subType);
    
    const now = Date.now();
    localStorage.setItem('tic_quiz_start_time', now.toString());

    if (firestore) {
      await setDoc(doc(firestore, 'users', cleanName), {
        uid: currentUser.uid,
        name: cleanName,
        nameNormalized: normalizeName(cleanName),
        lastActive: serverTimestamp(),
      }, { merge: true });
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setActiveSessionId(sessionId);

    let pool: Question[] = [];
    if (subjectKey === 'general') pool = [...officialQuestions] as Question[];
    if (subjectKey === 'is') pool = [...subjectIS] as Question[];
    if (subjectKey === 'prog') pool = [...subjectProg] as Question[];

    if (subType) {
      pool = pool.filter(q => q.subType === subType);
    }

    pool = pool.sort(() => Math.random() - 0.5);
    
    const newState: QuizState = {
      questions: pool.map((q: any) => ({
        ...q,
        optionOrder: shuffleArray(
          (['A', 'B', 'C', 'D'] as Array<'A' | 'B' | 'C' | 'D'>)
            .filter((key) => q.opciones[key] && q.opciones[key].trim() !== '' && q.opciones[key] !== 'N/A')
        )
      })),
      currentQuestionIndex: 0,
      responses: [],
      status: 'in_progress',
    };

    setState(newState);
    setCurrentAttempts(0);
    setLastFeedback(null);
    
    await saveToCloud(newState, sessionId, cleanName, currentUser.uid, subjectKey);
    router.push('/simulador');
  }, [router, firestore, saveToCloud]);

  const submitAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    const currentName = identifiedName || user?.displayName;
    const subjectKey = localStorage.getItem('tic_active_subject') || 'general';
    if (!activeSessionId || !currentName) return;
    
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion) return;

    if (state.responses.some(r => r.questionId === currentQuestion.id)) return;
    if (lastFeedback && lastFeedback.isFinished) return;

    const isCorrect = answer === currentQuestion.correcta;
    const newAttempts = currentAttempts + 1;
    
    if (isCorrect || newAttempts >= maxAttempts) {
      const feedback = { isCorrect, showCorrect: true, selectedKey: answer, isFinished: true };
      setLastFeedback(feedback);
      
      const updatedResponses: UserResponse[] = [...state.responses, {
        questionId: currentQuestion.id,
        attemptsUsed: newAttempts,
        isCorrect,
        selectedOption: answer,
      }];
      
      const newState = { ...state, responses: updatedResponses };
      setState(newState);
      saveToCloud(newState, activeSessionId, currentName, user?.uid || 'anonymous', subjectKey);
    } else {
      setCurrentAttempts(newAttempts);
      setLastFeedback({ isCorrect: false, showCorrect: false, selectedKey: answer, isFinished: false });
    }
  }, [state, currentAttempts, lastFeedback, saveToCloud, activeSessionId, user, identifiedName]);

  const nextQuestion = useCallback(() => {
    const currentName = identifiedName || user?.displayName;
    const subjectKey = localStorage.getItem('tic_active_subject') || 'general';
    if (!activeSessionId || !currentName) return;
    
    setLastFeedback(null);
    setCurrentAttempts(0);
    
    if (state.currentQuestionIndex + 1 < state.questions.length) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    } else {
      const completedState = { ...state, status: 'completed' as const };
      setState(completedState);
      saveToCloud(completedState, activeSessionId, currentName, user?.uid || 'anonymous', subjectKey);
      localStorage.removeItem('tic_quiz_start_time');
      router.push('/resultados');
    }
  }, [state, router, saveToCloud, activeSessionId, user, identifiedName]);

  const completeQuiz = useCallback(async () => {
    const currentName = identifiedName || user?.displayName;
    const subjectKey = localStorage.getItem('tic_active_subject') || 'general';
    if (activeSessionId && currentName && state.status === 'in_progress') {
      const completedState = { ...state, status: 'completed' as const };
      setState(completedState);
      await saveToCloud(completedState, activeSessionId, currentName, user?.uid || 'anonymous', subjectKey);
      localStorage.removeItem('tic_quiz_start_time');
      router.push('/resultados');
    }
  }, [state, saveToCloud, activeSessionId, router, user, identifiedName]);

  const finishQuizEarly = useCallback(async () => {
    const currentName = identifiedName || user?.displayName;
    const subjectKey = localStorage.getItem('tic_active_subject') || 'general';
    if (activeSessionId && currentName && state.status === 'in_progress') {
      const finalState = { ...state, status: 'completed' as const };
      await saveToCloud(finalState, activeSessionId, currentName, user?.uid || 'anonymous', subjectKey);
    }
    setState({ questions: [], currentQuestionIndex: 0, responses: [], status: 'idle' });
    setActiveSessionId(null);
    localStorage.removeItem('tic_quiz_start_time');
    router.push('/');
  }, [state, saveToCloud, activeSessionId, router, user, identifiedName]);

  const deleteResult = useCallback(async (id: string) => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'resultados', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const { displayName, subjectKey } = snap.data();
        await deleteDoc(docRef);
        
        if (displayName && subjectKey === 'general') {
          // Buscamos todos los resultados generales del usuario
          const q = query(
            collection(firestore, 'resultados'),
            where('displayName', '==', displayName),
            where('subjectKey', '==', 'general'),
            where('status', '==', 'completed')
          );
          const allUserSnap = await getDocs(q);
          
          if (!allUserSnap.empty) {
            const results = allUserSnap.docs.map(d => d.data());
            // Encontramos el mejor en memoria
            results.sort((a: any, b: any) => {
              if (b.percentage !== a.percentage) return b.percentage - a.percentage;
              return a.duration - b.duration;
            });
            const best = results[0];
            
            await setDoc(doc(firestore, 'ranking', displayName), {
              userId: best.userId,
              displayName: best.displayName,
              percentage: best.percentage,
              correctAnswersCount: best.correctAnswersCount,
              duration: best.duration,
              lastUpdate: best.lastUpdate,
              subjectKey: 'general'
            }, { merge: true });
          } else {
            await deleteDoc(doc(firestore, 'ranking', displayName));
          }
        }
      }
    } catch (e) {
      console.error("Error al eliminar resultado:", e);
    }
  }, [firestore]);

  const restartQuiz = useCallback(() => {
    setState({ questions: [], currentQuestionIndex: 0, responses: [], status: 'idle' });
    setActiveSessionId(null);
    localStorage.removeItem('tic_quiz_start_time');
    router.push('/');
  }, [router]);

  return (
    <QuizContext.Provider value={{ 
      state, history: historyData, ranking, startQuiz, submitAnswer, nextQuestion, restartQuiz, finishQuizEarly, completeQuiz, deleteResult,
      currentAttempts, maxAttempts, lastFeedback, isLoadingHistory, activeSessionId, identifiedName
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within QuizProvider');
  return context;
};
