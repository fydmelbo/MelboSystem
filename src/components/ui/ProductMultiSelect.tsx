import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, MapPin, Barcode, Layers, Check, CalendarClock } from 'lucide-react';
import { Product } from '../../features/products/types/Product';

export interface ProductMultiSelectProps {
  products: Product[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  ubicacionLabels?: Record<string, string>;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxHeight?: number;
}

// Un producto se considera "con stock" si tiene cantidad > 0 en ALGUNA de
// las presentaciones que vende. Por ejemplo: un producto que SOLO se vende
// por caja puede tener stock.units = 0 pero stock.boxes > 0 y aún así
// debe mostrarse. Si no vende nada (o todo está en 0), se filtra.
const hasAvailableStock = (p: Product): boolean => {
  const stock = p.stock;
  if (!stock) return false;
  const opts = p.sellOptions || { unit: false, blister: false, box: false };
  const units = Number(stock.units || 0);
  const blisters = Number(stock.blisters || 0);
  const boxes = Number(stock.boxes || 0);
  if (opts.unit && units > 0) return true;
  if (opts.blister && blisters > 0) return true;
  if (opts.box && boxes > 0) return true;
  return false;
};

const formatExpiration = (val: string | Date | undefined | null): string => {
  if (!val) return '—';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ProductMultiSelect({
  products,
  selectedIds,
  onSelectionChange,
  ubicacionLabels = {},
  searchPlaceholder = 'Buscar por nombre o código...',
  emptyMessage = 'No hay productos disponibles',
  maxHeight = 280,
}: ProductMultiSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Productos disponibles: solo los que tienen stock en alguna presentación.
  // Los productos ya seleccionados se mantienen aunque su stock haya bajado a 0
  // para que el usuario pueda ver/desselecionar lo que ya eligió.
  const availableProducts = useMemo(
    () => products.filter(hasAvailableStock),
    [products]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return availableProducts;
    return availableProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      const company = (p.pharmaceuticalCompany || '').toLowerCase();
      return name.includes(term) || barcode.includes(term) || company.includes(term);
    });
  }, [availableProducts, search]);

  const selectedProducts = useMemo(
    () => selectedIds
      .map(id => products.find(p => p._id === id))
      .filter(Boolean) as Product[],
    [selectedIds, products]
  );

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(s => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const removeProduct = (id: string) => {
    onSelectionChange(selectedIds.filter(s => s !== id));
  };

  const getPresentationsLabel = (p: Product) => {
    const opts = p.sellOptions || { unit: false, blister: false, box: false };
    const parts: string[] = [];
    if (opts.unit) parts.push('Unidad');
    if (opts.blister) parts.push('Blíster');
    if (opts.box) parts.push('Caja');
    return parts.join(' · ') || '—';
  };

  const getUbicacionLabel = (p: Product) => {
    const id = typeof p.location?._id === 'string' ? p.location._id : String(p.location?._id || '');
    return ubicacionLabels[id] || 'Sin ubicación';
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Input buscador + dropdown */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-elevated overflow-hidden"
            >
              <div
                className="overflow-y-auto"
                style={{ maxHeight }}
              >
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      {availableProducts.length === 0
                        ? 'No hay productos con stock disponible'
                        : 'No se encontraron coincidencias'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filtered.slice(0, 30).map(p => {
                      const isSelected = selectedIds.includes(p._id);
                      return (
                        <li key={p._id}>
                          <button
                            type="button"
                            onClick={() => toggleProduct(p._id)}
                            className={`w-full text-left p-3 transition-colors ${
                              isSelected ? 'bg-primary-50/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-primary-600 border-primary-600'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {p.name}
                                  </p>
                                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                    {p.category || 'Sin categoría'}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-1">
                                    <Barcode className="w-3 h-3" />
                                    {p.barcode || '—'}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {getUbicacionLabel(p)}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {getPresentationsLabel(p)}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" />
                                    Vence: {formatExpiration(p.expirationDate)}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs">
                                  <span className="text-gray-600">
                                    Stock: <span className="font-semibold text-gray-900">{p.stock?.units ?? 0} u.</span>
                                  </span>
                                  {p.pharmaceuticalCompany && (
                                    <span className="text-gray-500 truncate">
                                      {p.pharmaceuticalCompany}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chips de productos seleccionados */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {selectedProducts.length} producto{selectedProducts.length === 1 ? '' : 's'} seleccionado{selectedProducts.length === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map(p => {
              const outOfStock = !hasAvailableStock(p);
              return (
                <div
                  key={p._id}
                  className={`inline-flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-lg text-xs font-medium border ${
                    outOfStock
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-primary-50 text-primary-800 border-primary-100'
                  }`}
                  title={outOfStock ? 'Este producto ya no tiene stock disponible' : undefined}
                >
                  <span className="font-semibold truncate max-w-[180px]">{p.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] opacity-80">
                    <MapPin className="w-3 h-3" />
                    {getUbicacionLabel(p)}
                  </span>
                  {outOfStock && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                      Sin stock
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeProduct(p._id)}
                    className={`p-0.5 rounded-full transition-colors ${
                      outOfStock
                        ? 'hover:bg-amber-100 text-amber-700'
                        : 'hover:bg-primary-100 text-primary-600 hover:text-primary-900'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
