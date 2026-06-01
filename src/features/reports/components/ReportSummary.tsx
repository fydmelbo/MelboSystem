import React from 'react';
import { Report } from '../types/Report';
import SaleDetails from './SaleDetails';

interface ReportSummaryProps {
  report: Report;
}

export default function ReportSummary({ report }: ReportSummaryProps) {
  // Ordenar las ventas por fecha, las más recientes primero
  const sortedSales = [...report.sales].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Ventas</p>
          <p className="text-2xl font-bold text-blue-900">Q{report.totalSales.toFixed(2)}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Productos Vendidos</p>
          <p className="text-2xl font-bold text-green-900">{report.totalProducts}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Ventas Realizadas</p>
          <p className="text-2xl font-bold text-purple-900">{report.sales.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Ventas del Día</h3>
        {sortedSales.length > 0 ? (
          sortedSales.map((sale, index) => (
            <SaleDetails 
              key={index} 
              sale={sale} 
              index={index}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No hay ventas registradas para esta fecha</p>
        )}
      </div>
    </div>
  );
}