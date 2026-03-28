
import { Question, QuizLevel } from "@/types/quiz";

export function validateQuestion(q: any): q is Question {
  if (!q) return false;
  if (!q.pregunta || typeof q.pregunta !== 'string' || q.pregunta.trim() === '') return false;
  
  if (!q.opciones || typeof q.opciones !== 'object') return false;
  
  // Mínimo requiere A y B (para Verdadero/Falso)
  if (!q.opciones.A || !q.opciones.B) return false;
  
  const optionsKeys = Object.keys(q.opciones);
  for (const opt of optionsKeys) {
    const value = q.opciones[opt as keyof typeof q.opciones];
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return false;
    }
  }
  
  if (!['A', 'B', 'C', 'D'].includes(q.correcta)) return false;
  
  if (!q.justificacion || typeof q.justificacion !== 'string' || q.justificacion.trim() === '') return false;
  if (!q.explicacionError || typeof q.explicacionError !== 'string' || q.explicacionError.trim() === '') return false;
  if (!q.categoria || typeof q.categoria !== 'string' || q.categoria.trim() === '') return false;
  
  return true;
}

export function calculateLevel(percentage: number): QuizLevel {
  if (percentage >= 90) return 'Excelente';
  if (percentage >= 70) return 'Aprobado';
  if (percentage >= 50) return 'Regular';
  return 'Bajo';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function getStatusFromPercentage(percentage: number): 'APROBADO' | 'REPROBADO' {
  return percentage >= 70 ? 'APROBADO' : 'REPROBADO';
}
