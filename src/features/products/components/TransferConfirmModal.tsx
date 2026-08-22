import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Truck, ArrowRight, X } from 'lucide-react';

interface TransferConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  originName: string;
  destinyName: string;
  products: { name: string; quantity: number; saleType: string }[];
  totalUnits: number;
  isLoading?: boolean;
}

export default function TransferConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  originName,
  destinyName,
  products,
  totalUnits,
  isLoading = false,
}: TransferConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg z-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirmar Transferencia</h3>
                  <p className="text-sm text-gray-500">Revisa los detalles antes de enviar</p>
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="px-6 py-3">
              <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Origen</p>
                  <p className="text-sm font-bold text-primary-700">{originName}</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-px w-8 bg-gray-300" />
                  <Truck className="w-5 h-5 text-primary-500" />
                  <div className="h-px w-8 bg-gray-300" />
                  <ArrowRight className="w-4 h-4 text-primary-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Destino</p>
                  <p className="text-sm font-bold text-green-700">{destinyName}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="px-6 py-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Productos ({products.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {products.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">
                      {p.name}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {p.quantity} {p.saleType === 'unit' ? 'u' : p.saleType === 'blister' ? 'bl' : 'caj'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="px-6 py-3">
              <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-primary-700">Total unidades:</span>
                <span className="text-lg font-bold text-primary-800">{totalUnits}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="px-6 pb-2">
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                La transferencia se guardará como <strong>pendiente</strong>. El stock se deducirá cuando la ubicación destino la reciba.
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    Enviar Transferencia
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
