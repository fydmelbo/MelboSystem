import { useEffect, useState } from 'react';
import { useStats } from '../hooks/useStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import MainLayout from '../../../components/layout/MainLayout';
import React from 'react';
import MonthlySalesChart from '../components/MonthlySalesChart';
import ProductSalesStats from '../components/ProductSalesStats';
import { getProductsSalesStats, getEarningsStats, getFinancialMetrics, DailySalesData } from '../services/statsService';
import EarningsStats from '../components/EarningsStats';
import FinancialMetrics from '../components/FinancialMetrics';
import DailySalesChart from '../components/DailySalesChart';


export default function AdminPanel() {
  const { topProducts, monthlyData, loading, selectedPeriod, setSelectedPeriod } = useStats();
  const [productStats, setProductStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [earningsData, setEarningsData] = useState({
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    previousWeekEarnings: 0,
    previousMonthEarnings: 0,
    firstFifteenDaysEarnings: 0,
    lastFifteenDaysEarnings: 0
  });
  const [financialMetrics, setFinancialMetrics] = useState({
    totalRevenue: 0,
    totalCost: 0,
    contributionMargin: 0,
    marginPercentage: 0,
    dailyMarginTrend: [] as any[],
    topProducts: [] as any[]
  });
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, earnings, financial,] = await Promise.all([
          getProductsSalesStats(),
          getEarningsStats(),
          getFinancialMetrics()
        ]);
        setProductStats(stats);
        setEarningsData(earnings);
        setFinancialMetrics(financial || {
          totalRevenue: 0,
          totalCost: 0,
          contributionMargin: 0,
          marginPercentage: 0,
          dailyMarginTrend: [] as any[],
          topProducts: [] as any[]
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="mt-2 text-sm text-gray-600">Monitorea las métricas importantes de tu farmacia en tiempo real</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                  <p className="text-xl font-semibold text-gray-900">
                    Q{topProducts.reduce((sum, product) => sum + product.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {topProducts.reduce((sum, product) => sum + product.totalUnits, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Promedio por Venta</p>
                  <p className="text-xl font-semibold text-gray-900">
                    Q{(topProducts.reduce((sum, product) => sum + product.totalAmount, 0) / (topProducts.length || 1)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Productos Diferentes</p>
                  <p className="text-xl font-semibold text-gray-900">{topProducts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Productos Más Vendidos</h2>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
              >
                <option value="day">Hoy</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mes</option>
              </select>
            </div>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.slice(0, 5)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#4B5563', fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: '#4B5563' }}
                    label={{ value: 'Total Vendido', angle: -90, position: 'insideLeft', fill: '#4B5563' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any, name: any, props: any) => {
                      const product = props.payload;
                      return [
                        <div className="space-y-1">
                          <p>Unidades: {product.salesByType?.unit || 0}</p>
                          <p>Blisters: {product.salesByType?.blister || 0}</p>
                          <p>Cajas: {product.salesByType?.box || 0}</p>
                          <p className="font-semibold">Total: Q{product.totalAmount.toFixed(2) || 0}</p>
                        </div>
                      ];
                    }}
                  />
                  <Bar
                    dataKey="totalUnits"
                    fill="rgba(59, 130, 246, 0.7)"
                    stroke="rgb(220, 9, 9)"
                    strokeWidth={1}
                    radius={[4, 4, 0, 0]}
                  >
                    {topProducts.slice(0, 5).map((entry, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? '#10B981' : 'rgba(59, 130, 246, 0.7)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Sales Chart - Moved here */}
          {!loading && monthlyData && monthlyData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <MonthlySalesChart data={monthlyData} />
            </div>
          )}

          {/* Product Stats Section */}
          {!loadingStats && productStats.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <ProductSalesStats products={productStats} />
            </div>
          )}

          {/* Financial Metrics Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Métricas Financieras</h2>
              <p className="mt-1 text-sm text-gray-600">Análisis detallado del margen de contribución</p>
            </div>
            <div className="p-6">
              {loadingStats ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : financialMetrics ? (
                <FinancialMetrics data={financialMetrics} />
              ) : (
                <p className="text-center text-gray-500">No hay datos financieros disponibles</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <EarningsStats
                weeklyEarnings={earningsData.weeklyEarnings}
                monthlyEarnings={earningsData.monthlyEarnings}
                previousWeekEarnings={earningsData.previousWeekEarnings}
                previousMonthEarnings={earningsData.previousMonthEarnings}
                firstFifteenDaysEarnings={earningsData.firstFifteenDaysEarnings}
                lastFifteenDaysEarnings={earningsData.lastFifteenDaysEarnings}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
