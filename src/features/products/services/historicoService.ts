import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  collectionGroup,
  setDoc,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { HistoricoProducto } from '../types/HistoricoProducto';
import { logAuditAction } from '../../audit/services/auditService';

export const getHistoricoProductos = async (
  startDate?: string,
  endDate?: string,
  name?: string,
  type?: string
): Promise<HistoricoProducto[]> => {
  try {
    let q = query(collection(db, 'historicoProductos'));

    // Firestore no soporta múltiples filtros sin índices compuestos,
    // así que filtramos en el cliente para flexibilidad
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({
      _id: d.id,
      ...d.data(),
    })) as unknown as (HistoricoProducto & { _id: string })[];

    // Filtrar por fecha si se proporcionan
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      results = results.filter(item => {
        const deletedAt = item.deletedAt instanceof Date ? item.deletedAt : new Date(item.deletedAt as any);
        return deletedAt >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      results = results.filter(item => {
        const deletedAt = item.deletedAt instanceof Date ? item.deletedAt : new Date(item.deletedAt as any);
        return deletedAt <= end;
      });
    }

    // Filtrar por nombre
    if (name) {
      const lowerName = name.toLowerCase();
      results = results.filter(item => item.name?.toLowerCase().includes(lowerName));
    }

    // Filtrar por tipo
    if (type) {
      results = results.filter(item => item.types?.includes(type));
    }

    return results;
  } catch (error) {
    console.error('Error al obtener histórico de productos:', error);
    throw error;
  }
};

export const getHistoricoUsuarios = async () => {
  try {
    const q = query(collection(db, 'historicoUsuarios'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error al obtener histórico de usuarios:', error);
    throw error;
  }
};

export const getHistoricoUbicaciones = async () => {
  try {
    const q = query(collection(db, 'historicoUbicaciones'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error al obtener histórico de ubicaciones:', error);
    throw error;
  }
};

export const restoreProducto = async (id: string, data: any, ubicacionId: string) => {
  const ref = doc(db, 'ubicaciones', ubicacionId, 'products', id);
  const { _id, deletedAt, deletionReason, ...restData } = data;
  await setDoc(ref, restData);
  await deleteDoc(doc(db, 'historicoProductos', _id));
  
  await logAuditAction(
    'REACTIVAR',
    'Producto',
    id,
    `Se reactivó el producto desde el histórico`
  );
};

export const hardDeleteProducto = async (id: string) => {
  const docRef = doc(db, 'historicoProductos', id);
  const snap = await getDoc(docRef);
  const name = snap.exists() ? snap.data().name : 'Desconocido';
  await deleteDoc(docRef);
  
  await logAuditAction(
    'ELIMINAR',
    'Producto',
    id,
    `Se eliminó permanentemente el producto ${name} del histórico`
  );
};

export const restoreUsuario = async (id: string, data: any) => {
  const { _id, deletedAt, deletionReason, ...restData } = data;
  await setDoc(doc(db, 'users', restData.id || id), restData);
  await deleteDoc(doc(db, 'historicoUsuarios', _id));
  
  await logAuditAction(
    'REACTIVAR',
    'Usuario',
    id,
    `Se reactivó el usuario ${data.email || data.name || 'Desconocido'} desde el histórico`
  );
};

export const hardDeleteUsuario = async (id: string) => {
  const docRef = doc(db, 'historicoUsuarios', id);
  const snap = await getDoc(docRef);
  const name = snap.exists() ? (snap.data().name || snap.data().email) : 'Desconocido';
  await deleteDoc(docRef);
  
  await logAuditAction(
    'ELIMINAR',
    'Usuario',
    id,
    `Se eliminó permanentemente el usuario ${name} del histórico`
  );
};

export const restoreUbicacion = async (id: string, data: any) => {
  const { _id, deletedAt, deletionReason, ...restData } = data;
  await setDoc(doc(db, 'ubicaciones', restData.id || id), restData);
  await deleteDoc(doc(db, 'historicoUbicaciones', _id));
  
  await logAuditAction(
    'REACTIVAR',
    'Ubicación',
    id,
    `Se reactivó la ubicación ${data.nombre || 'Desconocida'} desde el histórico`
  );
};

export const hardDeleteUbicacion = async (id: string) => {
  const docRef = doc(db, 'historicoUbicaciones', id);
  const snap = await getDoc(docRef);
  const name = snap.exists() ? snap.data().nombre : 'Desconocida';
  await deleteDoc(docRef);
  
  await logAuditAction(
    'ELIMINAR',
    'Ubicación',
    id,
    `Se eliminó permanentemente la ubicación ${name} del histórico`
  );
};

import * as XLSX from 'xlsx';

export const downloadHistoricoExcel = async () => {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. Histórico de Productos
    const prodSnap = await getDocs(collection(db, 'historicoProductos'));
    const prodData = prodSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ID: doc.id,
        Nombre: data.name,
        Categoría: data.category,
        "Casa Farmacéutica": data.pharmaceuticalCompany,
        "Fecha Eliminación": data.deletedAt?.toDate ? data.deletedAt.toDate().toLocaleString() : '',
        "Borrado Por": data.deletedBy
      };
    });
    const prodSheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(prodSheet, [["MELBO SYSTEM"], ["Histórico de Productos"], [`Generado el: ${new Date().toLocaleString()}`], []], { origin: "A1" });
    XLSX.utils.sheet_add_json(prodSheet, prodData, { origin: "A5" });
    prodSheet['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, prodSheet, "Productos");

    // 2. Histórico de Usuarios
    const userSnap = await getDocs(collection(db, 'historicoUsuarios'));
    const userData = userSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ID: doc.id,
        Nombre: data.name,
        Email: data.email,
        Rol: data.role,
        "Fecha Eliminación": data.deletedAt?.toDate ? data.deletedAt.toDate().toLocaleString() : '',
        "Borrado Por": data.deletedBy
      };
    });
    const userSheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(userSheet, [["MELBO SYSTEM"], ["Histórico de Usuarios"], [`Generado el: ${new Date().toLocaleString()}`], []], { origin: "A1" });
    XLSX.utils.sheet_add_json(userSheet, userData, { origin: "A5" });
    userSheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, userSheet, "Usuarios");

    // 3. Histórico de Ubicaciones
    const ubiSnap = await getDocs(collection(db, 'historicoUbicaciones'));
    const ubiData = ubiSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ID: doc.id,
        Nombre: data.nombre,
        Dirección: data.direccion,
        Teléfono: data.telefono,
        "Fecha Eliminación": data.deletedAt?.toDate ? data.deletedAt.toDate().toLocaleString() : '',
        "Borrado Por": data.deletedBy
      };
    });
    const ubiSheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ubiSheet, [["MELBO SYSTEM"], ["Histórico de Ubicaciones"], [`Generado el: ${new Date().toLocaleString()}`], []], { origin: "A1" });
    XLSX.utils.sheet_add_json(ubiSheet, ubiData, { origin: "A5" });
    ubiSheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, ubiSheet, "Ubicaciones");

    XLSX.writeFile(workbook, `Historico_Completo_${new Date().getTime()}.xlsx`);
  } catch (error) {
    console.error('Error generando Excel del histórico:', error);
    throw new Error('Error al descargar el Excel del histórico.');
  }
};