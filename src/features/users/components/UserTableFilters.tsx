import React from 'react';

interface UserTableFiltersProps {
  onSortChange: (value: string) => void;
  onUbicacionChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  sortOption: string;
}

export default function UserTableFilters({
  onSortChange,
  onUbicacionChange,
  onClearFilters,
  hasActiveFilters,
  sortOption,
}: UserTableFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="w-full sm:w-auto">
        <select
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-gray-700"
          value={sortOption}
        >
          <option value="">Todos los usuarios</option>
          <option value="email-asc">Email (A-Z)</option>
          <option value="email-desc">Email (Z-A)</option>
          <option value="role-admin">Administradores</option>
          <option value="role-admin_ubicacion">Administradores de Ubicación</option>
          <option value="role-employee">Empleados</option>
        </select>
      </div>

      <div className="w-full sm:flex-1">
        <input
          type="text"
          placeholder="Buscar por ubicación..."
          onChange={(e) => onUbicacionChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-gray-700"
        />
      </div>

      {hasActiveFilters && (
        <div className="w-full sm:w-auto text-center sm:text-left">
          <button
            onClick={onClearFilters}
            className="w-full sm:w-auto px-3 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}