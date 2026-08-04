import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { logAuditAction } from '../../audit/services/auditService';
import { toast } from 'react-hot-toast';

// ==========================================
// Categorías
// ==========================================

export interface Category {
  _id: string;
  name: string;
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'categorias'));
    return snapshot.docs
      .map(d => ({ _id: d.id, name: d.data().name as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error: any) {
    const message = error?.message || 'Error al obtener categorías';
    toast.error(message);
    throw error;
  }
};

export const addCategory = async (name: string): Promise<Category> => {
  try {
    const q = query(collection(db, 'categorias'), where('name', '==', name));
    const existing = await getDocs(q);
    if (!existing.empty) {
      const msg = 'Ya existe una categoría con ese nombre';
      toast.error(msg);
      throw new Error(msg);
    }
    const docRef = await addDoc(collection(db, 'categorias'), { name });

    await logAuditAction(
      'CREAR',
      'Categoría',
      docRef.id,
      `Se creó la categoría "${name}"`
    );

    return { _id: docRef.id, name };
  } catch (error: any) {
    const message = error?.message || 'Error al crear categoría';
    toast.error(message);
    throw error;
  }
};

export const updateCategory = async (id: string, name: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'categorias', id), { name });

    await logAuditAction(
      'ACTUALIZAR',
      'Categoría',
      id,
      `Se actualizó la categoría a "${name}"`
    );
  } catch (error: any) {
    const message = error?.message || 'Error al actualizar categoría';
    toast.error(message);
    throw error;
  }
};

export const deleteCategory = async (id: string, reason: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'categorias', id));

    await logAuditAction(
      'ELIMINAR',
      'Categoría',
      id,
      `Se eliminó la categoría`,
      reason
    );
  } catch (error: any) {
    const message = error?.message || 'Error al eliminar categoría';
    toast.error(message);
    throw error;
  }
};

export const bulkAddCategories = async (names: string[]): Promise<number> => {
  try {
    const existing = await getCategories();
    const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));

    const uniqueNames = names.filter(
      n => n.trim() && !existingNames.has(n.toLowerCase().trim())
    );

    let added = 0;
    for (let i = 0; i < uniqueNames.length; i += 450) {
      const batch = writeBatch(db);
      const chunk = uniqueNames.slice(i, i + 450);
      for (const name of chunk) {
        const ref = doc(collection(db, 'categorias'));
        batch.set(ref, { name: name.trim() });
        added++;
      }
      await batch.commit();
    }

    return added;
  } catch (error: any) {
    const message = error?.message || 'Error al importar categorías';
    toast.error(message);
    throw error;
  }
};

// ==========================================
// Casas Farmacéuticas
// ==========================================

export interface PharmaceuticalCompany {
  _id: string;
  name: string;
}

export const getPharmaceuticalCompanies = async (): Promise<PharmaceuticalCompany[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'casasFarmaceuticas'));
    return snapshot.docs
      .map(d => ({ _id: d.id, name: d.data().name as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error: any) {
    const message = error?.message || 'Error al obtener casas farmacéuticas';
    toast.error(message);
    throw error;
  }
};

export const addPharmaceuticalCompany = async (name: string): Promise<PharmaceuticalCompany> => {
  try {
    const q = query(collection(db, 'casasFarmaceuticas'), where('name', '==', name));
    const existing = await getDocs(q);
    if (!existing.empty) {
      const msg = 'Ya existe una casa farmacéutica con ese nombre';
      toast.error(msg);
      throw new Error(msg);
    }
    const docRef = await addDoc(collection(db, 'casasFarmaceuticas'), { name });

    await logAuditAction(
      'CREAR',
      'Casa Farmacéutica',
      docRef.id,
      `Se creó la casa farmacéutica "${name}"`
    );

    return { _id: docRef.id, name };
  } catch (error: any) {
    const message = error?.message || 'Error al crear casa farmacéutica';
    toast.error(message);
    throw error;
  }
};

export const updatePharmaceuticalCompany = async (id: string, name: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'casasFarmaceuticas', id), { name });

    await logAuditAction(
      'ACTUALIZAR',
      'Casa Farmacéutica',
      id,
      `Se actualizó la casa farmacéutica a "${name}"`
    );
  } catch (error: any) {
    const message = error?.message || 'Error al actualizar casa farmacéutica';
    toast.error(message);
    throw error;
  }
};

export const deletePharmaceuticalCompany = async (id: string, reason: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'casasFarmaceuticas', id));

    await logAuditAction(
      'ELIMINAR',
      'Casa Farmacéutica',
      id,
      `Se eliminó la casa farmacéutica`,
      reason
    );
  } catch (error: any) {
    const message = error?.message || 'Error al eliminar casa farmacéutica';
    toast.error(message);
    throw error;
  }
};

export const bulkAddPharmaceuticalCompanies = async (names: string[]): Promise<number> => {
  try {
    const existing = await getPharmaceuticalCompanies();
    const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));

    const uniqueNames = names.filter(
      n => n.trim() && !existingNames.has(n.toLowerCase().trim())
    );

    let added = 0;
    for (let i = 0; i < uniqueNames.length; i += 450) {
      const batch = writeBatch(db);
      const chunk = uniqueNames.slice(i, i + 450);
      for (const name of chunk) {
        const ref = doc(collection(db, 'casasFarmaceuticas'));
        batch.set(ref, { name: name.trim() });
        added++;
      }
      await batch.commit();
    }

    return added;
  } catch (error: any) {
    const message = error?.message || 'Error al importar casas farmacéuticas';
    toast.error(message);
    throw error;
  }
};
