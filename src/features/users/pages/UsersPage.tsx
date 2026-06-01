import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import UserList from '../components/UserList';
import UserForm from '../components/UserForm';
import userService, { User, CreateUserData } from '../services/userService';
import { useAuth } from '../../auth/context/AuthContext';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ubicacionesAPI } from '../../../lib/api';
import UserSearch from '../components/UserSearch';
import UserTableFilters from '../components/UserTableFilters';

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);
  const { user: currentUser } = useAuth();
  
  // Estados para filtros y búsqueda
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [ubicacionFilter, setUbicacionFilter] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    loadUbicaciones();
  }, []);

  const loadUbicaciones = async () => {
    try {
      const data = await ubicacionesAPI.getUbicaciones();
      setUbicaciones(data);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      toast.error('Error al cargar ubicaciones');
    }
  };

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      await userService.createUser(userData);
      setIsFormOpen(false);
      toast.success('Usuario creado exitosamente');
      triggerRefresh();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast.error('Error al crear usuario');
    }
  };

  const handleUpdateUser = async (userData: CreateUserData) => {
    try {
      if (selectedUser) {
        await userService.updateUser(selectedUser.id, userData);
        setIsFormOpen(false);
        setSelectedUser(undefined);
        toast.success('Usuario actualizado exitosamente');
        triggerRefresh();
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await userService.deleteUser(userId);
        toast.success('Usuario eliminado exitosamente');
        triggerRefresh();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  const hasActiveFilters = sortOption !== '' || ubicacionFilter !== '' || emailFilter !== '' || roleFilter !== '';

  const handleClearFilters = () => {
    setSortOption('');
    setUbicacionFilter('');
    setEmailFilter('');
    setRoleFilter('');
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            disabled={!['admin', 'admin_ubicacion'].includes(currentUser?.role || '')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            Nuevo Usuario
          </button>
        </div>

        <UserTableFilters
          onSortChange={(value) => setSortOption(value)}
          onUbicacionChange={setUbicacionFilter}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          sortOption={sortOption}
        />

        <UserSearch
          emailFilter={emailFilter}
          roleFilter={roleFilter}
          onEmailFilterChange={setEmailFilter}
          onRoleFilterChange={setRoleFilter}
        />

        <UserList 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          emailFilter={emailFilter}
          roleFilter={roleFilter}
          sortOption={sortOption}
          ubicacionFilter={ubicacionFilter}
          refreshTrigger={refreshTrigger}
        />

        <UserForm
          open={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
          user={selectedUser}
          ubicaciones={ubicaciones}
        />
      </div>
    </MainLayout>
  );
}