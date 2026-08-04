import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  stepLabels?: string[];
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-[95vw]',
};

export default function BaseModal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  currentStep,
  totalSteps,
  stepLabels,
}: BaseModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const progressPercentage =
    totalSteps && currentStep !== undefined
      ? ((currentStep + 1) / totalSteps) * 100
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 400,
              mass: 0.8,
            }}
            className={`relative flex flex-col w-full bg-white rounded-2xl shadow-elevated overflow-hidden max-h-[90vh] ${sizeClasses[size]} z-10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar (Wizard) — uses scaleX for GPU-composited animation */}
            {totalSteps && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-20">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progressPercentage / 100 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 origin-left"
                />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${totalSteps ? 'pt-6' : ''}`}>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                {totalSteps && stepLabels && currentStep !== undefined && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Paso {currentStep + 1} de {totalSteps}: {stepLabels[currentStep]}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
