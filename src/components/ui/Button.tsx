import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md active:bg-primary-800',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md active:bg-red-800',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
  outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200 ease-out
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
