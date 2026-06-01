// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Los encuentras en: Firebase Console > Configuración del proyecto > Tus apps > SDK de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAE9wNWG2fTcchmQ5hYOyxAg8a1ygX21qg",
  authDomain: "melbosys.firebaseapp.com",
  projectId: "melbosys",
  storageBucket: "melbosys.firebasestorage.app",
  messagingSenderId: "857735403239",
  appId: "1:857735403239:web:6a9c66a2d63fc54878f442",
  measurementId: "G-70QYQ765RR"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias de Auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
