"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartConfig 
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { useQuiz } from '../quiz/QuizProvider';

export function StatsCharts() {
  const { state } = useQuiz();
  
  const correctCount = state.responses.filter(r => r.isCorrect).length;
  const incorrectCount = state.questions.length - correctCount;

  const pieData = [
    { name: 'Correctas', value: correctCount, fill: 'hsl(var(--chart-2))' },
    { name: 'Incorrectas', value: incorrectCount, fill: 'hsl(var(--destructive))' },
  ];

  // Group by category
  const categoryStats = state.questions.reduce((acc, q) => {
    const response = state.responses.find(r => r.questionId === q.id);
    if (!acc[q.categoria]) {
      acc[q.categoria] = { category: q.categoria, correct: 0, total: 0 };
    }
    acc[q.categoria].total += 1;
    if (response?.isCorrect) acc[q.categoria].correct += 1;
    return acc;
  }, {} as Record<string, { category: string, correct: number, total: number }>);

  const barData = Object.values(categoryStats).map(s => ({
    categoria: s.category,
    porcentaje: Math.round((s.correct / s.total) * 100),
  }));

  const chartConfig: ChartConfig = {
    correct: { label: "Correctas", color: "hsl(var(--chart-2))" },
    incorrect: { label: "Incorrectas", color: "hsl(var(--destructive))" },
    porcentaje: { label: "Rendimiento (%)", color: "hsl(var(--chart-1))" },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Balance General</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Rendimiento por Categoría</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="categoria" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="porcentaje" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}