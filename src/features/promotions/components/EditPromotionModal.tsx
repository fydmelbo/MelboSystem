import React, { useState, useEffect } from 'react';
import { Promotion } from '../types/Promotion';
import { Product } from '../../products/types/Product';
import { getProducts } from '../../products/services/productService';

interface EditPromotionModalProps {
  promotion: Promotion;
  onClose: () => void;
  onSubmit: (id: string, promotionData: Partial<Promotion>) => void;
}

export function EditPromotionModal({ promotion, onClose, onSubmit }: EditPromotionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Partial<Promotion>>(promotion);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        // Aseguramos que los productos se carguen correctamente cuando se abre el modal
        if (promotion.products) {
          const selectedProducts = promotion.products.map(p => ({
            productId: p.productId._id,
            minimumQuantity: p.minimumQuantity,
            location: p.productId.location // Preservamos la información de ubicación
          }));
          setFormData(prev => ({
            ...prev,
            products: selectedProducts
          }));
        }
      } catch (error) {
        console.error('Error al obtener productos:', error);
      }
    };
    fetchProducts();
  }, [promotion]);

  useEffect(() => {
    setFormData(promotion);
  }, [promotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(promotion._id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Editar Promoción</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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

            {formData.promotionType === 'NxM' && (
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
            )}

            {formData.promotionType !== 'NxM' && (
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
                        // Verificar si el producto ya está seleccionado
                        if (!formData.products?.some(p => p.productId === product._id)) {
                          const newProduct = {
                            productId: product._id,
                            minimumQuantity: formData.promotionType === 'NxM' ? 
                              formData.nxmConfig?.buyQuantity || 1 : 1
                          };
                          setFormData(prev => ({
                            ...prev,
                            products: [...(prev.products || []), newProduct]
                          }));
                        }
                      }}
                      className="py-2 px-3 border-b cursor-pointer hover:bg-gray-100"
                    >
                      {`${product.name} - ${product.barcode} | ${product.pharmaceuticalCompany} | Vence: ${new Date(product.expirationDate).toLocaleDateString()}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {formData?.products?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Productos Seleccionados:</h4>
                <div className="space-y-2">
                  {formData.products.map((selectedProduct) => {
                    // Buscar el producto completo en la lista de productos
                    const product = products.find(p => p._id === selectedProduct.productId);
                    const productLocation = product?.location?.nombre || selectedProduct?.location?.nombre || 'No especificada';
                    
                    return product ? (
                      <div key={product._id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{product.name}</h5>
                            <p className="text-sm text-gray-600">Código: {product.barcode}</p>
                            <p className="text-sm text-gray-600">Casa Farmacéutica: {product.pharmaceuticalCompany}</p>
                            <p className="text-sm text-gray-600">
                              Vencimiento: {new Date(product.expirationDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Ubicación: {productLocation}
                            </p>
                            {formData.promotionType === 'NxM' && (
                              <div className="mt-2">
                                <label className="text-sm font-medium text-gray-700">Cantidad mínima:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={selectedProduct.minimumQuantity}
                                  onChange={(e) => {
                                    const newProducts = formData.products?.map(p =>
                                      p.productId === selectedProduct.productId
                                        ? { ...p, minimumQuantity: Number(e.target.value) }
                                        : p
                                    );
                                    setFormData(prev => ({ ...prev, products: newProducts }));
                                  }}
                                  className="ml-2 w-20 px-2 py-1 border rounded-md"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newProducts = formData.products?.filter(
                                p => p.productId !== selectedProduct.productId
                              );
                              setFormData(prev => ({ ...prev, products: newProducts }));
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <span className="sr-only">Eliminar</span>
                            ×
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
              <input
                type="date"
                value={formData.startDate?.split('T')[0]}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
              <input
                type="date"
                value={formData.endDate?.split('T')[0]}
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}