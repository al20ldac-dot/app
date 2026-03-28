
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { QuizProvider } from '@/components/quiz/QuizProvider';

export const metadata: Metadata = {
  title: 'TIC-Simul - Plataforma de Evaluación Complexiva',
  description: 'Sistema avanzado de simulación académica para la carrera de TIC con persistencia en Firestore.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-slate-50">
        <FirebaseClientProvider>
          <QuizProvider>
            {children}
          </QuizProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
