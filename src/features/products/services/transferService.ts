import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { auth } from '../../../config/firebase';
import { TransferProductRecord } from '../types/Transfer';
import { normalizeFromUnits } from '../utils/stockMath';

export interface TransferProduct {
  productId: string;
  quantity: number;
  saleType: 'unit' | 'blister' | 'box';
}

export interface TransferRequest {
  ubicacionOrigenId: string;
  ubicacionDestinoId: string;
  productos: TransferProduct[];
}

export const createTransfer = async (transferData: TransferRequest): Promise<string> => {
  const { ubicacionOrigenId, ubicacionDestinoId, productos } = transferData;

  const origenUbiSnap = await getDoc(doc(db, 'ubicaciones', ubicacionOrigenId));
  const destinoUbiSnap = await getDoc(doc(db, 'ubicaciones', ubicacionDestinoId));
  const origenName = origenUbiSnap.exists() ? origenUbiSnap.data().nombre : 'Desconocida';
  const destinoName = destinoUbiSnap.exists() ? destinoUbiSnap.data().nombre : 'Desconocida';

  const productosRecord: TransferProductRecord[] = [];
  let totalUnidades = 0;

  for (const item of productos) {
    const origenRef = doc(db, 'ubicaciones', ubicacionOrigenId, 'products', item.productId);
    const origenSnap = await getDoc(origenRef);

    if (!origenSnap.exists()) {
      throw new Error(`Producto ${item.productId} no encontrado en ubicación de origen`);
    }

    const origenData = origenSnap.data();
    const packaging = origenData.packaging || {};

    let unitsToTransfer = item.quantity;
    if (item.saleType === 'blister') {
      unitsToTransfer = item.quantity * (packaging.unitsPerBlister || 1);
    } else if (item.saleType === 'box') {
      unitsToTransfer = item.quantity * (packaging.unitsPerBlister || 1) * (packaging.blistersPerBox || 1);
    }

    if ((origenData.stock?.units || 0) < unitsToTransfer) {
      throw new Error(`Stock insuficiente para el producto ${origenData.name}`);
    }

    productosRecord.push({
      productId: item.productId,
      productName: origenData.name || 'Sin nombre',
      quantity: item.quantity,
      saleType: item.saleType,
      unitsTransferred: unitsToTransfer,
    });

    totalUnidades += unitsToTransfer;
  }

  const currentUser = auth.currentUser;
  const localName = localStorage.getItem('userName');
  const localEmail = localStorage.getItem('userEmail');

  const transferRecord = {
    ubicacionOrigenId,
    ubicacionOrigenNombre: origenName,
    ubicacionDestinoId,
    ubicacionDestinoNombre: destinoName,
    productos: productosRecord,
    totalProductos: productos.length,
    totalUnidades,
    status: 'pendiente' as const,
    userId: currentUser?.uid || 'sistema',
    userName: currentUser?.displayName || localName || 'Sistema',
    userEmail: currentUser?.email || localEmail || 'sistema@melbo.com',
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'transferencias'), transferRecord);

  const { logAuditAction } = await import('../../audit/services/auditService');
  await logAuditAction(
    'CREAR',
    'Transferencia',
    docRef.id,
    `Se creó transferencia de ${origenName} hacia ${destinoName} (${productos.length} producto(s))`
  );

  return docRef.id;
};

export const executeTransfer = async (transferId: string): Promise<void> => {
  const transferRef = doc(db, 'transferencias', transferId);
  const transferSnap = await getDoc(transferRef);

  if (!transferSnap.exists()) {
    throw new Error('Transferencia no encontrada');
  }

  const transferData = transferSnap.data();
  const { ubicacionOrigenId, ubicacionDestinoId, productos } = transferData;

  for (const item of productos) {
    const origenRef = doc(db, 'ubicaciones', ubicacionOrigenId, 'products', item.productId);
    const origenSnap = await getDoc(origenRef);

    if (!origenSnap.exists()) {
      throw new Error(`Producto ${item.productId} no encontrado en origen`);
    }

    const origenData = origenSnap.data();
    const packaging = origenData.packaging || {};
    const sellOptions = origenData.sellOptions || { unit: true, blister: false, box: false };

    if ((origenData.stock?.units || 0) < item.unitsTransferred) {
      throw new Error(`Stock insuficiente para ${origenData.name}`);
    }

    const originNewTotal = (origenData.stock?.units || 0) - item.unitsTransferred;
    const originStock = normalizeFromUnits(originNewTotal, packaging, sellOptions);
    await updateDoc(origenRef, { stock: originStock, updatedAt: Timestamp.now() });

    const destinoProductsRef = collection(db, 'ubicaciones', ubicacionDestinoId, 'products');
    const destinoSnap = await getDocs(destinoProductsRef);

    let found = false;
    for (const destDoc of destinoSnap.docs) {
      const destData = destDoc.data();
      if (destData.barcode === origenData.barcode && destData.name === origenData.name) {
        const destPackaging = destData.packaging || {};
        const destSellOptions = destData.sellOptions || { unit: true, blister: false, box: false };
        const destNewTotal = (destData.stock?.units || 0) + item.unitsTransferred;
        const destStock = normalizeFromUnits(destNewTotal, destPackaging, destSellOptions);
        await updateDoc(destDoc.ref, { stock: destStock, updatedAt: Timestamp.now() });
        found = true;
        break;
      }
    }

    if (!found) {
      const { ...productDataCopy } = origenData;
      const newProductPackaging = origenData.packaging || {};
      const newProductSellOptions = origenData.sellOptions || { unit: true, blister: false, box: false };
      productDataCopy.stock = normalizeFromUnits(item.unitsTransferred, newProductPackaging, newProductSellOptions);
      productDataCopy.createdAt = Timestamp.now();
      productDataCopy.updatedAt = Timestamp.now();
      await addDoc(destinoProductsRef, productDataCopy);
    }
  }

  await updateDoc(transferRef, {
    status: 'recibida',
    receivedAt: Timestamp.now(),
  });

  const { logAuditAction } = await import('../../audit/services/auditService');
  await logAuditAction(
    'ACTUALIZAR',
    'Transferencia',
    transferId,
    `Transferencia recibida: ${productos.length} producto(s)`
  );
};
