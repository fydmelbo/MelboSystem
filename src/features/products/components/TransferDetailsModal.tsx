import React from 'react';
import BaseModal from '../../../components/ui/BaseModal';
import { TransferRecord } from '../types/Transfer';
import { Truck, ArrowRight, Package, User, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: TransferRecord | null;
}

const statusConfig = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock className="w-4 h-4" /> },
  recibida: { label: 'Recibida', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle className="w-4 h-4" /> },
  rechazada: { label: 'Rechazada', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle className="w-4 h-4" /> },
};

export default function TransferDetailsModal({ isOpen, onClose, transfer }: TransferDetailsModalProps) {
  if (!transfer) return null;

  const cfg = statusConfig[transfer.status];

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Detalle de Transferencia" size="lg">
      <div className="space-y-5">
        {/* Status badge */}
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>

        {/* Route */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Origen</p>
              <div className="flex items-center gap-1.5 justify-center">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-sm font-bold text-primary-700">{transfer.ubicacionOrigenNombre}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px w-10 bg-gray-300" />
              <Truck className="w-5 h-5 text-primary-400" />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="h-px w-10 bg-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Destino</p>
              <div className="flex items-center gap-1.5 justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-bold text-green-700">{transfer.ubicacionDestinoNombre}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Productos ({transfer.productos.length})
          </h4>
          <div className="space-y-2">
            {transfer.productos.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.productName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.saleType === 'unit' ? 'Unidad' : p.saleType === 'blister' ? 'Blister' : 'Caja'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-bold text-gray-900">{p.quantity}</p>
                  <p className="text-xs text-gray-400">{p.unitsTransferred} u. total</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <p className="text-xs text-primary-600 uppercase tracking-wide">Productos</p>
            <p className="text-2xl font-bold text-primary-800 mt-1">{transfer.totalProductos}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-green-600 uppercase tracking-wide">Unidades</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{transfer.totalUnidades}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">Enviado por:</span>
            <span>{transfer.userName} ({transfer.userEmail})</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">Fecha de creación:</span>
            <span>{formatDate(transfer.createdAt) || '-'}</span>
          </div>
          {transfer.receivedAt && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Recibida:</span>
              <span>{formatDate(transfer.receivedAt)} por {transfer.receivedBy}</span>
            </div>
          )}
          {transfer.rejectedAt && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Rechazada:</span>
              <span>{formatDate(transfer.rejectedAt)} por {transfer.rejectedBy}</span>
            </div>
          )}
          {transfer.rejectionReason && (
            <div className="bg-red-50 rounded-lg p-2 text-red-700 text-xs">
              <span className="font-medium">Motivo:</span> {transfer.rejectionReason}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
