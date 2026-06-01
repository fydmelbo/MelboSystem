import React from 'react';

interface DeletePromotionModalProps {
  promotionName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeletePromotionModal({ promotionName, onClose, onConfirm }: DeletePromotionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Eliminar Promoción</h2>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro que deseas eliminar la promoción "{promotionName}"? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}