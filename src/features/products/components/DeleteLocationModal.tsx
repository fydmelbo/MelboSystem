import { X } from 'lucide-react';
import React from 'react';

interface DeleteLocationModalProps {
  locationName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteLocationModal({ locationName, onConfirm, onClose }: DeleteLocationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Eliminar Ubicación</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            ¿Está seguro de eliminar esta ubicación <span className="font-medium text-gray-900">{locationName}</span>?
          </p>
          <p className="mt-2 text-sm text-red-600">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}