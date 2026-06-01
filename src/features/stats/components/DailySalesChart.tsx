import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DailySalesData } from '../services/statsService';

interface DailySalesChartProps {
    data: DailySalesData[];
}

export default function DailySalesChart({ data }: DailySalesChartProps) {
    const chartData = data.map(item => ({
        name: format(new Date(item.date), 'dd MMM', { locale: es }),
        ventas: item.numberOfSales,
        total: item.totalSales
    }));

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Ventas por Día</h2>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#4B5563' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis
                            tick={{ fill: '#4B5563' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: any, name: any) => [
                                value,
                                name === 'ventas' ? 'Ventas' : 'Total Q'
                            ]}
                        />
                        <Line
                            type="monotone"
                            dataKey="ventas"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}