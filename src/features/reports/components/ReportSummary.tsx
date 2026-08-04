import React from 'react';
import { Report } from '../types/Report';
import SaleDetails from './SaleDetails';
import { toDate } from '../../../lib/timezone';

interface ReportSummaryProps {
  report: Report;
  ubicaciones?: Array<{ _id: string; nombre: string }>;
  isAdmin?: boolean;
}

export default function ReportSummary({ report, ubicaciones = [], isAdmin = false }: ReportSummaryProps) {
  const sortedSales = [...report.sales].sort((a, b) => 
    toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
  );

  // Calcular desglose por ubicación (solo para admin viendo "Todas")
  const ubicacionMap = new Map(ubicaciones.map(ub => [ub._id, ub.nombre]));
  const showBreakdown = isAdmin && ubicaciones.length > 0 && report.sales.some(s => s.ubicacion);

  const ubicacionBreakdown = React.useMemo(() => {
    if (!showBreakdown) return [];
    const map = new Map<string, { nombre: string; totalSales: number; totalProducts: number; salesCount: number }>();
    
    for (const sale of report.sales) {
      const ubId = sale.ubicacion || 'unknown';
      const existing = map.get(ubId) || { nombre: ubicacionMap.get(ubId) || ubId, totalSales: 0, totalProducts: 0, salesCount: 0 };
      existing.totalSales += sale.total || 0;
      existing.totalProducts += sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      existing.salesCount += 1;
      map.set(ubId, existing);
    }
    
    return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [report.sales, showBreakdown, ubicacionMap]);

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

      {/* Desglose por ubicación (solo admin con "Todas") */}
      {showBreakdown && ubicacionBreakdown.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Desglose por Ubicación</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Productos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ubicacionBreakdown.map((ub, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{ub.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{ub.salesCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{ub.totalProducts}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Q{ub.totalSales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Ventas del Día</h3>
        {sortedSales.length > 0 ? (
          sortedSales.map((sale, index) => (
            <SaleDetails 
              key={index} 
              sale={sale} 
              index={index}
              ubicacionName={isAdmin ? (ubicacionMap.get(sale.ubicacion || '') || undefined) : undefined}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No hay ventas registradas para esta fecha</p>
        )}
      </div>
    </div>
  );
}