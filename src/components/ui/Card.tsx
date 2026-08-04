import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  gradient?: boolean;
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  gradient = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-gray-100
        transition-all duration-300 ease-out
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : 'shadow-card'}
        ${gradient ? 'bg-gradient-to-br from-white to-gray-50/50' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}
