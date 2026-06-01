import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../../utils/format';

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

export default function FinancialMetrics({ data }: FinancialMetricsProps) {

  if (!data) {
    return <div>No hay datos disponibles</div>;
  }

  // Asegurar valores por defecto
  const safeData = {
    totalRevenue: data.totalRevenue ?? 0,
    totalCost: data.totalCost ?? 0,
    contributionMargin: data.contributionMargin ?? 0,
    marginPercentage: data.marginPercentage ?? 0,
    dailyMarginTrend: data.dailyMarginTrend ?? [],
    topProducts: data.topProducts ?? []
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Ingresos Totales</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeData.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Costos Totales</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(safeData.totalCost)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Margen de Contribución</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(safeData.contributionMargin)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Porcentaje de Margen</h3>
          <p className="text-2xl font-bold text-blue-600">{safeData.marginPercentage.toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Tendencia del Margen de Contribución</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeData.dailyMarginTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="#4B5563"
                tick={{ fill: '#4B5563' }}
              />
              <YAxis
                stroke="#4B5563"
                tick={{ fill: '#4B5563' }}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value) || 0)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#4B5563' }}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke="#10B981"
                name="Margen"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                name="Ingresos"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#EF4444"
                name="Costos"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Productos con Mayor Margen</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topProducts?.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(product.revenue) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(product.cost) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(product.margin) || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}