import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, CheckCircle, XCircle, Clock, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { TransferRecord } from '../types/Transfer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IncomingTransfersTableProps {
  transfers: TransferRecord[];
  onAccept: (transfer: TransferRecord) => void;
  onReject: (transfer: TransferRecord) => void;
  isProcessing?: string | null;
}

export default function IncomingTransfersTable({
  transfers,
  onAccept,
  onReject,
  isProcessing,
}: IncomingTransfersTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return format(date, "dd 'de' MMMM, yyyy HH:mm", { locale: es });
  };

  if (transfers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Truck className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin transferencias pendientes</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          No hay transferencias entrantes que requieran tu atención en este momento.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {transfers.map((transfer, index) => {
          const isExpanded = expandedId === transfer._id;
          const isCurrentlyProcessing = isProcessing === transfer._id;

          return (
            <motion.div
              key={transfer._id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Main row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => toggleExpand(transfer._id!)}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">
                      {transfer.ubicacionOrigenNombre}
                    </span>
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-bold text-gray-900">
                      {transfer.ubicacionDestinoNombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {transfer.totalProductos} producto(s)
                    </span>
                    <span>•</span>
                    <span>{transfer.totalUnidades} unidades</span>
                    <span>•</span>
                    <span>{formatDate(transfer.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept(transfer);
                    }}
                    disabled={isCurrentlyProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Recibir
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject(transfer);
                    }}
                    disabled={isCurrentlyProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(transfer._id!);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-0 border-t border-gray-50">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-2">
                        Productos a recibir
                      </p>
                      <div className="space-y-1.5">
                        {transfer.productos.map((p, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <span className="text-sm text-gray-800 font-medium">{p.productName}</span>
                            <span className="text-xs text-gray-500">
                              {p.quantity} {p.saleType === 'unit' ? 'unidades' : p.saleType === 'blister' ? 'blisteres' : 'cajas'}
                              {' '}({p.unitsTransferred} u. total)
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Enviado por: {transfer.userName} ({transfer.userEmail})
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
