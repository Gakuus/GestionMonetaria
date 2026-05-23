'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = ['#22c55e', '#ef4444'];

interface Props {
  labels: string[];
  incomes: number[];
  expenses: number[];
}

export function MonthlyBarChart({ labels, incomes, expenses }: Props) {
  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: incomes,
            backgroundColor: COLORS[0],
            borderRadius: 4,
          },
          {
            label: 'Gastos',
            data: expenses,
            backgroundColor: COLORS[1],
            borderRadius: 4,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'rgba(255,255,255,0.5)', boxWidth: 12, padding: 12 },
          },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.35)' },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255,255,255,0.35)',
              callback: (v) =>
                Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }),
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      }}
    />
  );
}
