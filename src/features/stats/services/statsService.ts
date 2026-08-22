import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';

export interface TopSellingProduct {
  productId: string;
  name: string;
  pharmaceuticalCompany: string;
  category: string;
  totalUnits: number;
  totalAmount: number;
  totalCost: number;
  profit: number;
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

export interface PaymentMethodData {
  efectivo: number;
  TC: number;
  transferencia: number;
  total: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  units: number;
}

export interface LocationRevenue {
  ubicacionId: string;
  ubicacionNombre: string;
  revenue: number;
  salesCount: number;
  averageTicket: number;
}

export interface InventorySummary {
  totalProducts: number;
  totalValueAtCost: number;
  totalValueAtRetail: number;
  totalUnits: number;
  lowStockCount: number;
  expiringSoonCount: number;
  outOfStockCount: number;
}

export interface ExpiringProduct {
  productId: string;
  name: string;
  expirationDate: string;
  daysUntilExpiration: number;
  stock: number;
  ubicacionId: string;
  ubicacionNombre: string;
}

export interface LowStockProduct {
  productId: string;
  name: string;
  currentStock: number;
  category: string;
  ubicacionId: string;
  ubicacionNombre: string;
}

export interface ProductMarginRanking {
  productId: string;
  name: string;
  category: string;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  unitsSold: number;
}

export interface SalesByDayOfWeek {
  day: string;
  salesCount: number;
  revenue: number;
}

const getSalesFromReports = async (ubicacion: string | null, startDate: Date, endDate: Date) => {
  const allSales: any[] = [];

  if (ubicacion) {
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
        allSales.push({ ...saleDoc.data(), reportId: reportDoc.id, ubicacionId: ubicacion });
      });
    }
  } else {
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

const getUbicacionesMap = async (): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  const snap = await getDocs(collection(db, 'ubicaciones'));
  snap.docs.forEach(doc => {
    map.set(doc.id, doc.data().nombre || doc.id);
  });
  return map;
};

const defaultStart = (now: Date, daysBack: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysBack);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getTopSellingProducts = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<TopSellingProduct[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 7);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);

    const productMap = new Map<string, TopSellingProduct>();
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const existing = productMap.get(item.productId) || {
          productId: item.productId,
          name: item.name || 'Desconocido',
          pharmaceuticalCompany: '',
          category: '',
          totalUnits: 0,
          totalAmount: 0,
          totalCost: 0,
          profit: 0,
          salesDetails: { units: 0, blisters: 0, boxes: 0 },
        };

        existing.totalUnits += item.quantity || 0;
        existing.totalAmount += item.subtotal || 0;
        existing.totalCost += (item.purchasePrice || 0) * (item.quantity || 0);

        if (item.saleType === 'unit') existing.salesDetails.units += item.quantity || 0;
        if (item.saleType === 'blister') existing.salesDetails.blisters += item.quantity || 0;
        if (item.saleType === 'box') existing.salesDetails.boxes += item.quantity || 0;

        productMap.set(item.productId, existing);
      }
    }

    return Array.from(productMap.values())
      .map(p => ({ ...p, profit: p.totalAmount - p.totalCost }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 15);
  } catch (error: any) {
    toast.error(error?.message || 'Error al obtener estadísticas');
    throw error;
  }
};

export const getMonthlySalesStats = async (ubicacion?: string | null): Promise<MonthlySalesData[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sales = await getSalesFromReports(ubicacionFilter, startOfYear, now);

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
    toast.error(error?.message || 'Error al obtener estadísticas mensuales');
    throw error;
  }
};

export const getProductsSalesStats = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);

    const productStats: Record<string, { name: string; totalSold: number; revenue: number; cost: number }> = {};
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.name, totalSold: 0, revenue: 0, cost: 0 };
        }
        productStats[item.productId].totalSold += item.quantity || 0;
        productStats[item.productId].revenue += item.subtotal || 0;
        productStats[item.productId].cost += (item.purchasePrice || 0) * (item.quantity || 0);
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

