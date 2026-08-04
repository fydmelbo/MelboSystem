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
import { logAuditAction } from '../features/audit/services/auditService';
import { getGuatemalaDate, getGuatemalaStartOfDay, getGuatemalaEndOfDay } from './timezone';
import { deductFromStock } from '../features/products/utils/stockMath';

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
    
    await logAuditAction(
      'CREAR',
      'Ubicación',
      docRef.id,
      `Se creó la ubicación ${ubicacionData.nombre}`
    );

    return { _id: docRef.id, id: docRef.id, ...ubicacionData };
  },

  updateUbicacion: async (id: string, ubicacionData: any) => {
    const ref = doc(db, 'ubicaciones', id);
    await updateDoc(ref, ubicacionData);
    
    let targetName = ubicacionData.nombre;
    if (!targetName) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        targetName = snap.data().nombre;
      }
    }

    await logAuditAction(
      'ACTUALIZAR',
      'Ubicación',
      id,
      `Se actualizó la ubicación ${targetName || 'Desconocida'}`
    );

    return { _id: id, id, ...ubicacionData };
  },

  deleteUbicacion: async (id: string, reason: string) => {
    const docRef = doc(db, 'ubicaciones', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await addDoc(collection(db, 'historicoUbicaciones'), {
        ...docSnap.data(),
        _id: id,
        id: id,
        deletedAt: Timestamp.now(),
        deletionReason: reason,
      });
      await deleteDoc(docRef);
      
      await logAuditAction(
        'ELIMINAR',
        'Ubicación',
        id,
        `Se envió al histórico la ubicación ${docSnap.data().nombre || 'Desconocida'}`,
        reason
      );
    }
    return { message: 'Ubicación enviada al Histórico' };
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
    const ubicacionesSnapshot = await getDocs(collection(db, 'ubicaciones'));
    for (const ubicacionDoc of ubicacionesSnapshot.docs) {
      const productRef = doc(db, 'ubicaciones', ubicacionDoc.id, 'products', productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const data = productSnap.data();
        const stock = { ...data.stock };
        const packaging = data.packaging || {};
        const sellOptions = data.sellOptions || {};

        const result = deductFromStock(
          {
            boxes: Number(stock.boxes || 0),
            blisters: Number(stock.blisters || 0),
            units: Number(stock.units || 0),
          },
          quantity,
          saleType,
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
      const todayStr = getGuatemalaDate();
      const startOfDay = getGuatemalaStartOfDay(todayStr);
      const endOfDay = getGuatemalaEndOfDay(todayStr);

      const newReport = {
        startDate: Timestamp.fromDate(startOfDay),
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
       for (const docSnap of snapshot.docs) {
         const data = docSnap.data();
         totalSales += data.totalSales || 0;
         totalProducts += data.totalProducts || 0;
         
         const salesSnap = await getDocs(collection(docSnap.ref, 'sales'));
         const reportSales = salesSnap.docs.map(s => ({ _id: s.id, id: s.id, ...s.data() }));
         allSales = [...allSales, ...reportSales];
       }
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
    const data = reportDoc.data();
    const salesSnap = await getDocs(collection(reportDoc.ref, 'sales'));
    const sales = salesSnap.docs.map(s => ({ _id: s.id, id: s.id, ...s.data() }));

    return { _id: reportDoc.id, id: reportDoc.id, ...data, sales };
  },

  getReportHistory: async (ubicacion?: string) => {
    if (ubicacion) {
      const reportsRef = collection(db, 'ubicaciones', ubicacion, 'reports');
      const q = query(reportsRef, where('status', '==', 'closed'));
      const snapshot = await getDocs(q);
      
      const reports = [];
      for (const docSnap of snapshot.docs) {
        const salesSnap = await getDocs(collection(docSnap.ref, 'sales'));
        const sales = salesSnap.docs.map(s => ({ _id: s.id, id: s.id, ...s.data() }));
        reports.push({
          _id: docSnap.id,
          id: docSnap.id,
          ...docSnap.data(),
          sales
        });
      }
      return reports;
    } else {
      // Admin: buscar en todas las ubicaciones
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      const allReports: any[] = [];
      for (const ubDoc of ubicacionesSnap.docs) {
        const reportsRef = collection(db, 'ubicaciones', ubDoc.id, 'reports');
        const q = query(reportsRef, where('status', '==', 'closed'));
        const snapshot = await getDocs(q);
        
        for (const docSnap of snapshot.docs) {
          const salesSnap = await getDocs(collection(docSnap.ref, 'sales'));
          const sales = salesSnap.docs.map(s => ({ _id: s.id, id: s.id, ...s.data() }));
          allReports.push({ 
            _id: docSnap.id, 
            id: docSnap.id, 
            ubicacionId: ubDoc.id, 
            ...docSnap.data(),
            sales 
          });
        }
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
      const todayStr = getGuatemalaDate();
      const startOfDay = getGuatemalaStartOfDay(todayStr);
      const endOfDay = getGuatemalaEndOfDay(todayStr);
      const newReportRef = await addDoc(reportsRef, {
        startDate: Timestamp.fromDate(startOfDay),
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
    
    const startOfDay = getGuatemalaStartOfDay(date);
    const endOfDay = getGuatemalaEndOfDay(date);

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
       for (const docSnap of snapshot.docs) {
         const data = docSnap.data();
         totalSales += data.totalSales || 0;
         totalProducts += data.totalProducts || 0;
         const salesSnap = await getDocs(collection(docSnap.ref, 'sales'));
         const reportSales = salesSnap.docs.map(s => ({ _id: s.id, id: s.id, ...s.data() }));
         allSales = [...allSales, ...reportSales];
       }
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
    const data = reportDoc.data();
    const salesSnap = await getDocs(collection(reportDoc.ref, 'sales'));
    const sales = salesSnap.docs.map(s => ({ _id: s.id, id: s.id, ...s.data() }));
    return { _id: reportDoc.id, id: reportDoc.id, ...data, sales };
  },

  getReportByRange: async (startDate: string, endDate: string, ubicacionParam?: string) => {
    const ubicacion = ubicacionParam || localStorage.getItem('ubicacion');
    
    const start = getGuatemalaStartOfDay(startDate);
    const end = getGuatemalaEndOfDay(endDate);

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
  }
};
