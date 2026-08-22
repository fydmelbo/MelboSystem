import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { PaymentMethodData } from '../services/statsService';
import { DollarSign, CreditCard, Building } from 'lucide-react';

interface PaymentMethodBreakdownProps {
  data: PaymentMethodData;
}

export default function PaymentMethodBreakdown({ data }: PaymentMethodBreakdownProps) {
  const pieData = [
    { id: 'Efectivo', value: data.efectivo, color: '#10b981' },
    { id: 'Tarjeta', value: data.TC, color: '#6366f1' },
    { id: 'Transferencia', value: data.transferencia, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const hasData = data.total > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Métodos de Pago</h2>
        <p className="text-sm text-gray-500 mt-0.5">Distribución de ingresos</p>
      </div>
      <div className="p-4">
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Sin datos de ventas
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsivePie
                data={pieData}
                innerRadius={55}
                padAngle={2}
                cornerRadius={4}
                colors={pieData.map(d => d.color)}
                borderColor={{ from: 'color', modifiers: [['brighter', 0.1]] }}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                theme={{
                  labels: { text: { fill: '#374151' } },
                }}
                tooltip={({ datum }) => (
                  <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
                    <p className="text-sm font-semibold" style={{ color: datum.color }}>{datum.id}</p>
                    <p className="text-sm text-gray-600">
                      Q{datum.value.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      <span className="text-gray-400 ml-1">
                        ({((datum.value / data.total) * 100).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                )}
              />
            </div>
            <div className="space-y-2 mt-2">
              {[
                { label: 'Efectivo', value: data.efectivo, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Tarjeta', value: data.TC, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Transferencia', value: data.transferencia, icon: Building, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(method => (
                <div key={method.label} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${method.bg}`}>
                      <method.icon className={`h-3.5 w-3.5 ${method.color}`} />
                    </div>
                    <span className="text-sm text-gray-600">{method.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      Q{method.value.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({data.total > 0 ? ((method.value / data.total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
