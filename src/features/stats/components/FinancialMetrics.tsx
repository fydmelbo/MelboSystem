import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { TrendingUp, DollarSign, Receipt, Percent, ShoppingCart } from 'lucide-react';

interface FinancialMetricsProps {
  data: {
    totalRevenue: number;
    totalCost: number;
    contributionMargin: number;
    marginPercentage: number;
    dailyMarginTrend: Array<{ date: string; revenue: number; cost: number; margin: number }>;
    topProducts: Array<{ name: string; revenue: number; cost: number; margin: number }>;
    totalSales: number;
    averageTicket: number;
  };
}

export default function FinancialMetrics({ data }: FinancialMetricsProps) {
  if (!data) {
    return <div className="text-center text-gray-500 py-12">No hay datos disponibles</div>;
  }

  const kpis = [
    { label: 'Ingresos Totales', value: data.totalRevenue, icon: DollarSign, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', prefix: 'Q' },
    { label: 'Costos Totales', value: data.totalCost, icon: Receipt, bgColor: 'bg-red-50', iconColor: 'text-red-500', prefix: 'Q' },
    { label: 'Utilidad', value: data.contributionMargin, icon: TrendingUp, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', prefix: 'Q' },
    { label: '% Margen', value: data.marginPercentage, icon: Percent, bgColor: 'bg-primary-50', iconColor: 'text-primary-600', suffix: '%' },
    { label: 'Ticket Promedio', value: data.averageTicket, icon: ShoppingCart, bgColor: 'bg-amber-50', iconColor: 'text-amber-600', prefix: 'Q' },
  ];

  const trendData = data.dailyMarginTrend.length > 0 ? [
    {
      id: 'Utilidad',
      data: data.dailyMarginTrend.map(d => ({ x: d.date, y: d.margin })),
    },
  ] : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Métricas Financieras</h2>
        <p className="text-sm text-gray-500 mt-0.5">Análisis detallado del margen de contribución</p>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
                <p className="text-xs font-medium text-gray-500 truncate">{kpi.label}</p>
              </div>
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                {kpi.prefix || ''}{kpi.value.toLocaleString('es-GT', {
                  minimumFractionDigits: kpi.suffix === '%' ? 1 : 2,
                  maximumFractionDigits: kpi.suffix === '%' ? 1 : 2,
                })}{kpi.suffix || ''}
              </p>
            </div>
          ))}
        </div>

        {trendData.length > 0 && (
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendencia de Utilidad Diaria</h3>
            <div className="h-64">
              <ResponsiveLine
                data={trendData}
                margin={{ top: 20, right: 60, bottom: 40, left: 60 }}
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
                colors={['#10b981']}
                pointSize={4}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'color' }}
                useMesh={true}
                enableCrosshair={true}
                crosshairType="bottom"
                area={true}
                areaBaselineValue={0}
                areaOpacity={0.1}
                defs={[
                  {
                    id: 'marginGrad',
                    type: 'linearGradient',
                    colors: [
                      { offset: 0, color: '#10b981' },
                      { offset: 100, color: '#34d399' },
                    ],
                  },
                ]}
                fill={[{ match: '*', id: 'marginGrad' }]}
                tooltip={({ point }) => (
                  <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{point.data.x}</p>
                    <p className="text-sm text-emerald-600">
                      Utilidad: <span className="font-bold">Q{Number(point.data.y).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                    </p>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {data.topProducts.length > 0 && (
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Productos con Mayor Utilidad</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Costos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.topProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                        Q{product.revenue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-red-500 tabular-nums">
                        Q{product.cost.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">
                        Q{product.margin.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
