import React from 'react';
import { HistoricoProducto } from '../types/HistoricoProducto';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoricoTableProps {
  historicos: HistoricoProducto[];
}

export default function HistoricoTable({ historicos }: HistoricoTableProps) {
  const formatPrice = (price: number) => `Q${price.toFixed(2)}`;
  
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
                {format(new Date(historico.expirationDate), 'dd/MM/yyyy', { locale: es })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {historico.types.join(', ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(historico.deletedAt), 'dd/MM/yyyy', { locale: es })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                {historico.deletionReason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}