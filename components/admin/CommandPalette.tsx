'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  action: () => void;
  icon?: React.ReactNode;
  category: 'navigation' | 'actions' | 'settings' | 'help';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define available commands
  const commands: Command[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        name: 'Go to Dashboard',
        description: 'Navigate to the admin dashboard',
        keywords: ['dashboard', 'home', 'overview'],
        category: 'navigation',
        action: () => router.push('/admin/dashboard'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
          </svg>
        ),
      },
      {
        id: 'nav-products',
        name: 'Go to Products',
        description: 'Navigate to product management',
        keywords: ['products', 'catalog', 'items'],
        category: 'navigation',
        action: () => router.push('/admin/dashboard?tab=products'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        ),
      },
      {
        id: 'nav-bulk-import',
        name: 'Go to Bulk Import',
        description: 'Navigate to bulk import tools',
        keywords: ['bulk', 'import', 'upload', 'csv'],
        category: 'navigation',
        action: () => router.push('/admin/dashboard?tab=bulk-import'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        ),
      },

      // Actions
      {
        id: 'action-new-product',
        name: 'Create New Product',
        description: 'Add a new product to the catalog',
        keywords: ['new', 'create', 'add', 'product'],
        category: 'actions',
        action: () => router.push('/admin/products/new'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        ),
      },
      {
        id: 'action-export-products',
        name: 'Export Products CSV',
        description: 'Download all products as CSV file',
        keywords: ['export', 'download', 'csv', 'backup'],
        category: 'actions',
        action: () => {
          // Export logic would go here
          window.open('/api/admin/products/export', '_blank');
        },
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
      },
      {
        id: 'action-clear-cache',
        name: 'Clear Cache',
        description: 'Clear application cache',
        keywords: ['clear', 'cache', 'refresh', 'reload'],
        category: 'actions',
        action: () => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        },
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
      },

      // Settings
      {
        id: 'settings-theme',
        name: 'Toggle Theme',
        description: 'Switch between light and dark mode',
        keywords: ['theme', 'dark', 'light', 'mode'],
        category: 'settings',
        action: () => {
          document.documentElement.classList.toggle('dark');
        },
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ),
      },
      {
        id: 'settings-logout',
        name: 'Logout',
        description: 'Sign out of admin dashboard',
        keywords: ['logout', 'signout', 'exit'],
        category: 'settings',
        action: () => router.push('/admin/logout'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        ),
      },

      // Help
      {
        id: 'help-shortcuts',
        name: 'Keyboard Shortcuts',
        description: 'View all available keyboard shortcuts',
        keywords: ['shortcuts', 'hotkeys', 'keyboard', 'help'],
        category: 'help',
        action: () => {
          // Show shortcuts modal
          alert(
            'Keyboard Shortcuts:\n\nCmd/Ctrl + K - Open Command Palette\nCmd/Ctrl + N - New Product\nCmd/Ctrl + S - Save\nEsc - Close modals'
          );
        },
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        ),
      },
    ],
    [router]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    return commands.filter(
      (command) =>
        command.name.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase()) ||
        command.keywords.some((keyword) => keyword.toLowerCase().includes(query.toLowerCase()))
    );
  }, [commands, query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categoryColors = {
    navigation: 'text-blue-600',
    actions: 'text-green-600',
    settings: 'text-purple-600',
    help: 'text-orange-600',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[10vh] z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-500"
              autoFocus
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className={`${categoryColors[command.category]}`}>{command.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">{command.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {command.description}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{command.category}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No commands found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>⌘K Open</span>
          </div>
          <div>
            {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for global command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    openPalette: () => setIsOpen(true),
    closePalette: () => setIsOpen(false),
  };
}
