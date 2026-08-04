import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';
import { Product } from '../types/Product';
import { logAuditAction } from '../../audit/services/auditService';
import { deductFromStock, StockPackaging, StockSellOptions } from '../utils/stockMath';

export const getProducts = async (ubicacion?: string): Promise<Product[]> => {
  try {
    if (ubicacion) {
      const productsRef = collection(db, 'ubicaciones', ubicacion, 'products');
      const snapshot = await getDocs(productsRef);
      return snapshot.docs.map((d: { id: any; data: () => any; }) => ({
        _id: d.id,
        location: { _id: ubicacion },
        ...d.data(),
      })) as unknown as Product[];
    } else {
      // Buscar en todas las ubicaciones
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      const allProducts: Product[] = [];
      for (const ubDoc of ubicacionesSnap.docs) {
        const productsRef = collection(db, 'ubicaciones', ubDoc.id, 'products');
        const productsSnap = await getDocs(productsRef);
        productsSnap.docs.forEach((d: { id: any; data: () => unknown; }) => {
          allProducts.push({
            _id: d.id,
            location: { _id: ubDoc.id },
            ...(d.data() as Record<string, unknown>),
          } as unknown as Product);
        });
      }
      return allProducts;
    }
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  try {
    const locationId = (productData as any).location?._id || (productData as any).location;
    if (!locationId) throw new Error('Se requiere una ubicación para crear el producto');

    const { location, _id, ...dataToSave } = productData as any;
    const productsRef = collection(db, 'ubicaciones', locationId, 'products');
    const docRef = await addDoc(productsRef, {
      ...dataToSave,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    await logAuditAction(
      'CREAR',
      'Producto',
      docRef.id,
      `Se creó el producto ${productData.name}`
    );

    return { _id: docRef.id, location: { _id: locationId }, ...dataToSave } as unknown as Product;
  } catch (error: any) {
    const message = error?.message || 'Error al crear el producto';
    toast.error(message);
    throw error;
  }
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  try {
    const locationId = (productData as any).location?._id || (productData as any).location;
    if (!locationId) {
      // Buscar en todas las ubicaciones
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      for (const ubDoc of ubicacionesSnap.docs) {
        const productRef = doc(db, 'ubicaciones', ubDoc.id, 'products', id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const { location: _loc, _id: _unused, ...dataToSave } = productData as any;
          await updateDoc(productRef, { ...dataToSave, needsReview: false, updatedAt: Timestamp.now() });
          
          await logAuditAction(
            'ACTUALIZAR',
            'Producto',
            id,
            `Se actualizó el producto ${productData.name || productSnap.data().name || 'Desconocido'}`
          );

          return { _id: id, location: { _id: ubDoc.id }, ...productSnap.data(), ...dataToSave } as unknown as Product;
        }
      }
      throw new Error('Producto no encontrado');
    }

    const productRef = doc(db, 'ubicaciones', locationId, 'products', id);
    const { location: _loc, _id: _unused, ...dataToSave } = productData as any;
    await updateDoc(productRef, { ...dataToSave, needsReview: false, updatedAt: Timestamp.now() });
    
    let targetName = productData.name;
    if (!targetName) {
      const snap = await getDoc(productRef);
      if (snap.exists()) {
        targetName = snap.data().name;
      }
    }

    await logAuditAction(
      'ACTUALIZAR',
      'Producto',
      id,
      `Se actualizó el producto ${targetName || 'Desconocido'}`
    );

    return { _id: id, location: { _id: locationId }, ...dataToSave } as unknown as Product;
  } catch (error: any) {
    const message = error?.message || 'Error al actualizar el producto';
    toast.error(message);
    throw error;
  }
};

export const deleteProduct = async (id: string, reason: string): Promise<void> => {
  try {
    // Buscar en todas las ubicaciones
    const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
    for (const ubDoc of ubicacionesSnap.docs) {
      const productRef = doc(db, 'ubicaciones', ubDoc.id, 'products', id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        // Guardar en histórico antes de eliminar
        await addDoc(collection(db, 'historicoProductos'), {
          ...productSnap.data(),
          ubicacionId: ubDoc.id,
          deletedAt: Timestamp.now(),
          deletionReason: reason,
        });
        await deleteDoc(productRef);
        
        await logAuditAction(
          'ELIMINAR',
          'Producto',
          id,
          `Se envió al histórico el producto ${productSnap.data().name || 'Desconocido'}`,
          reason
        );

        return;
      }
    }
    throw new Error('Producto no encontrado');
  } catch (error: any) {
    const message = error?.message || 'Error al eliminar el producto';
    toast.error(message);
    throw error;
  }
};

export const findProductByBarcode = async (barcode: string): Promise<Product> => {
  const ubicacion = localStorage.getItem('ubicacion');

  if (ubicacion) {
    const q = query(
      collection(db, 'ubicaciones', ubicacion, 'products'),
      where('barcode', '==', barcode)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      return { _id: d.id, location: { _id: ubicacion }, ...d.data() } as unknown as Product;
    }
  }

  // Fallback: buscar en todas las ubicaciones
  const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
  for (const ubDoc of ubicacionesSnap.docs) {
    const q = query(
      collection(db, 'ubicaciones', ubDoc.id, 'products'),
      where('barcode', '==', barcode)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      return { _id: d.id, location: { _id: ubDoc.id }, ...d.data() } as unknown as Product;
    }
  }

  throw new Error('Producto no encontrado');
};

export const updateStock = async (
  productId: string,
  quantity: number,
  saleType: 'unit' | 'blister' | 'box'
): Promise<void> => {
  const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
  for (const ubDoc of ubicacionesSnap.docs) {
    const productRef = doc(db, 'ubicaciones', ubDoc.id, 'products', productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const data = productSnap.data();
      const stock = { ...data.stock };
      const packaging = data.packaging || {};
      const sellOptions = data.sellOptions || {};

      const packagingNorm: StockPackaging = {
        unitsPerBlister: Number(packaging.unitsPerBlister || 1),
        blistersPerBox: Number(packaging.blistersPerBox || 1),
        unitsPerBox: Number(packaging.unitsPerBox || 1),
      };
      const sellOptionsNorm: StockSellOptions = {
        unit: !!sellOptions.unit,
        blister: !!sellOptions.blister,
        box: !!sellOptions.box,
      };

      const result = deductFromStock(
        {
          boxes: Number(stock.boxes || 0),
          blisters: Number(stock.blisters || 0),
          units: Number(stock.units || 0),
        },
        quantity,
        saleType,
        packagingNorm,
        sellOptionsNorm,
      );

      if (!result.ok) {
        throw new Error(result.error || 'Stock insuficiente');
      }

      stock.units = result.remaining.units;
      stock.blisters = result.remaining.blisters;
      stock.boxes = result.remaining.boxes;

      await updateDoc(productRef, { stock, updatedAt: Timestamp.now() });
      return;
    }
  }
  throw new Error('Producto no encontrado para actualizar stock');
};

// Las categorías y casas farmacéuticas ahora se manejan desde catalogService.ts

export const subscribeToProducts = (
  ubicacion: string | null | undefined,
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const handleError = (error: Error) => {
    console.error('Error en suscripción de productos:', error);
    onError?.(error);
  };

  if (ubicacion) {
    const productsRef = collection(db, 'ubicaciones', ubicacion, 'products');
    return onSnapshot(
      productsRef,
      (snapshot) => {
        const products = snapshot.docs.map((d) => ({
          _id: d.id,
          location: { _id: ubicacion },
          ...d.data(),
        })) as unknown as Product[];
        callback(products);
      },
      handleError
    );
  }

  // Sin ubicación: escuchar todas las ubicaciones
  const unsubscribers: (() => void)[] = [];
  let allProducts: Product[] = [];

  const updateCallback = () => {
    callback([...allProducts]);
  };

  const ubicacionesRef = collection(db, 'ubicaciones');
  const unsubUbicaciones = onSnapshot(
    ubicacionesRef,
    (ubSnap) => {
      // Limpiar suscripciones anteriores
      unsubscribers.forEach((unsub) => unsub());
      unsubscribers.length = 0;
      allProducts = [];

      ubSnap.docs.forEach((ubDoc) => {
        const productsRef = collection(db, 'ubicaciones', ubDoc.id, 'products');
        const unsubProduct = onSnapshot(
          productsRef,
          (prodSnap) => {
            // Remover productos de esta ubicación y re-agregar
            allProducts = allProducts.filter(
              (p) => (p.location?._id || '') !== ubDoc.id
            );
            prodSnap.docs.forEach((d) => {
              allProducts.push({
                _id: d.id,
                location: { _id: ubDoc.id },
                ...d.data(),
              } as unknown as Product);
            });
            updateCallback();
          },
          handleError
        );
        unsubscribers.push(unsubProduct);
      });

      updateCallback();
    },
    handleError
  );

  return () => {
    unsubUbicaciones();
    unsubscribers.forEach((unsub) => unsub());
  };
};
