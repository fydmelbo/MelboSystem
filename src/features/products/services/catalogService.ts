import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// ==========================================
// Categorías
// ==========================================

export interface Category {
  _id: string;
  name: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(collection(db, 'categorias'));
  return snapshot.docs
    .map(d => ({ _id: d.id, name: d.data().name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const addCategory = async (name: string): Promise<Category> => {
  // Verificar si ya existe
  const q = query(collection(db, 'categorias'), where('name', '==', name));
  const existing = await getDocs(q);
  if (!existing.empty) {
    return { _id: existing.docs[0].id, name };
  }
  const docRef = await addDoc(collection(db, 'categorias'), { name });
  return { _id: docRef.id, name };
};

export const deleteCategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'categorias', id));
};

export const bulkAddCategories = async (names: string[]): Promise<number> => {
  // Obtener existentes para no duplicar
  const existing = await getCategories();
  const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));

  const uniqueNames = names.filter(
    n => n.trim() && !existingNames.has(n.toLowerCase().trim())
  );

  // Firestore batch max 500
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
};

// ==========================================
// Casas Farmacéuticas
// ==========================================

export interface PharmaceuticalCompany {
  _id: string;
  name: string;
}

export const getPharmaceuticalCompanies = async (): Promise<PharmaceuticalCompany[]> => {
  const snapshot = await getDocs(collection(db, 'casasFarmaceuticas'));
  return snapshot.docs
    .map(d => ({ _id: d.id, name: d.data().name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const addPharmaceuticalCompany = async (name: string): Promise<PharmaceuticalCompany> => {
  // Verificar si ya existe
  const q = query(collection(db, 'casasFarmaceuticas'), where('name', '==', name));
  const existing = await getDocs(q);
  if (!existing.empty) {
    return { _id: existing.docs[0].id, name };
  }
  const docRef = await addDoc(collection(db, 'casasFarmaceuticas'), { name });
  return { _id: docRef.id, name };
};

export const deletePharmaceuticalCompany = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'casasFarmaceuticas', id));
};

export const bulkAddPharmaceuticalCompanies = async (names: string[]): Promise<number> => {
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
};
