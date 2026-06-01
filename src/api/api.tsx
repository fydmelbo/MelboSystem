// Este archivo ahora re-exporta todo desde lib/api.ts (Firestore)
// Se mantiene por compatibilidad con imports existentes en pages/Login.tsx
export { ubicacionesAPI, productsAPI, reportsAPI } from '../lib/api';

// Auth API ya no se usa desde aquí (migrado a Firebase Auth)
// Si algún componente importa authAPI desde aquí, debe migrar a authService
export const authAPI = {
  login: async (_email: string, _password: string) => {
    throw new Error('authAPI.login está obsoleto. Usa loginWithFirebase de authService.');
  },
};
