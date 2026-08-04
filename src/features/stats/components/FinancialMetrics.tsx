import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { formatCurrency } from '../../../utils/format';
import AnimatedCounter from '../../../components/ui/AnimatedCounter';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Receipt, Percent } from 'lucide-react';

interface FinancialMetricsProps {
  data: {
    totalRevenue: number;
    totalCost: number;
    contributionMargin: number;
    marginPercentage: number;
    dailyMarginTrend: Array<{
      date: string;
      revenue: number;
      cost: number;
      margin: number;
    }>;
    topProducts: Array<{
      name: string;
      revenue: number;
      cost: number;
      margin: number;
    }>;
  };
}

const kpiVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function FinancialMetrics({ data }: FinancialMetricsProps) {
  if (!data) {
    return <div className="text-center text-gray-500 py-12">No hay datos disponibles</div>;
  }

  const safeData = {
    totalRevenue: data.totalRevenue ?? 0,
    totalCost: data.totalCost ?? 0,
    contributionMargin: data.contributionMargin ?? 0,
    marginPercentage: data.marginPercentage ?? 0,
    dailyMarginTrend: data.dailyMarginTrend ?? [],
    topProducts: data.topProducts ?? []
  };

  const kpis = [
    { label: 'Ingresos Totales', value: safeData.totalRevenue, icon: DollarSign, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', prefix: 'Q' },
    { label: 'Costos Totales', value: safeData.totalCost, icon: Receipt, bgColor: 'bg-red-50', iconColor: 'text-red-500', prefix: 'Q' },
    { label: 'Margen de Contribución', value: safeData.contributionMargin, icon: TrendingUp, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', prefix: 'Q' },
    { label: 'Porcentaje de Margen', value: safeData.marginPercentage, icon: Percent, bgColor: 'bg-primary-50', iconColor: 'text-primary-600', suffix: '%' },
  ];

  const trendData = safeData.dailyMarginTrend.length > 0 ? [
    {
      id: 'Margen',
      data: safeData.dailyMarginTrend.map(d => ({ x: d.date, y: d.margin })),
    },
    {
      id: 'Ingresos',
      data: safeData.dailyMarginTrend.map(d => ({ x: d.date, y: d.revenue })),
    },
    {
      id: 'Costos',
      data: safeData.dailyMarginTrend.map(d => ({ x: d.date, y: d.cost })),
    },
  ] : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Métricas Financieras</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Análisis detallado del margen de contribución</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={kpiVariants}
              className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className={`p-1.5 sm:p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${kpi.iconColor}`} />
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">{kpi.label}</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
                <AnimatedCounter
                  value={kpi.value}
                  prefix={kpi.prefix || ''}
                  suffix={kpi.suffix || ''}
                  decimals={kpi.suffix === '%' ? 1 : 2}
                />
              </p>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        {trendData.length > 0 && (
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendencia del Margen</h3>
            <div className="h-72">
              {(() => {
                const props: any = {
                  data: trendData,
                  margin: { top: 20, right: 60, bottom: 40, left: 40 },
                  xScale: { type: 'point' },
                  yScale: {
                    type: 'linear',
                    min: 'auto',
                    max: 'auto',
                    stacked: false,
                  },
                  axisBottom: {
                    tickSize: 0,
                    tickPadding: 12,
                  },
                  axisLeft: {
                    tickSize: 0,
                    tickPadding: 10,
                  },
                  axisRight: {
                    tickSize: 0,
                    tickPadding: 10,
                    format: (v: number) => `Q${v.toLocaleString()}`,
                  },
                  enableGridY: true,
                  gridYValues: 5,
                  theme: {
                    grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
                    axis: {
                      domain: { line: { stroke: 'transparent' } },
                      ticks: { text: { fill: '#94a3b8' } },
                    },
                  },
                  colors: ['#10b981', '#6366f1', '#f43f5e'],
                  pointSize: 0,
                  pointColor: { theme: 'background' },
                  useMesh: true,
                  enableCrosshair: true,
                  crosshairType: 'bottom',
                  defs: [
                    {
                      id: 'marginGrad',
                      type: 'linearGradient',
                      colors: [
                        { offset: 0, color: '#10b981' },
                        { offset: 100, color: '#34d399' },
                      ],
                    },
                  ],
                  area: true,
                  areaBaselineValue: 0,
                  areaOpacity: 0.08,
                  tooltip: ({ point }: any) => (
                    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{point.data.x}</p>
                      <p className="text-sm" style={{ color: point.color }}>
                        {point.seriesId}: <span className="font-bold">{formatCurrency(Number(point.data.y) || 0)}</span>
                      </p>
                    </div>
                  ),
                };
                return <ResponsiveLine {...props} />;
              })()}
            </div>
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Margen
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                Ingresos
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                Costos
              </div>
            </div>
          </div>
        )}

        {/* Top margin products table */}
        {safeData.topProducts.length > 0 && (
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 bg-gray-50/80 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Productos con Mayor Margen</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos</th>
                    <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Costos</th>
                    <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {safeData.topProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-5 py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 sm:px-5 py-3 text-right text-gray-600 tabular-nums">{formatCurrency(product.revenue) || '-'}</td>
                      <td className="px-4 sm:px-5 py-3 text-right text-red-500 tabular-nums">{formatCurrency(product.cost) || '-'}</td>
                      <td className="px-4 sm:px-5 py-3 text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(product.margin) || '-'}</td>
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
