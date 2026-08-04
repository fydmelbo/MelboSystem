import { useState, useEffect, useRef } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import BarcodeScanner from '../components/BarcodeScanner';
import SaleItems from '../components/SaleItems';
import ProductQuantityModal from '../components/ProductQuantityModal';
import ProductSearchModal from '../components/ProductSearchModal';
import { SaleItem } from '../types/Sale';
import { toast } from 'react-hot-toast';
import { findProductByBarcodeService, updateStockService, invalidateProductsCache } from '../services/salesService';
import { Product } from '../../../features/products/types/Product';
import { addSaleToReport } from '../../../features/reports/services/reportService';
import React from 'react';
import { PaymentDivider, Payment } from '../components/PaymentDivider';
import { useAuth } from '../../auth/context/AuthContext';
import { ubicacionesAPI } from '../../../lib/api';
import { unitsToDeductForSale, StockPackaging, StockSellOptions } from '../../products/utils/stockMath';

export default function SalesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<string>('efectivo');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isDivided, setIsDivided] = useState(false);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>(user?.ubicacion || '');
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);
  const cashInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) {
      ubicacionesAPI.getUbicaciones().then(setUbicaciones).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (paymentType === 'efectivo' && !isDivided) {
      setTimeout(() => cashInputRef.current?.focus(), 100);
    } else {
      setCashGiven('');
    }
  }, [paymentType, isDivided]);

  const ubicacion = isAdmin ? selectedUbicacion : (user?.ubicacion || '');

  const handleScan = async (barcode: string) => {
    if (isAdmin && !selectedUbicacion) {
      toast.error('Selecciona una ubicación antes de escanear');
      return;
    }
    try {
      const product = await findProductByBarcodeService(barcode, ubicacion || null);
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

  const handleSearchSelect = (product: Product) => {
    setIsSearchModalOpen(false);
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleOpenSearchModal = () => {
    if (isAdmin && !selectedUbicacion) {
      toast.error('Selecciona una ubicación antes de buscar productos');
      return;
    }
    setIsSearchModalOpen(true);
  };

  const handleUbicacionChange = (newUbicacion: string) => {
    if (selectedUbicacion && selectedUbicacion !== newUbicacion) {
      invalidateProductsCache(selectedUbicacion);
    }
    setSelectedUbicacion(newUbicacion);
  };

  const getPackagingFromProduct = (product: Product): StockPackaging => ({
    unitsPerBlister: Number(product.packaging?.unitsPerBlister || 1),
    blistersPerBox: Number(product.packaging?.blistersPerBox || 1),
    unitsPerBox: Number(product.packaging?.unitsPerBox || 1),
  });

  const getSellOptionsFromProduct = (product: Product): StockSellOptions => ({
    unit: !!product.sellOptions?.unit,
    blister: !!product.sellOptions?.blister,
    box: !!product.sellOptions?.box,
  });

  const handleAddProduct = async (quantity: number, saleType: 'unit' | 'blister' | 'box', discount: number = 0, promotionInfo: any = null) => {
    if (!selectedProduct) return;
  
    const basePrice = selectedProduct.prices[saleType];
    if (!basePrice) {
      toast.error('Precio no disponible para este tipo de venta');
      return;
    }

    const packaging = getPackagingFromProduct(selectedProduct);
    const sellOptions = getSellOptionsFromProduct(selectedProduct);

    // Para NxM: deducir stock por lo que el cliente LLEVA (getQuantity), no por lo que PAGA (buyQuantity)
    let unitsToDeduct: number;
    if (promotionInfo && promotionInfo.type === 'NxM' && promotionInfo.config) {
      unitsToDeduct = unitsToDeductForSale(promotionInfo.config.getQuantity, saleType, packaging, sellOptions);
    } else {
      unitsToDeduct = unitsToDeductForSale(quantity, saleType, packaging, sellOptions);
    }

    const totalAvailable = Number(selectedProduct.stock?.units || 0);
    
    if (unitsToDeduct > totalAvailable) {
      toast.error('Stock insuficiente');
      return;
    }
  
    let finalPrice = basePrice;
    let finalQuantity = quantity;
    let subtotal;

    if (promotionInfo && promotionInfo.type === 'NxM' && promotionInfo.config) {
      finalQuantity = promotionInfo.config.buyQuantity;
      subtotal = Number((basePrice * promotionInfo.config.getQuantity).toFixed(2));
    } else {
      finalPrice = Number((basePrice - (basePrice * (discount / 100))).toFixed(2));
      subtotal = Number((finalPrice * finalQuantity).toFixed(2));
    }
  
    // unitsPerSale: unidades a deducir por cada unidad vendida (buyQuantity)
    // Para NxM: totalUnitsToDeduct / buyQuantity para que quantity * unitsPerSale = totalUnitsToDeduct
    const unitsPerSale = unitsToDeduct / finalQuantity;

    const newItem: SaleItem & { ubicacion?: string } = {
      productId: selectedProduct._id,
      barcode: selectedProduct.barcode,
      name: selectedProduct.name,
      price: finalPrice,
      quantity: finalQuantity,
      saleType,
      unitsPerSale,
      subtotal: subtotal,
      paymentType: payments.length > 0 ? 'multiple' : paymentType,
      discount: discount,
      promotion: promotionInfo,
      ubicacion: isAdmin ? selectedUbicacion : (selectedProduct.location?._id || localStorage.getItem('ubicacion'))
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
      const product = await findProductByBarcodeService(item.barcode, ubicacion || null);
      
      if (!product) {
        toast.error('Producto no encontrado');
        return;
      }

      const packaging = getPackagingFromProduct(product);
      const sellOptions = getSellOptionsFromProduct(product);
      const unitsToDeduct = unitsToDeductForSale(newQuantity, item.saleType, packaging, sellOptions);
      const totalAvailable = Number(product.stock?.units || 0);
      
      if (unitsToDeduct > totalAvailable) {
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

    if (isAdmin && !selectedUbicacion) {
      toast.error('Selecciona una ubicación antes de finalizar la venta');
      return;
    }

    if (paymentType === 'efectivo' && !isDivided && (cashGivenNum === null || cashGivenNum < total)) {
      toast.error('El efectivo recibido debe ser igual o mayor al total');
      return;
    }

    try {
      for (const item of saleItems) {
        const totalUnits = item.quantity * item.unitsPerSale;
        const itemUbicacion = (item as SaleItem & { ubicacion?: string }).ubicacion;
        await updateStockService(item.productId, totalUnits, itemUbicacion || ubicacion || null);
      }

      const efectivoDivided = isDivided ? payments.find(p => p.type === 'efectivo') : null;

      const paymentData = {
        type: isDivided ? 'multiple' : paymentType,
        amount: total,
        isDivided,
        cashGiven: paymentType === 'efectivo' && !isDivided ? cashGivenNum : (efectivoDivided?.amount || undefined),
        change: paymentType === 'efectivo' && !isDivided ? (change && change > 0 ? change : 0) : (efectivoDivided?.change || undefined),
        paymentDetails: {
          efectivo: isDivided ? (payments.find(p => p.type === 'efectivo')?.amount || 0) : (paymentType === 'efectivo' ? total : 0),
          TC: isDivided ? (payments.find(p => p.type === 'TC')?.amount || 0) : (paymentType === 'TC' ? total : 0),
          transferencia: isDivided ? (payments.find(p => p.type === 'transferencia')?.amount || 0) : (paymentType === 'transferencia' ? total : 0)
        }
      };

      const firstItem = saleItems[0] as SaleItem & { ubicacion?: string };

      const saleData = {
        items: saleItems,
        total,
        paymentType: paymentData,
        ubicacion: isAdmin ? selectedUbicacion : (firstItem.ubicacion || localStorage.getItem('ubicacion')),
        createdAt: new Date().toISOString()
      };

      await addSaleToReport(saleData as any);

      const { logAuditAction } = await import('../../../features/audit/services/auditService');
      const totalItemsLogged = saleItems.reduce((acc, item) => acc + item.quantity, 0);
      const productNames = saleItems.map(item => item.name).join(', ');
      await logAuditAction(
        'CREAR',
        'Venta',
        saleData.ubicacion || 'Sistema',
        `Se registró una venta de ${totalItemsLogged} producto(s) (${productNames}) por un total de Q${total.toFixed(2)}`
      );

      toast.success('Venta finalizada con éxito');
      setSaleItems([]);
      setPayments([]);
      setPaymentType('efectivo');
      setIsDivided(false);
      setCashGiven('');
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
    setCashGiven('');
    toast.success('Venta cancelada');
  };

  const total = Number(saleItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const cashGivenNum = cashGiven !== '' ? Number(cashGiven) : null;
  const change = cashGivenNum !== null ? cashGivenNum - total : null;

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Nueva Venta</h1>

        {isAdmin && ubicaciones.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación de la venta *</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all bg-white"
              value={selectedUbicacion}
              onChange={(e) => handleUbicacionChange(e.target.value)}
            >
              <option value="">Seleccionar ubicación</option>
              {ubicaciones.map((ub) => (
                <option key={ub._id} value={ub._id}>{ub.nombre}</option>
              ))}
            </select>
          </div>
        )}
        
        <BarcodeScanner
          onScan={handleScan}
          onSearchByName={handleOpenSearchModal}
        />
        
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
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
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

              {paymentType === 'efectivo' && !isDivided && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Efectivo del cliente (obligatorio) *
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-600">Q</span>
                    <input
                      ref={cashInputRef}
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  {change !== null && (
                    <div className="mt-3">
                      {change > 0 ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-green-700">Vuelto:</span>
                            <span className="text-xl font-bold text-green-600">Q{change.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : change === 0 ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="text-sm font-bold text-blue-600">Pago exacto - Sin vuelto</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-red-700">Falta:</span>
                            <span className="text-xl font-bold text-red-600">Q{Math.abs(change).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  onClick={handleCancelSale}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                >
                  Cancelar Venta
                </button>
                <button
                  onClick={handleFinalizeSale}
                  disabled={
                    (isDivided ? payments.length === 0 : false) ||
                    (paymentType === 'efectivo' && !isDivided && (cashGiven === '' || Number(cashGiven) < total)) ||
                    (isAdmin && !selectedUbicacion)
                  }
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

      {isSearchModalOpen && (
        <ProductSearchModal
          ubicacion={ubicacion || null}
          onProductSelected={handleSearchSelect}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}
    </MainLayout>
  );
}
