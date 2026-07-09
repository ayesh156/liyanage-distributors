import { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * FancyDatePicker — A modern, dark-themed date picker with month/year navigation.
 * Replaces native <input type="date"> for consistent styling across the system.
 */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  return days;
}

export default function FancyDatePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const parsed = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  const days = getCalendarDays(viewYear, viewMonth);

  const selectedStr = value || '';
  const todayStr = new Date().toISOString().split('T')[0];

  const handleSelect = useCallback((day) => {
    if (!day) return;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange({ target: { value: `${viewYear}-${m}-${d}` } });
    setOpen(false);
  }, [viewYear, viewMonth, onChange]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [open]);

  // Format display value
  const displayValue = selectedStr
    ? (() => {
        const d = new Date(selectedStr + 'T00:00:00');
        return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
      })()
    : '';

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="input-label">
          <CalendarDays size={13} className="inline mr-1 text-gray-400" /> {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all ${
          open
            ? 'border-orange-500 ring-1 ring-orange-500/20 bg-white dark:bg-slate-800'
            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500'
        } ${selectedStr ? 'text-slate-800 dark:text-white' : 'text-gray-400 dark:text-slate-400'}`}
      >
        <CalendarDays size={15} className="text-gray-400 dark:text-slate-400 flex-shrink-0" />
        <span className="flex-1 text-left truncate">
          {displayValue || 'Select date...'}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">▼</span>
      </button>

      {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-[9999] shadow-2xl bg-white border border-slate-200 rounded-xl p-3 w-72 dark:bg-slate-900 dark:border-slate-700">
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-500 dark:text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedStr;
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`text-center text-xs py-1.5 rounded-lg transition-colors ${
                    isSelected
                    ? 'bg-orange-500 text-white font-bold'
                    : isToday
                      ? 'bg-orange-100 text-orange-600 font-semibold dark:bg-slate-700 dark:text-orange-400'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}