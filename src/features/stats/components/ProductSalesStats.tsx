import React from 'react';
import { Package, TrendingUp } from 'lucide-react';

interface ProductSalesStatsProps {
  products: Array<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
    cost: number;
  }>;
}

export default function ProductSalesStats({ products }: ProductSalesStatsProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Detalle por Producto</h2>
          <p className="text-sm text-gray-500 mt-0.5">Estadísticas de ventas por producto</p>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Sin datos de ventas
        </div>
      </div>
    );
  }

  const sorted = [...products].sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = sorted[0]?.revenue || 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Detalle por Producto</h2>
        <p className="text-sm text-gray-500 mt-0.5">{products.length} productos con ventas</p>
      </div>
      <div className="overflow-y-auto max-h-96">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidades</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.slice(0, 20).map((product) => {
              const barWidth = (product.revenue / maxRevenue) * 100;
              const profit = product.revenue - product.cost;
              return (
                <tr key={product.productId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 tabular-nums font-medium">
                    {product.totalSold}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 tabular-nums font-medium">
                    Q{product.revenue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={`font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Q{profit.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
