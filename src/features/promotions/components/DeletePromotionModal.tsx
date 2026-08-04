import React, { useState } from 'react';
import BaseModal from '../../../components/ui/BaseModal';
import Button from '../../../components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface DeletePromotionModalProps {
  promotionName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeletePromotionModal({ promotionName, onClose, onConfirm }: DeletePromotionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    onConfirm();
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={handleConfirm} loading={isSubmitting} loadingText="Eliminando..." icon={<AlertTriangle className="w-4 h-4" />}>
        Eliminar
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Eliminar Promoción"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          ¿Estás seguro que deseas eliminar la promoción{' '}
          <span className="font-semibold text-gray-900">{promotionName}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Esta acción enviará la promoción al Histórico y ya no estará disponible.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
