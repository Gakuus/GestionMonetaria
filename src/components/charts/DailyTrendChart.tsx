'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface Props {
  labels: string[];
  incomes: number[];
  expenses: number[];
  isWeekend: boolean[];
}

export function DailyTrendChart({ labels, incomes, expenses }: Props) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Gastos',
            data: expenses,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointHitRadius: 10,
            pointBackgroundColor: '#ef4444',
          },
          {
            label: 'Ingresos',
            data: incomes,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointHitRadius: 10,
            pointBackgroundColor: '#22c55e',
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'rgba(255,255,255,0.5)', boxWidth: 12, padding: 12 },
          },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.35)', maxRotation: 0, autoSkip: true, maxTicksLimit: 15 },
            grid: { display: false },
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
