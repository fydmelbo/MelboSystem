import React from 'react';
import { Product } from '../types/Product';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export default function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  const formatPrice = (price?: number) => {
    return price ? `Q${price.toFixed(2)}` : '-';
  };

  const formatStock = (product: Product) => {
    const stockLines: string[] = [];
    if (product.sellOptions?.unit) {
      stockLines.push(`U: ${product.stock?.units ?? 0}`);
    }
    if (product.sellOptions?.blister) {
      stockLines.push(`B: ${product.stock?.blisters ?? 0}`);
    }
    if (product.sellOptions?.box) {
      stockLines.push(`C: ${product.stock?.boxes ?? 0}`);
    }
    // Si no tiene ninguna opción de venta marcada, mostrar unidades por defecto
    if (stockLines.length === 0) {
      stockLines.push(`U: ${product.stock?.units ?? 0}`);
    }
    return (
      <div className="flex flex-col gap-1">
        {stockLines.map((line, idx) => (
          <span key={idx}>{line}</span>
        ))}
      </div>
    );
  };

  const formatDateSafe = (dateVal: any): string => {
    if (!dateVal) return '-';
    try {
      if (dateVal?.seconds) {
        return format(new Date(dateVal.seconds * 1000), 'dd/MM/yyyy');
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return format(d, 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const getRowStyle = (expirationDate: any) => {
    if (!expirationDate) return '';
    let expDate: Date;
    if (expirationDate?.seconds) {
      expDate = new Date(expirationDate.seconds * 1000);
    } else {
      expDate = new Date(expirationDate);
    }
    if (isNaN(expDate.getTime())) return '';

    const today = new Date();
    const diffInMs = expDate.getTime() - today.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays < 0) {
      return 'bg-gray-200 text-gray-500';
    } else if (diffInDays <= 30) {
      return 'bg-red-100 text-red-700';
    } else if (diffInDays <= 180) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return '';
  };

  const getProductStatus = (expirationDate: any) => {
    if (!expirationDate) return '-';
    let expDate: Date;
    if (expirationDate?.seconds) {
      expDate = new Date(expirationDate.seconds * 1000);
    } else {
      expDate = new Date(expirationDate);
    }
    if (isNaN(expDate.getTime())) return '-';

    const today = new Date();
    const diffInMs = expDate.getTime() - today.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays < 0) {
      return 'PV';
    } else if (diffInDays <= 30) {
      return 'PPV';
    }
    return 'PL';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span className="text-sm">Próximo a vencer (menos de 6 meses)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm">Próximo a vencer (menos de 1 mes)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span className="text-sm">Producto vencido</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Código de Barras
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Nombre
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Categoría
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Fecha Venc.
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Casa Farm.
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Stock
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Precios
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Estado
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((product) => (
                  <tr key={product._id} className={getRowStyle(product.expirationDate)}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                      {product.barcode || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {product.category || '-'}
                    </td>
                    <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {formatDateSafe(product.expirationDate)}
                    </td>
                    <td className="hidden lg:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {product.pharmaceuticalCompany || '-'}
                    </td>
                    <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {formatStock(product)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <div className="flex flex-col gap-1">
                        {product.prices?.unit && <span>U: {formatPrice(product.prices.unit)}</span>}
                        {product.prices?.blister && <span>B: {formatPrice(product.prices.blister)}</span>}
                        {product.prices?.box && <span>C: {formatPrice(product.prices.box)}</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {getProductStatus(product.expirationDate)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onEdit(product)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors shadow-sm"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => product._id && onDelete(product._id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
