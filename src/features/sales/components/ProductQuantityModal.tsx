import { useState, useEffect } from 'react';
import { Product } from '../../../features/products/types/Product';
import { Promotion } from '../../../features/promotions/types/Promotion';
import { getProductPromotions } from '../services/salesService';
import BaseModal from '../../../components/ui/BaseModal';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import React from 'react';

interface ProductQuantityModalProps {
  product: Product;
  onConfirm: (quantity: number, saleType: 'unit' | 'blister' | 'box', discount?: number, promotionInfo?: any) => void;
  onClose: () => void;
}

export default function ProductQuantityModal({
  product,
  onConfirm,
  onClose
}: ProductQuantityModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [saleType, setSaleType] = useState<'unit' | 'blister' | 'box'>(
    product.sellOptions.unit ? 'unit' :
    product.sellOptions.blister ? 'blister' :
    'box'
  );
  const [discount, setDiscount] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const productPromotions = await getProductPromotions(product._id);
        setPromotions(productPromotions);
      } catch (error) {
        console.error('Error al cargar promociones:', error);
      }
    };
    loadPromotions();
  }, [product._id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const promotionInfo = selectedPromotion ? {
      promotionId: selectedPromotion._id,
      name: selectedPromotion.name,
      type: selectedPromotion.promotionType,
      description: selectedPromotion.description,
      config: selectedPromotion.promotionType === 'NxM' ? selectedPromotion.nxmConfig : null,
      discountValue: selectedPromotion.discountValue
    } : null;
    onConfirm(quantity, saleType, discount, promotionInfo);
  };

  const formatPrice = (price?: number) => {
    return price ? `Q${price.toFixed(2)}` : '-';
  };

  const handlePromotionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const promotionId = e.target.value;
    if (promotionId === '') {
      setSelectedPromotion(null);
      setDiscount(0);
      setQuantity(1);
    } else {
      const promotion = promotions.find(p => p._id === promotionId);
      if (promotion) {
        setSelectedPromotion(promotion);
        switch (promotion.promotionType) {
          case 'NxM':
            if (promotion.nxmConfig) {
              setQuantity(promotion.nxmConfig.buyQuantity);
              setDiscount(0);
            }
            break;
          case 'percentage':
            setDiscount(promotion.discountValue || 0);
            break;
          case 'fixed':
            const porcentajeDescuento = ((promotion.discountValue || 0) / basePrice) * 100;
            setDiscount(porcentajeDescuento);
            break;
        }
      }
    }
  };

  const basePrice = product.prices[saleType] || 0;
  const finalPrice = selectedPromotion?.promotionType === 'NxM' && selectedPromotion.nxmConfig
    ? basePrice * (selectedPromotion.nxmConfig.getQuantity / selectedPromotion.nxmConfig.buyQuantity)
    : basePrice - (basePrice * (discount / 100));

  const saleTypeOptions = [
    ...(product.sellOptions.unit ? [{ value: 'unit', label: `Unidad - ${formatPrice(product.prices.unit)}` }] : []),
    ...(product.sellOptions.blister ? [{ value: 'blister', label: `Blister - ${formatPrice(product.prices.blister)}` }] : []),
    ...(product.sellOptions.box ? [{ value: 'box', label: `Caja - ${formatPrice(product.prices.box)}` }] : []),
  ];

  const promotionOptions = [
    { value: '', label: 'Seleccionar promoción' },
    ...promotions.map(p => ({
      value: p._id,
      label: `${p.name} - ${
        p.promotionType === 'NxM'
          ? `Lleva ${p.nxmConfig?.buyQuantity} y paga ${p.nxmConfig?.getQuantity}`
          : p.promotionType === 'percentage'
            ? `${p.discountValue}% descuento`
            : `Q${p.discountValue} descuento`
      }`
    }))
  ];

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} loadingText="Agregando...">
        Agregar
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={product.name}
      size="sm"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo de Venta"
          options={saleTypeOptions}
          value={saleType}
          onChange={(e) => setSaleType(e.target.value as 'unit' | 'blister' | 'box')}
        />

        <Input
          label="Cantidad"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        <Input
          label="Descuento (%)"
          type="number"
          min="0"
          max="100"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
        />

        {promotions.length > 0 && (
          <Select
            label="Promociones Disponibles"
            options={promotionOptions}
            value={selectedPromotion?._id || ''}
            onChange={handlePromotionSelect}
          />
        )}

        {selectedPromotion && (
          <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-primary-900">{selectedPromotion.name}</h4>
                <p className="text-sm text-primary-700">{selectedPromotion.description}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedPromotion(null); setDiscount(0); }}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Quitar
              </button>
            </div>
            <div className="text-sm text-primary-700 space-y-1">
              <p><strong>Tipo:</strong> {
                selectedPromotion.promotionType === 'NxM'
                  ? `Lleva ${selectedPromotion.nxmConfig?.buyQuantity} y paga ${selectedPromotion.nxmConfig?.getQuantity}`
                  : selectedPromotion.promotionType === 'percentage'
                    ? `${selectedPromotion.discountValue}% de descuento`
                    : `Q${selectedPromotion.discountValue} de descuento fijo`
              }</p>
              <p><strong>Válido:</strong> {new Date(selectedPromotion.startDate).toLocaleDateString()} — {new Date(selectedPromotion.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 space-y-1">
          <p className="text-sm text-gray-600">
            Precio unitario: {formatPrice(basePrice)}
          </p>
          {discount > 0 && (
            <p className="text-sm text-emerald-600">
              Precio con descuento: {formatPrice(finalPrice)}
            </p>
          )}
          <p className="text-lg font-bold text-gray-900">
            Total: {formatPrice(finalPrice * quantity)}
          </p>
        </div>
      </form>
    </BaseModal>
  );
}