export const getEarningsStats = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const periodDays = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const previousPeriodStart = new Date(start);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    const [currentSales, previousSales] = await Promise.all([
      getSalesFromReports(ubicacionFilter, start, now),
      getSalesFromReports(ubicacionFilter, previousPeriodStart, start),
    ]);

    const totalEarnings = currentSales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0);
    const previousTotalEarnings = previousSales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0);

    const halfPeriod = new Date(start);
    halfPeriod.setDate(halfPeriod.getDate() + Math.ceil(periodDays / 2));

    const firstHalfEarnings = currentSales
      .filter((sale: any) => {
        const d = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
        return d < halfPeriod;
      })
      .reduce((acc: number, sale: any) => acc + (sale.total || 0), 0);

    const secondHalfEarnings = totalEarnings - firstHalfEarnings;

    const changePercent = previousTotalEarnings === 0 ? 0 : ((totalEarnings - previousTotalEarnings) / previousTotalEarnings) * 100;

    return {
      periodEarnings: totalEarnings,
      previousPeriodEarnings: previousTotalEarnings,
      changePercent,
      firstHalfEarnings,
      secondHalfEarnings,
      salesCount: currentSales.length,
      averageTicket: currentSales.length > 0 ? totalEarnings / currentSales.length : 0,
    };
  } catch (error: any) {
    toast.error(error?.message || 'Error al obtener estadísticas');
    throw error;
  }
};

export const getFinancialMetrics = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);
    const totalRevenue = sales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0);

    let totalCost = 0;
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        totalCost += (item.purchasePrice || 0) * (item.quantity || 0);
      }
    }

    if (totalCost === 0 && totalRevenue > 0) {
      totalCost = totalRevenue * 0.6;
    }

    const contributionMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;

    const dailyMap = new Map<string, { revenue: number; cost: number; margin: number }>();
    for (const sale of sales) {
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      const dateKey = saleDate.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { revenue: 0, cost: 0, margin: 0 };
      existing.revenue += sale.total || 0;
      for (const item of (sale.items || [])) {
        existing.cost += (item.purchasePrice || 0) * (item.quantity || 0);
      }
      existing.margin = existing.revenue - existing.cost;
      dailyMap.set(dateKey, existing);
    }

    const dailyMarginTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    const productMap = new Map<string, { name: string; revenue: number; cost: number }>();
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const existing = productMap.get(item.productId) || { name: item.name, revenue: 0, cost: 0 };
        existing.revenue += item.subtotal || 0;
        existing.cost += (item.purchasePrice || 0) * (item.quantity || 0);
        productMap.set(item.productId, existing);
      }
    }

    const topProducts = Array.from(productMap.values())
      .map(data => ({
        name: data.name,
        revenue: data.revenue,
        cost: data.cost,
        margin: data.revenue - data.cost,
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);

    return {
      totalRevenue,
      totalCost,
      contributionMargin,
      marginPercentage,
      dailyMarginTrend,
      topProducts,
      totalSales: sales.length,
      averageTicket: sales.length > 0 ? totalRevenue / sales.length : 0,
    };
  } catch (error: any) {
    toast.error(error?.message || 'Error al obtener métricas financieras');
    throw error;
  }
};

export const getDailySalesStats = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<DailySalesData[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);

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
    toast.error(error?.message || 'Error al obtener estadísticas diarias');
    throw error;
  }
};

export const getPaymentMethodBreakdown = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<PaymentMethodData> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);

    const breakdown: PaymentMethodData = { efectivo: 0, TC: 0, transferencia: 0, total: 0 };

    for (const sale of sales) {
      const amount = sale.total || 0;
      breakdown.total += amount;

      const pt = sale.paymentType;
      if (pt && typeof pt === 'object' && pt.type === 'multiple') {
        breakdown.efectivo += pt.paymentDetails?.efectivo || 0;
        breakdown.TC += pt.paymentDetails?.TC || 0;
        breakdown.transferencia += pt.paymentDetails?.transferencia || 0;
      } else if (pt === 'efectivo' || (pt && typeof pt === 'object' && pt.type === 'efectivo')) {
        breakdown.efectivo += amount;
      } else if (pt === 'TC' || (pt && typeof pt === 'object' && pt.type === 'TC')) {
        breakdown.TC += amount;
      } else if (pt === 'transferencia' || (pt && typeof pt === 'object' && pt.type === 'transferencia')) {
        breakdown.transferencia += amount;
      } else {
        breakdown.efectivo += amount;
      }
    }

    return breakdown;
  } catch (error: any) {
    toast.error('Error al obtener métodos de pago');
    throw error;
  }
};

