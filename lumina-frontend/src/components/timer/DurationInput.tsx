import React, { useState, useEffect } from 'react';

interface DurationInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const clampValue = (val: number): number => {
    return Math.max(min, Math.min(max, Math.round(val)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    // Handle empty input
    if (inputVal === '') {
      onChange(min);
      return;
    }

    // Parse the input value
    const numericValue = parseFloat(inputVal);

    // Check if it's a valid number
    if (isNaN(numericValue)) {
      // Don't call onChange for invalid input, but keep the input value for user feedback
      return;
    }

    // Handle negative numbers or zero
    if (numericValue <= 0) {
      onChange(min);
      return;
    }

    // Clamp and round the value
    const clampedValue = clampValue(numericValue);
    onChange(clampedValue);
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const isAtMin = value <= min;
  const isAtMax = value >= max;

  const inputId = `duration-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <div className="flex items-center space-x-2">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isAtMin}
          aria-label={`Decrease ${label}`}
          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
        >
          <span className="text-sm font-medium">−</span>
        </button>

        {/* Input Field */}
        <div className="flex-1 relative">
          <input
            id={inputId}
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-xs text-gray-500">{suffix}</span>
            </div>
          )}
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isAtMax}
          aria-label={`Increase ${label}`}
          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
        >
          <span className="text-sm font-medium">+</span>
        </button>
      </div>
    </div>
  );
};
