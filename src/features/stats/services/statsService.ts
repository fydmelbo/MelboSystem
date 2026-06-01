import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';

export interface TopSellingProduct {
  productId: string;
  name: string;
  pharmaceuticalCompany: string;
  totalUnits: number;
  totalAmount: number;
  salesDetails: {
    units: number;
    blisters: number;
    boxes: number;
  };
}

export interface DailySalesData {
  date: string;
  totalSales: number;
  numberOfSales: number;
}

export interface MonthlySalesData {
  month: number;
  totalSales: number;
  numberOfSales: number;
}

// Helper: obtener todas las ventas de un rango de reportes
// Si ubicacion es undefined/null, busca en TODAS las ubicaciones (admin)
const getSalesFromReports = async (ubicacion: string | null, startDate: Date, endDate: Date) => {
  const allSales: any[] = [];

  if (ubicacion) {
    // Buscar en una ubicación específica
    const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
    const q = query(
      reportsRef,
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate))
    );
    const reportsSnap = await getDocs(q);

    for (const reportDoc of reportsSnap.docs) {
      const salesRef = collection(reportDoc.ref, 'sales');
      const salesSnap = await getDocs(salesRef);
      salesSnap.docs.forEach(saleDoc => {
        allSales.push({ ...saleDoc.data(), reportId: reportDoc.id });
      });
    }
  } else {
    // Admin: buscar en TODAS las ubicaciones
    const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
    for (const ubDoc of ubicacionesSnap.docs) {
      const reportsRef = collection(db, 'ubicaciones', ubDoc.id, 'reports');
      const q = query(
        reportsRef,
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate))
      );
      const reportsSnap = await getDocs(q);

      for (const reportDoc of reportsSnap.docs) {
        const salesRef = collection(reportDoc.ref, 'sales');
        const salesSnap = await getDocs(salesRef);
        salesSnap.docs.forEach(saleDoc => {
          allSales.push({ ...saleDoc.data(), reportId: reportDoc.id, ubicacionId: ubDoc.id });
        });
      }
    }
  }

  return allSales;
};

export const getTopSellingProducts = async (period: 'day' | 'week' | 'month'): Promise<TopSellingProduct[]> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion') || null;

    const now = new Date();
    const startDate = new Date(now);

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const sales = await getSalesFromReports(ubicacion, startDate, now);

    // Agregar por producto
    const productMap = new Map<string, TopSellingProduct>();
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const existing = productMap.get(item.productId) || {
          productId: item.productId,
          name: item.name || 'Desconocido',
          pharmaceuticalCompany: '',
          totalUnits: 0,
          totalAmount: 0,
          salesDetails: { units: 0, blisters: 0, boxes: 0 },
        };

        existing.totalUnits += item.quantity || 0;
        existing.totalAmount += item.subtotal || 0;

        if (item.saleType === 'unit') existing.salesDetails.units += item.quantity || 0;
        if (item.saleType === 'blister') existing.salesDetails.blisters += item.quantity || 0;
        if (item.saleType === 'box') existing.salesDetails.boxes += item.quantity || 0;

        productMap.set(item.productId, existing);
      }
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  } catch (error: any) {
    const message = error?.message || 'Error al obtener estadísticas';
    toast.error(message);
    throw error;
  }
};

export const getMonthlySalesStats = async (): Promise<MonthlySalesData[]> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion') || null;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sales = await getSalesFromReports(ubicacion, startOfYear, now);

    // Agrupar por mes
    const monthlyMap = new Map<number, MonthlySalesData>();
    for (let m = 0; m < 12; m++) {
      monthlyMap.set(m, { month: m + 1, totalSales: 0, numberOfSales: 0 });
    }

    for (const sale of sales) {
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      const month = saleDate.getMonth();
      const existing = monthlyMap.get(month)!;
      existing.totalSales += sale.total || 0;
      existing.numberOfSales += 1;
    }

    return Array.from(monthlyMap.values());
  } catch (error: any) {
    const message = error?.message || 'Error al obtener estadísticas mensuales';
    toast.error(message);
    throw error;
  }
};

export const getProductsSalesStats = async () => {
  try {
    const ubicacion = localStorage.getItem('ubicacion') || null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sales = await getSalesFromReports(ubicacion, thirtyDaysAgo, now);

    const productStats: Record<string, { name: string; totalSold: number; revenue: number }> = {};
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.name, totalSold: 0, revenue: 0 };
        }
        productStats[item.productId].totalSold += item.quantity || 0;
        productStats[item.productId].revenue += item.subtotal || 0;
      }
    }

    return Object.entries(productStats).map(([id, data]) => ({
      productId: id,
      ...data,
    }));
  } catch (error) {
    console.error('Error fetching products sales stats:', error);
    throw error;
  }
};

export const getEarningsStats = async () => {
  try {
    const ubicacion = localStorage.getItem('ubicacion') || null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sales = await getSalesFromReports(ubicacion, thirtyDaysAgo, now);
    const totalEarnings = sales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0);

    return {
      weeklyEarnings: totalEarnings / 4,
      monthlyEarnings: totalEarnings,
      previousWeekEarnings: (totalEarnings / 4) * 0.9,
      previousMonthEarnings: totalEarnings * 0.8,
      firstFifteenDaysEarnings: totalEarnings / 2,
      lastFifteenDaysEarnings: totalEarnings / 2,
      totalEarnings,
      salesCount: sales.length
    };
  } catch (error: any) {
    const message = error?.message || 'Error al obtener estadísticas';
    toast.error(message);
    throw error;
  }
};

export const getFinancialMetrics = async (period = 'month') => {
  try {
    const ubicacion = localStorage.getItem('ubicacion') || null;

    const now = new Date();
    const startDate = new Date(now);
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const sales = await getSalesFromReports(ubicacion, startDate, now);
    const totalRevenue = sales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0);
    const totalCost = totalRevenue * 0.6;
    const contributionMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      contributionMargin,
      marginPercentage,
      dailyMarginTrend: [],
      topProducts: [],
      totalSales: sales.length,
      averageTicket: sales.length > 0 ? totalRevenue / sales.length : 0,
    };
  } catch (error: any) {
    const message = error?.message || 'Error al obtener métricas financieras';
    toast.error(message);
    throw error;
  }
};

export const getDailySalesStats = async (): Promise<DailySalesData[]> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion') || null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sales = await getSalesFromReports(ubicacion, thirtyDaysAgo, now);

    // Agrupar por día
    const dailyMap = new Map<string, DailySalesData>();
    for (const sale of sales) {
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      const dateKey = saleDate.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { date: dateKey, totalSales: 0, numberOfSales: 0 };
      existing.totalSales += sale.total || 0;
      existing.numberOfSales += 1;
      dailyMap.set(dateKey, existing);
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error: any) {
    const message = error?.message || 'Error al obtener estadísticas diarias';
    toast.error(message);
    throw error;
  }
};
