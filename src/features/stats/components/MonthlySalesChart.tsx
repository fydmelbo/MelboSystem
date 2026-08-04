import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { MonthlySalesData } from '../services/statsService';
import React from 'react';

interface MonthlySalesChartProps {
  data: MonthlySalesData[];
}

const months = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const chartData = data.map(item => ({
    month: months[item.month],
    ventas: item.numberOfSales,
    dinero: item.totalSales,
  }));

  const lineData = [
    {
      id: 'Total Generado',
      data: chartData.map(d => ({ x: d.month, y: d.dinero })),
    },
  ];

  const tickColorTheme = {
    grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
    axis: {
      domain: { line: { stroke: 'transparent' } },
      ticks: { text: { fill: '#94a3b8' } },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Ventas por Mes</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Tendencia mensual del año actual</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="h-72 sm:h-80">
          {(() => {
            const props: any = {
              data: chartData,
              keys: ['ventas'],
              indexBy: 'month',
              margin: { top: 20, right: 60, bottom: 40, left: 40 },
              padding: 0.3,
              colors: ["url(#barGradient)"],
              borderRadius: 4,
              axisBottom: {
                tickSize: 0,
                tickPadding: 12,
                legend: '',
                legendPosition: 'middle',
                legendOffset: 32,
              },
              axisLeft: {
                tickSize: 0,
                tickPadding: 10,
                legend: '',
                legendPosition: 'middle',
                legendOffset: -40,
              },
              axisRight: {
                tickSize: 0,
                tickPadding: 10,
                format: (v: number) => `Q${v.toLocaleString()}`,
              },
              enableGridY: true,
              gridYValues: 5,
              theme: tickColorTheme,
              enableLabel: false,
              tooltip: ({ value, indexValue }: any) => (
                <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{indexValue}</p>
                  <p className="text-sm text-gray-500">Cantidad: <span className="font-bold text-gray-900">{value}</span></p>
                </div>
              ),
              defs: [
                {
                  id: 'barGradient',
                  type: 'linearGradient',
                  colors: [
                    { offset: 0, color: '#6366f1' },
                    { offset: 100, color: '#818cf8' },
                  ],
                },
              ],
            };
            return <ResponsiveBar {...props} />;
          })()}
        </div>
        <div className="mt-4 sm:h-48">
          {(() => {
            const props: any = {
              data: lineData,
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
              axisRight: {
                tickSize: 0,
                tickPadding: 10,
                format: (v: number) => `Q${v.toLocaleString()}`,
              },
              enableGridY: true,
              gridYValues: 5,
              theme: tickColorTheme,
              colors: ['#10b981'],
              pointSize: 6,
              pointColor: { theme: 'background' },
              pointBorderWidth: 2,
              pointBorderColor: { from: 'color' },
              useMesh: true,
              enableCrosshair: true,
              crosshairType: 'bottom',
              tooltip: ({ point }: any) => (
                <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{point.data.x}</p>
                  <p className="text-sm text-emerald-600">Total: <span className="font-bold">Q{Number(point.data.y).toLocaleString()}</span></p>
                </div>
              ),
              defs: [
                {
                  id: 'lineGradient',
                  type: 'linearGradient',
                  colors: [
                    { offset: 0, color: '#10b981' },
                    { offset: 100, color: '#34d399' },
                  ],
                },
              ],
              areaBaselineValue: 0,
              areaOpacity: 0.15,
              area: true,
            };
            return <ResponsiveLine {...props} />;
          })()}
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            Cantidad de Ventas
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Total Generado
          </div>
        </div>
      </div>
    </div>
  );
}
