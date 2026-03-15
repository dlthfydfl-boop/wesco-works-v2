'use client';

import { useState, useMemo } from 'react';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  color?: 'red' | 'blue' | 'green' | 'amber';
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const dotColors: Record<string, string> = {
  red: 'bg-[#E1431B]',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
};

export function Calendar({ events, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: { day: number; inMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      cells.push({
        day: d,
        inMonth: false,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        inMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Next month padding
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = month + 2 > 12 ? 1 : month + 2;
        const y = month + 2 > 12 ? year + 1 : year;
        cells.push({
          day: d,
          inMonth: false,
          dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        });
      }
    }

    return cells;
  }, [year, month]);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return map;
  }, [events]);

  const today = new Date().toISOString().split('T')[0];

  const goToPrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNext = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button
          onClick={goToPrev}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            {year}년 {month + 1}월
          </h3>
          <button
            onClick={goToToday}
            className="text-xs text-gray-500 px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            오늘
          </button>
        </div>
        <button
          onClick={goToNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`text-center py-2 text-xs font-medium ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((cell, idx) => {
          const dayEvents = eventMap.get(cell.dateStr) || [];
          const isToday = cell.dateStr === today;
          const dayOfWeek = idx % 7;

          return (
            <button
              key={idx}
              onClick={() => onDateClick?.(cell.dateStr)}
              className={`relative min-h-[56px] p-1 border-b border-r border-gray-50 text-left hover:bg-gray-50 transition-colors ${
                !cell.inMonth ? 'opacity-30' : ''
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${
                  isToday
                    ? 'bg-[#E1431B] text-white'
                    : dayOfWeek === 0
                    ? 'text-red-500'
                    : dayOfWeek === 6
                    ? 'text-blue-500'
                    : 'text-gray-700'
                }`}
              >
                {cell.day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className={`w-full text-[9px] leading-tight truncate px-1 py-0.5 rounded ${
                        dotColors[ev.color || 'blue']
                      } text-white`}
                    >
                      {ev.label}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-gray-400">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
