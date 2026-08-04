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
import { deductUnitsFromStock } from '../../products/utils/stockMath';
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
