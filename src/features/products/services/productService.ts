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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';
import { Product } from '../types/Product';

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
          await updateDoc(productRef, { ...dataToSave, updatedAt: Timestamp.now() });
          return { _id: id, location: { _id: ubDoc.id }, ...productSnap.data(), ...dataToSave } as unknown as Product;
        }
      }
      throw new Error('Producto no encontrado');
    }

    const productRef = doc(db, 'ubicaciones', locationId, 'products', id);
    const { location: _loc, _id: _unused, ...dataToSave } = productData as any;
    await updateDoc(productRef, { ...dataToSave, updatedAt: Timestamp.now() });
    return { _id: id, location: { _id: locationId }, ...dataToSave } as unknown as Product;
  } catch (error: any) {
    const message = error?.message || 'Error al actualizar el producto';
    toast.error(message);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
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
          deletedAt: Timestamp.now(),
          deletionReason: 'manual',
        });
        await deleteDoc(productRef);
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

      let unitsToDeduct = quantity;
      if (saleType === 'blister') {
        unitsToDeduct = quantity * (packaging.unitsPerBlister || 1);
      } else if (saleType === 'box') {
        unitsToDeduct = quantity * (packaging.unitsPerBlister || 1) * (packaging.blistersPerBox || 1);
      }

      stock.units = (stock.units || 0) - unitsToDeduct;
      await updateDoc(productRef, { stock, updatedAt: Timestamp.now() });
      return;
    }
  }
  throw new Error('Producto no encontrado para actualizar stock');
};

// Las categorías y casas farmacéuticas ahora se manejan desde catalogService.ts
