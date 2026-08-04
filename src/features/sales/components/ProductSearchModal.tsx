import { useState, useRef, useEffect } from 'react';
import { Product } from '../../../features/products/types/Product';
import { searchProductsByNameService } from '../services/salesService';
import BaseModal from '../../../components/ui/BaseModal';
import Button from '../../../components/ui/Button';
import React from 'react';
import { Search, Package } from 'lucide-react';

interface ProductSearchModalProps {
  ubicacion: string | null;
  onProductSelected: (product: Product) => void;
  onClose: () => void;
}

export default function ProductSearchModal({
  ubicacion,
  onProductSelected,
  onClose,
}: ProductSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const found = await searchProductsByNameService(term, ubicacion);
      setResults(found);
    } catch (error) {
      console.error('Error searching products:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const formatPrice = (price?: number) => {
    return price ? `Q${price.toFixed(2)}` : '-';
  };

  const getStockDisplay = (product: Product) => {
    const units = Number(product.stock?.units || 0);
    if (units === 0) return 'Sin stock';
    if (units <= 10) return `${units} unidades (bajo)`;
    return `${units} unidades`;
  };

  const footer = (
    <div className="flex justify-end w-full">
      <Button variant="secondary" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Buscar Producto por Nombre"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            placeholder="Escriba el nombre del producto..."
          />
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
            Buscando productos...
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No se encontraron productos con ese nombre.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {results.map((product) => (
              <button
                key={product._id}
                onClick={() => onProductSelected(product)}
                className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-primary-700 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {product.barcode || 'Sin código'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="font-bold text-gray-900">
                      {formatPrice(product.prices?.unit)}
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      Number(product.stock?.units || 0) === 0
                        ? 'text-red-500'
                        : Number(product.stock?.units || 0) <= 10
                          ? 'text-amber-500'
                          : 'text-green-600'
                    }`}>
                      {getStockDisplay(product)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="text-center py-8 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Escriba al menos 2 caracteres para buscar</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
