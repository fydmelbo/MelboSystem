import React from 'react';
import { Report } from '../types/Report';

interface SalesHistoryProps {
  reports: Report[];
}

export default function SalesHistory({ reports }: SalesHistoryProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventas</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(report.startDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {report.sales.length}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {report.totalProducts}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${report.totalSales.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  report.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {report.status === 'active' ? 'Activo' : 'Completado'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}