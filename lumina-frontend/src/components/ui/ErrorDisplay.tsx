import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | Error;
  title?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'Something went wrong',
  showRetry = false,
  onRetry,
  onDismiss,
  className = '',
  variant = 'card',
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const baseClasses = 'flex items-start gap-3';
  const variantClasses = {
    inline: 'p-3 bg-red-50 border border-red-200 rounded-md',
    card: 'p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm',
    banner: 'p-4 bg-red-100 border-l-4 border-red-500',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-red-800 mb-1">{title}</h3>
        <p className="text-sm text-red-700 break-words">{errorMessage}</p>

        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 border border-red-300 rounded-md transition-colors"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 flex-shrink-0"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
