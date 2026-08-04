import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface Notification {
  _id: string;
  productId: string;
  type: 'stock-low' | 'expired' | 'expiring-soon' | 'out-of-stock';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  ubicacion?: string;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export const createNotification = async (notification: Omit<Notification, '_id' | 'read' | 'createdAt'>) => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      ubicacion: ubicacion || null,
      read: false,
      createdAt: Timestamp.now(),
    });

    return { _id: docRef.id, ...notification, read: false, createdAt: new Date().toISOString() };
  } catch (error: any) {
    const errorMessage = error?.message || 'Error al crear notificación';
    console.error('Error al crear notificación:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');

    let q;
    if (ubicacion) {
      // Empleado/admin_ubicacion: solo sus notificaciones
      q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('ubicacion', '==', ubicacion)
      );
    } else {
      // Admin: ver TODAS las notificaciones
      q = collection(db, NOTIFICATIONS_COLLECTION);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      let createdAtStr = data.createdAt;
      // Si es un Timestamp de Firestore, convertir a string ISO
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtStr = data.createdAt.toDate().toISOString();
      }
      return {
        _id: d.id,
        ...data,
        createdAt: createdAtStr,
      };
    }) as unknown as Notification[];
  } catch (error: any) {
    const errorMessage = error?.message || 'Error al obtener notificaciones';
    console.error('Error al obtener notificaciones:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifRef, { read: true });
    return { _id: notificationId, read: true } as Notification;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');
    let q;
    if (ubicacion) {
      q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('ubicacion', '==', ubicacion),
        where('read', '==', false)
      );
    } else {
      q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('read', '==', false)
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    throw error;
  }
};