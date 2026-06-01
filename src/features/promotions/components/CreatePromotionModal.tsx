import React, { useState, useEffect } from 'react';
import { Promotion } from '../types/Promotion';
import { Product } from '../../products/types/Product';
import { getProducts } from '../../products/services/productService';

interface CreatePromotionModalProps {
  onClose: () => void;
  onSubmit: (promotionData: Partial<Promotion>) => void;
}

export function CreatePromotionModal({ onClose, onSubmit }: CreatePromotionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    description: '',
    promotionType: 'NxM',
    nxmConfig: {
      buyQuantity: 2,
      getQuantity: 1
    },
    discountValue: 0,
    products: [],
    startDate: '',
    endDate: '',
    isActive: true,
    conditions: {
      minimumPurchase: 0,
      maxUses: null,
      usedCount: 0
    }
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error al obtener productos:', error);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Crear Nueva Promoción</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Campos básicos */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Tipo de promoción */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Promoción</label>
              <select
                value={formData.promotionType}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  promotionType: e.target.value as 'NxM' | 'percentage' | 'fixed'
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="NxM">N x M</option>
                <option value="percentage">Porcentaje</option>
                <option value="fixed">Monto Fijo</option>
              </select>
            </div>

            {/* Configuración específica según el tipo */}
            {formData.promotionType === 'NxM' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compra (N)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.nxmConfig?.buyQuantity}
                    onChange={(e) => setFormData({
                      ...formData,
                      nxmConfig: {
                        ...formData.nxmConfig,
                        buyQuantity: Number(e.target.value)
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lleva (M)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.nxmConfig?.getQuantity}
                    onChange={(e) => setFormData({
                      ...formData,
                      nxmConfig: {
                        ...formData.nxmConfig,
                        getQuantity: Number(e.target.value)
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {formData.promotionType === 'percentage' ? 'Porcentaje de descuento' : 'Monto de descuento'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.promotionType === 'percentage' ? "100" : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Selección de productos */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Productos</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const filtered = products.filter(p => 
                      p.name.toLowerCase().includes(searchTerm) ||
                      p.barcode.toLowerCase().includes(searchTerm) ||
                      p.pharmaceuticalCompany.toLowerCase().includes(searchTerm)
                    );
                    setFilteredProducts(filtered);
                  }}
                  className="w-full p-2 border rounded-md mb-2"
                />
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {(filteredProducts.length > 0 ? filteredProducts : products).map(product => (
                    <div
                      key={product._id}
                      onClick={() => {
                        const isSelected = formData.products?.some(p => p.productId === product._id);
                        if (!isSelected) {
                          setFormData({
                            ...formData,
                            products: [...(formData.products || []), {
                              productId: product._id,
                              minimumQuantity: formData.nxmConfig?.buyQuantity || 1
                            }]
                          });
                        }
                      }}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                    >
                      <h3 className="font-medium text-lg">{product.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Código: {product.barcode}</p>
                        <p>Casa Farmacéutica: {product.pharmaceuticalCompany}</p>
                        <p>Vencimiento: {new Date(product.expirationDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {formData.products?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Productos Seleccionados:</h4>
                <div className="space-y-2">
                  {formData.products.map((selectedProduct) => {
                    const product = products.find(p => p._id === selectedProduct.productId);
                    return product ? (
                      <div key={product._id} className="bg-gray-50 p-3 rounded-md flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-lg">{product.name}</h5>
                          <p className="text-sm text-gray-600">Código: {product.barcode}</p>
                          <p className="text-sm text-gray-600">Casa Farmacéutica: {product.pharmaceuticalCompany}</p>
                          <p className="text-sm text-gray-600">
                            Vencimiento: {new Date(product.expirationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              products: formData.products?.filter(p => p.productId !== product._id)
                            });
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Fechas y estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Activa</label>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}