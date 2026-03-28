# **App Name**: Simulador ExamPrep TIC

## Core Features:

- Ingesta de Preguntas DOCX por IA: Módulo para cargar archivos .docx y extraer automáticamente enunciado, opciones, respuesta correcta, justificación y análisis de distractores, usando Genkit para convertir a JSON estructurado y validarlo.
- Carga Manual de Preguntas JSON: Permite a los administradores cargar preguntas pre-estructuradas directamente desde un archivo JSON para su inclusión en el banco de preguntas.
- Simulador de Examen Dinámico: Motor de examen interactivo que presenta preguntas con un máximo de tres intentos, proporcionando feedback visual y transición fluida entre preguntas.
- Visualización de Progreso en Tiempo Real: Muestra una barra de progreso, indicador de intentos restantes y feedback visual instantáneo (verde/rojo) para la interacción del usuario.
- Dashboard de Análisis de Rendimiento: Calcula y presenta puntaje total, porcentaje, nivel (Excelente, Bueno, Regular, Bajo) y métricas clave (aciertos, errores, promedio de intentos, eficiencia) con gráficos de Chart.js.
- Revisión Completa de Errores: Interfaz para revisar todas las preguntas respondidas incorrectamente, mostrando la respuesta correcta, justificación y explicación de los distractores.
- Validación Robusta de Preguntas: Sistema de validación que asegura la integridad de las preguntas importadas (verificando formato, opciones, respuestas correctas y campos no vacíos), ignorando y registrando errores sin romper la aplicación.

## Style Guidelines:

- Esquema de color general: Se utilizará un esquema de colores claros para fomentar un ambiente de estudio académico y una interfaz de usuario limpia.
- Color principal: Azul-indigo vibrante (#2942A3). Este color evoca profesionalismo, estabilidad y tecnología, adecuado para una aplicación SaaS y un entorno educativo de TIC.
- Color de fondo: Gris claro (#ECEFF6). Un tono suave del azul principal, que proporciona una base tranquila y minimiza la fatiga visual.
- Color de acento: Turquesa brillante (#2EA6CC). Complementario al azul principal, este color se usará para resaltar elementos interactivos importantes y crear puntos focales energéticos, añadiendo un toque moderno.
- Fuente principal: 'Inter' (sans-serif). Esta fuente ha sido elegida por su legibilidad, neutralidad y su adaptación óptima a interfaces de usuario, lo que la hace ideal para el contenido académico y de dashboard, tanto en titulares como en texto de cuerpo.
- Diseño responsivo con un enfoque tipo dashboard profesional. Los componentes se ajustarán dinámicamente para ofrecer una experiencia óptima en dispositivos móviles, tablets y escritorios.
- Animaciones suaves y transiciones sutiles. Se implementarán animaciones CSS para mejorar la fluidez de la interfaz de usuario, especialmente durante el cambio de preguntas, feedback de respuestas y carga de elementos, sin distraer al usuario del contenido principal.