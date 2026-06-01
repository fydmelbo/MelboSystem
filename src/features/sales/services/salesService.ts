import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Product } from '../../../features/products/types/Product';
import { SaleItem } from '../types/Sale';
import toast from 'react-hot-toast';
import { Promotion } from '../../promotions/types/Promotion';

export const findProductByBarcodeService = async (barcode: string): Promise<Product> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');
    
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

export const updateStockService = async (
  productId: string,
  quantity: number,
  saleType: 'unit' | 'blister' | 'box'
): Promise<void> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');
    
    const searchAndUpdate = async (ubId: string): Promise<boolean> => {
      const productRef = doc(db, 'ubicaciones', ubId, 'products', productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const data = productSnap.data();
        const stock = { ...data.stock };
        const packaging = data.packaging || {};

        let unitsToDeduct = quantity;
        if (saleType === 'blister') {
          unitsToDeduct = quantity * (packaging.unitsPerBlister || 1);
        } else if (saleType === 'box') {
          unitsToDeduct = quantity * (packaging.unitsPerBlister || 1) * (packaging.blistersPerBox || 1);
        }

        stock.units = (stock.units || 0) - unitsToDeduct;
        await updateDoc(productRef, { stock, updatedAt: Timestamp.now() });
        return true;
      }
      return false;
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

export const registerSaleService = async (items: SaleItem[], total: number): Promise<void> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');
    if (!ubicacion) throw new Error('No hay ubicación seleccionada');

    // Buscar el reporte activo
    const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
    const q = query(reportsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    let reportRef;
    if (snapshot.empty) {
      // Crear reporte nuevo
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const newReportRef = await addDoc(reportsRef, {
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endOfDay),
        totalSales: 0,
        totalProducts: 0,
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      reportRef = newReportRef;
    } else {
      reportRef = snapshot.docs[0].ref;
    }

    // Registrar la venta en la subcolección de sales
    const saleData = {
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        saleType: item.saleType,
        unitsPerSale: item.unitsPerSale,
        subtotal: item.subtotal,
      })),
      total,
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(reportRef, 'sales'), saleData);

    // Actualizar totales del reporte
    const reportSnap = await getDoc(reportRef);
    if (reportSnap.exists()) {
      const reportData = reportSnap.data();
      const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
      await updateDoc(reportRef, {
        totalSales: (reportData.totalSales || 0) + total,
        totalProducts: (reportData.totalProducts || 0) + totalItems,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error: any) {
    const message = error?.message || 'Error al registrar la venta';
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
        const endDate = promo.endDate instanceof Date ? promo.endDate : new Date(promo.endDate as any);
        return endDate >= now && promo.products?.some(p => p.productId === productId);
      });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener promociones del producto';
    toast.error(message);
    throw error;
  }
};
