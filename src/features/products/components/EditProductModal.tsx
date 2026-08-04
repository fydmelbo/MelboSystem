import React, { useState, useEffect } from 'react';
import { Package, Tag, DollarSign, Calendar, Info, Building2, Layers } from 'lucide-react';
import { ubicacionesAPI } from '../../../lib/api';
import { useAuth } from '../../auth/context/AuthContext';
import { getCategories, getPharmaceuticalCompanies, Category, PharmaceuticalCompany } from '../services/catalogService';
import BaseModal from '../../../components/ui/BaseModal';
import Button from '../../../components/ui/Button';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types/Product';
import { format } from 'date-fns';
import {
  autoFillFromBoxes,
  normalizeFromBlisters,
  normalizeFromUnits,
  computeTotalUnits,
  StockPackaging,
  StockSellOptions,
} from '../utils/stockMath';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSubmit: (productId: string, productData: any) => void;
}

interface Ubicacion {
  _id: string;
  nombre: string;
}

const STEP_LABELS = [
  'Información General',
  'Ventas y Precios',
  'Stock y Fechas',
  'Configuración Final'
];

export default function EditProductModal({ product, onClose, onSubmit }: EditProductModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pharmaCompanies, setPharmaCompanies] = useState<PharmaceuticalCompany[]>([]);
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDateSafe = (dateVal: any): string => {
    if (!dateVal) return '';
    try {
      if (dateVal?.seconds) {
        return format(new Date(dateVal.seconds * 1000), 'yyyy-MM-dd');
      }
      return format(new Date(dateVal), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    barcode: product.barcode || '',
    name: product.name || '',
    category: product.category || (product as any).types?.[0] || '',
    expirationDate: formatDateSafe(product.expirationDate),
    entryDate: formatDateSafe((product as any).entryDate),
    pharmaceuticalCompany: product.pharmaceuticalCompany || '',
    paymentType: (product.paymentType as string) || 'excento',
    invoice: (product as any).invoice || '',
    profitMargin: ((product as any).profitMargin || '').toString(),
    location: product.location?._id || '',
    prices: {
      unit: product.prices?.unit?.toString() || '',
      blister: product.prices?.blister?.toString() || '',
      box: product.prices?.box?.toString() || ''
    },
    purchasePrices: {
      unit: product.purchasePrices?.unit?.toString() || '',
      blister: product.purchasePrices?.blister?.toString() || '',
      box: product.purchasePrices?.box?.toString() || ''
    },
    stock: {
      units: (product.stock?.units || 0).toString(),
      blisters: (product.stock?.blisters || 0).toString(),
      boxes: (product.stock?.boxes || 0).toString(),
      initial: ((product.stock as any)?.initial || 0).toString()
    },
    packaging: {
      unitsPerBlister: (product.packaging?.unitsPerBlister || 0).toString(),
      blistersPerBox: (product.packaging?.blistersPerBox || 0).toString(),
      unitsPerBox: ((product.packaging as any)?.unitsPerBox || 0).toString(),
      description: (product.packaging as any)?.description || ''
    },
    sellOptions: {
      unit: product.sellOptions?.unit ?? true,
      blister: product.sellOptions?.blister ?? false,
      box: product.sellOptions?.box ?? false
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ubicacionesData, categoriesData, companiesData] = await Promise.all([
          ubicacionesAPI.getUbicaciones(),
          getCategories(),
          getPharmaceuticalCompanies(),
        ]);
        setUbicaciones(ubicacionesData);
        setCategories(categoriesData);
        setPharmaCompanies(companiesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    fetchData();
  }, []);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (step === 0) {
      if (!formData.name.trim()) { newErrors.name = 'El nombre es obligatorio'; isValid = false; }
      if (!formData.category) { newErrors.category = 'Seleccione una categoría'; isValid = false; }
    } else if (step === 1) {
      if (!formData.sellOptions.unit && !formData.sellOptions.blister && !formData.sellOptions.box) {
        newErrors.sellOptions = 'Debe seleccionar al menos una opción de venta';
        isValid = false;
      }
      if (formData.sellOptions.unit && (!formData.prices.unit || Number(formData.prices.unit) <= 0)) {
        newErrors.priceUnit = 'Precio unitario inválido';
        isValid = false;
      }
      if (formData.sellOptions.blister && (!formData.prices.blister || Number(formData.prices.blister) <= 0)) {
        newErrors.priceBlister = 'Precio de blister inválido';
        isValid = false;
      }
      if (formData.sellOptions.box && (!formData.prices.box || Number(formData.prices.box) <= 0)) {
        newErrors.priceBox = 'Precio de caja inválido';
        isValid = false;
      }
    } else if (step === 2) {
      if (!formData.entryDate) { newErrors.entryDate = 'Fecha de ingreso obligatoria'; isValid = false; }
    } else if (step === 3) {
      if (!formData.location) { newErrors.location = 'Ubicación requerida'; isValid = false; }
    }

    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEP_LABELS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const getPackaging = (): StockPackaging => ({
    unitsPerBlister: Number(formData.packaging.unitsPerBlister) || 0,
    blistersPerBox: Number(formData.packaging.blistersPerBox) || 0,
    unitsPerBox: Number(formData.packaging.unitsPerBox) || 0,
  });

  const getSellOptions = (): StockSellOptions => ({ ...formData.sellOptions });

  const applyStockResult = (result: { boxes: number; blisters: number; units: number }) => {
    setFormData(prev => ({
      ...prev,
      stock: {
        ...prev.stock,
        boxes: String(result.boxes),
        blisters: String(result.blisters),
        units: String(result.units),
      },
    }));
  };

  const handleBoxesChange = (value: string) => {
    const numBoxes = Math.max(0, Number(value) || 0);
    applyStockResult(autoFillFromBoxes(numBoxes, getPackaging(), getSellOptions()));
  };

  const handleBlistersChange = (value: string) => {
    const numBlisters = Math.max(0, Number(value) || 0);
    applyStockResult(normalizeFromBlisters(numBlisters, getPackaging(), getSellOptions()));
  };

  const handleUnitsChange = (value: string) => {
    const numUnits = Math.max(0, Number(value) || 0);
    applyStockResult(normalizeFromUnits(numUnits, getPackaging(), getSellOptions()));
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);

    const processedData = {
      ...formData,
      prices: {
        ...(formData.prices.unit ? { unit: Number(formData.prices.unit) } : {}),
        ...(formData.prices.blister ? { blister: Number(formData.prices.blister) } : {}),
        ...(formData.prices.box ? { box: Number(formData.prices.box) } : {}),
      },
      purchasePrices: {
        ...(formData.purchasePrices.unit ? { unit: Number(formData.purchasePrices.unit) } : {}),
        ...(formData.purchasePrices.blister ? { blister: Number(formData.purchasePrices.blister) } : {}),
        ...(formData.purchasePrices.box ? { box: Number(formData.purchasePrices.box) } : {}),
      },
      stock: {
        units: Number(formData.stock.units) || 0,
        blisters: Number(formData.stock.blisters) || 0,
        boxes: Number(formData.stock.boxes) || 0,
        initial: Number(formData.stock.initial) || 0
      },
      packaging: {
        unitsPerBlister: Number(formData.packaging.unitsPerBlister) || 0,
        blistersPerBox: Number(formData.packaging.blistersPerBox) || 0,
        unitsPerBox: Number(formData.packaging.unitsPerBox) || 0,
        description: formData.packaging.description
      },
      profitMargin: formData.profitMargin ? Number(formData.profitMargin) : 0,
    };

    onSubmit(product._id, processedData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <Info className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-gray-900">Información General</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <SearchableSelect
                  label="Categoría *"
                  options={[
                    ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
                    ...(formData.category && !categories.some(c => c.name === formData.category)
                      ? [{ value: formData.category, label: `${formData.category} (no catalogada)` }]
                      : []),
                  ]}
                  value={formData.category}
                  onChange={(val) => setFormData({ ...formData, category: val })}
                  placeholder="Selecciona una categoría..."
                  searchPlaceholder="Buscar categoría..."
                  error={errors.category}
                  required
                />
              </div>
              <div>
                <SearchableSelect
                  label="Casa Farmacéutica"
                  options={[
                    ...pharmaCompanies.map((comp) => ({ value: comp.name, label: comp.name })),
                    ...(formData.pharmaceuticalCompany && !pharmaCompanies.some(c => c.name === formData.pharmaceuticalCompany)
                      ? [{ value: formData.pharmaceuticalCompany, label: `${formData.pharmaceuticalCompany} (no catalogada)` }]
                      : []),
                  ]}
                  value={formData.pharmaceuticalCompany}
                  onChange={(val) => setFormData({ ...formData, pharmaceuticalCompany: val })}
                  placeholder="Selecciona una casa farmacéutica..."
                  searchPlaceholder="Buscar casa farmacéutica..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Distribución / Empaquetado</label>
                <input
                  type="text"
                  value={formData.packaging.description}
                  onChange={(e) => setFormData({ ...formData, packaging: { ...formData.packaging, description: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ej: Frasco x 100 mL, Blister x 10/Unidad"
                />
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-2 mb-6 text-green-600">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-gray-900">Ventas y Precios</h3>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">Opciones de Venta Disponibles</label>
              <div className="flex flex-wrap gap-6">
                {['unit', 'blister', 'box'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(formData.sellOptions as any)[opt]}
                      onChange={(e) => setFormData({ ...formData, sellOptions: { ...formData.sellOptions, [opt]: e.target.checked } })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                    />
                    <span className="text-gray-700 group-hover:text-blue-600 transition-colors capitalize">
                      {opt === 'unit' ? 'Unidad' : opt === 'box' ? 'Caja' : 'Blister'}
                    </span>
                  </label>
                ))}
              </div>
              {errors.sellOptions && <p className="text-red-500 text-xs mt-2">{errors.sellOptions}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Precios de Venta</h4>
                {formData.sellOptions.unit && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Precio Unitario *</label>
                    <input type="number" step="0.01" value={formData.prices.unit} onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, unit: e.target.value } })} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.priceUnit ? 'border-red-500' : 'border-gray-300'}`} />
                  </div>
                )}
                {formData.sellOptions.blister && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Precio Blister *</label>
                    <input type="number" step="0.01" value={formData.prices.blister} onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, blister: e.target.value } })} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.priceBlister ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.priceBlister && <p className="text-red-500 text-xs mt-1">{errors.priceBlister}</p>}
                  </div>
                )}
                {formData.sellOptions.box && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Precio Caja *</label>
                    <input type="number" step="0.01" value={formData.prices.box} onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, box: e.target.value } })} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.priceBox ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.priceBox && <p className="text-red-500 text-xs mt-1">{errors.priceBox}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Costos (Compra)</h4>
                {formData.sellOptions.unit && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Costo Unitario</label>
                  <input type="number" step="0.01" value={formData.purchasePrices.unit} onChange={(e) => setFormData({ ...formData, purchasePrices: { ...formData.purchasePrices, unit: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                )}
                {formData.sellOptions.blister && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Costo Blister</label>
                  <input type="number" step="0.01" value={formData.purchasePrices.blister} onChange={(e) => setFormData({ ...formData, purchasePrices: { ...formData.purchasePrices, blister: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                )}
                {formData.sellOptions.box && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Costo Caja</label>
                  <input type="number" step="0.01" value={formData.purchasePrices.box} onChange={(e) => setFormData({ ...formData, purchasePrices: { ...formData.purchasePrices, box: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                )}
              </div>
            </div>
            
            <div className="pt-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">% Ganancia Deseada</label>
               <input type="number" step="0.01" value={formData.profitMargin} onChange={(e) => setFormData({ ...formData, profitMargin: e.target.value })} className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-2 mb-6 text-purple-600">
              <Package className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-gray-900">Inventario y Fechas</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2"><Layers className="w-4 h-4" /> Configuración de Empaque</h4>
                {(!formData.sellOptions.blister && !formData.sellOptions.box) ? (
                  <p className="text-sm text-gray-500 italic">No aplica (venta solo por unidad)</p>
                ) : (
                  <>
                    {formData.sellOptions.blister && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Unidades por Blister</label>
                        <input type="number" value={formData.packaging.unitsPerBlister} onChange={(e) => setFormData({ ...formData, packaging: { ...formData.packaging, unitsPerBlister: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                    {formData.sellOptions.box && !formData.sellOptions.blister && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Unidades por Caja</label>
                        <input type="number" value={formData.packaging.unitsPerBox} onChange={(e) => setFormData({ ...formData, packaging: { ...formData.packaging, unitsPerBox: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                    {formData.sellOptions.box && formData.sellOptions.blister && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Blisters por Caja</label>
                        <input type="number" value={formData.packaging.blistersPerBox} onChange={(e) => setFormData({ ...formData, packaging: { ...formData.packaging, blistersPerBox: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Stock Disponible</h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stock Inicial Referencial</label>
                  <input type="number" value={formData.stock.initial} onChange={(e) => setFormData({ ...formData, stock: { ...formData.stock, initial: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(formData.sellOptions.unit || (formData.sellOptions.blister && formData.sellOptions.box && Number(formData.packaging.unitsPerBlister) > 0)) && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unidades</label>
                      <input type="number" value={formData.stock.units} onChange={(e) => handleUnitsChange(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  )}
                  {formData.sellOptions.blister && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Blisters</label>
                      <input type="number" value={formData.stock.blisters} onChange={(e) => handleBlistersChange(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  )}
                  {formData.sellOptions.box && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cajas</label>
                      <input type="number" value={formData.stock.boxes} onChange={(e) => handleBoxesChange(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                  <span className="font-medium text-gray-700">Total calculado:</span>{' '}
                  {computeTotalUnits(
                    {
                      boxes: Number(formData.stock.boxes) || 0,
                      blisters: Number(formData.stock.blisters) || 0,
                      units: Number(formData.stock.units) || 0,
                    },
                    getPackaging(),
                    getSellOptions(),
                  )}{' '}
                  unidades
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> Fecha de Ingreso *</label>
                <input type="date" value={formData.entryDate} onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.entryDate ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.entryDate && <p className="text-red-500 text-xs mt-1">{errors.entryDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4 text-red-500"/> Fecha de Vencimiento</label>
                <input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center gap-2 mb-6 text-orange-600">
              <Building2 className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-gray-900">Configuración Final</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
                <input type="text" value={formData.invoice} onChange={(e) => setFormData({ ...formData, invoice: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago (G/E)</label>
                <select value={formData.paymentType} onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="excento">Excento</option>
                  <option value="gravado">Gravado</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <SearchableSelect
                  label="Ubicación (Farmacia) *"
                  options={ubicaciones.map((ub) => ({ value: ub._id, label: ub.nombre }))}
                  value={formData.location}
                  onChange={(val) => setFormData({ ...formData, location: val })}
                  placeholder="Seleccione una ubicación..."
                  searchPlaceholder="Buscar ubicación..."
                  error={errors.location}
                  required
                  disabled={currentUser?.role !== 'admin'}
                />
              </div>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-blue-800 font-medium mb-2">Resumen de Cambios</h4>
              <p className="text-sm text-blue-900"><span className="font-semibold">Nombre:</span> {formData.name || '---'}</p>
              <p className="text-sm text-blue-900"><span className="font-semibold">Categoría:</span> {formData.category || '---'}</p>
              <p className="text-sm text-blue-900"><span className="font-semibold">Precio Base (Unitario):</span> Q{formData.prices.unit || '0.00'}</p>
              <p className="text-sm text-blue-900"><span className="font-semibold">Stock Total Unidades:</span> {formData.stock.units || '0'}</p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <Button
        type="button"
        variant="outline"
        onClick={currentStep === 0 ? onClose : prevStep}
        disabled={isSubmitting}
      >
        {currentStep === 0 ? 'Cancelar' : 'Atrás'}
      </Button>
      
      <Button
        type="button"
        variant="primary"
        onClick={currentStep === STEP_LABELS.length - 1 ? handleSubmit : nextStep}
        loading={isSubmitting}
        loadingText="Guardando..."
        disabled={isSubmitting}
      >
        {currentStep === STEP_LABELS.length - 1 ? 'Guardar Cambios' : 'Siguiente'}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Editar Producto"
      size="lg"
      currentStep={currentStep}
      totalSteps={STEP_LABELS.length}
      stepLabels={STEP_LABELS}
      footer={footer}
    >
      <div className="py-2">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </BaseModal>
  );
}
