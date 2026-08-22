import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/style.css';

export type DateFilterMode = 'dia' | 'semana' | 'mes' | 'anio' | 'rango' | 'fecha';

export interface DateFilter {
  mode: DateFilterMode;
  startDate: Date;
  endDate: Date;
}

interface DateFilterBarProps {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
}

const modes: { id: DateFilterMode; label: string }[] = [
  { id: 'dia', label: 'Día' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'anio', label: 'Año' },
  { id: 'rango', label: 'Rango' },
  { id: 'fecha', label: 'Fecha' },
];

function getDefaultRange(mode: DateFilterMode): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);

  switch (mode) {
    case 'dia':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'semana':
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'mes':
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'anio':
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'rango':
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'fecha':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}

export function createDateFilter(mode: DateFilterMode): DateFilter {
  const { startDate, endDate } = getDefaultRange(mode);
  return { mode, startDate, endDate };
}

export default function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [showSinglePicker, setShowSinglePicker] = useState(false);
  const [tempRange, setTempRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: value.startDate,
    to: value.endDate,
  });
  const [tempDate, setTempDate] = useState<Date | undefined>(value.startDate);

  const handleModeChange = (mode: DateFilterMode) => {
    if (mode === 'rango') {
      const { startDate, endDate } = getDefaultRange('rango');
      setTempRange({ from: startDate, to: endDate });
      setShowRangePicker(true);
      setShowSinglePicker(false);
      onChange({ mode, startDate, endDate });
    } else if (mode === 'fecha') {
      const { startDate, endDate } = getDefaultRange('fecha');
      setTempDate(startDate);
      setShowSinglePicker(true);
      setShowRangePicker(false);
      onChange({ mode, startDate, endDate });
    } else {
      setShowRangePicker(false);
      setShowSinglePicker(false);
      const { startDate, endDate } = getDefaultRange(mode);
      onChange({ mode, startDate, endDate });
    }
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setTempRange({ from: range.from, to: range.to });
      onChange({
        mode: 'rango',
        startDate: range.from,
        endDate: range.to,
      });
      setShowRangePicker(false);
    } else if (range.from) {
      setTempRange({ from: range.from, to: undefined });
    }
  };

  const handleSingleDateSelect = (date: Date | undefined) => {
    if (date) {
      setTempDate(date);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      onChange({ mode: 'fecha', startDate: start, endDate: end });
      setShowSinglePicker(false);
    }
  };

  const formatDateRange = () => {
    if (value.mode === 'rango') {
      return `${format(value.startDate, 'dd MMM', { locale: es })} — ${format(value.endDate, 'dd MMM yyyy', { locale: es })}`;
    }
    if (value.mode === 'fecha') {
      return format(value.startDate, 'dd MMMM yyyy', { locale: es });
    }
    return null;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              value.mode === m.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {(value.mode === 'rango' || value.mode === 'fecha') && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{formatDateRange()}</span>
        </div>
      )}

      {showRangePicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowRangePicker(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
            <DayPicker
              mode="range"
              selected={tempRange}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              locale={es}
              disabled={{ after: new Date() }}
            />
          </div>
        </>
      )}

      {showSinglePicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSinglePicker(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
            <DayPicker
              mode="single"
              selected={tempDate}
              onSelect={handleSingleDateSelect}
              locale={es}
              disabled={{ after: new Date() }}
            />
          </div>
        </>
      )}
    </div>
  );
}
