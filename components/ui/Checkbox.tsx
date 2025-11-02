import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}

/**
 * Custom Checkbox component với design đẹp và animation mượt mà
 * Có thể dùng standalone hoặc với label
 */
const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer group
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
    >
      {/* Custom checkbox wrapper */}
      <div className="relative inline-flex items-center justify-center">
        {/* Hidden native checkbox for accessibility */}
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        {/* Custom checkbox visual */}
        <div
          className={`
            relative
            w-5 h-5
            rounded-md
            border-2
            transition-all duration-200 ease-in-out
            flex items-center justify-center
            group-hover:scale-110
            ${
              checked
                ? 'bg-gradient-to-br from-accent-cyan to-accent-violet border-transparent shadow-md shadow-accent-violet/30'
                : 'bg-surface2 border-surface2 group-hover:border-accent-violet/50'
            }
            ${disabled ? 'group-hover:scale-100' : ''}
          `}
        >
          {/* Checkmark icon with animation */}
          {checked && (
            <Check
              className={`
                w-3.5 h-3.5 text-white
                stroke-[3]
                transition-all duration-200
                scale-100
              `}
            />
          )}
        </div>
      </div>
      {/* Optional label */}
      {label && (
        <span
          className={`
            text-sm font-medium select-none
            ${checked ? 'text-primary' : 'text-primary-muted'}
            transition-colors duration-200
          `}
        >
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;

