import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const dotSizes = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2',
};

const containerGaps = {
  sm: 'gap-1',
  md: 'gap-1.5',
  lg: 'gap-2',
};

export default function LoadingSpinner({ size = 'sm', className = '' }: LoadingSpinnerProps) {
  const dot = dotSizes[size];
  const gap = containerGaps[size];

  return (
    <div className={`inline-flex items-center justify-center ${gap} ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${dot} rounded-full bg-current`}
          style={{
            animation: `loadingDot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
