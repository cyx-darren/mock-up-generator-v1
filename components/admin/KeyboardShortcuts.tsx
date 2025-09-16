'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'editing' | 'general';
}

interface KeyboardShortcutsProps {
  onCommandPalette?: () => void;
  onNewProduct?: () => void;
  onSave?: () => void;
  onBulkEdit?: () => void;
}

export function KeyboardShortcuts({
  onCommandPalette,
  onNewProduct,
  onSave,
  onBulkEdit,
}: KeyboardShortcutsProps) {
  const router = useRouter();

  // Define all keyboard shortcuts
  const shortcuts: ShortcutAction[] = [
    // Navigation
    {
      key: 'cmd+k',
      description: 'Open command palette',
      category: 'navigation',
      action: () => onCommandPalette?.(),
    },
    {
      key: 'g d',
      description: 'Go to dashboard',
      category: 'navigation',
      action: () => router.push('/admin/dashboard'),
    },
    {
      key: 'g p',
      description: 'Go to products',
      category: 'navigation',
      action: () => router.push('/admin/dashboard?tab=products'),
    },
    {
      key: 'g b',
      description: 'Go to bulk import',
      category: 'navigation',
      action: () => router.push('/admin/dashboard?tab=bulk-import'),
    },

    // Actions
    {
      key: 'cmd+n',
      description: 'Create new product',
      category: 'actions',
      action: () => onNewProduct?.() || router.push('/admin/products/new'),
    },
    {
      key: 'cmd+s',
      description: 'Save current form',
      category: 'actions',
      action: () => onSave?.(),
    },
    {
      key: 'cmd+shift+e',
      description: 'Open bulk edit',
      category: 'actions',
      action: () => onBulkEdit?.(),
    },
    {
      key: 'cmd+shift+d',
      description: 'Duplicate current item',
      category: 'actions',
      action: () => {
        // Duplicate logic would be handled by parent component
        console.log('Duplicate action triggered');
      },
    },

    // Editing
    {
      key: 'cmd+z',
      description: 'Undo last action',
      category: 'editing',
      action: () => document.execCommand('undo'),
    },
    {
      key: 'cmd+shift+z',
      description: 'Redo last action',
      category: 'editing',
      action: () => document.execCommand('redo'),
    },
    {
      key: 'cmd+a',
      description: 'Select all items',
      category: 'editing',
      action: () => {
        // Select all logic would be handled by parent component
        console.log('Select all action triggered');
      },
    },

    // General
    {
      key: 'escape',
      description: 'Close modal/cancel',
      category: 'general',
      action: () => {
        // Cancel/close logic handled by parent
        console.log('Escape action triggered');
      },
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      category: 'general',
      action: () => {
        // Show shortcuts modal
        console.log('Show shortcuts help');
      },
    },
  ];

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Don't trigger shortcuts when typing in inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Only allow certain shortcuts in inputs
        const allowedInInputs = ['cmd+k', 'cmd+s', 'escape'];
        const key = getKeyString(event);
        if (!allowedInInputs.includes(key)) {
          return;
        }
      }

      const keyString = getKeyString(event);
      const shortcut = shortcuts.find((s) => s.key === keyString);

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    },
    [shortcuts]
  );

  // Helper function to get key string
  const getKeyString = (event: KeyboardEvent): string => {
    const parts: string[] = [];

    if (event.metaKey || event.ctrlKey) parts.push('cmd');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');

    // Handle special keys
    const key = event.key.toLowerCase();
    switch (key) {
      case ' ':
        parts.push('space');
        break;
      case 'escape':
        parts.push('escape');
        break;
      case 'enter':
        parts.push('enter');
        break;
      case 'backspace':
        parts.push('backspace');
        break;
      case 'delete':
        parts.push('delete');
        break;
      case 'tab':
        parts.push('tab');
        break;
      case 'arrowup':
        parts.push('up');
        break;
      case 'arrowdown':
        parts.push('down');
        break;
      case 'arrowleft':
        parts.push('left');
        break;
      case 'arrowright':
        parts.push('right');
        break;
      default:
        if (key.length === 1) {
          parts.push(key);
        }
        break;
    }

    return parts.join('+');
  };

  // Set up event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // This component doesn't render anything - it's just for handling shortcuts
  return null;
}

// Shortcuts help modal component
export function ShortcutsHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: '⌘K', description: 'Open command palette' },
        { key: 'G D', description: 'Go to dashboard' },
        { key: 'G P', description: 'Go to products' },
        { key: 'G B', description: 'Go to bulk import' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { key: '⌘N', description: 'Create new product' },
        { key: '⌘S', description: 'Save current form' },
        { key: '⌘⇧E', description: 'Open bulk edit' },
        { key: '⌘⇧D', description: 'Duplicate current item' },
      ],
    },
    {
      category: 'Editing',
      items: [
        { key: '⌘Z', description: 'Undo last action' },
        { key: '⌘⇧Z', description: 'Redo last action' },
        { key: '⌘A', description: 'Select all items' },
      ],
    },
    {
      category: 'General',
      items: [
        { key: 'ESC', description: 'Close modal/cancel' },
        { key: '?', description: 'Show keyboard shortcuts' },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </span>
                      <div className="flex items-center space-x-1">
                        {item.key.split(' ').map((part, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <span className="text-gray-400">then</span>}
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono rounded">
                              {part}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Press{' '}
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-mono rounded">
                ?
              </kbd>{' '}
              anytime to show this help
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
