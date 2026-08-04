import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onSearchByName?: () => void;
}

export default function BarcodeScanner({ onScan, onSearchByName }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode);
      setBarcode('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
          placeholder="Escanear código de barras o escribir código..."
          autoFocus
        />
        <div className="flex gap-2 shrink-0">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
          {onSearchByName && (
            <button
              type="button"
              onClick={onSearchByName}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Nombre</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
