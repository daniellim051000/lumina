import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface InlineInputModalProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  validation?: (value: string) => string | null;
}

export const InlineInputModal: React.FC<InlineInputModalProps> = ({
  isOpen,
  title,
  placeholder = '',
  initialValue = '',
  maxLength = 50,
  onConfirm,
  onCancel,
  validation,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setError('Please enter a value');
      return;
    }

    if (validation) {
      const validationError = validation(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onConfirm(trimmedValue);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setError(null);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => {
                  setValue(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-invalid={!!error}
                aria-describedby={error ? 'input-error' : undefined}
              />

              {error && (
                <p
                  id="input-error"
                  className="mt-2 text-sm text-red-600"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="mt-2 text-xs text-gray-500">
                {value.length}/{maxLength} characters
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <X className="w-4 h-4 mr-2 inline" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Check className="w-4 h-4 mr-2 inline" />
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
