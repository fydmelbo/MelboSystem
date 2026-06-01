import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import { onAuthChange, logoutFromFirebase, UserProfile } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userProfile: UserProfile) => void;
  logout: () => void;
  updateUser: (userData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación de Firebase
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener datos del perfil desde Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: userData.role || 'employee',
              ubicacion: userData.ubicacion || undefined,
            };
            setUser(userProfile);
            setIsAuthenticated(true);

            // Guardar en localStorage para que los servicios puedan filtrar
            localStorage.setItem('role', userData.role || 'employee');
            if (userData.ubicacion) {
              localStorage.setItem('ubicacion', userData.ubicacion);
            } else {
              localStorage.removeItem('ubicacion');
            }
          } else {
            // El usuario existe en Auth pero no en Firestore
            console.warn('Usuario autenticado sin perfil en Firestore');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error al obtener perfil del usuario:', error);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // No hay usuario autenticado
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('ubicacion');
        localStorage.removeItem('role');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userProfile: UserProfile) => {
    setUser(userProfile);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await logoutFromFirebase();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ubicacion');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const updateUser = (userData: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
      {!isLoading ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}