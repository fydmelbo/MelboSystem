import { Search } from 'lucide-react';
import React from 'react';

interface ProductSearchProps {
  nameFilter: string;
  barcodeFilter: string;
  onNameFilterChange: (value: string) => void;
  onBarcodeFilterChange: (value: string) => void;
}

export default function ProductSearch({
  nameFilter,
  barcodeFilter,
  onNameFilterChange,
  onBarcodeFilterChange
}: ProductSearchProps) {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar por nombre
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => onNameFilterChange(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar por código de barras
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={barcodeFilter}
            onChange={(e) => onBarcodeFilterChange(e.target.value)}
            placeholder="Escanear código..."
            className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}