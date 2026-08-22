import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface EarningsStatsProps {
  periodEarnings: number;
  previousPeriodEarnings: number;
  changePercent: number;
  firstHalfEarnings: number;
  secondHalfEarnings: number;
  salesCount: number;
  averageTicket: number;
}

export default function EarningsStats({
  periodEarnings,
  previousPeriodEarnings,
  changePercent,
  firstHalfEarnings,
  secondHalfEarnings,
  salesCount,
  averageTicket,
}: EarningsStatsProps) {
  const isPositive = changePercent >= 0;

  const halfData = [
    { id: 'Primera mitad', value: firstHalfEarnings, color: '#6366f1' },
    { id: 'Segunda mitad', value: secondHalfEarnings, color: '#10b981' },
  ].filter(d => d.value > 0);

  const hasData = periodEarnings > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Ganancias</h2>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de ingresos del período</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Ingresos del período</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900 tabular-nums">
              Q{periodEarnings.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-400">vs. período anterior</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Ticket Promedio</span>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums">
              Q{averageTicket.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Total Ventas</span>
            </div>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{salesCount}</p>
          </div>
        </div>

        {hasData && halfData.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Distribución del período</p>
            <div className="flex items-center gap-4">
              <div className="h-32 w-32 shrink-0">
                <ResponsivePie
                  data={halfData}
                  innerRadius={35}
                  padAngle={2}
                  cornerRadius={4}
                  colors={halfData.map(d => d.color)}
                  enableArcLabels={false}
                  enableArcLinkLabels={false}
                  tooltip={({ datum }) => (
                    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
                      <p className="text-sm font-semibold" style={{ color: datum.color }}>{datum.id}</p>
                      <p className="text-sm text-gray-600">
                        Q{datum.value.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2 flex-1">
                {halfData.map(d => (
                  <div key={d.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-gray-600">{d.id}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      Q{d.value.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
