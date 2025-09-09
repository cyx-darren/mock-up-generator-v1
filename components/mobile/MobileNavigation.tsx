'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

// Bottom navigation for mobile
export function BottomNavigation({
  items,
  className = ''
}: {
  items: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb ${className}`}>
      <div className="flex">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-2 min-h-[64px] transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div className="relative">
                <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Hamburger menu for mobile
export function HamburgerMenu({
  items,
  isOpen,
  onToggle,
  className = ''
}: {
  items: Array<{
    id: string;
    label: string;
    href: string;
    icon?: ReactNode;
    onClick?: () => void;
    divider?: boolean;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    if (isOpen) {
      onToggle();
    }
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu button */}
      <button
        onClick={onToggle}
        className={`relative w-12 h-12 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 relative">
          <span
            className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
            }`}
          />
          <span
            className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-300 ${
              isOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-300 ${
              isOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
            }`}
          />
        </div>
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggle}
      />

      {/* Menu panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onToggle}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto py-2">
            {items.map((item) => {
              if (item.divider) {
                return <div key={item.id} className="my-2 border-t border-gray-200" />;
              }

              const isActive = pathname === item.href;

              return (
                <div key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors min-h-[48px] ${
                        isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                      }`}
                    >
                      {item.icon && <span className="mr-3 w-5 h-5">{item.icon}</span>}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors min-h-[48px]"
                    >
                      {item.icon && <span className="mr-3 w-5 h-5">{item.icon}</span>}
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// Mobile-optimized dropdown menu
export function MobileDropdown({
  trigger,
  items,
  isOpen,
  onToggle,
  align = 'right',
  className = ''
}: {
  trigger: ReactNode;
  items: Array<{
    id: string;
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: ReactNode;
    danger?: boolean;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <div onClick={onToggle}>
        {trigger}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={onToggle}
        />
      )}

      {/* Dropdown */}
      <div
        className={`absolute top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40 transform transition-all duration-200 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        } ${align === 'right' ? 'right-0' : 'left-0'}`}
      >
        {items.map((item) => (
          <div key={item.id}>
            {item.href ? (
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px] ${
                  item.danger ? 'text-red-600 hover:bg-red-50' : ''
                }`}
                onClick={onToggle}
              >
                {item.icon && <span className="mr-3 w-5 h-5">{item.icon}</span>}
                <span className="font-medium">{item.label}</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  item.onClick?.();
                  onToggle();
                }}
                className={`w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px] ${
                  item.danger ? 'text-red-600 hover:bg-red-50' : ''
                }`}
              >
                {item.icon && <span className="mr-3 w-5 h-5">{item.icon}</span>}
                <span className="font-medium">{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile sticky header
export function MobileHeader({
  title,
  leftAction,
  rightAction,
  showBackButton = false,
  onBack,
  className = ''
}: {
  title?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}) {
  return (
    <header className={`sticky top-0 z-40 bg-white border-b border-gray-200 safe-area-pt ${className}`}>
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center min-w-0">
          {showBackButton && (
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mr-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {leftAction}
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center">
          {rightAction}
        </div>
      </div>
    </header>
  );
}

// Mobile-optimized search bar
export function MobileSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  showCancel = false,
  onCancel,
  className = ''
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
  className?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Search input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-10 pr-4 text-base bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Cancel button */}
      {showCancel && (
        <button
          onClick={onCancel}
          className="text-blue-600 font-medium hover:text-blue-700 transition-colors whitespace-nowrap"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// Safe area utilities for iOS devices
export const SafeAreaStyles = `
  .safe-area-pt { padding-top: env(safe-area-inset-top); }
  .safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }
  .safe-area-pl { padding-left: env(safe-area-inset-left); }
  .safe-area-pr { padding-right: env(safe-area-inset-right); }
  
  @supports (padding: env(safe-area-inset-top)) {
    .safe-area-pt { padding-top: calc(env(safe-area-inset-top) + 0.5rem); }
    .safe-area-pb { padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem); }
  }
`;