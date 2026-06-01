import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { 
  getPromotions, 
  createPromotion, 
  updatePromotion, 
  deletePromotion 
} from '../services/promotionService';
import { Promotion } from '../types/Promotion';
import { CreatePromotionModal } from '../components/CreatePromotionModal';
import { EditPromotionModal } from '../components/EditPromotionModal';
import { DeletePromotionModal } from '../components/DeletePromotionModal';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);

  const fetchPromotions = async () => {
    try {
      const data = await getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error al obtener promociones:', error);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreatePromotion = async (promotionData: Partial<Promotion>) => {
    try {
      await createPromotion(promotionData);
      setIsCreateModalOpen(false);
      fetchPromotions();
    } catch (error) {
      console.error('Error al crear promoción:', error);
    }
  };

  const handleUpdatePromotion = async (id: string, promotionData: Partial<Promotion>) => {
    try {
      await updatePromotion(id, promotionData);
      setEditingPromotion(null);
      fetchPromotions();
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
    }
  };

  const handleDeletePromotion = async () => {
    if (!deletingPromotion) return;
    try {
      await deletePromotion(deletingPromotion._id);
      setDeletingPromotion(null);
      fetchPromotions();
    } catch (error) {
      console.error('Error al eliminar promoción:', error);
    }
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Promociones</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nueva Promoción
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {promotions.map((promotion) => (
            <div
              key={promotion._id}
              className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{promotion.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPromotion(promotion)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeletingPromotion(promotion)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{promotion.description}</p>

              <div className="space-y-3 flex-grow">
                {/* Tipo de Promoción */}
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Tipo de Promoción: </span>
                  {promotion.promotionType === 'NxM' ? (
                    <span className="text-blue-600 font-semibold">
                      {promotion.nxmConfig.buyQuantity}x{promotion.nxmConfig.getQuantity}
                    </span>
                  ) : promotion.promotionType === 'percentage' ? (
                    <span className="text-green-600 font-semibold">{promotion.discountValue}% descuento</span>
                  ) : (
                    <span className="text-green-600 font-semibold">${promotion.discountValue} descuento</span>
                  )}
                </div>

                {/* Productos */}
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Productos:</span>
                  <div className="mt-2 space-y-3">
                    {promotion.products.map((product) => (
                      <div key={product.productId._id} className="bg-gray-50 p-4 rounded-md">
                        <div className="font-medium text-gray-800 mb-2">{product.productId.name}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-gray-600">Código:</span>
                            <span className="font-medium">{product.productId.barcode}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-600">Casa Farmacéutica:</span>
                            <span className="font-medium">{product.productId.pharmaceuticalCompany}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-600">Vencimiento:</span>
                            <span className="font-medium">
                              {new Date(product.productId.expirationDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-medium">{product.productId.stock.units} unidades</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-600">Ubicación:</span>
                            <span className="font-medium">{product.productId.location?.nombre || 'No especificada'}</span>
                          </div>
                        </div>
                        {promotion.promotionType === 'NxM' && (
                          <div className="mt-2 text-blue-600 font-medium">
                            Mínimo: {product.minimumQuantity} unidades
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vigencia */}
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Vigencia:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-gray-600">Desde:</span>{' '}
                      <span className="font-medium">{new Date(promotion.startDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hasta:</span>{' '}
                      <span className="font-medium">{new Date(promotion.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div className="text-sm flex items-center">
                  <span className="font-medium text-gray-700 mr-2">Estado:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      promotion.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {promotion.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Condiciones adicionales */}
                {(promotion.conditions.minimumPurchase > 0 || promotion.conditions.maxUses) && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Condiciones:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {promotion.conditions.minimumPurchase > 0 && (
                        <div>
                          <span className="text-gray-600">Compra mínima:</span>{' '}
                          <span className="font-medium">${promotion.conditions.minimumPurchase}</span>
                        </div>
                      )}
                      {promotion.conditions.maxUses && (
                        <div>
                          <span className="text-gray-600">Usos máximos:</span>{' '}
                          <span className="font-medium">
                            {promotion.conditions.maxUses}
                            <span className="text-gray-400 ml-1">
                              (Usada: {promotion.conditions.usedCount} veces)
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreatePromotionModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePromotion}
        />
      )}

      {editingPromotion && (
        <EditPromotionModal
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
          onSubmit={handleUpdatePromotion}
        />
      )}

      {deletingPromotion && (
        <DeletePromotionModal
          promotionName={deletingPromotion.name}
          onClose={() => setDeletingPromotion(null)}
          onConfirm={handleDeletePromotion}
        />
      )}
    </MainLayout>
  );
}