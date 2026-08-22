import React from 'react';
import { Purchase } from '../types/Purchase';
import { formatGuatemalaDateTime } from '../../../lib/timezone';
import { X, FileText, ExternalLink, RotateCcw, Building2, CreditCard, Banknote, Truck, Calendar } from 'lucide-react';

interface PurchaseDetailsProps {
  purchase: Purchase;
  onClose: () => void;
  onRevert?: () => void;
  userRole?: string;
}

export default function PurchaseDetails({ purchase, onClose, onRevert, userRole }: PurchaseDetailsProps) {
  const isReverted = !!purchase.revertedAt;

  const formatDateTime = (dateStr: string) => {
    try {
      return formatGuatemalaDateTime(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const invoiceRef = purchase.invoiceSerie && purchase.invoiceNumber
    ? `${purchase.invoiceSerie}-${purchase.invoiceNumber}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detalle de Compra</h2>
            <p className="text-sm text-gray-500">{formatDateTime(purchase.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isReverted && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                <RotateCcw className="h-4 w-4" />
                Compra Revertida
              </div>
              <p className="text-sm text-red-600">Motivo: {purchase.revertReason}</p>
              <p className="text-xs text-red-500 mt-1">
                Revertida por: {purchase.revertedBy} el {purchase.revertedAt ? formatDateTime(purchase.revertedAt) : ''}
              </p>
            </div>
          )}

          {/* Datos de la Factura */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Datos de Factura
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {purchase.supplier && (
                <div>
                  <p className="text-xs text-gray-500">Proveedor</p>
                  <p className="text-sm font-medium text-gray-900">{purchase.supplier}</p>
                </div>
              )}
              {purchase.supplierNit && (
                <div>
                  <p className="text-xs text-gray-500">NIT</p>
                  <p className="text-sm font-medium text-gray-900">{purchase.supplierNit}</p>
                </div>
              )}
              {invoiceRef && (
                <div>
                  <p className="text-xs text-gray-500">Factura</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{invoiceRef}</p>
                </div>
              )}
              {purchase.purchaseDate && (
                <div>
                  <p className="text-xs text-gray-500">Fecha de Compra</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(purchase.purchaseDate)}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-gray-500">Metodo de Pago</p>
                  <div className="flex items-center gap-1 mt-0.5">
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
                  </div>
                </div>
              </div>
              {purchase.paymentMethod === 'credito' && purchase.dueDate && (
                <div>
                  <p className="text-xs text-gray-500">Vencimiento</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-orange-500" />
                    {formatDate(purchase.dueDate)}
                  </p>
                </div>
              )}
              {purchase.transport && (
                <div>
                  <p className="text-xs text-gray-500">Transporte</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-gray-400" />
                    {purchase.transport}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Productos</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600">
                <div className="col-span-5">Producto</div>
                <div className="col-span-2 text-center">Cantidad</div>
                <div className="col-span-2 text-center">Precio Unit.</div>
                <div className="col-span-3 text-right">Subtotal</div>
              </div>
              <div className="divide-y divide-gray-100">
                {purchase.items.map((item, index) => (
                  <div key={index} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-gray-700">{item.quantity}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-gray-700">{formatCurrency(item.costPerUnit)}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className={`text-lg font-bold ${isReverted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {formatCurrency(purchase.total)}
                </span>
              </div>
            </div>
          </div>

          {purchase.invoiceUrl && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Factura Adjunta</h3>
              {purchase.invoiceUrl.includes('.pdf') ? (
                <a
                  href={purchase.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Ver PDF
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <a href={purchase.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <img src={purchase.invoiceUrl} alt="Factura" className="max-h-48 rounded-xl border border-gray-200" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
          {!isReverted && onRevert && (userRole === 'admin' || userRole === 'admin_ubicacion') && (
            <button
              onClick={onRevert}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Revertir Compra
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
