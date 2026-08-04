import React, { useState } from 'react';
import BaseModal from '../../../components/ui/BaseModal';
import Button from '../../../components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteCatalogModalProps {
  itemName: string;
  entityLabel: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function DeleteCatalogModal({ itemName, entityLabel, onConfirm, onClose }: DeleteCatalogModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Por favor, ingresa el motivo de la eliminación.');
      return;
    }
    setIsSubmitting(true);
    onConfirm(reason.trim());
  };

  const footer = (
    <div className="flex justify-end gap-4 w-full">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button
        variant="danger"
        onClick={handleConfirm}
        loading={isSubmitting}
        loadingText="Eliminando..."
        icon={<AlertTriangle className="w-4 h-4" />}
      >
        Eliminar
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Eliminar ${entityLabel}`}
      size="md"
      footer={footer}
    >
      <div className="py-2 space-y-4">
        <p className="text-gray-600">
          ¿Estás seguro que deseas eliminar <span className="font-semibold text-gray-900">{itemName}</span>?
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de eliminación <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none h-24 ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Escribe la razón detallada..."
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            Esta acción eliminará permanentemente este registro del catálogo.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
