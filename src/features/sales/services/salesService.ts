import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Product } from '../../../features/products/types/Product';
import { SaleItem } from '../types/Sale';
import toast from 'react-hot-toast';
import { deductUnitsFromStock, increaseUnitsToStock, normalizeFromUnits } from '../../products/utils/stockMath';
import { Promotion } from '../../promotions/types/Promotion';

export const findProductByBarcodeService = async (
  barcode: string,
  ubicacionOverride?: string | null
): Promise<Product> => {
  try {
    const ubicacion = ubicacionOverride ?? localStorage.getItem('ubicacion');
    
    // Buscar primero en la ubicación actual
    if (ubicacion) {
      const q = query(
        collection(db, 'ubicaciones', ubicacion, 'products'),
        where('barcode', '==', barcode)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        return { _id: d.id, location: { _id: ubicacion }, ...d.data() } as unknown as Product;
      }
    }

    // Fallback: buscar en todas las ubicaciones
    const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
    for (const ubDoc of ubicacionesSnap.docs) {
      const q = query(
        collection(db, 'ubicaciones', ubDoc.id, 'products'),
        where('barcode', '==', barcode)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        return { _id: d.id, location: { _id: ubDoc.id }, ...d.data() } as unknown as Product;
      }
    }

    throw new Error('Producto no encontrado');
  } catch (error) {
    console.error('Error buscando producto por código de barras:', error);
    throw error;
  }
};

// Determina si un producto tiene stock disponible en ALGUNA de las
// presentaciones que ofrece. El stock se modela en tres magnitudes
// (units, blisters, boxes) y un producto puede venderse por 1, 2 o las
// 3 presentaciones. Por ejemplo: un producto que SOLO se vende por caja
// puede tener stock.units = 0 pero stock.boxes > 0 y aun así venderse.
// Solo se considera con stock si la presentación que el producto vende
// tiene cantidad > 0.
const hasAvailableStock = (product: Product): boolean => {
  const stock = product.stock;
  if (!stock) return false;

  const units = Number(stock.units || 0);
  const blisters = Number(stock.blisters || 0);
  const boxes = Number(stock.boxes || 0);
  const opts = product.sellOptions || { unit: false, blister: false, box: false };

  if (opts.unit && units > 0) return true;
  if (opts.blister && blisters > 0) return true;
  if (opts.box && boxes > 0) return true;

  return false;
};

