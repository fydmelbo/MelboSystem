import { useState } from 'react';
import React from 'react';
import AnimatedCounter from '../../../components/ui/AnimatedCounter';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

  const currentEarnings = view === 'weekly' ? weeklyEarnings : monthlyEarnings;
  const currentChange = view === 'weekly' ? weeklyChange : monthlyChange;
  const isPositive = currentChange >= 0;

  const circumference = 2 * Math.PI * 40;
  const firstHalfOffset = circumference * (1 - firstFifteenDaysEarnings / 100);
  const secondHalfOffset = circumference * (1 - lastFifteenDaysEarnings / 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Ganancias</h2>
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl">
          {(['weekly', 'monthly'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                view === v
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v === 'weekly' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main metric */}
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {view === 'weekly' ? 'Esta Semana' : 'Este Mes'}
          </p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900 tabular-nums">
              Q<AnimatedCounter value={currentEarnings} decimals={2} />
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{currentChange.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-400">
              vs. {view === 'weekly' ? 'semana' : 'mes'} anterior
            </span>
          </div>
        </div>

        {/* Donut charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90">
                <circle
                  className="text-gray-100"
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
                  strokeDasharray={circumference}
                  strokeDashoffset={firstHalfOffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="48"
                  cy="48"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
              </svg>
              <span className="absolute text-sm font-bold text-gray-900">
                {firstFifteenDaysEarnings?.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-2">Primeros 15 días</p>
          </div>

          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90">
                <circle
                  className="text-gray-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="48"
                  cy="48"
                />
                <circle
                  className="text-amber-500"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={secondHalfOffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="48"
                  cy="48"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
              </svg>
              <span className="absolute text-sm font-bold text-gray-900">
                {lastFifteenDaysEarnings?.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-2">Últimos 15 días</p>
          </div>
        </div>
      </div>
    </div>
  );
}
