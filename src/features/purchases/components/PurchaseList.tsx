import React from 'react';
import { Purchase } from '../types/Purchase';
import { formatGuatemalaDate } from '../../../lib/timezone';
import { Eye, RotateCcw, FileText, CreditCard, Banknote } from 'lucide-react';

interface PurchaseListProps {
  purchases: Purchase[];
  onViewDetails: (purchase: Purchase) => void;
  onRevert: (purchase: Purchase) => void;
  userRole?: string;
}

export default function PurchaseList({ purchases, onViewDetails, onRevert, userRole }: PurchaseListProps) {
  const formatDate = (dateStr: string) => {
    try {
      return formatGuatemalaDate(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No hay compras registradas</p>
        <p className="text-sm text-gray-400 mt-1">Las compras realizadas apareceran aqui</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Proveedor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Factura</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Pago</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Productos</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Total</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Estado</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {purchases.map((purchase) => {
              const isReverted = !!purchase.revertedAt;
              const invoiceRef = purchase.invoiceSerie && purchase.invoiceNumber
                ? `${purchase.invoiceSerie}-${purchase.invoiceNumber}`
                : '-';
              return (
                <tr
                  key={purchase._id}
                  className={`hover:bg-gray-50/50 transition-colors ${isReverted ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">
                      {purchase.purchaseDate ? formatDate(purchase.purchaseDate) : formatDate(purchase.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                      {purchase.supplier || '-'}
                    </p>
                    {purchase.supplierNit && (
                      <p className="text-xs text-gray-400">NIT: {purchase.supplierNit}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 font-mono">{invoiceRef}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {purchase.paymentMethod === 'credito' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <CreditCard className="h-3 w-3" />
                        Credito
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Banknote className="h-3 w-3" />
                        Contado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">
                      {purchase.items.length} producto{purchase.items.length !== 1 ? 's' : ''}
                    </span>
                    {purchase.invoiceUrl && (
                      <FileText className="inline h-3.5 w-3.5 text-blue-500 ml-1" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${isReverted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {formatCurrency(purchase.total)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isReverted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <RotateCcw className="h-3 w-3" />
                        Revertida
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Activa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetails(purchase)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isReverted && (userRole === 'admin' || userRole === 'admin_ubicacion') && (
                        <button
                          onClick={() => onRevert(purchase)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Revertir compra"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
