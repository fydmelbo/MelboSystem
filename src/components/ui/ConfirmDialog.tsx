import React, { useState } from 'react';
import BaseModal from './BaseModal';
import Textarea from './Textarea';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  itemName?: string;
  requireReason?: boolean;
  confirmLabel?: string;
  confirmIcon?: React.ReactNode;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  itemName,
  requireReason = false,
  confirmLabel = 'Eliminar',
  confirmIcon,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Por favor, ingresa el motivo.');
      return;
    }
    setIsSubmitting(true);
    onConfirm(requireReason ? reason.trim() : undefined);
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button
        variant="danger"
        onClick={handleConfirm}
        loading={isSubmitting}
        loadingText="Eliminando..."
        icon={confirmIcon || <AlertTriangle className="w-4 h-4" />}
      >
        {confirmLabel}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {typeof message === 'string' ? (
            <p>
              {message}
              {itemName && (
                <>
                  {' '}
                  <span className="font-semibold text-gray-900">{itemName}</span>
                </>
              )}
              ?
            </p>
          ) : (
            message
          )}
        </div>

        {requireReason && (
          <Textarea
            label="Motivo"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            placeholder="Escribe el motivo detallado..."
            error={error}
            rows={3}
            required
          />
        )}

        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Esta acción enviará el elemento al Histórico y ya no estará disponible.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
