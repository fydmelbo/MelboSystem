import { useState } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import BarcodeScanner from '../components/BarcodeScanner';
import SaleItems from '../components/SaleItems';
import ProductQuantityModal from '../components/ProductQuantityModal';
import { SaleItem } from '../types/Sale';
import { toast } from 'react-hot-toast';
import { findProductByBarcodeService, updateStockService } from '../services/salesService';
import { Product } from '../../../features/products/types/Product';
import { addSaleToReport } from '../../../features/reports/services/reportService';
import React from 'react';
import { PaymentDivider } from '../components/PaymentDivider';

interface Payment {
  type: 'efectivo' | 'TC' | 'transferencia';
  amount: number;
}

export default function SalesPage() {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<string>('efectivo');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isDivided, setIsDivided] = useState(false);

  const handleScan = async (barcode: string) => {
    try {
      const product = await findProductByBarcodeService(barcode);
      if (!product) {
        toast.error('Producto no encontrado');
        return;
      }
      setSelectedProduct(product);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Error al buscar producto');
    }
  };

  const calculateUnitsToDeduct = (quantity: number, saleType: 'unit' | 'blister' | 'box', product: Product) => {
    switch (saleType) {
      case 'unit':
        return quantity;
      case 'blister':
        return quantity;
      case 'box':
        return quantity;
      default:
        return quantity;
    }
  };

  const handleAddProduct = async (quantity: number, saleType: 'unit' | 'blister' | 'box', discount: number = 0, promotionInfo: any = null) => {
    if (!selectedProduct) return;
  
    const basePrice = selectedProduct.prices[saleType];
    if (!basePrice) {
      toast.error('Precio no disponible para este tipo de venta');
      return;
    }
  
    const unitsToDeduct = calculateUnitsToDeduct(quantity, saleType, selectedProduct);
    
    if (unitsToDeduct > selectedProduct.stock.units) {
      toast.error('Stock insuficiente');
      return;
    }
  
    let finalPrice = basePrice;
    let finalQuantity = quantity;
    let subtotal;

    if (promotionInfo && promotionInfo.type === 'NxM' && promotionInfo.config) {
      finalQuantity = promotionInfo.config.buyQuantity;
      // Calculamos el subtotal basado en la cantidad a pagar (getQuantity) en lugar de la cantidad total
      subtotal = Number((basePrice * promotionInfo.config.getQuantity).toFixed(2));
    } else {
      // Para descuentos normales
      finalPrice = Number((basePrice - (basePrice * (discount / 100))).toFixed(2));
      subtotal = Number((finalPrice * finalQuantity).toFixed(2));
    }
  
    const newItem: SaleItem = {
      productId: selectedProduct._id,
      barcode: selectedProduct.barcode,
      name: selectedProduct.name,
      price: finalPrice,
      quantity: finalQuantity,
      saleType,
      unitsPerSale: unitsToDeduct / finalQuantity,
      subtotal: subtotal,
      paymentType: payments.length > 0 ? 'multiple' : paymentType,
      discount: discount,
      promotion: promotionInfo 
    };
  
    setSaleItems([...saleItems, newItem]);
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = async (index: number, newQuantity: number) => {
    try {
      const item = saleItems[index];
      const product = await findProductByBarcodeService(item.barcode);
      
      if (!product) {
        toast.error('Producto no encontrado');
        return;
      }

      const unitsToDeduct = calculateUnitsToDeduct(newQuantity, item.saleType, product);
      
      if (unitsToDeduct > product.stock.units) {
        toast.error('Stock insuficiente');
        return;
      }

      const updatedItems = [...saleItems];
      updatedItems[index] = {
        ...item,
        quantity: newQuantity,
        subtotal: item.price * newQuantity,
        unitsPerSale: unitsToDeduct / newQuantity
      };
      setSaleItems(updatedItems);
    } catch (error) {
      toast.error('Error al actualizar cantidad');
    }
  };

  const handleFinalizeSale = async () => {
    if (saleItems.length === 0) {
      toast.error('No hay productos en la venta');
      return;
    }

    try {
      // Actualizar el stock de cada producto
      for (const item of saleItems) {
        const totalUnits = item.quantity * item.unitsPerSale;
        await updateStockService(item.productId, totalUnits, item.saleType);
      }

      // Preparar el objeto de pago
      const paymentData = {
        type: isDivided ? 'multiple' : paymentType,
        amount: total,
        isDivided,
        paymentDetails: {
          efectivo: isDivided ? (payments.find(p => p.type === 'efectivo')?.amount || 0) : (paymentType === 'efectivo' ? total : 0),
          TC: isDivided ? (payments.find(p => p.type === 'TC')?.amount || 0) : (paymentType === 'TC' ? total : 0),
          transferencia: isDivided ? (payments.find(p => p.type === 'transferencia')?.amount || 0) : (paymentType === 'transferencia' ? total : 0)
        }
      };

      // Crear el objeto de venta
      const saleData = {
        items: saleItems,
        total,
        paymentType: paymentData,
        createdAt: new Date().toISOString()
      };
      console.log(saleData); // Agrega esta línea para verificar los datos de la venta en la consola

      // Agregar la venta al reporte
      await addSaleToReport(saleData);

      toast.success('Venta finalizada con éxito');
      setSaleItems([]);
      setPayments([]);
      setPaymentType('efectivo');
      setIsDivided(false);
    } catch (error) {
      console.error('Error en la venta:', error);
      toast.error('Error al procesar la venta');
    }
  };

  const handlePaymentsChange = (newPayments: Payment[]) => {
    setPayments(newPayments);
  };

  const handleCancelSale = () => {
    setSaleItems([]);
    toast.success('Venta cancelada');
  };

  const total = Number(saleItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva Venta</h1>
        
        <BarcodeScanner onScan={handleScan} />
        
        {saleItems.length > 0 && (
          <>
            <SaleItems 
              items={saleItems} 
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />
            
            <div className="mt-6">
              <div className="text-xl font-bold mb-4">
                Total: Q{total.toFixed(2)}
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isDivided}
                    onChange={(e) => setIsDivided(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>Dividir pago</span>
                </label>
              </div>

              {!isDivided ? (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setPaymentType('efectivo')}
                    className={`px-4 py-2 rounded-md ${
                      paymentType === 'efectivo' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    onClick={() => setPaymentType('TC')}
                    className={`px-4 py-2 rounded-md ${
                      paymentType === 'TC' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    onClick={() => setPaymentType('transferencia')}
                    className={`px-4 py-2 rounded-md ${
                      paymentType === 'transferencia' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Transferencia
                  </button>
                </div>
              ) : (
                <PaymentDivider
                  total={total}
                  onPaymentsChange={handlePaymentsChange}
                />
              )}
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={handleCancelSale}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                >
                  Cancelar Venta
                </button>
                <button
                  onClick={handleFinalizeSale}
                  disabled={isDivided ? payments.length === 0 : false}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finalizar Venta
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && selectedProduct && (
        <ProductQuantityModal
          product={selectedProduct}
          onConfirm={handleAddProduct}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </MainLayout>
  );
}
