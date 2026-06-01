// src/lib/api.ts
// Servicios de Firebase Firestore - Reemplazo de axios
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==========================================
// Ubicaciones API (Firestore directo)
// ==========================================
export const ubicacionesAPI = {
  getUbicaciones: async (): Promise<Array<{ _id: string; id: string; nombre: string; [key: string]: any }>> => {
    const snapshot = await getDocs(collection(db, 'ubicaciones'));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        nombre: data.nombre || '',
        ...data,
      };
    });
  },

  createUbicacion: async (ubicacionData: any) => {
    const docRef = await addDoc(collection(db, 'ubicaciones'), ubicacionData);
    return { _id: docRef.id, id: docRef.id, ...ubicacionData };
  },

  updateUbicacion: async (id: string, ubicacionData: any) => {
    const ref = doc(db, 'ubicaciones', id);
    await updateDoc(ref, ubicacionData);
    return { _id: id, id, ...ubicacionData };
  },

  deleteUbicacion: async (id: string) => {
    await deleteDoc(doc(db, 'ubicaciones', id));
    return { message: 'Ubicación eliminada' };
  },

  getUbicacionById: async (id: string) => {
    const docSnap = await getDoc(doc(db, 'ubicaciones', id));
    if (!docSnap.exists()) throw new Error('Ubicación no encontrada');
    return { _id: docSnap.id, id: docSnap.id, ...docSnap.data() };
  }
};

