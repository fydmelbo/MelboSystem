import { collection, addDoc, Timestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

export type AuditAction = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'REACTIVAR';
export type AuditEntity = 'Usuario' | 'Producto' | 'Ubicación' | 'Autenticación' | 'Promoción' | 'Venta' | 'Transferencia' | 'Categoría' | 'Casa Farmacéutica';

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  details: string;
  reason?: string;
  createdAt: Timestamp;
}

export const logAuditAction = async (
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  details: string,
  reason?: string
) => {
  try {
    const currentUser = auth.currentUser;
    const localName = localStorage.getItem('userName');
    const localEmail = localStorage.getItem('userEmail');

    // Usamos el displayName de Auth, o el nombre de localStorage, o 'Sistema'
    const finalName = currentUser?.displayName || localName || 'Sistema';
    const finalEmail = currentUser?.email || localEmail || 'sistema@melbo.com';

    const log: any = {
      userId: currentUser?.uid || 'sistema',
      userEmail: finalEmail,
      userName: finalName,
      action,
      entity,
      entityId,
      details,
      createdAt: Timestamp.now(),
    };

    if (reason) {
      log.reason = reason;
    }

    await addDoc(collection(db, 'auditoria'), log);
  } catch (error) {
    console.error('Error al registrar acción de auditoría:', error);
    // No lanzamos el error para no bloquear la acción principal del usuario
  }
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const q = query(collection(db, 'auditoria'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuditLog[];
  } catch (error) {
    console.error('Error al obtener auditoría:', error);
    throw error;
  }
};
