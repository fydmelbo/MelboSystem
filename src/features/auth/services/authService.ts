import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: string;
  ubicacion?: string;
}

export const loginWithFirebase = async (email: string, password: string): Promise<UserProfile> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('No se encontraron datos del usuario en la base de datos');
    }

    const userData = userDoc.data();

    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: userData.name || userData.nombre || firebaseUser.displayName || email,
      role: userData.role || 'employee',
      ubicacion: userData.ubicacion || undefined,
    };

    return userProfile;
  } catch (error: any) {
    let errorMessage = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found') errorMessage = 'No existe una cuenta con este correo';
    else if (error.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta';
    throw new Error(errorMessage);
  }
};

export const logoutFromFirebase = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};