import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { DailySalesData } from '../services/statsService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RevenueChartProps {
  data: DailySalesData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = [
    {
      id: 'Ingresos',
      data: data.map(d => ({
        x: format(new Date(d.date), 'dd MMM', { locale: es }),
        y: d.totalSales,
      })),
    },
  ];

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Ingresos Totales</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tendencia de ingresos en el período seleccionado</p>
        </div>
        <div className="h-80 flex items-center justify-center text-gray-400">
          Sin datos para el período seleccionado
        </div>
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.totalSales, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Ingresos Totales</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tendencia de ingresos en el período seleccionado</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">Q{totalRevenue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="h-72">
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            axisBottom={{
              tickSize: 0,
              tickPadding: 12,
              tickRotation: -45,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              format: (v: number) => `Q${v.toLocaleString()}`,
            }}
            enableGridY={true}
            gridYValues={5}
            theme={{
              grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
              axis: {
                domain: { line: { stroke: 'transparent' } },
                ticks: { text: { fill: '#94a3b8' } },
              },
            }}
            colors={['#6366f1']}
            pointSize={5}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'color' }}
            useMesh={true}
            enableCrosshair={true}
            crosshairType="bottom"
            area={true}
            areaBaselineValue={0}
            areaOpacity={0.12}
            defs={[
              {
                id: 'revenueGradient',
                type: 'linearGradient',
                colors: [
                  { offset: 0, color: '#6366f1' },
                  { offset: 100, color: '#818cf8' },
                ],
              },
            ]}
            fill={[{ match: '*', id: 'revenueGradient' }]}
            tooltip={({ point }) => (
              <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{point.data.x}</p>
                <p className="text-sm text-indigo-600">
                  Ingresos: <span className="font-bold">Q{Number(point.data.y).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