export const getRevenueByCategory = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<CategoryRevenue[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);

    const categoryMap = new Map<string, CategoryRevenue>();

    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const category = item.category || 'Sin categoría';
        const existing = categoryMap.get(category) || { category, revenue: 0, units: 0 };
        existing.revenue += item.subtotal || 0;
        existing.units += item.quantity || 0;
        categoryMap.set(category, existing);
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);
  } catch (error: any) {
    toast.error('Error al obtener ingresos por categoría');
    throw error;
  }
};

export const getRevenueByLocation = async (
  startDate?: Date,
  endDate?: Date
): Promise<LocationRevenue[]> => {
  try {
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
    const results: LocationRevenue[] = [];

    for (const ubDoc of ubicacionesSnap.docs) {
      const ubId = ubDoc.id;
      const ubNombre = ubDoc.data().nombre || ubId;
      const sales = await getSalesFromReports(ubId, start, now);
      const revenue = sales.reduce((acc: number, s: any) => acc + (s.total || 0), 0);
      results.push({
        ubicacionId: ubId,
        ubicacionNombre: ubNombre,
        revenue,
        salesCount: sales.length,
        averageTicket: sales.length > 0 ? revenue / sales.length : 0,
      });
    }

    return results.sort((a, b) => b.revenue - a.revenue);
  } catch (error: any) {
    toast.error('Error al obtener ingresos por ubicación');
    throw error;
  }
};

export const getInventorySummary = async (ubicacion?: string | null): Promise<InventorySummary> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let allProducts: any[] = [];

    if (ubicacionFilter) {
      const snap = await getDocs(collection(db, 'ubicaciones', ubicacionFilter, 'products'));
      snap.docs.forEach(doc => {
        allProducts.push({ ...doc.data(), _id: doc.id, ubicacionId: ubicacionFilter });
      });
    } else {
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      for (const ubDoc of ubicacionesSnap.docs) {
        const snap = await getDocs(collection(db, 'ubicaciones', ubDoc.id, 'products'));
        snap.docs.forEach(doc => {
          allProducts.push({ ...doc.data(), _id: doc.id, ubicacionId: ubDoc.id });
        });
      }
    }

    let totalValueAtCost = 0;
    let totalValueAtRetail = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0;
    let outOfStockCount = 0;

    for (const product of allProducts) {
      const units = product.stock?.units || 0;
      totalUnits += units;
      totalValueAtCost += (product.purchasePrices?.unit || 0) * units;
      totalValueAtRetail += (product.prices?.unit || 0) * units;

      if (units === 0) outOfStockCount++;
      else if (units <= 5) lowStockCount++;

      const expDate = product.expirationDate ? new Date(product.expirationDate) : null;
      if (expDate && expDate <= thirtyDaysFromNow && expDate > now) {
        expiringSoonCount++;
      }
    }

    return {
      totalProducts: allProducts.length,
      totalValueAtCost,
      totalValueAtRetail,
      totalUnits,
      lowStockCount,
      expiringSoonCount,
      outOfStockCount,
    };
  } catch (error: any) {
    toast.error('Error al obtener resumen de inventario');
    throw error;
  }
};

