import { Sale } from '../types/Report';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { useState } from 'react';

interface SaleDetailsProps {
  sale: Sale;
  index: number;
}

export default function SaleDetails({ sale, index }: SaleDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatSaleType = (type: string) => {
    switch (type) {
      case 'unit': return 'Unidad';
      case 'blister': return 'Blister';
      case 'box': return 'Caja';
      default: return type;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {index + 1}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            {formatDate(sale.createdAt)} - {formatTime(sale.createdAt)}
          </span>
          <span className="font-medium">
            Q{sale.total.toFixed(2)}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-3 border-t">
          <table className="w-full mt-2">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="py-2 text-left">Producto</th>
                <th className="py-2 text-right">Cantidad</th>
                <th className="py-2 text-right">Tipo</th>
                <th className="py-2 text-right">Precio Unit.</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} className="text-sm border-b last:border-0">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{formatSaleType(item.saleType)}</td>
                  <td className="py-2 text-right">Q{item.price.toFixed(2)}</td>
                  <td className="py-2 text-right">Q{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}