import React, { useState, useEffect } from 'react';

export interface Payment {
  type: 'efectivo' | 'TC' | 'transferencia';
  amount: number;
  change?: number;
}

interface PaymentDividerProps {
  total: number;
  onPaymentsChange: (payments: Payment[]) => void;
}

const paymentTypes = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'TC', label: 'Tarjeta' },
  { id: 'transferencia', label: 'Transferencia' }
];

export function PaymentDivider({ total, onPaymentsChange }: PaymentDividerProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [remainingAmount, setRemainingAmount] = useState(total);

  useEffect(() => {
    setRemainingAmount(total);
  }, [total]);

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
      setPayments(payments.filter(p => p.type !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
      setPayments([...payments, { type: type as Payment['type'], amount: 0 }]);
    }
  };

  const handleAmountChange = (type: string, amount: number) => {
    const newPayments = payments.map(p =>
      p.type === type ? { ...p, amount } : p
    );
    setPayments(newPayments);

    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    setRemainingAmount(total - totalPaid);

    const efectivoPayment = newPayments.find(p => p.type === 'efectivo');
    if (efectivoPayment) {
      const change = efectivoPayment.amount - total;
      onPaymentsChange(newPayments.map(p =>
        p.type === 'efectivo' ? { ...p, change: change >= 0 ? change : undefined } : p
      ));
    } else {
      onPaymentsChange(newPayments);
    }
  };

  const efectivoPayment = payments.find(p => p.type === 'efectivo');
  const efectivoChange = efectivoPayment && efectivoPayment.amount > 0 ? efectivoPayment.amount - total : null;
  const hasEfectivo = selectedTypes.includes('efectivo');

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {paymentTypes.map(type => (
          <button
            key={type.id}
            onClick={() => handleTypeToggle(type.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedTypes.includes(type.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {selectedTypes.length > 0 && (
        <div className="space-y-3">
          {selectedTypes.map(type => (
            <div key={type} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-gray-700">
                {paymentTypes.find(t => t.id === type)?.label}:
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={payments.find(p => p.type === type)?.amount || ''}
                onChange={(e) => handleAmountChange(type, Number(e.target.value) || 0)}
                className="w-32 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Monto"
              />
            </div>
          ))}

          {hasEfectivo && efectivoChange !== null && (
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Vuelto (efectivo):</span>
                {efectivoChange > 0 ? (
                  <span className="text-lg font-bold text-green-600">
                    Q{efectivoChange.toFixed(2)}
                  </span>
                ) : efectivoChange === 0 ? (
                  <span className="text-lg font-bold text-blue-600">
                    Pago exacto - Sin vuelto
                  </span>
                ) : (
                  <span className="text-lg font-bold text-red-600">
                    Falta Q{Math.abs(efectivoChange).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="w-24 text-gray-700">Restante:</span>
            <span className={`${remainingAmount === 0 ? 'text-green-600' : 'text-red-600'}`}>
              Q{remainingAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}