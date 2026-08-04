import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-50 text-primary-700 border border-primary-100',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  danger: 'bg-red-50 text-red-700 border border-red-100',
  info: 'bg-blue-50 text-blue-700 border border-blue-100',
};

const dotColors = {
  default: 'bg-gray-400',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {children}
    </span>
  );
}