// Caché simple de productos por ubicación para no recargar en cada búsqueda
const productsCache = new Map<string, { products: Product[]; loadedAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minuto

const loadProductsFromUbicacion = async (ubId: string): Promise<Product[]> => {
  const cached = productsCache.get(ubId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.products;
  }
  const snapshot = await getDocs(collection(db, 'ubicaciones', ubId, 'products'));
  const products = snapshot.docs.map(d => ({
    _id: d.id,
    location: { _id: ubId },
    ...d.data(),
  })) as unknown as Product[];
  productsCache.set(ubId, { products, loadedAt: Date.now() });
  return products;
};

export const invalidateProductsCache = (ubicacionId?: string) => {
  if (ubicacionId) {
    productsCache.delete(ubicacionId);
  } else {
    productsCache.clear();
  }
};

export const searchProductsByNameService = async (
  searchTerm: string,
  ubicacionOverride?: string | null
): Promise<Product[]> => {
  try {
    const ubicacion = ubicacionOverride ?? localStorage.getItem('ubicacion');
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return [];
    if (!ubicacion) return [];

    // Filtrado en cliente: la query de rango de Firestore falla cuando el campo
    // está capitalizado (ej: "Balsamico") y se busca en minúsculas ("balsamico"),
    // porque la comparación lexicográfica distingue mayúsculas. Cargamos los
    // productos de la ubicación y filtramos con includes (case-insensitive).
    // Solo se muestran productos con stock disponible en alguna de las
    // presentaciones que se venden (unit / blister / box).
    const products = await loadProductsFromUbicacion(ubicacion);
    return products
      .filter(p => (p.name || '').toLowerCase().includes(normalizedSearch))
      .filter(hasAvailableStock)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .slice(0, 20);
  } catch (error) {
    console.error('Error buscando productos por nombre:', error);
    return [];
  }
};

/**
 * Descuenta `unitsToDeduct` unidades del TOTAL de stock del producto
 * (en la ubicación indicada o, como fallback, en cualquier otra).
 *
 * El caller debe pasar la cantidad YA CONVERTIDA a unidades (por
 * ejemplo, multiplicando cantidad vendida × empaque, o usando el
 * `getQuantity` de una promoción NxM). Internamente se descuenta
 * directamente de `stock.units` y se re-normaliza la distribución
 * entre boxes / blisters / units.
 *
 * Antes esta función recibía `quantity` y `saleType` y los volvía a
 * convertir con `unitsToDeductForSale`, lo que producía una doble
 * conversión y descuentos incorrectos para ventas por blister o caja
 * (y especialmente para promociones NxM).
 */
export const updateStockService = async (
  productId: string,
  unitsToDeduct: number,
  ubicacionOverride?: string | null
): Promise<void> => {
  try {
    const ubicacion = ubicacionOverride ?? localStorage.getItem('ubicacion');

    const searchAndUpdate = async (ubId: string): Promise<boolean> => {
      const productRef = doc(db, 'ubicaciones', ubId, 'products', productId);

      return runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) return false;

        const data = productSnap.data();
        const stock = { ...data.stock };
        const packaging = data.packaging || {};
        const sellOptions = data.sellOptions || {};

        const result = deductUnitsFromStock(
          {
            boxes: Number(stock.boxes || 0),
            blisters: Number(stock.blisters || 0),
            units: Number(stock.units || 0),
          },
          unitsToDeduct,
          {
            unitsPerBlister: Number(packaging.unitsPerBlister || 1),
            blistersPerBox: Number(packaging.blistersPerBox || 1),
            unitsPerBox: Number(packaging.unitsPerBox || 1),
          },
          {
            unit: !!sellOptions.unit,
            blister: !!sellOptions.blister,
            box: !!sellOptions.box,
          },
        );

        if (!result.ok) {
          throw new Error(result.error || 'Stock insuficiente');
        }

        stock.units = result.remaining.units;
        stock.blisters = result.remaining.blisters;
        stock.boxes = result.remaining.boxes;

        transaction.update(productRef, { stock, updatedAt: Timestamp.now() });
        return true;
      });
    };

    if (ubicacion) {
      const found = await searchAndUpdate(ubicacion);
      if (found) return;
    }

    // Buscar en todas las ubicaciones
    const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
    for (const ubDoc of ubicacionesSnap.docs) {
      const found = await searchAndUpdate(ubDoc.id);
      if (found) return;
    }

    throw new Error('Producto no encontrado para actualizar stock');
  } catch (error: any) {
    const message = error?.message || 'Error al actualizar el stock';
    toast.error(message);
    throw error;
  }
};



export const getProductPromotions = async (productId: string): Promise<Promotion[]> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, 'promotions'),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(d => ({ _id: d.id, ...d.data() } as unknown as Promotion))
      .filter(promo => {
        if (!promo.products?.some(p => p.productId === productId)) return false;
        // Filtrar por ventana de vigencia completa
        const startDate = promo.startDate instanceof Date
          ? promo.startDate
          : new Date(promo.startDate as any);
        const endDate = promo.endDate instanceof Date
          ? promo.endDate
          : new Date(promo.endDate as any);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
        return startDate <= now && endDate >= now;
      });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener promociones del producto';
    toast.error(message);
    throw error;
  }
};

/**
 * Revierte una venta completa: devuelve el stock de cada ítem,
 * marca la venta como anulada y actualiza los contadores del reporte.
 *
 * @param saleId - ID del documento de venta en Firestore
 * @param saleData - Datos de la venta (items, total, ubicacion, etc.)
 * @param ubicacionId - ID de la ubicación donde está el reporte
 * @param reportId - ID del reporte que contiene la venta
 * @param reason - Motivo de la anulación
 */
