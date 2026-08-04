import { useEffect, useState, useCallback } from 'react';
import { useStats } from '../hooks/useStats';
import { ResponsiveBar } from '@nivo/bar';
import { Loader2, TrendingUp, Package, DollarSign, Tag, Building2, ShoppingCart, BarChart3 } from 'lucide-react';
import MainLayout from '../../../components/layout/MainLayout';
import React from 'react';
import MonthlySalesChart from '../components/MonthlySalesChart';
import ProductSalesStats from '../components/ProductSalesStats';
import { getProductsSalesStats, getEarningsStats, getFinancialMetrics } from '../services/statsService';
import EarningsStats from '../components/EarningsStats';
import FinancialMetrics from '../components/FinancialMetrics';
import DailySalesChart from '../components/DailySalesChart';
import CatalogManager from '../../products/components/CatalogManager';
import AnimatedCounter from '../../../components/ui/AnimatedCounter';
import { StatCardSkeleton, ChartSkeleton } from '../../../components/ui/Skeleton';
import { motion } from 'framer-motion';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  Category,
  getPharmaceuticalCompanies,
  addPharmaceuticalCompany,
  updatePharmaceuticalCompany,
  deletePharmaceuticalCompany,
  PharmaceuticalCompany,
} from '../../products/services/catalogService';
import { useAuth } from '../../auth/context/AuthContext';
import { ubicacionesAPI } from '../../../lib/api';

