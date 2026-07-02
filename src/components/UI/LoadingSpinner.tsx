import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2 border-slate-300 border-t-primary-500',
    md: 'w-8 h-8 border-3 border-slate-300 border-t-primary-500',
    lg: 'w-12 h-12 border-4 border-slate-300 border-t-primary-500',
  };

  return (
    <div className="flex items-center justify-center" id="loading-spinner">
      <div className={`animate-spin rounded-full border-solid ${sizeClasses[size]}`}></div>
    </div>
  );
};
