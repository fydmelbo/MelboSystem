import React from 'react';
import { HistoricoProducto } from '../types/HistoricoProducto';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RefreshCcw, Trash2 } from 'lucide-react';

interface HistoricoTableProps {
  historicos: HistoricoProducto[];
  onRestore: (product: HistoricoProducto) => void;
  onHardDelete: (id: string) => void;
}

export default function HistoricoTable({ historicos, onRestore, onHardDelete }: HistoricoTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Casa Farm.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Vencimiento</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Eliminación</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {historicos.map((historico) => (
            <tr key={historico._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {historico.barcode}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {historico.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {historico.pharmaceuticalCompany}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {historico.expirationDate && typeof historico.expirationDate === 'object' && 'toDate' in (historico.expirationDate as any)
                  ? format((historico.expirationDate as any).toDate(), 'dd/MM/yyyy', { locale: es })
                  : historico.expirationDate ? format(new Date(historico.expirationDate), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {historico.types?.join(', ') || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {historico.deletedAt && typeof historico.deletedAt === 'object' && 'toDate' in (historico.deletedAt as any)
                  ? format((historico.deletedAt as any).toDate(), 'dd/MM/yyyy', { locale: es })
                  : historico.deletedAt ? format(new Date(historico.deletedAt), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                {historico.deletionReason || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onRestore(historico)}
                    className="text-green-600 hover:text-green-900"
                    title="Reactivar Producto"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onHardDelete(historico._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar Permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}