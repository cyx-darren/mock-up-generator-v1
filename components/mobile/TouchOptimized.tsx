'use client';

import React, { ReactNode } from 'react';

// Touch-optimized button component with proper sizing
export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 select-none';

  // Minimum 44px touch target for accessibility
  const sizeClasses = {
    small: 'min-h-[44px] px-4 py-2 text-sm',
    medium: 'min-h-[48px] px-6 py-3 text-base',
    large: 'min-h-[52px] px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

// Touch-optimized card component
export function TouchCard({
  children,
  onClick,
  className = '',
  elevated = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  elevated?: boolean;
}) {
  const baseClasses = 'rounded-lg transition-all duration-200 select-none';
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    : '';
  const shadowClasses = elevated ? 'shadow-lg hover:shadow-xl' : 'shadow-sm hover:shadow-md';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${shadowClasses} ${className}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

// Touch-optimized toggle switch
export function TouchToggle({
  checked,
  onChange,
  label,
  size = 'medium',
  disabled = false,
  className = '',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    small: { switch: 'w-11 h-6', circle: 'w-4 h-4', translate: 'translate-x-5' },
    medium: { switch: 'w-14 h-7', circle: 'w-5 h-5', translate: 'translate-x-7' },
    large: { switch: 'w-16 h-8', circle: 'w-6 h-6', translate: 'translate-x-8' },
  };

  const { switch: switchSize, circle: circleSize, translate } = sizeClasses[size];

  return (
    <label className={`flex items-center space-x-3 cursor-pointer select-none ${className}`}>
      <div
        className={`relative inline-flex ${switchSize} items-center rounded-full transition-colors duration-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span
          className={`inline-block ${circleSize} bg-white rounded-full transform transition-transform duration-300 ease-in-out ${
            checked ? translate : 'translate-x-1'
          }`}
        />
      </div>
      {label && (
        <span className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </label>
  );
}

// Touch-optimized input field
export function TouchInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  disabled = false,
  className = '',
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full min-h-[48px] px-4 py-3 text-base border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error
            ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400'
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-gray-400'}`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Touch-optimized tab navigation
export function TouchTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: {
  tabs: Array<{ id: string; label: string; icon?: ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center min-h-[44px] px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Touch-optimized slider
export function TouchSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = '',
  showValue = true,
  className = '',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {showValue && <span className="text-sm text-gray-500">{value}</span>}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 slider"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((value - min) / (max - min)) * 100}%, #E5E7EB ${((value - min) / (max - min)) * 100}%, #E5E7EB 100%)`,
          }}
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #3b82f6;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            transition: all 0.2s;
          }
          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          .slider::-webkit-slider-thumb:active {
            transform: scale(1.2);
          }
          .slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #3b82f6;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            transition: all 0.2s;
          }
          .slider::-moz-range-thumb:hover {
            transform: scale(1.1);
          }
          .slider::-moz-range-thumb:active {
            transform: scale(1.2);
          }
        `}</style>
      </div>
    </div>
  );
}

// Touch-optimized FAB (Floating Action Button)
export function TouchFAB({
  children,
  onClick,
  position = 'bottom-right',
  size = 'medium',
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-14 h-14',
    large: 'w-16 h-16',
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };

  return (
    <button
      onClick={onClick}
      className={`fixed z-50 ${sizeClasses[size]} ${positionClasses[position]} bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center ${className}`}
    >
      {children}
    </button>
  );
}
