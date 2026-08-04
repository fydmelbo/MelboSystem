import React from 'react';
import { RefreshCcw, Trash2 } from 'lucide-react';

interface HistoricoUbicacionesTableProps {
  ubicaciones: any[];
  onRestore: (ubicacion: any) => void;
  onHardDelete: (id: string) => void;
}

export default function HistoricoUbicacionesTable({ ubicaciones, onRestore, onHardDelete }: HistoricoUbicacionesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo de Eliminación</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ubicaciones.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                No hay ubicaciones en el histórico.
              </td>
            </tr>
          ) : (
            ubicaciones.map((u) => (
              <tr key={u._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.direccion}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={u.deletionReason}>{u.deletionReason || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.deletedAt?.toDate ? u.deletedAt.toDate().toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onRestore(u)}
                      className="text-green-600 hover:text-green-900 flex items-center gap-1"
                      title="Reactivar Ubicación"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onHardDelete(u._id)}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      title="Eliminar Permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
