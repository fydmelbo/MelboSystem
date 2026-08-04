import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  label,
  error,
  required = false,
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 240, opensAbove: false });

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        opt.description?.toLowerCase().includes(lower)
    );
  }, [options, search]);

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 10;
      const spaceAbove = rect.top - 10;
      const opensAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(opensAbove ? spaceAbove : spaceBelow, 240);

      setDropdownPos({
        top: opensAbove
          ? rect.top + window.scrollY - maxHeight - 6
          : rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
        maxHeight: Math.max(maxHeight, 120),
        opensAbove,
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedContainer = containerRef.current?.contains(e.target as Node);
      const clickedDropdown = dropdownRef.current?.contains(e.target as Node);
      if (!clickedContainer && !clickedDropdown) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      searchInputRef.current?.focus();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
    return undefined;
  }, [isOpen, updatePosition]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const showSearch = options.length > 5;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2
          px-3.5 py-2.5 rounded-xl border text-sm text-left
          transition-all duration-200 ease-out
          bg-white
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50'
            : 'cursor-pointer hover:border-gray-300'
          }
          ${error
            ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-500'
            : isOpen
              ? 'border-primary-400 ring-2 ring-primary-500/20'
              : 'border-gray-200'
          }
          focus:outline-none
        `}
      >
        <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-white border border-gray-200 rounded-xl shadow-elevated overflow-hidden flex flex-col"
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownPos.maxHeight,
              zIndex: 99999,
            }}
          >
            {showSearch && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left
                      transition-colors duration-100
                      ${option.value === value
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Check
                      className={`w-4 h-4 shrink-0 transition-opacity ${
                        option.value === value ? 'opacity-100 text-primary-600' : 'opacity-0'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{option.label}</div>
                      {option.description && (
                        <div className="truncate text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
