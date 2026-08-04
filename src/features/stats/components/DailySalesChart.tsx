import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DailySalesData } from '../services/statsService';

interface DailySalesChartProps {
  data: DailySalesData[];
}

export default function DailySalesChart({ data }: DailySalesChartProps) {
  const VentasData = [
    {
      id: 'Ventas',
      data: data.map(item => ({
        x: format(new Date(item.date), 'dd MMM', { locale: es }),
        y: item.numberOfSales,
      })),
    },
  ];

  const TotalData = [
    {
      id: 'Total Q',
      data: data.map(item => ({
        x: format(new Date(item.date), 'dd MMM', { locale: es }),
        y: item.totalSales,
      })),
    },
  ];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Ventas por Día</h2>
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveLine
          data={VentasData}
          margin={{ top: 20, right: 60, bottom: 40, left: 40 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
          }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 12,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
          }}
          axisRight={{
            tickSize: 0,
            tickPadding: 10,
          }}
          enableGridY={true}
          gridYValues={5}
          theme={{
            grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
            axis: {
              domain: { line: { stroke: 'transparent' } },
              ticks: { text: { fill: '#94a3b8' } as any },
            },
          } as any}
          colors={['#3b82f6']}
          pointSize={5}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'color' }}
          useMesh={true}
          enableCrosshair={true}
          crosshairType="bottom"
          tooltip={({ point }) => (
            <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{point.data.x}</p>
              <p className="text-sm text-blue-600">Ventas: <span className="font-bold">{point.data.y}</span></p>
            </div>
          )}
        />
      </div>
      <div className="mt-4 sm:h-48">
        {(() => {
          const props: any = {
            data: TotalData,
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
            theme: {
              grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
              axis: {
                domain: { line: { stroke: 'transparent' } },
                ticks: { text: { fill: '#94a3b8' } },
              },
            },
            colors: ['#10b981'],
            pointSize: 5,
            pointColor: { theme: 'background' },
            pointBorderWidth: 2,
            pointBorderColor: { from: 'color' },
            useMesh: true,
            enableCrosshair: true,
            crosshairType: 'bottom',
            area: true,
            areaBaselineValue: 0,
            areaOpacity: 0.15,
            tooltip: ({ point }: any) => (
              <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{point.data.x}</p>
                <p className="text-sm text-emerald-600">Total: <span className="font-bold">Q{Number(point.data.y).toLocaleString()}</span></p>
              </div>
            ),
          };
          return <ResponsiveLine {...props} />;
        })()}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          Cantidad de Ventas
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          Total Generado
        </div>
      </div>
    </div>
  );
}
