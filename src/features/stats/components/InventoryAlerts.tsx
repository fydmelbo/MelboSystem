import React from 'react';
import { InventorySummary, ExpiringProduct, LowStockProduct } from '../services/statsService';
import { AlertTriangle, Clock, TrendingDown, Warehouse } from 'lucide-react';

interface InventoryAlertsProps {
  inventory: InventorySummary;
  expiringProducts: ExpiringProduct[];
  lowStockProducts: LowStockProduct[];
}

export default function InventoryAlerts({ inventory, expiringProducts, lowStockProducts }: InventoryAlertsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Resumen de Inventario</h2>
        <p className="text-sm text-gray-500 mt-0.5">Estado actual del inventario y alertas</p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Productos', value: inventory.totalProducts, icon: Warehouse, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Stock Bajo', value: inventory.lowStockCount, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Por Vencer', value: inventory.expiringSoonCount, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-500">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {expiringProducts.length > 0 && (
            <div className="rounded-xl border border-red-100 overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold text-red-700">Productos por Vencer (30 días)</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {expiringProducts.slice(0, 8).map(p => (
                  <div key={p.productId} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.ubicacionNombre}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.daysUntilExpiration <= 7 ? 'bg-red-100 text-red-700' :
                        p.daysUntilExpiration <= 14 ? 'bg-amber-100 text-amber-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.daysUntilExpiration}d
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">{p.stock} uds</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="rounded-xl border border-orange-100 overflow-hidden">
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-orange-700">Stock Bajo (≤5 unidades)</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {lowStockProducts.slice(0, 8).map(p => (
                  <div key={p.productId} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.ubicacionNombre}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.currentStock === 0 ? 'bg-red-100 text-red-700' :
                        p.currentStock <= 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.currentStock} uds
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