type TabId = 'dashboard' | 'categories' | 'companies';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('');
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);

  const ubicacionFilter = isAdmin ? (selectedUbicacion || null) : (user?.ubicacion || null);
  const { topProducts, monthlyData, loading, selectedPeriod, setSelectedPeriod } = useStats(ubicacionFilter);
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<PharmaceuticalCompany[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, earnings, financial] = await Promise.all([
          getProductsSalesStats(ubicacionFilter),
          getEarningsStats(ubicacionFilter),
          getFinancialMetrics('month', ubicacionFilter)
        ]);
        setProductStats(stats);
        setEarningsData(earnings);
        setFinancialMetrics(financial || {
          totalRevenue: 0,
          totalCost: 0,
          contributionMargin: 0,
          marginPercentage: 0,
          dailyMarginTrend: [],
          topProducts: []
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    setLoadingStats(true);
    fetchData();
  }, [ubicacionFilter]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try { setCategories(await getCategories()); } catch {} finally { setLoadingCategories(false); }
  }, []);

  const loadCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try { setCompanies(await getPharmaceuticalCompanies()); } catch {} finally { setLoadingCompanies(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'companies') loadCompanies();
  }, [activeTab, loadCategories, loadCompanies]);

  useEffect(() => {
    if (isAdmin) {
      ubicacionesAPI.getUbicaciones().then(setUbicaciones).catch(() => {});
    }
  }, [isAdmin]);

  const totalSales = topProducts.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalUnits = topProducts.reduce((sum, p) => sum + p.totalUnits, 0);
  const avgPerSale = topProducts.length > 0 ? totalSales / topProducts.length : 0;

  const tabs: { id: TabId; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'categories', label: 'Categorías', icon: Tag, adminOnly: true },
    { id: 'companies', label: 'Casas Farmacéuticas', icon: Building2, adminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  const kpiCards = [
    { label: 'Ventas Totales', value: totalSales, prefix: 'Q', format: 'currency', icon: TrendingUp, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Productos Vendidos', value: totalUnits, icon: ShoppingCart, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Promedio/Venta', value: avgPerSale, prefix: 'Q', format: 'currency', icon: DollarSign, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Diferentes', value: topProducts.length, icon: Package, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f0f2f5]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Panel de Administración</h1>
                <p className="mt-2 text-sm text-gray-500">Gestiona las configuraciones y métricas de tu farmacia</p>
              </div>
              {isAdmin && ubicaciones.length > 0 && (
                <select
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all bg-white min-w-[200px]"
                  value={selectedUbicacion}
                  onChange={(e) => setSelectedUbicacion(e.target.value)}
                >
                  <option value="">Todas las ubicaciones</option>
                  {ubicaciones.map((ub) => (
                    <option key={ub._id} value={ub._id}>{ub.nombre}</option>
                  ))}
                </select>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex gap-1 bg-gray-100/80 p-1 rounded-2xl backdrop-blur-sm">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-0 ${
                    activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {loadingStats ? (
                  Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                  kpiCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="bg-white rounded-2xl border border-gray-100/80 p-3 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 sm:p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                          <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{card.label}</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums">
                            <AnimatedCounter
                              value={card.value}
                              prefix={card.prefix || ''}
                              decimals={card.format === 'currency' ? 2 : 0}
                            />
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Top Products + Daily Sales */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="xl:col-span-2 bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden"
                >
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">Productos Más Vendidos</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Top 5 por cantidad vendida</p>
                    </div>
                    <select
                      className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all bg-white"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
                    >
                      <option value="day">Hoy</option>
                      <option value="week">Esta Semana</option>
                      <option value="month">Este Mes</option>
                    </select>
                  </div>
                  <div className="p-4 sm:p-6">
                    {loading ? (
                      <div className="h-80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                      </div>
                    ) : (
                      <div className="h-80">
                        {(() => {
                          const props: any = {
                            data: topProducts.slice(0, 5).map((p, i) => ({
                              name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
                              fullName: p.name,
                              totalUnits: p.totalUnits || 0,
                              totalAmount: p.totalAmount || 0,
                              salesByType: {
                                unit: p.salesDetails?.units || 0,
                                blister: p.salesDetails?.blisters || 0,
                                box: p.salesDetails?.boxes || 0,
                              },
                              index: i,
                            })),
                            keys: ['totalUnits'],
                            indexBy: 'name',
                            margin: { top: 20, right: 20, bottom: 60, left: 40 },
                            padding: 0.3,
                            colors: ["url(#adminGradient)"],
                            borderRadius: 6,
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
                            enableLabel: false,
                            tooltip: ({ data }: any) => (
                              <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
                                <p className="text-sm font-semibold text-gray-900 mb-1">{data.fullName}</p>
                                <div className="space-y-0.5 text-sm">
                                  <p className="text-gray-500">Unidades: <span className="font-semibold text-gray-900">{data.salesByType?.unit || 0}</span></p>
                                  <p className="text-gray-500">Blisters: <span className="font-semibold text-gray-900">{data.salesByType?.blister || 0}</span></p>
                                  <p className="text-gray-500">Cajas: <span className="font-semibold text-gray-900">{data.salesByType?.box || 0}</span></p>
                                  <p className="text-gray-500 pt-1 border-t border-gray-100">Total: <span className="font-bold text-gray-900">Q{(data.totalAmount || 0).toFixed(2)}</span></p>
                                </div>
                              </div>
                            ),
                            defs: [
                              {
                                id: 'adminGradient',
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
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <EarningsStats
                    weeklyEarnings={earningsData.weeklyEarnings}
                    monthlyEarnings={earningsData.monthlyEarnings}
                    previousWeekEarnings={earningsData.previousWeekEarnings}
                    previousMonthEarnings={earningsData.previousMonthEarnings}
                    firstFifteenDaysEarnings={earningsData.firstFifteenDaysEarnings}
                    lastFifteenDaysEarnings={earningsData.lastFifteenDaysEarnings}
                  />
                </motion.div>
              </div>

              {/* Monthly + Product Stats */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {!loading && monthlyData && monthlyData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <MonthlySalesChart data={monthlyData} />
                  </motion.div>
                )}

                {!loadingStats && productStats.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <ProductSalesStats products={productStats} />
                  </motion.div>
                )}
              </div>

              {/* Financial Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {loadingStats ? (
                  <ChartSkeleton />
                ) : financialMetrics ? (
                  <FinancialMetrics data={financialMetrics} />
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
                    <p className="text-gray-500">No hay datos financieros disponibles</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CatalogManager
                title="Categorías"
                entityLabel="Categoría"
                items={categories}
                loading={loadingCategories}
                onAdd={async (name) => { await addCategory(name); }}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
                onRefresh={loadCategories}
              />
            </motion.div>
          )}

          {activeTab === 'companies' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CatalogManager
                title="Casas Farmacéuticas"
                entityLabel="Casa Farmacéutica"
                items={companies}
                loading={loadingCompanies}
                onAdd={async (name) => { await addPharmaceuticalCompany(name); }}
                onUpdate={updatePharmaceuticalCompany}
                onDelete={deletePharmaceuticalCompany}
                onRefresh={loadCompanies}
              />
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