// ==========================================
// Products API (Subcolección dentro de ubicaciones)
// ==========================================
export const productsAPI = {
  getProducts: async (ubicacion?: string) => {
    if (ubicacion) {
      // Buscar productos en la subcolección de la ubicación específica
      const productsRef = collection(db, 'ubicaciones', ubicacion, 'products');
      const snapshot = await getDocs(productsRef);
      return snapshot.docs.map(doc => ({
        _id: doc.id,
        id: doc.id,
        location: { _id: ubicacion },
        ...doc.data(),
      }));
    } else {
      // Si no hay ubicación, buscar en TODAS las ubicaciones
      const ubicacionesSnapshot = await getDocs(collection(db, 'ubicaciones'));
      const allProducts: any[] = [];

      for (const ubicacionDoc of ubicacionesSnapshot.docs) {
        const productsRef = collection(db, 'ubicaciones', ubicacionDoc.id, 'products');
        const productsSnapshot = await getDocs(productsRef);
        productsSnapshot.docs.forEach(productDoc => {
          allProducts.push({
            _id: productDoc.id,
            id: productDoc.id,
            location: { _id: ubicacionDoc.id },
            ...productDoc.data(),
          });
        });
      }

      return allProducts;
    }
  },

  createProduct: async (productData: any) => {
    const locationId = productData.location;
    if (!locationId) throw new Error('Se requiere una ubicación para crear el producto');

    const { location, ...dataWithoutLocation } = productData;
    const productsRef = collection(db, 'ubicaciones', locationId, 'products');
    const docRef = await addDoc(productsRef, {
      ...dataWithoutLocation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { _id: docRef.id, id: docRef.id, location: { _id: locationId }, ...dataWithoutLocation };
  },

  findByBarcode: async (barcode: string) => {
    // Buscar en todas las ubicaciones
    const ubicacionesSnapshot = await getDocs(collection(db, 'ubicaciones'));
    for (const ubicacionDoc of ubicacionesSnapshot.docs) {
      const q = query(
        collection(db, 'ubicaciones', ubicacionDoc.id, 'products'),
        where('barcode', '==', barcode)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const productDoc = snapshot.docs[0];
        return {
          _id: productDoc.id,
          id: productDoc.id,
          location: { _id: ubicacionDoc.id },
          ...productDoc.data(),
        };
      }
    }
    throw new Error('Producto no encontrado');
  },

  updateStock: async (productId: string, quantity: number, saleType: 'unit' | 'blister' | 'box') => {
    // Necesitamos encontrar el producto para saber su ubicación
    const ubicacionesSnapshot = await getDocs(collection(db, 'ubicaciones'));
    for (const ubicacionDoc of ubicacionesSnapshot.docs) {
      const productRef = doc(db, 'ubicaciones', ubicacionDoc.id, 'products', productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const data = productSnap.data();
        const stock = { ...data.stock };
        const packaging = data.packaging || {};

        // Calcular unidades a descontar
        let unitsToDeduct = quantity;
        if (saleType === 'blister') {
          unitsToDeduct = quantity * (packaging.unitsPerBlister || 1);
        } else if (saleType === 'box') {
          unitsToDeduct = quantity * (packaging.unitsPerBlister || 1) * (packaging.blistersPerBox || 1);
        }

        stock.units = (stock.units || 0) - unitsToDeduct;
        
        await updateDoc(productRef, { stock, updatedAt: Timestamp.now() });
        return { _id: productId, stock };
      }
    }
    throw new Error('Producto no encontrado para actualizar stock');
  }
};

// ==========================================
// Reports API (Subcolección dentro de ubicaciones)
// ==========================================
export const reportsAPI = {
  getCurrentReport: async (ubicacion?: string) => {
    let q;
    if (ubicacion) {
      const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
      q = query(reportsRef, where('status', '==', 'active'));
    } else {
      q = query(collectionGroup(db, 'reports'), where('status', '==', 'active'));
    }
    
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (!ubicacion) throw new Error('No hay reporte activo');
      // Crear un reporte nuevo para hoy
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const newReport = {
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endOfDay),
        sales: [],
        totalSales: 0,
        totalProducts: 0,
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
      const docRef = await addDoc(reportsRef, newReport);
      return { _id: docRef.id, id: docRef.id, ...newReport };
    }

    if (!ubicacion && snapshot.docs.length > 1) {
       // Merge reports if admin views all
       let totalSales = 0;
       let totalProducts = 0;
       let allSales: any[] = [];
       snapshot.docs.forEach(doc => {
         const data = doc.data();
         totalSales += data.totalSales || 0;
         totalProducts += data.totalProducts || 0;
         allSales = [...allSales, ...(data.sales || [])];
       });
       return {
         _id: 'combined-active',
         id: 'combined-active',
         startDate: snapshot.docs[0].data().startDate,
         status: 'active',
         totalSales,
         totalProducts,
         sales: allSales
       };
    }

    const reportDoc = snapshot.docs[0];
    return { _id: reportDoc.id, id: reportDoc.id, ...reportDoc.data() };
  },

  getReportHistory: async (ubicacion?: string) => {
    if (ubicacion) {
      const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
      const q = query(reportsRef, where('status', '==', 'closed'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        _id: doc.id,
        id: doc.id,
        ...doc.data(),
      }));
    } else {
      // Admin: buscar en todas las ubicaciones
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      const allReports: any[] = [];
      for (const ubDoc of ubicacionesSnap.docs) {
        const reportsRef = collection(db, 'ubicaciones', ubDoc.id, 'reports');
        const q = query(reportsRef, where('status', '==', 'closed'));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          allReports.push({ _id: doc.id, id: doc.id, ubicacionId: ubDoc.id, ...doc.data() });
        });
      }
      return allReports;
    }
  },

  addSaleToReport: async (sale: any) => {
    const ubicacion = sale.ubicacion || localStorage.getItem('ubicacion');
    if (!ubicacion) throw new Error('Se requiere ubicación para registrar la venta');

    // Buscar el reporte activo
    const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
    const q = query(reportsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    let reportRef;
    if (snapshot.empty) {
      // Crear reporte si no existe
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const newReportRef = await addDoc(reportsRef, {
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endOfDay),
        sales: [],
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

    // Agregar la venta como subcolección
    const salesRef = collection(reportRef, 'sales');
    const saleData = {
      ...sale,
      createdAt: Timestamp.now(),
    };
    delete saleData.ubicacion; // No necesitamos la ubicación dentro de la venta
    await addDoc(salesRef, saleData);

    // Actualizar totales del reporte
    const reportSnap = await getDoc(reportRef);
    if (reportSnap.exists()) {
      const reportData = reportSnap.data();
      const totalItems = sale.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
      await updateDoc(reportRef, {
        totalSales: (reportData.totalSales || 0) + (sale.total || 0),
        totalProducts: (reportData.totalProducts || 0) + totalItems,
        updatedAt: Timestamp.now(),
      });
    }

    return { message: 'Venta registrada exitosamente' };
  },

  closeCurrentReport: async (ubicacion?: string) => {
    if (!ubicacion) ubicacion = localStorage.getItem('ubicacion') || undefined;

    if (ubicacion) {
      const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
      const q = query(reportsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      for (const reportDoc of snapshot.docs) {
        await updateDoc(reportDoc.ref, {
          status: 'closed',
          endDate: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } else {
      // Admin: cerrar todos los reportes activos en todas las ubicaciones
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      for (const ubDoc of ubicacionesSnap.docs) {
        const reportsRef = collection(db, 'ubicaciones', ubDoc.id, 'reports');
        const q = query(reportsRef, where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        for (const reportDoc of snapshot.docs) {
          await updateDoc(reportDoc.ref, {
            status: 'closed',
            endDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }
    }

    return { message: 'Reporte cerrado' };
  },

  getReportByDate: async (date: string, ubicacionParam?: string) => {
    const ubicacion = ubicacionParam || localStorage.getItem('ubicacion');
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let q;
    if (ubicacion) {
      const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
      q = query(
        reportsRef,
        where('startDate', '>=', Timestamp.fromDate(startOfDay)),
        where('startDate', '<=', Timestamp.fromDate(endOfDay))
      );
    } else {
      q = query(
        collectionGroup(db, 'reports'),
        where('startDate', '>=', Timestamp.fromDate(startOfDay)),
        where('startDate', '<=', Timestamp.fromDate(endOfDay))
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('No se encontró reporte para esa fecha');

    if (!ubicacion && snapshot.docs.length > 1) {
       let totalSales = 0;
       let totalProducts = 0;
       let allSales: any[] = [];
       snapshot.docs.forEach(doc => {
         const data = doc.data();
         totalSales += data.totalSales || 0;
         totalProducts += data.totalProducts || 0;
         allSales = [...allSales, ...(data.sales || [])];
       });
       return {
         _id: 'combined-' + date,
         id: 'combined-' + date,
         startDate: snapshot.docs[0].data().startDate,
         status: 'closed',
         totalSales,
         totalProducts,
         sales: allSales
       };
    }

    const reportDoc = snapshot.docs[0];
    return { _id: reportDoc.id, id: reportDoc.id, ...reportDoc.data() };
  },

  getReportByRange: async (startDate: string, endDate: string, ubicacionParam?: string) => {
    const ubicacion = ubicacionParam || localStorage.getItem('ubicacion');
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let q;
    if (ubicacion) {
      const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
      q = query(
        reportsRef,
        where('startDate', '>=', Timestamp.fromDate(start)),
        where('startDate', '<=', Timestamp.fromDate(end))
      );
    } else {
      q = query(
        collectionGroup(db, 'reports'),
        where('startDate', '>=', Timestamp.fromDate(start)),
        where('startDate', '<=', Timestamp.fromDate(end))
      );
    }
    
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      _id: doc.id,
      id: doc.id,
      ...doc.data(),
    }));
  },

  // PDF y Excel se manejarán via Cloud Functions (Paso 5)
  generatePDF: async (reportId: string | null, startDate?: string, endDate?: string) => {
    console.warn('Generación de PDF será migrada a Cloud Functions');
    throw new Error('La generación de PDF se implementará via Cloud Functions');
  },

  generateDetailedPDF: async (report: any) => {
    console.warn('Generación de PDF detallado será migrada a Cloud Functions');
    throw new Error('La generación de PDF detallado se implementará via Cloud Functions');
  },

  generateExcel: async (reportId: string | null, startDate?: string, endDate?: string) => {
    console.warn('Generación de Excel será migrada a Cloud Functions');
    throw new Error('La generación de Excel se implementará via Cloud Functions');
  },
};
