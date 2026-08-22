import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { LocationRevenue } from '../services/statsService';

interface LocationComparisonChartProps {
  data: LocationRevenue[];
}

export default function LocationComparisonChart({ data }: LocationComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Comparación por Ubicación</h2>
          <p className="text-sm text-gray-500 mt-0.5">Rendimiento de cada ubicación</p>
        </div>
        <div className="h-80 flex items-center justify-center text-gray-400">
          Sin datos de ubicaciones
        </div>
      </div>
    );
  }

  const chartData = data.map(loc => ({
    ubicacion: loc.ubicacionNombre.length > 12 ? loc.ubicacionNombre.slice(0, 12) + '...' : loc.ubicacionNombre,
    fullNombre: loc.ubicacionNombre,
    ingresos: loc.revenue,
    ventas: loc.salesCount,
    ticketPromedio: loc.averageTicket,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Comparación por Ubicación</h2>
        <p className="text-sm text-gray-500 mt-0.5">Rendimiento de cada ubicación</p>
      </div>
      <div className="p-4">
        <div className="h-72">
          <ResponsiveBar
            data={chartData}
            keys={['ingresos']}
            indexBy="ubicacion"
            margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
            padding={0.3}
            borderRadius={6}
            colors={['#10b981']}
            defs={[
              {
                id: 'locGradient',
                type: 'linearGradient',
                colors: [
                  { offset: 0, color: '#10b981' },
                  { offset: 100, color: '#34d399' },
                ],
              },
            ]}
            fill={[{ match: '*', id: 'locGradient' }]}
            axisBottom={{
              tickSize: 0,
              tickPadding: 12,
              tickRotation: -20,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              format: (v: number) => `Q${v.toLocaleString()}`,
            }}
            enableGridY={true}
            gridYValues={5}
            enableLabel={false}
            theme={{
              grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
              axis: {
                domain: { line: { stroke: 'transparent' } },
                ticks: { text: { fill: '#94a3b8' } },
              },
            }}
            tooltip={({ data }) => (
              <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-1">{data.fullNombre}</p>
                <p className="text-sm text-emerald-600">
                  Ingresos: <span className="font-bold">Q{data.ingresos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Ventas: <span className="font-semibold text-gray-900">{data.ventas}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Ticket promedio: <span className="font-semibold text-gray-900">Q{data.ticketPromedio.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
