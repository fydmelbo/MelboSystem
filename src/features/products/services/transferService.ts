import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

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

export const transferProducts = async (transferData: TransferRequest) => {
  const { ubicacionOrigenId, ubicacionDestinoId, productos } = transferData;

  for (const item of productos) {
    // Obtener producto de origen
    const origenRef = doc(db, 'ubicaciones', ubicacionOrigenId, 'products', item.productId);
    const origenSnap = await getDoc(origenRef);

    if (!origenSnap.exists()) {
      throw new Error(`Producto ${item.productId} no encontrado en ubicación de origen`);
    }

    const origenData = origenSnap.data();
    const packaging = origenData.packaging || {};
    
    // Calcular unidades a transferir
    let unitsToTransfer = item.quantity;
    if (item.saleType === 'blister') {
      unitsToTransfer = item.quantity * (packaging.unitsPerBlister || 1);
    } else if (item.saleType === 'box') {
      unitsToTransfer = item.quantity * (packaging.unitsPerBlister || 1) * (packaging.blistersPerBox || 1);
    }

    // Verificar stock suficiente
    if ((origenData.stock?.units || 0) < unitsToTransfer) {
      throw new Error(`Stock insuficiente para el producto ${origenData.name}`);
    }

    // Descontar del origen
    const newOrigenStock = { ...origenData.stock };
    newOrigenStock.units = (newOrigenStock.units || 0) - unitsToTransfer;
    await updateDoc(origenRef, { stock: newOrigenStock, updatedAt: Timestamp.now() });

    // Buscar el producto en destino (por barcode y nombre)
    const destinoProductsRef = collection(db, 'ubicaciones', ubicacionDestinoId, 'products');
    const destinoSnap = await getDocs(destinoProductsRef);
    
    let found = false;
    for (const destDoc of destinoSnap.docs) {
      const destData = destDoc.data();
      if (destData.barcode === origenData.barcode && destData.name === origenData.name) {
        // Sumar al destino
        const newDestStock = { ...destData.stock };
        newDestStock.units = (newDestStock.units || 0) + unitsToTransfer;
        await updateDoc(destDoc.ref, { stock: newDestStock, updatedAt: Timestamp.now() });
        found = true;
        break;
      }
    }

    if (!found) {
      // Crear producto en destino si no existe
      const { ...productDataCopy } = origenData;
      productDataCopy.stock = { units: unitsToTransfer, blisters: 0, boxes: 0 };
      productDataCopy.createdAt = Timestamp.now();
      productDataCopy.updatedAt = Timestamp.now();

      const { addDoc } = await import('firebase/firestore');
      await addDoc(destinoProductsRef, productDataCopy);
    }
  }

  // Auditoría: Obtener nombres de las ubicaciones
  const origenUbiSnap = await getDoc(doc(db, 'ubicaciones', ubicacionOrigenId));
  const destinoUbiSnap = await getDoc(doc(db, 'ubicaciones', ubicacionDestinoId));
  const origenName = origenUbiSnap.exists() ? origenUbiSnap.data().nombre : 'Desconocida';
  const destinoName = destinoUbiSnap.exists() ? destinoUbiSnap.data().nombre : 'Desconocida';

  const { logAuditAction } = await import('../../audit/services/auditService');
  const totalItemsLogged = productos.reduce((acc, item) => acc + item.quantity, 0);
  
  await logAuditAction(
    'CREAR',
    'Transferencia',
    `${ubicacionOrigenId}-${ubicacionDestinoId}-${Date.now()}`,
    `Se transfirieron ${totalItemsLogged} producto(s) de ${origenName} hacia ${destinoName}`
  );

  return { message: 'Transferencia realizada exitosamente' };
};