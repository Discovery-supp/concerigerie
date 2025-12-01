import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface CounterProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

const Counter: React.FC<CounterProps> = ({ 
  label, 
  value, 
  min = 0, 
  max = 100, 
  onChange, 
  className = '' 
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
            value <= min
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-semibold text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
            value >= max
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Counter;