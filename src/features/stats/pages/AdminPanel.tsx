import { useState, useEffect, useCallback } from 'react';
import { useStats } from '../hooks/useStats';
import { getFinancialMetrics, getProductsSalesStats } from '../services/statsService';
import { exportAdminExcel } from '../services/exportAdminExcel';
import { Loader2, Tag, Building2, BarChart3, TrendingUp, ShoppingCart, DollarSign, Package, Download } from 'lucide-react';
import MainLayout from '../../../components/layout/MainLayout';
import React from 'react';
import DateFilterBar, { DateFilter, createDateFilter } from '../components/DateFilterBar';
import RevenueChart from '../components/RevenueChart';
import TopProductsList from '../components/TopProductsList';
import PaymentMethodBreakdown from '../components/PaymentMethodBreakdown';
import EarningsStats from '../components/EarningsStats';
import CategoryRevenueChart from '../components/CategoryRevenueChart';
import LocationComparisonChart from '../components/LocationComparisonChart';
import InventoryAlerts from '../components/InventoryAlerts';
import FinancialMetrics from '../components/FinancialMetrics';
import ProductSalesStats from '../components/ProductSalesStats';
import CatalogManager from '../../products/components/CatalogManager';
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
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('');
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>(createDateFilter('mes'));

  const ubicacionFilter = isAdmin ? (selectedUbicacion || null) : (user?.ubicacion || null);
  const stats = useStats(ubicacionFilter, dateFilter);

  const [financialData, setFinancialData] = useState<any>(null);
  const [productStats, setProductStats] = useState<any[]>([]);
  const [loadingFinancial, setLoadingFinancial] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<PharmaceuticalCompany[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchFinancial = async () => {
      try {
        setLoadingFinancial(true);
        const startDate = dateFilter.startDate;
        const endDate = dateFilter.endDate;
        const [financial, products] = await Promise.all([
          getFinancialMetrics(ubicacionFilter, startDate, endDate),
          getProductsSalesStats(ubicacionFilter, startDate, endDate),
        ]);
        setFinancialData(financial);
        setProductStats(products);
      } catch (error) {
        console.error('Error al cargar métricas:', error);
      } finally {
        setLoadingFinancial(false);
      }
    };
    fetchFinancial();
  }, [ubicacionFilter, dateFilter.startDate?.getTime(), dateFilter.endDate?.getTime()]);

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

  const tabs: { id: TabId; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'categories', label: 'Categorías', icon: Tag, adminOnly: true },
    { id: 'companies', label: 'Casas Farmacéuticas', icon: Building2, adminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  const ubicacionNombre = selectedUbicacion
    ? ubicaciones.find(u => u._id === selectedUbicacion)?.nombre || ''
    : '';

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportAdminExcel(ubicacionFilter, dateFilter, ubicacionNombre);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
    } finally {
      setExporting(false);
    }
  };

  const kpiCards = [
    {
      label: 'Ingresos Totales',
      value: stats.totalRevenue,
      prefix: 'Q',
      format: 'currency',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Ventas Totales',
      value: stats.totalSales,
      icon: ShoppingCart,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Ticket Promedio',
      value: stats.averageTicket,
      prefix: 'Q',
      format: 'currency',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Productos Vendidos',
      value: stats.uniqueProducts,
      icon: Package,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f0f2f5]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Panel de Administración</h1>
                <p className="mt-1 text-sm text-gray-500">Gestiona las configuraciones y métricas de tu farmacia</p>
              </div>
              <div className="flex items-center gap-3">
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
                <button
                  onClick={handleExportExcel}
                  disabled={exporting || stats.loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exporting ? 'Exportando...' : 'Descargar Excel'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
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
            <div className="space-y-6">
              {/* Date Filter */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <DateFilterBar value={dateFilter} onChange={setDateFilter} />
              </motion.div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.loading ? (
                  Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                  kpiCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="bg-white rounded-2xl border border-gray-100/80 p-4 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                          <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500 truncate">{card.label}</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
                            {card.prefix || ''}{card.value.toLocaleString('es-GT', {
                              minimumFractionDigits: card.format === 'currency' ? 2 : 0,
                              maximumFractionDigits: card.format === 'currency' ? 2 : 0,
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {stats.loading ? (
                  <ChartSkeleton />
                ) : (
                  <RevenueChart data={stats.dailyData} />
                )}
              </motion.div>

              {/* Top Products + Earnings */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2"
                >
                  {stats.loading ? <ChartSkeleton /> : <TopProductsList products={stats.topProducts} />}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  {stats.loading ? <ChartSkeleton /> : (
                    <EarningsStats
                      periodEarnings={stats.paymentMethods.total}
                      previousPeriodEarnings={0}
                      changePercent={0}
                      firstHalfEarnings={stats.dailyData.slice(0, Math.ceil(stats.dailyData.length / 2)).reduce((s, d) => s + d.totalSales, 0)}
                      secondHalfEarnings={stats.dailyData.slice(Math.ceil(stats.dailyData.length / 2)).reduce((s, d) => s + d.totalSales, 0)}
                      salesCount={stats.totalSales}
                      averageTicket={stats.averageTicket}
                    />
                  )}
                </motion.div>
              </div>

              {/* Payment Methods + Category Revenue */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {stats.loading ? <ChartSkeleton /> : <PaymentMethodBreakdown data={stats.paymentMethods} />}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  {stats.loading ? <ChartSkeleton /> : <CategoryRevenueChart data={stats.categoryRevenue} />}
                </motion.div>
              </div>

              {/* Location Comparison (admin only) */}
              {isAdmin && stats.locationRevenue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <LocationComparisonChart data={stats.locationRevenue} />
                </motion.div>
              )}

              {/* Product Sales Stats + Financial Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  {loadingFinancial ? <ChartSkeleton /> : <ProductSalesStats products={productStats} />}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {stats.loading ? <ChartSkeleton /> : (
                    <EarningsStats
                      periodEarnings={stats.totalRevenue}
                      previousPeriodEarnings={0}
                      changePercent={0}
                      firstHalfEarnings={stats.dailyData.slice(0, Math.ceil(stats.dailyData.length / 2)).reduce((s, d) => s + d.totalSales, 0)}
                      secondHalfEarnings={stats.dailyData.slice(Math.ceil(stats.dailyData.length / 2)).reduce((s, d) => s + d.totalSales, 0)}
                      salesCount={stats.totalSales}
                      averageTicket={stats.averageTicket}
                    />
                  )}
                </motion.div>
              </div>

              {/* Financial Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                {loadingFinancial ? (
                  <ChartSkeleton />
                ) : financialData ? (
                  <FinancialMetrics data={financialData} />
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <p className="text-gray-500">No hay datos financieros disponibles</p>
                  </div>
                )}
              </motion.div>

              {/* Inventory Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {stats.loading ? (
                  <ChartSkeleton />
                ) : (
                  <InventoryAlerts
                    inventory={stats.inventory}
                    expiringProducts={stats.expiringProducts}
                    lowStockProducts={stats.lowStockProducts}
                  />
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
