import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3 text-ink-500">
      <Loader2 className={`${sizeClass} text-brand-600 animate-spin`} />
      {message && <p className="text-xs sm:text-sm font-medium text-ink-600">{message}</p>}
    </div>
  );
};
