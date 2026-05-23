'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const BG_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4',
  '#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#6366f1',
  '#d946ef', '#64748b',
];

interface Props {
  labels: string[];
  values: number[];
}

export function ExpensePieChart({ labels, values }: Props) {
  const hasData = values.some((v) => v > 0);

  return (
    <Doughnut
      data={{
        labels,
        datasets: [
          {
            data: hasData ? values : [1],
            backgroundColor: hasData ? BG_COLORS.slice(0, labels.length) : ['rgba(255,255,255,0.06)'],
            borderWidth: 0,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.5)',
              padding: 12,
              font: { size: 11 },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                return `${ctx.label}: $${ctx.parsed.toLocaleString('es-AR')} (${pct}%)`;
              },
            },
          },
        },
      }}
    />
  );
}
