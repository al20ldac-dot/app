'use server';
/**
 * @fileOverview Flujo de Genkit para la ingesta de preguntas desde documentos Word (.docx).
 * 
 * - Extrae texto utilizando mammoth.
 * - Procesa el contenido con Gemini para estructurar el JSON.
 * - Valida estrictamente el esquema antes de retornar.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import mammoth from 'mammoth';

const QuestionSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta no puede estar vacía'),
  opciones: z.object({
    A: z.string().min(1, 'La opción A es obligatoria'),
    B: z.string().min(1, 'La opción B es obligatoria'),
    C: z.string().min(1, 'La opción C es obligatoria'),
    D: z.string().min(1, 'La opción D es obligatoria'),
  }),
  correcta: z.enum(['A', 'B', 'C', 'D']),
  justificacion: z.string().min(1, 'La justificación es obligatoria'),
  explicacionError: z.string().min(1, 'El análisis de distractores es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
});

export type Question = z.infer<typeof QuestionSchema>;

const UploadDocxQuestionsInputSchema = z.object({
  docxBase64: z.string().describe("Archivo DOCX en base64")
});

const UploadDocxQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema),
  errors: z.array(z.string())
});

export type UploadDocxQuestionsOutput = z.infer<typeof UploadDocxQuestionsOutputSchema>;

const extractQuestionsPrompt = ai.definePrompt({
  name: 'extractQuestionsFromDocxPrompt',
  input: { schema: z.object({ docxText: z.string() }) },
  output: { schema: z.object({ questions: z.array(QuestionSchema) }) },
  prompt: `Eres un asistente experto en ingeniería de software y educación TIC.
Tu tarea es analizar el texto extraído de un documento Word y convertirlo en un array de objetos JSON estructurados.

INSTRUCCIONES CRÍTICAS:
1. Extrae cada pregunta con sus 4 opciones (A, B, C, D).
2. Identifica la respuesta correcta (debe ser A, B, C o D).
3. Extrae la justificación técnica de la respuesta correcta.
4. Extrae el análisis pedagógico de por qué las otras opciones son incorrectas (explicacionError).
5. Asigna una categoría temática (Redes, Programación, etc.).

Si el texto no especifica explícitamente una categoría o análisis, deduce uno basado en el contexto académico de TIC.

Texto del documento:
{{{docxText}}}

Genera ÚNICAMENTE el JSON bajo la clave 'questions'.`
});

export async function uploadDocxQuestions(input: { docxBase64: string }): Promise<UploadDocxQuestionsOutput> {
  const buffer = Buffer.from(input.docxBase64, 'base64');
  const { value: docxText } = await mammoth.extractRawText({ buffer });

  const { output } = await extractQuestionsPrompt({ docxText });

  const validatedQuestions: Question[] = [];
  const errors: string[] = [];

  if (output?.questions) {
    output.questions.forEach((q, index) => {
      try {
        validatedQuestions.push(QuestionSchema.parse(q));
      } catch (e: any) {
        errors.push(`Pregunta #${index + 1}: Datos incompletos o inválidos.`);
      }
    });
  } else {
    errors.push("No se pudo estructurar la información del documento.");
  }

  return { questions: validatedQuestions, errors };
}
