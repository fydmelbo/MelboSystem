import React, { useState } from 'react';
import { Purchase } from '../types/Purchase';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface RevertPurchaseModalProps {
  purchase: Purchase;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function RevertPurchaseModal({ purchase, onConfirm, onCancel, loading }: RevertPurchaseModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    await onConfirm(reason);
  };

  const formatCurrency = (amount: number) => {
    return `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Revertir Compra</h2>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium">
              Se reducirá el stock de {purchase.items.length} producto(s) por un total de {formatCurrency(purchase.total)}.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la reversión *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
              placeholder="Describa el motivo de la reversión..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {loading ? 'Revertiendo...' : 'Confirmar Reversión'}
          </button>
        </div>
      </div>
    </div>
  );
}
