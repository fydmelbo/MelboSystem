import { useState, useEffect, useCallback } from 'react';
import { User } from '../services/userService';
import userService from '../services/userService';
import { useAuth } from '../../auth/context/AuthContext';
import { toast } from 'react-hot-toast';

interface UseUsersProps {
  emailFilter?: string;
  roleFilter?: string;
  ubicacionFilter?: string;
  sortOption?: string;
  refreshTrigger?: number;
}

export function useUsers({
  emailFilter: emailFilterProp = '',
  roleFilter: roleFilterProp = '',
  ubicacionFilter: ubicacionFilterProp = '',
  sortOption: sortOptionProp = '',
  refreshTrigger = 0
}: UseUsersProps = {}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [emailFilter, setEmailFilter] = useState(emailFilterProp);
  const [roleFilter, setRoleFilter] = useState(roleFilterProp);
  const [ubicacionFilter, setUbicacionFilter] = useState(ubicacionFilterProp);
  const [sortOption, setSortOption] = useState(sortOptionProp);

  // Actualizar filtros cuando cambien las props
  useEffect(() => {
    setEmailFilter(emailFilterProp);
    setRoleFilter(roleFilterProp);
    setUbicacionFilter(ubicacionFilterProp);
    setSortOption(sortOptionProp);
  }, [emailFilterProp, roleFilterProp, ubicacionFilterProp, sortOptionProp]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Si el usuario no es 'admin' global, forzar que solo traiga usuarios de su propia ubicación
      const fetchUbicacionId = currentUser?.role !== 'admin' && currentUser?.ubicacion
        ? (typeof currentUser.ubicacion === 'string' ? currentUser.ubicacion : (currentUser.ubicacion as any).id)
        : undefined;

      const response = await userService.getUsers(fetchUbicacionId);
      setUsers(response);
    } catch (error) {
      toast.error('Error al cargar los usuarios');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshTrigger]);

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    const matchesEmail = user.email
      .toLowerCase()
      .includes(emailFilter.toLowerCase());
    const matchesRole = user.role
      .toLowerCase()
      .includes(roleFilter.toLowerCase());
    const matchesUbicacion = !ubicacionFilter || 
      (user.ubicacion && typeof user.ubicacion === 'object' && 'nombre' in user.ubicacion && 
      user.ubicacion.nombre.toLowerCase().includes(ubicacionFilter.toLowerCase()));

    return matchesEmail && matchesRole && matchesUbicacion;
  });

  // Ordenar usuarios
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortOption) return 0;

    switch (sortOption) {
      case 'email-asc':
        return a.email.localeCompare(b.email);
      case 'email-desc':
        return b.email.localeCompare(a.email);
      case 'role-admin':
        return a.role === 'admin' ? -1 : 1;
      case 'role-admin_ubicacion':
        return a.role === 'admin_ubicacion' ? -1 : 1;
      case 'role-employee':
        return a.role === 'employee' ? -1 : 1;
      default:
        return 0;
    }
  });

  // Calcular paginación
  const totalItems = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  // Asegurar que la página actual es válida cuando cambian los filtros
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const refreshUsers = () => {
    fetchUsers();
  };

  return {
    users: currentUsers,
    loading,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    emailFilter,
    roleFilter,
    ubicacionFilter,
    sortOption,
    setEmailFilter,
    setRoleFilter,
    setUbicacionFilter,
    setSortOption,
    handlePageChange,
    handleItemsPerPageChange,
    refreshUsers,
  };
}