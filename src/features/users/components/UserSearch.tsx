import { Search } from 'lucide-react';
import React from 'react';

interface UserSearchProps {
  emailFilter: string;
  roleFilter: string;
  onEmailFilterChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
}

export default function UserSearch({
  emailFilter,
  roleFilter,
  onEmailFilterChange,
  onRoleFilterChange
}: UserSearchProps) {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar por email
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={emailFilter}
            onChange={(e) => onEmailFilterChange(e.target.value)}
            placeholder="Buscar usuario..."
            className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar por rol
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            placeholder="Filtrar por rol..."
            className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}