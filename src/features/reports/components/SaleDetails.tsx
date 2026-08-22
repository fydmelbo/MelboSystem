import { Sale } from '../types/Report';
import { ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import React from 'react';
import { useState } from 'react';
import { formatGuatemalaDate, formatGuatemalaTime } from '../../../lib/timezone';

interface SaleDetailsProps {
  sale: Sale;
  index: number;
  ubicacionName?: string;
  onRevert?: (sale: Sale) => void;
  canRevert?: boolean;
}


export default function SaleDetails({ sale, index, ubicacionName, onRevert, canRevert = false }: SaleDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isReverted = !!sale.revertedAt;
  const isBackdated = !!sale.isBackdated;


  const formatSaleType = (type: string) => {
    switch (type) {
      case 'unit': return 'Unidad';
      case 'blister': return 'Blister';
      case 'box': return 'Caja';
      default: return type;
    }
  };

  return (
    <div className={`border rounded-lg ${isReverted ? 'bg-red-50 border-red-200' : isBackdated ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}>
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
            {formatGuatemalaDate(sale.createdAt)} - {formatGuatemalaTime(sale.createdAt)}
          </span>
          {ubicacionName && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded-full">
              {ubicacionName}
            </span>
          )}
          {isReverted && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">
              ANULADA
            </span>
          )}
          {isBackdated && !isReverted && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-full">
              VENTA ATRASADA
            </span>
          )}
          <span className={`font-medium ${isReverted ? 'line-through text-gray-400' : ''}`}>
            Q{sale.total.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isReverted && canRevert && (
            <span
              className="text-[10px] text-red-500 italic max-w-[120px] truncate"
              title={sale.revertReason}
            >
              {sale.revertReason}
            </span>
          )}
          {!isReverted && canRevert && onRevert && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRevert(sale);
              }}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Revertir esta venta"
            >
              <Undo2 className="h-4 w-4" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 border-t">
          {isReverted && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
              <span className="font-semibold text-red-700">Anulada:</span>{' '}
              <span className="text-red-600">{sale.revertReason}</span>
              {sale.revertedBy && (
                <span className="text-gray-500 ml-2">— por {sale.revertedBy}</span>
              )}
            </div>
          )}
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
