import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { User, CreateUserData } from '../services/userService';
import BaseModal from '../../../components/ui/BaseModal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: CreateUserData) => void;
  user?: User;
  ubicaciones: Array<{ _id: string; nombre: string }>;
}

export default function UserForm({ open, onClose, onSubmit, user, ubicaciones }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    ubicacion: { _id: '', nombre: '' }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        role: user.role,
        ubicacion: user?.ubicacion?._id || ''
      });
    } else {
      setFormData({
        name: '',
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
    setIsSubmitting(true);
    onSubmit(formData);
  };

  const availableRoles = currentUser?.role === 'admin'
    ? ['admin', 'admin_ubicacion', 'employee']
    : ['admin_ubicacion', 'employee'];

  const roleOptions = availableRoles.map(role => ({
    value: role,
    label: role === 'admin' ? 'Administrador' : role === 'admin_ubicacion' ? 'Admin Ubicación' : 'Empleado'
  }));

  const ubicacionOptions = [
    { value: '', label: 'Seleccione una ubicación' },
    ...ubicaciones.map(u => ({ value: u._id, label: u.nombre }))
  ];

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} loadingText={user ? 'Actualizando...' : 'Creando...'}>
        {user ? 'Actualizar' : 'Crear'}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title={user ? 'Editar Usuario' : 'Crear Usuario'}
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre Completo"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {!user && (
          <Input
            label="Contraseña"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        )}

        <Select
          label="Rol"
          name="role"
          options={roleOptions}
          value={formData.role}
          onChange={handleChange}
          required
        />

        {(formData.role === 'employee' || formData.role === 'admin_ubicacion') && (
          <Select
            label="Ubicación"
            name="ubicacion"
            options={ubicacionOptions}
            value={typeof formData.ubicacion === 'string' ? formData.ubicacion : (formData.ubicacion as any)?._id || ''}
            onChange={handleChange}
            required
            disabled={currentUser?.role === 'admin_ubicacion'}
          />
        )}
      </form>
    </BaseModal>
  );
}
