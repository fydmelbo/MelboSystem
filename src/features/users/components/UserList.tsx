import React from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { User } from '../services/userService';
import Pagination from './Pagination';
import { useUsers } from '../hooks/useUsers';
import { Pencil, Trash2 } from 'lucide-react';

interface UserListProps {
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  emailFilter: string;
  roleFilter: string;
  sortOption: string;
  ubicacionFilter: string;
  refreshTrigger?: number;
}

export default function UserList({ 
  onEdit, 
  onDelete, 
  emailFilter,
  roleFilter,
  sortOption,
  ubicacionFilter,
  refreshTrigger
}: UserListProps) {
  const { user: currentUser } = useAuth();
  const { 
    users, 
    currentPage, 
    totalPages, 
    totalItems,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange, 
    loading: isLoading
  } = useUsers({
    emailFilter,
    roleFilter,
    ubicacionFilter,
    sortOption,
    refreshTrigger
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Email
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Rol
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Ubicación
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                {emailFilter || roleFilter || ubicacionFilter
                  ? 'No se encontraron usuarios que coincidan con los filtros aplicados'
                  : 'No hay usuarios registrados'}
              </td>
            </tr>
          ) : (
            users.map((user) => (
            <tr key={user.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                {user.email}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                {user.role}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                {user?.ubicacion?.nombre || 'N/A'}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onEdit(user)}
                    disabled={currentUser?.role === 'admin_ubicacion' && user.role === 'admin'}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    disabled={currentUser?.role === 'admin_ubicacion' && user.role === 'admin'}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))
          )}
        </tbody>
      </table>
          </div>
        </div>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}