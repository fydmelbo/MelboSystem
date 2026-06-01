import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Legend
} from 'recharts';
import { MonthlySalesData } from '../services/statsService';
import React from 'react';

interface MonthlySalesChartProps {
  data: MonthlySalesData[];
}

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const chartData = data.map(item => ({
    name: months[item.month],
    ventas: item.numberOfSales,
    dinero: item.totalSales
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Ventas por Mes</h2>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#4B5563' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: '#4B5563' }}
              axisLine={{ stroke: '#E5E7EB' }}
              label={{ value: 'Cantidad de Ventas', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#4B5563' }}
              axisLine={{ stroke: '#E5E7EB' }}
              label={{ value: 'Dinero (Q)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              labelFormatter={(label) => label}
              formatter={(value: any, name: any, props: any) => {
                if (props.dataKey === 'dinero') {
                  return [`Q${value.toFixed(2)}`, 'Total Generado'];
                }
                return [value, 'Cantidad de Ventas'];
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="ventas" 
              fill="rgba(59, 130, 246, 0.7)" 
              stroke="rgb(37, 99, 235)" 
              strokeWidth={1}
              name="Cantidad de Ventas"
              barSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="dinero"
              stroke="#10B981"
              name="Total Generado"
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#059669' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}