export const getExpiringProducts = async (
  ubicacion?: string | null,
  daysAhead: number = 30
): Promise<ExpiringProduct[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    let allProducts: any[] = [];

    if (ubicacionFilter) {
      const snap = await getDocs(collection(db, 'ubicaciones', ubicacionFilter, 'products'));
      snap.docs.forEach(doc => {
        allProducts.push({ ...doc.data(), _id: doc.id, ubicacionId: ubicacionFilter });
      });
    } else {
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      for (const ubDoc of ubicacionesSnap.docs) {
        const snap = await getDocs(collection(db, 'ubicaciones', ubDoc.id, 'products'));
        snap.docs.forEach(doc => {
          allProducts.push({ ...doc.data(), _id: doc.id, ubicacionId: ubDoc.id });
        });
      }
    }

    const ubicacionesMap = await getUbicacionesMap();

    return allProducts
      .filter(p => {
        const expDate = p.expirationDate ? new Date(p.expirationDate) : null;
        return expDate && expDate > now && expDate <= cutoffDate;
      })
      .map(p => {
        const expDate = new Date(p.expirationDate);
        const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          productId: p._id,
          name: p.name,
          expirationDate: p.expirationDate,
          daysUntilExpiration: daysUntil,
          stock: p.stock?.units || 0,
          ubicacionId: p.ubicacionId,
          ubicacionNombre: ubicacionesMap.get(p.ubicacionId) || p.ubicacionId,
        };
      })
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  } catch (error: any) {
    toast.error('Error al obtener productos por vencer');
    throw error;
  }
};

export const getLowStockProducts = async (
  ubicacion?: string | null,
  threshold: number = 5
): Promise<LowStockProduct[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);

    let allProducts: any[] = [];

    if (ubicacionFilter) {
      const snap = await getDocs(collection(db, 'ubicaciones', ubicacionFilter, 'products'));
      snap.docs.forEach(doc => {
        allProducts.push({ ...doc.data(), _id: doc.id, ubicacionId: ubicacionFilter });
      });
    } else {
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      for (const ubDoc of ubicacionesSnap.docs) {
        const snap = await getDocs(collection(db, 'ubicaciones', ubDoc.id, 'products'));
        snap.docs.forEach(doc => {
          allProducts.push({ ...doc.data(), _id: doc.id, ubicacionId: ubDoc.id });
        });
      }
    }

    const ubicacionesMap = await getUbicacionesMap();

    return allProducts
      .filter(p => (p.stock?.units || 0) <= threshold)
      .map(p => ({
        productId: p._id,
        name: p.name,
        currentStock: p.stock?.units || 0,
        category: p.category || '',
        ubicacionId: p.ubicacionId,
        ubicacionNombre: ubicacionesMap.get(p.ubicacionId) || p.ubicacionId,
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
  } catch (error: any) {
    toast.error('Error al obtener productos con stock bajo');
    throw error;
  }
};

export const getSalesByDayOfWeek = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<SalesByDayOfWeek[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayMap = new Map<string, SalesByDayOfWeek>();
    days.forEach(d => dayMap.set(d, { day: d, salesCount: 0, revenue: 0 }));

    for (const sale of sales) {
      const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      const dayName = days[saleDate.getDay()];
      const existing = dayMap.get(dayName)!;
      existing.salesCount += 1;
      existing.revenue += sale.total || 0;
    }

    return Array.from(dayMap.values());
  } catch (error: any) {
    toast.error('Error al obtener ventas por día');
    throw error;
  }
};

export const getMarginRanking = async (
  ubicacion?: string | null,
  startDate?: Date,
  endDate?: Date
): Promise<ProductMarginRanking[]> => {
  try {
    const ubicacionFilter = ubicacion !== undefined ? ubicacion : (localStorage.getItem('ubicacion') || null);
    const now = endDate || new Date();
    const start = startDate || defaultStart(now, 30);

    const sales = await getSalesFromReports(ubicacionFilter, start, now);

    const productMap = new Map<string, { name: string; category: string; revenue: number; cost: number; unitsSold: number }>();
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const existing = productMap.get(item.productId) || { name: item.name, category: '', revenue: 0, cost: 0, unitsSold: 0 };
        existing.revenue += item.subtotal || 0;
        existing.cost += (item.purchasePrice || 0) * (item.quantity || 0);
        existing.unitsSold += item.quantity || 0;
        productMap.set(item.productId, existing);
      }
    }

    return Array.from(productMap.entries())
      .map(([, data]) => ({
        productId: '',
        name: data.name,
        category: data.category,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
        marginPercent: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
        unitsSold: data.unitsSold,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  } catch (error: any) {
    toast.error('Error al obtener ranking de márgenes');
    throw error;
  }
};
