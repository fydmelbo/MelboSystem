import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { User, CreateUserData } from '../services/userService';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: CreateUserData) => void;
  user?: User;
  ubicaciones: Array<{ _id: string; nombre: string }>;
}

export default function UserForm({ open, onClose, onSubmit, user, ubicaciones }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    role: 'employee',
    ubicacion: { _id: '', nombre: '' }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // No mostrar la contraseña actual
        role: user.role,
        ubicacion: user?.ubicacion?._id || ''
      });
    } else {
      setFormData({
        email: '',
        password: '',
        role: 'employee',
        ubicacion: currentUser?.role === 'admin_ubicacion' ? currentUser.ubicacion || '' : ''
      });
    }
  }, [user, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableRoles = currentUser?.role === 'admin'
    ? ['admin', 'admin_ubicacion', 'employee']
    : ['admin_ubicacion', 'employee'];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {user ? 'Editar Usuario' : 'Crear Usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {!user && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {(formData.role === 'employee' || formData.role === 'admin_ubicacion') && (
              <div>
                <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <select
                  id="ubicacion"
                  name="ubicacion"
                  value={typeof formData.ubicacion === 'string' ? formData.ubicacion : (formData.ubicacion as any)?._id || ''}
                  onChange={handleChange}
                  required
                  disabled={currentUser?.role === 'admin_ubicacion'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione una ubicación</option>
                  {ubicaciones.map(ubicacion => (
                    <option key={ubicacion._id} value={ubicacion._id}>
                      {ubicacion.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {user ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}