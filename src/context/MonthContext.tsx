'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface MonthContextValue {
  selectedDate: Date;
  year: number;
  month: number;
  label: string;
  setSelectedDate: (d: Date) => void;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToToday: () => void;
  isCurrentMonth: boolean;
}

const MonthContext = createContext<MonthContextValue | null>(null);

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getMonthLabel(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function isCurrentMonth(d: Date) {
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function MonthProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

  const goToNextMonth = useCallback(() => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToPrevMonth = useCallback(() => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    const n = new Date();
    setSelectedDate(new Date(n.getFullYear(), n.getMonth(), 1));
  }, []);

  return (
    <MonthContext.Provider
      value={{
        selectedDate,
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        label: getMonthLabel(selectedDate),
        setSelectedDate,
        goToNextMonth,
        goToPrevMonth,
        goToToday,
        isCurrentMonth: isCurrentMonth(selectedDate),
      }}
    >
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
}
