import React, { useState, useEffect, useMemo } from 'react';
import { Promotion } from '../types/Promotion';
import { Product } from '../../products/types/Product';
import { getProducts } from '../../products/services/productService';
import { ubicacionesAPI } from '../../../lib/api';
import BaseModal from '../../../components/ui/BaseModal';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import ProductMultiSelect from '../../../components/ui/ProductMultiSelect';
import {
  Tag, Calendar, Percent, Hash, Gift, Power, Info,
  AlertCircle, Sparkles, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePromotionModalProps {
  onClose: () => void;
  onSubmit: (promotionData: Partial<Promotion>) => void;
}

type PromotionType = 'NxM' | 'percentage' | 'fixed';

const PROMO_TYPES: { value: PromotionType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'NxM',
    label: 'N x M',
    description: 'Lleva más y paga menos',
    icon: <Gift className="w-4 h-4" />,
    color: 'from-violet-500 to-purple-600',
  },
  {
    value: 'percentage',
    label: 'Porcentaje',
    description: 'Descuento sobre el precio',
    icon: <Percent className="w-4 h-4" />,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    value: 'fixed',
    label: 'Monto Fijo',
    description: 'Descuento en quetzales',
    icon: <Tag className="w-4 h-4" />,
    color: 'from-amber-500 to-orange-600',
  },
];

