import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, orderBy, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { Purchase, PurchaseItem } from '../types/Purchase';
import { logAuditAction } from '../../audit/services/auditService';
import { toast } from 'react-hot-toast';

const PURCHASES_PATH = 'ubicaciones/{ubicacionId}/purchases';

export const uploadInvoice = async (file: File, ubicacionId: string): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `invoices/${ubicacionId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const createPurchaseService = async (
  data: {
    items: PurchaseItem[];
    invoiceFile: File | null;
    supplier: string;
    supplierNit: string;
    invoiceSerie: string;
    invoiceNumber: string;
    paymentMethod: 'contado' | 'credito';
    dueDate?: string;
    transport: string;
    purchaseDate: string;
  },
  ubicacionId: string,
): Promise<string> => {
  try {
    const total = data.items.reduce((sum, item) => sum + item.subtotal, 0);

    let invoiceUrl: string | undefined;
    if (data.invoiceFile) {
      invoiceUrl = await uploadInvoice(data.invoiceFile, ubicacionId);
    }

    const purchaseData = {
      items: data.items,
      total,
      invoiceUrl: invoiceUrl || null,
      ubicacion: ubicacionId,
      supplier: data.supplier || null,
      supplierNit: data.supplierNit || null,
      invoiceSerie: data.invoiceSerie || null,
      invoiceNumber: data.invoiceNumber || null,
      paymentMethod: data.paymentMethod || 'contado',
      dueDate: data.dueDate || null,
      transport: data.transport || 'PROPIO',
      purchaseDate: data.purchaseDate || null,
      createdAt: Timestamp.now().toDate().toISOString(),
    };

    const purchaseRef = await addDoc(
      collection(db, 'ubicaciones', ubicacionId, 'purchases'),
      purchaseData
    );

    const productNames = data.items.map(i => i.name).join(', ');
    const invoiceRef = data.invoiceSerie && data.invoiceNumber
      ? `${data.invoiceSerie}-${data.invoiceNumber}`
      : 'S/N';
    await logAuditAction(
      'CREAR',
      'Compra',
      purchaseRef.id,
      `Compra ${invoiceRef} a ${data.supplier || 'Sin proveedor'} — ${data.items.length} producto(s) (${productNames}) por Q${total.toFixed(2)} [${data.paymentMethod}]`
    );

    toast.success('Compra registrada exitosamente');
    return purchaseRef.id;
  } catch (error: any) {
    const message = error?.message || 'Error al registrar la compra';
    toast.error(message);
    throw error;
  }
};

export const getPurchasesService = async (
  ubicacionId?: string | null
): Promise<Purchase[]> => {
  try {
    const ubicacionFilter = ubicacionId !== undefined
      ? ubicacionId
      : (localStorage.getItem('ubicacion') || null);

    let purchases: Purchase[] = [];

    if (ubicacionFilter) {
      const q = query(
        collection(db, 'ubicaciones', ubicacionFilter, 'purchases'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      purchases = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
      })) as Purchase[];
    } else {
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      for (const ubDoc of ubicacionesSnap.docs) {
        const q = query(
          collection(db, 'ubicaciones', ubDoc.id, 'purchases'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        purchases.push(
          ...snapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data(),
          })) as Purchase[]
        );
      }
    }

    return purchases;
  } catch (error: any) {
    toast.error('Error al obtener compras');
    throw error;
  }
};

export const getPurchaseByIdService = async (
  purchaseId: string,
  ubicacionId: string
): Promise<Purchase | null> => {
  try {
    const purchaseRef = doc(db, 'ubicaciones', ubicacionId, 'purchases', purchaseId);
    const purchaseSnap = await getDoc(purchaseRef);
    if (!purchaseSnap.exists()) return null;
    return { _id: purchaseSnap.id, ...purchaseSnap.data() } as Purchase;
  } catch (error: any) {
    toast.error('Error al obtener la compra');
    throw error;
  }
};

export const updatePurchaseService = async (
  purchaseId: string,
  ubicacionId: string,
  updates: Partial<Purchase>
): Promise<void> => {
  try {
    const purchaseRef = doc(db, 'ubicaciones', ubicacionId, 'purchases', purchaseId);
    await updateDoc(purchaseRef, updates);

    await logAuditAction(
      'ACTUALIZAR',
      'Compra',
      purchaseId,
      `Compra actualizada`
    );

    toast.success('Compra actualizada exitosamente');
  } catch (error: any) {
    toast.error('Error al actualizar la compra');
    throw error;
  }
};

export const revertPurchaseService = async (
  purchaseId: string,
  purchaseData: {
    items: PurchaseItem[];
    total: number;
  },
  ubicacionId: string,
  reason: string
): Promise<void> => {
  try {
    const purchaseRef = doc(db, 'ubicaciones', ubicacionId, 'purchases', purchaseId);
    const purchaseSnap = await getDoc(purchaseRef);
    if (!purchaseSnap.exists()) {
      throw new Error('La compra no existe en la ubicación seleccionada.');
    }

    await updateDoc(purchaseRef, {
      revertedAt: Timestamp.now().toDate().toISOString(),
      revertReason: reason,
      revertedBy: localStorage.getItem('userEmail') || 'Sistema',
    });

    const productNames = purchaseData.items.map(i => i.name).join(', ');
    await logAuditAction(
      'REVERTIR',
      'Compra',
      purchaseId,
      `Se revirtió compra de ${purchaseData.items.length} producto(s) (${productNames}) por un total de Q${purchaseData.total.toFixed(2)}`,
      reason
    );

    toast.success('Compra revertida exitosamente');
  } catch (error: any) {
    const message = error?.message || 'Error al revertir la compra';
    toast.error(message);
    throw error;
  }
};
