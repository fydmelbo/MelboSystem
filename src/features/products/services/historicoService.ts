import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { HistoricoProducto } from '../types/HistoricoProducto';

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

export const downloadHistoricoExcel = async () => {
  // TODO: Implementar via Cloud Function generateExcel
  console.warn('Descarga de Excel de histórico pendiente de migración a Cloud Functions');
  throw new Error('La descarga de Excel del histórico se implementará via Cloud Functions');
};