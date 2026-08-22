import React, { useState, useEffect } from 'react';
import BaseModal from '../../../components/ui/BaseModal';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import InvoiceUploader from './InvoiceUploader';
import { PurchaseItem } from '../types/Purchase';
import { getPharmaceuticalCompanies, PharmaceuticalCompany } from '../../products/services/catalogService';
import { getProducts } from '../../products/services/productService';
import { ubicacionesAPI } from '../../../lib/api';
import { Plus, Trash2, ShoppingCart, ArrowLeft, ArrowRight, Package, AlertTriangle } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    items: PurchaseItem[];
    invoiceFile: File | null;
    supplier: string;
    supplierNit: string;
    invoiceSerie: string;
    invoiceNumber: string;
    paymentMethod: 'contado' | 'credito';
    dueDate?: string;
    transport: string;
    purchaseDate: string;
  }) => Promise<void>;
  loading?: boolean;
  ubicacion?: string;
  userRole?: string;
}

const TRANSPORT_OPTIONS = [
  { value: 'PROPIO', label: 'Propio' },
  { value: 'TERCERO', label: 'Tercero' },
];

export default function PurchaseModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  ubicacion,
  userRole,
}: PurchaseModalProps) {
  const [step, setStep] = useState(0);
  const [pharmaCompanies, setPharmaCompanies] = useState<PharmaceuticalCompany[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);
  const [inventoryProducts, setInventoryProducts] = useState<Array<{ _id: string; name: string; purchasePrices?: { unit?: number } }>>([]);

  // Step 1: Factura data
  const [supplier, setSupplier] = useState('');
  const [supplierNit, setSupplierNit] = useState('');
  const [invoiceSerie, setInvoiceSerie] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [selectedUbicacion, setSelectedUbicacion] = useState(ubicacion || '');
  const [transport, setTransport] = useState('PROPIO');
  const [paymentMethod, setPaymentMethod] = useState<'contado' | 'credito'>('contado');
  const [dueDate, setDueDate] = useState('');

  // Step 2: Products
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      getPharmaceuticalCompanies()
        .then(setPharmaCompanies)
        .catch(() => {});
      ubicacionesAPI.getUbicaciones()
        .then(setUbicaciones)
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedUbicacion) {
      getProducts(selectedUbicacion)
        .then(setInventoryProducts)
        .catch(() => setInventoryProducts([]));
    } else {
      setInventoryProducts([]);
    }
  }, [isOpen, selectedUbicacion]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSupplier('');
      setSupplierNit('');
      setInvoiceSerie('');
      setInvoiceNumber('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSelectedUbicacion(ubicacion || '');
      setTransport('PROPIO');
      setPaymentMethod('contado');
      setDueDate('');
      setItems([]);
      setItemName('');
      setItemQty(1);
      setItemPrice(0);
      setSelectedProductId(undefined);
      setInvoiceFile(null);
    }
  }, [isOpen, ubicacion]);

  const companyOptions = [
    ...pharmaCompanies.map((c) => ({ value: c.name, label: c.name })),
    ...(supplier && !pharmaCompanies.some((c) => c.name === supplier)
      ? [{ value: supplier, label: `${supplier} (no catalogada)` }]
      : []),
  ];

  const productOptions = inventoryProducts.map((p) => ({
    value: p.name,
    label: p.name,
    description: p.purchasePrices?.unit ? `Costo: Q${p.purchasePrices.unit.toFixed(2)}` : undefined,
  }));

  const handleAddItem = () => {
    if (!itemName.trim() || itemQty <= 0 || itemPrice <= 0) return;
    const subtotal = itemQty * itemPrice;
    setItems((prev) => [...prev, { name: itemName.trim(), quantity: itemQty, costPerUnit: itemPrice, subtotal, productId: selectedProductId }]);
    setItemName('');
    setItemQty(1);
    setItemPrice(0);
    setSelectedProductId(undefined);
  };

  const handleProductSelect = (value: string) => {
    setItemName(value);
    const match = inventoryProducts.find((p) => p.name === value);
    if (match) {
      setSelectedProductId(match._id);
      if (match.purchasePrices?.unit) {
        setItemPrice(match.purchasePrices.unit);
      }
    } else {
      setSelectedProductId(undefined);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const canProceedStep0 =
    supplier.trim().length > 0 && purchaseDate.length > 0 && (ubicacion || selectedUbicacion);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    await onSubmit({
      items,
      invoiceFile,
      supplier: supplier.trim(),
      supplierNit: supplierNit.trim(),
      invoiceSerie: invoiceSerie.trim(),
      invoiceNumber: invoiceNumber.trim(),
      paymentMethod,
      dueDate: paymentMethod === 'credito' ? dueDate : undefined,
      transport,
      purchaseDate,
    });
  };

  const stepLabels = ['Datos de Factura', 'Productos'];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Compra"
      size="2xl"
      currentStep={step}
      totalSteps={2}
      stepLabels={stepLabels}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Atras
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            {step === 0 ? (
              <button
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={items.length === 0 || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {loading ? 'Guardando...' : 'Registrar Compra'}
              </button>
            )}
          </div>
        </div>
      }
    >
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <SearchableSelect
                label="Casa Farmaceutica *"
                options={companyOptions}
                value={supplier}
                onChange={setSupplier}
                placeholder="Seleccionar o escribir proveedor..."
                searchPlaceholder="Buscar casa farmaceutica..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                NIT del Proveedor
              </label>
              <input
                type="text"
                value={supplierNit}
                onChange={(e) => setSupplierNit(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                placeholder="Ej: 7237638-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha de Compra *
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Serie Factura
              </label>
              <input
                type="text"
                value={invoiceSerie}
                onChange={(e) => setInvoiceSerie(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                placeholder="Ej: EF4E245B"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Numero de Factura
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                placeholder="Ej: 402606203"
              />
            </div>
            <div className="sm:col-span-2">
              {userRole === 'admin' ? (
                <SearchableSelect
                  label="Ubicacion *"
                  options={ubicaciones.map((u) => ({ value: u._id, label: u.nombre }))}
                  value={selectedUbicacion}
                  onChange={setSelectedUbicacion}
                  placeholder="Seleccionar ubicacion..."
                  searchPlaceholder="Buscar ubicacion..."
                  required
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ubicacion *
                  </label>
                  <input
                    type="text"
                    value={ubicaciones.find((u) => u._id === selectedUbicacion)?.nombre || selectedUbicacion}
                    disabled
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Metodo de Pago</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod('contado')}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  paymentMethod === 'contado'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Contado
              </button>
              <button
                onClick={() => setPaymentMethod('credito')}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  paymentMethod === 'credito'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Credito
              </button>
            </div>
          </div>

          {paymentMethod === 'credito' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Transporte
                </label>
                <SearchableSelect
                  options={TRANSPORT_OPTIONS}
                  value={transport}
                  onChange={setTransport}
                  placeholder="Seleccionar..."
                />
              </div>
            </div>
          )}

          {paymentMethod === 'contado' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Transporte
              </label>
              <SearchableSelect
                options={TRANSPORT_OPTIONS}
                value={transport}
                onChange={setTransport}
                placeholder="Seleccionar..."
              />
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <SearchableSelect
                label="Producto"
                options={productOptions}
                value={itemName}
                onChange={handleProductSelect}
                placeholder="Buscar producto en inventario..."
                searchPlaceholder="Escriba para buscar..."
                allowCustom
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad</label>
              <input
                type="number"
                min="1"
                value={itemQty || ''}
                onChange={(e) => setItemQty(Number(e.target.value) || 1)}
                onKeyDown={handleItemKeyDown}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio Unitario (Q)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemPrice || ''}
                onChange={(e) => setItemPrice(Number(e.target.value) || 0)}
                onKeyDown={handleItemKeyDown}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                placeholder="0.00"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                onClick={handleAddItem}
                disabled={!itemName.trim() || itemQty <= 0 || itemPrice <= 0}
                className="w-full px-3 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600">
                <div className="col-span-5">Producto</div>
                <div className="col-span-2 text-center">Cantidad</div>
                <div className="col-span-2 text-center">Precio Unit.</div>
                <div className="col-span-2 text-right">Monto</div>
                <div className="col-span-1"></div>
              </div>
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = Number(e.target.value) || 1;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === index
                                ? { ...it, quantity: newQty, subtotal: newQty * it.costPerUnit }
                                : it
                            )
                          );
                        }}
                        className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.costPerUnit}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value) || 0;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === index
                                ? { ...it, costPerUnit: newPrice, subtotal: it.quantity * newPrice }
                                : it
                            )
                          );
                        }}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        Q{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">
                    {items.length} producto{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">Q{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Package className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Agrega productos a la compra</p>
              <p className="text-xs text-gray-400 mt-1">
                Busca un producto del inventario o escribe uno nuevo
              </p>
            </div>
          )}

          <InvoiceUploader onFileSelect={setInvoiceFile} currentUrl={null} />
        </div>
      )}
    </BaseModal>
  );
}
