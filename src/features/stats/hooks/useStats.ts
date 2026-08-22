import { useState, useEffect, useCallback } from 'react';
import {
  TopSellingProduct,
  MonthlySalesData,
  DailySalesData,
  PaymentMethodData,
  CategoryRevenue,
  LocationRevenue,
  InventorySummary,
  ExpiringProduct,
  LowStockProduct,
  ProductMarginRanking,
  SalesByDayOfWeek,
  getTopSellingProducts,
  getMonthlySalesStats,
  getDailySalesStats,
  getPaymentMethodBreakdown,
  getRevenueByCategory,
  getRevenueByLocation,
  getInventorySummary,
  getExpiringProducts,
  getLowStockProducts,
  getSalesByDayOfWeek,
  getMarginRanking,
} from '../services/statsService';
import { DateFilter } from '../components/DateFilterBar';

export interface DashboardData {
  topProducts: TopSellingProduct[];
  monthlyData: MonthlySalesData[];
  dailyData: DailySalesData[];
  paymentMethods: PaymentMethodData;
  categoryRevenue: CategoryRevenue[];
  locationRevenue: LocationRevenue[];
  inventory: InventorySummary;
  expiringProducts: ExpiringProduct[];
  lowStockProducts: LowStockProduct[];
  salesByDayOfWeek: SalesByDayOfWeek[];
  marginRanking: ProductMarginRanking[];
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
  uniqueProducts: number;
}

export function useStats(ubicacion?: string | null, dateFilter?: DateFilter) {
  const [data, setData] = useState<DashboardData>({
    topProducts: [],
    monthlyData: [],
    dailyData: [],
    paymentMethods: { efectivo: 0, TC: 0, transferencia: 0, total: 0 },
    categoryRevenue: [],
    locationRevenue: [],
    inventory: { totalProducts: 0, totalValueAtCost: 0, totalValueAtRetail: 0, totalUnits: 0, lowStockCount: 0, expiringSoonCount: 0, outOfStockCount: 0 },
    expiringProducts: [],
    lowStockProducts: [],
    salesByDayOfWeek: [],
    marginRanking: [],
    totalRevenue: 0,
    totalSales: 0,
    averageTicket: 0,
    uniqueProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      const startDate = dateFilter?.startDate;
      const endDate = dateFilter?.endDate;

      const [
        topProducts,
        monthlyData,
        dailyData,
        paymentMethods,
        categoryRevenue,
        inventory,
        expiringProducts,
        lowStockProducts,
        salesByDayOfWeek,
        marginRanking,
      ] = await Promise.all([
        getTopSellingProducts(ubicacion, startDate, endDate),
        getMonthlySalesStats(ubicacion),
        getDailySalesStats(ubicacion, startDate, endDate),
        getPaymentMethodBreakdown(ubicacion, startDate, endDate),
        getRevenueByCategory(ubicacion, startDate, endDate),
        getInventorySummary(ubicacion),
        getExpiringProducts(ubicacion),
        getLowStockProducts(ubicacion),
        getSalesByDayOfWeek(ubicacion, startDate, endDate),
        getMarginRanking(ubicacion, startDate, endDate),
      ]);

      let locationRevenue: LocationRevenue[] = [];
      if (!ubicacion) {
        locationRevenue = await getRevenueByLocation(startDate, endDate);
      }

      const totalRevenue = topProducts.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalSales = dailyData.reduce((sum, d) => sum + d.numberOfSales, 0);
      const uniqueProducts = topProducts.length;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      setData({
        topProducts,
        monthlyData,
        dailyData,
        paymentMethods,
        categoryRevenue,
        locationRevenue,
        inventory,
        expiringProducts,
        lowStockProducts,
        salesByDayOfWeek,
        marginRanking,
        totalRevenue,
        totalSales,
        averageTicket,
        uniqueProducts,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas', error);
    } finally {
      setLoading(false);
    }
  }, [ubicacion, dateFilter?.startDate?.getTime(), dateFilter?.endDate?.getTime()]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...data,
    loading,
    refreshStats: fetchStats,
  };
}