export function CreatePromotionModal({ onClose, onSubmit }: CreatePromotionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ubicacionLabels, setUbicacionLabels] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    description: '',
    promotionType: 'NxM',
    nxmConfig: { buyQuantity: 2, getQuantity: 1 },
    discountValue: 0,
    products: [],
    startDate: '',
    endDate: '',
    isActive: true,
    conditions: { minimumPurchase: 0, maxUses: null, usedCount: 0 },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allProducts, ubicaciones] = await Promise.all([
          getProducts(),
          ubicacionesAPI.getUbicaciones().catch(() => []),
        ]);
        setProducts(allProducts);
        const labels: Record<string, string> = {};
        ubicaciones.forEach(u => { labels[u._id] = u.nombre; });
        setUbicacionLabels(labels);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };
    loadData();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim()) e.name = 'El nombre es obligatorio';
    if (!formData.description?.trim()) e.description = 'La descripción es obligatoria';
    if (!formData.startDate) e.startDate = 'Fecha de inicio requerida';
    if (!formData.endDate) e.endDate = 'Fecha de fin requerida';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      e.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    if (!formData.products || formData.products.length === 0) {
      e.products = 'Selecciona al menos un producto';
    }
    if (formData.promotionType === 'NxM') {
      const buy = formData.nxmConfig?.buyQuantity || 0;
      const get = formData.nxmConfig?.getQuantity || 0;
      if (buy < 1) e.nxmConfig = 'La cantidad a comprar debe ser mayor a 0';
      if (get < 1) e.nxmConfig = 'La cantidad a llevar debe ser mayor a 0';
      if (get > buy) e.nxmConfig = 'En NxM, la cantidad a llevar no puede ser mayor a la que se compra';
    } else {
      if (!formData.discountValue || formData.discountValue <= 0) {
        e.discountValue = 'Ingresa un valor de descuento válido';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    onSubmit(formData);
  };

  const updateField = <K extends keyof Promotion>(key: K, value: Promotion[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateCondition = <K extends keyof NonNullable<Promotion['conditions']>>(
    key: K,
    value: NonNullable<Promotion['conditions']>[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      conditions: { ...(prev.conditions || { minimumPurchase: 0, maxUses: null, usedCount: 0 }), [key]: value },
    }));
  };

  const selectedProductIds = useMemo(
    () => (formData.products || []).map(p => p.productId),
    [formData.products]
  );

  const handleSelectionChange = (ids: string[]) => {
    const currentMap = new Map((formData.products || []).map(p => [p.productId, p]));
    const newProducts = ids.map(id => {
      const existing = currentMap.get(id);
      if (existing) return existing;
      return {
        productId: id,
        minimumQuantity: formData.promotionType === 'NxM'
          ? formData.nxmConfig?.buyQuantity || 1
          : 1,
      };
    });
    updateField('products', newProducts);
  };

  const setPromoType = (type: PromotionType) => {
    setFormData(prev => ({ ...prev, promotionType: type }));
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        loading={isSubmitting}
        loadingText="Creando..."
        icon={<Sparkles className="w-4 h-4" />}
      >
        Crear Promoción
      </Button>
    </div>
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <BaseModal isOpen={true} onClose={onClose} title="Nueva Promoción" size="2xl" footer={footer}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TIPO DE PROMOCIÓN */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Tipo de promoción</h3>
              <p className="text-xs text-gray-500">Elige cómo se aplicará el descuento</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PROMO_TYPES.map(t => {
              const isActive = formData.promotionType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPromoType(t.value)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isActive
                      ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-2`}>
                    {t.icon}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* INFORMACIÓN BÁSICA */}
        <section className="space-y-3">
          <Input
            label="Nombre de la promoción"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ej. Promo Paracetamol 2x1"
            error={errors.name}
            required
          />
          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe brevemente la promoción..."
            rows={2}
            error={errors.description}
            required
          />
        </section>

        {/* VALORES DE LA PROMOCIÓN */}
        <section className="p-4 bg-gray-50/60 rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              {formData.promotionType === 'NxM' ? <Gift className="w-4 h-4" /> : <Percent className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {formData.promotionType === 'NxM' ? 'Configuración N x M' : 'Valor del descuento'}
            </h3>
          </div>

          <AnimatePresence mode="wait">
            {formData.promotionType === 'NxM' ? (
              <motion.div
                key="nxm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="p-4 rounded-xl border-2 border-violet-200 bg-white">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Compra (N)</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      min="1"
                      value={formData.nxmConfig?.buyQuantity ?? 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        nxmConfig: {
                          buyQuantity: Number(e.target.value),
                          getQuantity: formData.nxmConfig?.getQuantity ?? 1,
                        },
                      })}
                      className="w-full text-3xl font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                    <span className="text-sm text-gray-400 font-medium">unid.</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border-2 border-primary-300 bg-primary-50/30">
                  <label className="text-xs font-medium text-primary-700 mb-1 block">Lleva (M)</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      min="1"
                      value={formData.nxmConfig?.getQuantity ?? 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        nxmConfig: {
                          buyQuantity: formData.nxmConfig?.buyQuantity ?? 1,
                          getQuantity: Number(e.target.value),
                        },
                      })}
                      className="w-full text-3xl font-bold text-primary-700 bg-transparent focus:outline-none"
                    />
                    <span className="text-sm text-primary-400 font-medium">unid.</span>
                  </div>
                </div>
                {errors.nxmConfig && (
                  <p className="col-span-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{errors.nxmConfig}
                  </p>
                )}
                <div className="col-span-2 p-2.5 bg-violet-50 rounded-lg border border-violet-100 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-violet-700">
                    El cliente compra <strong>{formData.nxmConfig?.buyQuantity || 0}</strong> y se lleva{' '}
                    <strong>{formData.nxmConfig?.getQuantity || 0}</strong>.
                    Se descuentan del stock las unidades que se lleva.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="discount"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <Input
                  label={formData.promotionType === 'percentage' ? 'Porcentaje de descuento' : 'Monto fijo (Q)'}
                  type="number"
                  min="0"
                  max={formData.promotionType === 'percentage' ? '100' : undefined}
                  value={formData.discountValue}
                  onChange={(e) => updateField('discountValue', Number(e.target.value))}
                  error={errors.discountValue}
                  required
                  icon={formData.promotionType === 'percentage'
                    ? <Percent className="w-4 h-4" />
                    : <span className="text-sm font-semibold">Q</span>}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* VIGENCIA Y CONDICIONES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Vigencia</h3>
            </div>
            <div className="space-y-3 p-3 rounded-xl border border-gray-100 bg-white">
              <Input
                label="Fecha de inicio"
                type="date"
                value={(formData.startDate as string) || ''}
                onChange={(e) => updateField('startDate', e.target.value)}
                min={today}
                error={errors.startDate}
                required
              />
              <Input
                label="Fecha de fin"
                type="date"
                value={(formData.endDate as string) || ''}
                onChange={(e) => updateField('endDate', e.target.value)}
                min={(formData.startDate as string) || today}
                error={errors.endDate}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <Hash className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Condiciones</h3>
            </div>
            <div className="space-y-3 p-3 rounded-xl border border-gray-100 bg-white">
              <Input
                label="Compra mínima (Q)"
                type="number"
                min="0"
                value={formData.conditions?.minimumPurchase ?? 0}
                onChange={(e) => updateCondition('minimumPurchase', Number(e.target.value))}
                placeholder="0 = sin mínimo"
                icon={<span className="text-xs font-semibold">Q</span>}
              />
              <Input
                label="Máximo de usos (opcional)"
                type="number"
                min="1"
                value={formData.conditions?.maxUses ?? ''}
                onChange={(e) => updateCondition('maxUses', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Sin límite"
              />
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => updateField('isActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Promoción activa</span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* PRODUCTOS */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Productos aplicables</h3>
              <p className="text-xs text-gray-500">
                Selecciona los productos que aplican. Se muestra su ubicación, stock y presentaciones.
              </p>
            </div>
          </div>
          <div className={`rounded-xl border ${errors.products ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white'} p-4`}>
            <ProductMultiSelect
              products={products}
              selectedIds={selectedProductIds}
              onSelectionChange={handleSelectionChange}
              ubicacionLabels={ubicacionLabels}
              emptyMessage="No hay productos registrados en el sistema"
            />
            {errors.products && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.products}
              </p>
            )}
          </div>
        </section>
      </form>
    </BaseModal>
  );
}
