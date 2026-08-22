import React from 'react';
import { TopSellingProduct } from '../services/statsService';
import { TrendingUp, Package } from 'lucide-react';

interface TopProductsListProps {
  products: TopSellingProduct[];
}

export default function TopProductsList({ products }: TopProductsListProps) {
  const top5 = products.slice(0, 5);
  const maxRevenue = top5.length > 0 ? top5[0].totalAmount : 1;

  if (top5.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Top Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Los más vendidos por ingresos</p>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Sin datos de ventas
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Top Productos</h2>
        <p className="text-sm text-gray-500 mt-0.5">Los más vendidos por ingresos</p>
      </div>
      <div className="p-4 space-y-3">
        {top5.map((product, index) => {
          const barWidth = (product.totalAmount / maxRevenue) * 100;
          return (
            <div key={product.productId} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                index === 0 ? 'bg-amber-100 text-amber-700' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-400'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums ml-2">
                    Q{product.totalAmount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {product.totalUnits} uds
                  </span>
                  {product.profit > 0 && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Q{product.profit.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
