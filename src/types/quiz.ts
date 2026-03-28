
export interface Question {
  id: string;
  pregunta: string;
  code?: string; // Soporte para bloques de código
  imageUrl?: string; // Soporte para imágenes técnicas o diagramas
  opciones: {
    A: string;
    B: string;
    C?: string;
    D?: string;
  };
  correcta: 'A' | 'B' | 'C' | 'D';
  optionOrder?: Array<'A' | 'B' | 'C' | 'D'>;
  justificacion: string;
  explicacionError: string;
  categoria: string;
  subType?: 'teorico' | 'practico';
}

export interface UserResponse {
  questionId: string;
  attemptsUsed: number;
  isCorrect: boolean;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
}

export type QuizStatus = 'idle' | 'in_progress' | 'completed';

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  responses: UserResponse[];
  status: QuizStatus;
}

export type QuizLevel = 'Excelente' | 'Aprobado' | 'Regular' | 'Bajo';
