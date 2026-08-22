import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { CategoryRevenue } from '../services/statsService';

interface CategoryRevenueChartProps {
  data: CategoryRevenue[];
}

export default function CategoryRevenueChart({ data }: CategoryRevenueChartProps) {
  const top8 = data.slice(0, 8);

  if (top8.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Ingresos por Categoría</h2>
          <p className="text-sm text-gray-500 mt-0.5">Top categorías por ingresos generados</p>
        </div>
        <div className="h-80 flex items-center justify-center text-gray-400">
          Sin datos de categorías
        </div>
      </div>
    );
  }

  const chartData = top8.map(c => ({
    category: c.category.length > 15 ? c.category.slice(0, 15) + '...' : c.category,
    fullCategory: c.category,
    ingresos: c.revenue,
    unidades: c.units,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Ingresos por Categoría</h2>
        <p className="text-sm text-gray-500 mt-0.5">Top categorías por ingresos generados</p>
      </div>
      <div className="p-4">
        <div className="h-72">
          <ResponsiveBar
            data={chartData}
            keys={['ingresos']}
            indexBy="category"
            layout="horizontal"
            margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
            padding={0.3}
            borderRadius={4}
            colors={['#6366f1']}
            defs={[
              {
                id: 'catGradient',
                type: 'linearGradient',
                colors: [
                  { offset: 0, color: '#6366f1' },
                  { offset: 100, color: '#818cf8' },
                ],
              },
            ]}
            fill={[{ match: '*', id: 'catGradient' }]}
            axisBottom={null}
            axisLeft={null}
            enableGridX={false}
            enableGridY={false}
            enableLabel={false}
            theme={{
              grid: { line: { stroke: '#f1f5f9' } },
              axis: {
                domain: { line: { stroke: 'transparent' } },
                ticks: { text: { fill: '#6b7280', fontSize: 11 } },
              },
            }}
            tooltip={({ data }) => (
              <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-1">{data.fullCategory}</p>
                <p className="text-sm text-indigo-600">
                  Ingresos: <span className="font-bold">Q{data.ingresos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Unidades: <span className="font-semibold text-gray-900">{data.unidades}</span>
                </p>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
