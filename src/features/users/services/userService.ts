import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { db, auth } from '../../../config/firebase';

export interface User {
  id: string;
  email: string;
  role: string;
  ubicacion?: {
    _id: string;
    id: string;
    nombre: string;
  } | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: string;
  ubicacion?: string | {
    _id?: string;
    id?: string;
    nombre?: string;
  } | null;
}

const USERS_COLLECTION = 'users';

const userService = {
  // Obtener todos los usuarios
  getUsers: async (ubicacionId?: string): Promise<User[]> => {
    try {
      let q;
      if (ubicacionId) {
        q = query(collection(db, USERS_COLLECTION), where('ubicacion', '==', ubicacionId));
      } else {
        q = collection(db, USERS_COLLECTION);
      }

      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener todas las ubicaciones para poblar el nombre
      const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
      const ubicacionesMap = new Map();
      ubicacionesSnap.docs.forEach(d => {
        ubicacionesMap.set(d.id, { _id: d.id, id: d.id, nombre: d.data().nombre });
      });

      return usersData.map((userData: any) => ({
        ...userData,
        ubicacion: userData.ubicacion ? ubicacionesMap.get(userData.ubicacion) : null,
      })) as User[];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  // Crear un nuevo usuario (crea en Firebase Auth + Firestore)
  createUser: async (userData: CreateUserData): Promise<User> => {
    let secondaryApp;
    try {
      // Extraer el ID de ubicación ya sea string o objeto
      const ubicacionId = typeof userData.ubicacion === 'string'
        ? userData.ubicacion
        : userData.ubicacion?.id || userData.ubicacion?._id || null;

      // Usar una app secundaria de Firebase para no desloguear al administrador actual
      secondaryApp = initializeApp(auth.app.options, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);

      // Crear el usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
      const newUserId = userCredential.user.uid;

      // Desloguear la app secundaria
      await secondaryAuth.signOut();

      // Guardar el perfil en Firestore usando el UID generado por Auth
      const userDocRef = doc(db, USERS_COLLECTION, newUserId);
      await setDoc(userDocRef, {
        email: userData.email,
        role: userData.role,
        ubicacion: ubicacionId || null,
      });

      return {
        id: newUserId,
        email: userData.email,
        role: userData.role,
        ubicacion: userData.ubicacion as any,
      };
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    } finally {
      // Limpiar la app secundaria
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
    }
  },

  // Actualizar un usuario existente
  updateUser: async (id: string, userData: Partial<CreateUserData>): Promise<void> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      const updateData: any = {};

      if (userData.email) updateData.email = userData.email;
      if (userData.role) updateData.role = userData.role;
      if (userData.ubicacion !== undefined) {
        // ubicacion puede venir como string (del select) o como objeto
        const ubicacionId = typeof userData.ubicacion === 'string'
          ? userData.ubicacion
          : userData.ubicacion?.id || userData.ubicacion?.id || null;
        updateData.ubicacion = ubicacionId || null;
      }

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  },

  // Eliminar un usuario
  deleteUser: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, id));
      // NOTA: Esto solo elimina de Firestore. 
      // Para eliminar de Firebase Auth, necesitas una Cloud Function con Admin SDK.
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  },

  // Obtener un usuario específico
  getUser: async (id: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, id));
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      let ubicacionObj = null;

      if (userData.ubicacion) {
        const ubDoc = await getDoc(doc(db, 'ubicaciones', userData.ubicacion));
        if (ubDoc.exists()) {
          ubicacionObj = { _id: ubDoc.id, id: ubDoc.id, nombre: ubDoc.data().nombre };
        }
      }

      return {
        id: userDoc.id,
        ...userData,
        ubicacion: ubicacionObj,
      } as User;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  }
};

export default userService;