import { Report, Sale, SaleItem } from '../types/Report';

interface DetailedReportProps {
  report: Report;
}

interface GroupedSales {
  [hour: string]: {
    sales: Sale[];
    totalAmount: number;
    totalItems: number;
  };
}

export default function DetailedReport({ report }: DetailedReportProps) {
  const groupSalesByHour = (sales: Sale[]): GroupedSales => {
    return sales.reduce((acc: GroupedSales, sale) => {
      const date = new Date(sale.createdAt);
      const hour = date.getHours().toString().padStart(2, '0');
      const key = `${hour}:00`;

      if (!acc[key]) {
        acc[key] = {
          sales: [],
          totalAmount: 0,
          totalItems: 0
        };
      }

      acc[key].sales.push(sale);
      acc[key].totalAmount += sale.total;
      acc[key].totalItems += sale.items.reduce((sum, item) => sum + item.quantity, 0);

      return acc;
    }, {});
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-GT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `Q${amount.toFixed(2)}`;
  };

  const formatSaleType = (type: string) => {
    switch (type) {
      case 'unit': return 'Unidad';
      case 'blister': return 'Blister';
      case 'box': return 'Caja';
      default: return type;
    }
  };

  const groupedSales = groupSalesByHour(report.sales);
  const hours = Object.keys(groupedSales).sort();

  return (
    <div className="space-y-8">
      {hours.map((hour) => (
        <div key={hour} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Hora: {hour}
            </h3>
            <div className="text-sm text-gray-600">
              <span className="mr-4">
                Total ventas: {groupedSales[hour].sales.length}
              </span>
              <span className="mr-4">
                Items vendidos: {groupedSales[hour].totalItems}
              </span>
              <span className="font-medium text-gray-900">
                Total: {formatCurrency(groupedSales[hour].totalAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {groupedSales[hour].sales.map((sale, saleIndex) => (
              <div key={saleIndex} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Venta #{saleIndex + 1} - {formatTime(sale.createdAt)}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(sale.total)}
                  </span>
                </div>

                <table className="min-w-full">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left py-2">Producto</th>
                      <th className="text-right py-2">Cantidad</th>
                      <th className="text-right py-2">Tipo</th>
                      <th className="text-right py-2">Precio Unit.</th>
                      <th className="text-right py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sale.items.map((item: SaleItem, itemIndex: number) => (
                      <tr key={itemIndex} className="text-sm">
                        <td className="py-2">{item.name}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatSaleType(item.saleType)}</td>
                        <td className="text-right py-2">{formatCurrency(item.price)}</td>
                        <td className="text-right py-2">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      ))}

      {hours.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay ventas registradas
        </div>
      )}
    </div>
  );
}