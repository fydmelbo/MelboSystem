import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { TransferRecord, TransferStatus } from '../types/Transfer';

const TRANSFERS_COLLECTION = 'transferencias';

export const getTransferHistory = async (ubicacion?: string): Promise<TransferRecord[]> => {
  try {
    let q;
    if (ubicacion) {
      q = query(
        collection(db, TRANSFERS_COLLECTION),
        where('ubicacionOrigenId', '==', ubicacion),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => ({
        _id: d.id,
        ...d.data(),
      })) as TransferRecord[];

      q = query(
        collection(db, TRANSFERS_COLLECTION),
        where('ubicacionDestinoId', '==', ubicacion),
        orderBy('createdAt', 'desc')
      );
      const snapshot2 = await getDocs(q);
      const results2 = snapshot2.docs.map((d) => ({
        _id: d.id,
        ...d.data(),
      })) as TransferRecord[];

      const all = [...results, ...results2];
      const unique = all.filter(
        (item, index, self) => index === self.findIndex((t) => t._id === item._id)
      );
      return unique.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    } else {
      q = query(
        collection(db, TRANSFERS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({
        _id: d.id,
        ...d.data(),
      })) as TransferRecord[];
    }
  } catch (error) {
    console.error('Error al obtener historial de transferencias:', error);
    throw error;
  }
};

export const getIncomingTransfers = async (ubicacionId?: string): Promise<TransferRecord[]> => {
  try {
    let q;
    if (ubicacionId) {
      q = query(
        collection(db, TRANSFERS_COLLECTION),
        where('ubicacionDestinoId', '==', ubicacionId),
        where('status', '==', 'pendiente'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, TRANSFERS_COLLECTION),
        where('status', '==', 'pendiente'),
        orderBy('createdAt', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      _id: d.id,
      ...d.data(),
    })) as TransferRecord[];
  } catch (error) {
    console.error('Error al obtener transferencias entrantes:', error);
    throw error;
  }
};

export const getTransferById = async (transferId: string): Promise<TransferRecord | null> => {
  try {
    const docRef = doc(db, TRANSFERS_COLLECTION, transferId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { _id: docSnap.id, ...docSnap.data() } as TransferRecord;
  } catch (error) {
    console.error('Error al obtener transferencia:', error);
    throw error;
  }
};

export const updateTransferStatus = async (
  transferId: string,
  status: TransferStatus,
  userName: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const docRef = doc(db, TRANSFERS_COLLECTION, transferId);
    const updateData: Record<string, any> = { status };

    if (status === 'recibida') {
      updateData.receivedAt = Timestamp.now();
      updateData.receivedBy = userName;
    } else if (status === 'rechazada') {
      updateData.rejectedAt = Timestamp.now();
      updateData.rejectedBy = userName;
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error al actualizar estado de transferencia:', error);
    throw error;
  }
};
