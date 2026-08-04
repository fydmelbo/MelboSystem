import { useState, useEffect } from 'react';
import { TopSellingProduct, MonthlySalesData, getTopSellingProducts, getMonthlySalesStats } from '../services/statsService';

export function useStats(ubicacion?: string | null) {
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [productsData, monthlyStats] = await Promise.all([
        getTopSellingProducts(selectedPeriod, ubicacion),
        getMonthlySalesStats(ubicacion)
      ]);
      setTopProducts(productsData);
      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error('Error al cargar estadísticas', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod, ubicacion]);

  return {
    topProducts,
    monthlyData,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    refreshStats: fetchStats
  };
} 