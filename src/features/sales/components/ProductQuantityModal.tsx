import { useState, useEffect } from 'react';
import { Product } from '../../../features/products/types/Product';
import { Promotion } from '../../../features/promotions/types/Promotion';
import { getProductPromotions } from '../services/salesService';
import React from 'react';

interface ProductQuantityModalProps {
  product: Product;
  onConfirm: (quantity: number, saleType: 'unit' | 'blister' | 'box', discount?: number) => void;
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
        
        // Manejar diferentes tipos de promociones
        switch (promotion.promotionType) {
          case 'NxM':
            if (promotion.nxmConfig) {
              setQuantity(promotion.nxmConfig.buyQuantity);
              // Para NxM no aplicamos descuento porcentual
              setDiscount(0);
              // El precio total se calculará multiplicando el precio base por getQuantity
            }
            break;
          case 'percentage':
            setDiscount(promotion.discountValue || 0);
            break;
          case 'fixed':
            // Convertir el descuento fijo a porcentaje
            const porcentajeDescuento = ((promotion.discountValue || 0) / basePrice) * 100;
            setDiscount(porcentajeDescuento);
            break;
        }
      }
    }
  };

  const basePrice = product.prices[saleType] || 0;
  // Modificamos el cálculo del precio final para manejar promociones NxM
  const finalPrice = selectedPromotion?.promotionType === 'NxM' && selectedPromotion.nxmConfig
    ? basePrice * (selectedPromotion.nxmConfig.getQuantity / selectedPromotion.nxmConfig.buyQuantity)
    : basePrice - (basePrice * (discount / 100));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">{product.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Venta
            </label>
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value as 'unit' | 'blister' | 'box')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {product.sellOptions.unit && (
                <option value="unit">Unidad - {formatPrice(product.prices.unit)}</option>
              )}
              {product.sellOptions.blister && (
                <option value="blister">Blister - {formatPrice(product.prices.blister)}</option>
              )}
              {product.sellOptions.box && (
                <option value="box">Caja - {formatPrice(product.prices.box)}</option>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descuento (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {promotions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promociones Disponibles
              </label>
              <select
                value={selectedPromotion?._id || ''}
                onChange={handlePromotionSelect}
                disabled={!!selectedPromotion}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seleccionar promoción</option>
                {promotions.map(promotion => (
                  <option key={promotion._id} value={promotion._id}>
                    {`${promotion.name}\n-${
                      promotion.promotionType === 'NxM' 
                        ? `Lleva ${promotion.nxmConfig?.buyQuantity} y paga ${promotion.nxmConfig?.getQuantity}`
                        : promotion.promotionType === 'percentage'
                          ? `${promotion.discountValue}% de descuento`
                          : `Q${promotion.discountValue} de descuento`
                    } | Válido hasta: ${new Date(promotion.endDate).toLocaleDateString()}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedPromotion && (
            <div className="bg-blue-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-blue-900">{selectedPromotion.name}</h4>
                  <p className="text-sm text-blue-700">{selectedPromotion.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPromotion(null);
                    setDiscount(0);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Eliminar
                </button>
              </div>
              
              <div className="text-sm text-blue-700">
                <p><strong>Tipo de Promoción:</strong> {
                  selectedPromotion.promotionType === 'NxM' 
                    ? `Lleva ${selectedPromotion.nxmConfig?.buyQuantity} y paga ${selectedPromotion.nxmConfig?.getQuantity}`
                    : selectedPromotion.promotionType === 'percentage'
                      ? `${selectedPromotion.discountValue}% de descuento`
                      : `Q${selectedPromotion.discountValue} de descuento fijo`
                }</p>
                <p><strong>Válido desde:</strong> {new Date(selectedPromotion.startDate).toLocaleDateString()}</p>
                <p><strong>Válido hasta:</strong> {new Date(selectedPromotion.endDate).toLocaleDateString()}</p>
                {selectedPromotion.conditions?.minimumPurchase > 0 && (
                  <p><strong>Compra mínima:</strong> Q{selectedPromotion.conditions.minimumPurchase}</p>
                )}
                {selectedPromotion.conditions?.maxUses && (
                  <p><strong>Usos máximos:</strong> {selectedPromotion.conditions.maxUses}</p>
                )}
                <p><strong>Estado:</strong> {selectedPromotion.isActive ? 'Activa' : 'Inactiva'}</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-sm text-gray-600">
              Precio unitario: {formatPrice(basePrice)}
            </p>
            {discount > 0 && (
              <p className="text-sm text-green-600">
                Precio con descuento: {formatPrice(finalPrice)}
              </p>
            )}
            <p className="text-lg font-medium text-gray-900">
              Total: {formatPrice(finalPrice * quantity)}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}