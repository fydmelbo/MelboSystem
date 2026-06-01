import { useState } from 'react';
import React from 'react';

interface EarningsStatsProps {
  weeklyEarnings: number;
  monthlyEarnings: number;
  previousWeekEarnings: number;
  previousMonthEarnings: number;
  firstFifteenDaysEarnings: number;
  lastFifteenDaysEarnings: number;
}

export default function EarningsStats({
  weeklyEarnings,
  monthlyEarnings,
  previousWeekEarnings,
  previousMonthEarnings,
  firstFifteenDaysEarnings,
  lastFifteenDaysEarnings
}: EarningsStatsProps) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const weeklyChange = calculatePercentageChange(weeklyEarnings, previousWeekEarnings);
  const monthlyChange = calculatePercentageChange(monthlyEarnings, previousMonthEarnings);

  return (
    <div className="bg-white rounded-lg shadow p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800"> Mensuales</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('weekly')}
            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${view === 'weekly'
              ? 'bg-green-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${view === 'monthly'
              ? 'bg-green-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">
          {view === 'weekly' ? 'Esta Semana' : 'Este Mes'}
        </p>
        <div className="flex items-end gap-3">
          <span className="text-2xl font-bold text-gray-900">
            Q{view === 'weekly' ? weeklyEarnings?.toFixed(2) : monthlyEarnings?.toFixed(2)}
          </span>
          <span className={`text-sm font-medium ${(view === 'weekly' ? weeklyChange : monthlyChange) >= 0
            ? 'text-green-600'
            : 'text-red-600'
            }`}>
            {(view === 'weekly' ? weeklyChange : monthlyChange).toFixed(2)}%
          </span>
          <span className="text-sm text-gray-500">
            del {view === 'weekly' ? 'semana' : 'mes'} anterior
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <div className="flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                className="text-gray-200"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
              <circle
                className="text-blue-500"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - firstFifteenDaysEarnings / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
            </svg>
            <span className="absolute text-sm font-semibold">
              {firstFifteenDaysEarnings?.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-center mt-2">Primeros 15 días</p>
        </div>

        <div className="relative">
          <div className="flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                className="text-gray-200"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
              <circle
                className="text-yellow-500"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - lastFifteenDaysEarnings / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
            </svg>
            <span className="absolute text-sm font-semibold">
              {lastFifteenDaysEarnings?.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-center mt-2">Últimos 15 días</p>
        </div>
      </div>
    </div>
  );
} 