export const revertSaleService = async (
  saleId: string,
  saleData: {
    items: Array<{
      productId: string;
      quantity: number;
      unitsPerSale: number;
      name: string;
      saleType: 'unit' | 'blister' | 'box';
    }>;
    total: number;
  },
  ubicacionId: string,
  reportId: string,
  reason: string
): Promise<void> => {
  try {
    // 0. Verificar que la venta existe en la ubicación indicada
    const saleRef = doc(db, 'ubicaciones', ubicacionId, 'reports', reportId, 'sales', saleId);
    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) {
      throw new Error('La venta no existe en la ubicación seleccionada. Verifique que seleccionó la ubicación correcta.');
    }

    // 1. Devolver stock de cada ítem
    for (const item of saleData.items) {
      const unitsToReturn = item.quantity * item.unitsPerSale;

      const productRef = doc(db, 'ubicaciones', ubicacionId, 'products', item.productId);
      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) {
          console.warn(`Producto ${item.productId} no encontrado, saltando devolución de stock`);
          return;
        }

        const data = productSnap.data();
        const stock = data.stock || {};
        const packaging = data.packaging || {};
        const sellOptions = data.sellOptions || {};

        const result = increaseUnitsToStock(
          {
            boxes: Number(stock.boxes || 0),
            blisters: Number(stock.blisters || 0),
            units: Number(stock.units || 0),
          },
          unitsToReturn,
          {
            unitsPerBlister: Number(packaging.unitsPerBlister || 1),
            blistersPerBox: Number(packaging.blistersPerBox || 1),
            unitsPerBox: Number(packaging.unitsPerBox || 1),
          },
          {
            unit: !!sellOptions.unit,
            blister: !!sellOptions.blister,
            box: !!sellOptions.box,
          },
        );

        const newStock = {
          units: result.remaining.units,
          blisters: result.remaining.blisters,
          boxes: result.remaining.boxes,
        };

        transaction.update(productRef, { stock: newStock, updatedAt: Timestamp.now() });
      });
    }

    // 2. Marcar la venta como anulada
    await updateDoc(saleRef, {
      revertedAt: Timestamp.now().toDate().toISOString(),
      revertReason: reason,
      revertedBy: localStorage.getItem('userEmail') || 'Sistema',
    });

    // 3. Actualizar contadores del reporte
    const reportRef = doc(db, 'ubicaciones', ubicacionId, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);
    if (reportSnap.exists()) {
      const reportData = reportSnap.data();
      const totalItemsReturned = saleData.items.reduce((sum, item) => sum + item.quantity, 0);
      await updateDoc(reportRef, {
        totalSales: Math.max(0, (reportData.totalSales || 0) - saleData.total),
        totalProducts: Math.max(0, (reportData.totalProducts || 0) - totalItemsReturned),
        updatedAt: Timestamp.now(),
      });
    }

    // 4. Registrar en auditoría
    const { logAuditAction } = await import('../../audit/services/auditService');
    const productNames = saleData.items.map(i => i.name).join(', ');
    await logAuditAction(
      'REVERTIR',
      'Venta',
      saleId,
      `Se revirtió venta de ${saleData.items.length} producto(s) (${productNames}) por un total de Q${saleData.total.toFixed(2)}`,
      reason
    );
  } catch (error: any) {
    const message = error?.message || 'Error al revertir la venta';
    toast.error(message);
    throw error;
  }
};

/**
 * Normaliza el stock de todos los productos de una ubicación.
 * Compara el stock actual con lo que normalizeFromUnits produciría
 * y corrige las diferencias.
 *
 * @param ubicacionId - ID de la ubicación a normalizar
 * @returns Objeto con la cantidad de productos corregidos y los que ya estaban bien
 */
export const normalizeAllStockService = async (
  ubicacionId: string
): Promise<{ corrected: number; alreadyCorrect: number; total: number }> => {
  try {
    const productsRef = collection(db, 'ubicaciones', ubicacionId, 'products');
    const snapshot = await getDocs(productsRef);

    let corrected = 0;
    let alreadyCorrect = 0;

    for (const productDoc of snapshot.docs) {
      const data = productDoc.data();
      const stock = data.stock || {};
      const packaging = data.packaging || {};
      const sellOptions = data.sellOptions || {};

      const currentUnits = Number(stock.units || 0);
      const currentBlisters = Number(stock.blisters || 0);
      const currentBoxes = Number(stock.boxes || 0);

      const normalized = normalizeFromUnits(
        currentUnits,
        {
          unitsPerBlister: Number(packaging.unitsPerBlister || 1),
          blistersPerBox: Number(packaging.blistersPerBox || 1),
          unitsPerBox: Number(packaging.unitsPerBox || 1),
        },
        {
          unit: !!sellOptions.unit,
          blister: !!sellOptions.blister,
          box: !!sellOptions.box,
        },
      );

      if (normalized.blisters !== currentBlisters || normalized.boxes !== currentBoxes) {
        await updateDoc(productDoc.ref, {
          stock: {
            ...stock,
            boxes: normalized.boxes,
            blisters: normalized.blisters,
          },
          updatedAt: Timestamp.now(),
        });
        corrected++;
      } else {
        alreadyCorrect++;
      }
    }

    return { corrected, alreadyCorrect, total: snapshot.docs.length };
  } catch (error: any) {
    const message = error?.message || 'Error al normalizar el stock';
    toast.error(message);
    throw error;
  }
};
