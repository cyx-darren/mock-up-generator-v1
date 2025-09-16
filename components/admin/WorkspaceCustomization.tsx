'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable' | 'spacious';
  sidebar: 'expanded' | 'collapsed' | 'auto';
  tableSettings: {
    itemsPerPage: number;
    defaultSort: string;
    visibleColumns: string[];
  };
  dashboardWidgets: {
    id: string;
    visible: boolean;
    position: number;
  }[];
  notifications: {
    desktop: boolean;
    email: boolean;
    sound: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

const defaultSettings: WorkspaceSettings = {
  theme: 'system',
  density: 'comfortable',
  sidebar: 'expanded',
  tableSettings: {
    itemsPerPage: 10,
    defaultSort: 'name',
    visibleColumns: ['name', 'category', 'sku', 'price', 'status', 'created', 'actions'],
  },
  dashboardWidgets: [
    { id: 'statistics', visible: true, position: 0 },
    { id: 'popular-products', visible: true, position: 1 },
    { id: 'recent-activity', visible: true, position: 2 },
    { id: 'system-health', visible: true, position: 3 },
    { id: 'category-breakdown', visible: false, position: 4 },
  ],
  notifications: {
    desktop: true,
    email: false,
    sound: false,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
  },
};

interface WorkspaceCustomizationProps {
  onSettingsChange?: (settings: WorkspaceSettings) => void;
}

export function WorkspaceCustomization({ onSettingsChange }: WorkspaceCustomizationProps) {
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultSettings);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('workspace-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load workspace settings:', error);
    }
  }, []);

  // Save settings to localStorage and notify parent
  const saveSettings = useCallback(
    async (newSettings: WorkspaceSettings) => {
      try {
        localStorage.setItem('workspace-settings', JSON.stringify(newSettings));
        setSettings(newSettings);
        onSettingsChange?.(newSettings);
        setSuccess('Settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to save settings');
        setTimeout(() => setError(''), 3000);
      }
    },
    [onSettingsChange]
  );

  // Update a specific setting
  const updateSetting = useCallback(
    (path: string, value: any) => {
      const newSettings = { ...settings };
      const keys = path.split('.');
      let current = newSettings as any;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // Reset to defaults
  const resetSettings = useCallback(() => {
    saveSettings(defaultSettings);
  }, [saveSettings]);

  // Apply theme immediately
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [settings.theme]);

  // Apply density
  useEffect(() => {
    document.documentElement.setAttribute('data-density', settings.density);
  }, [settings.density]);

  const availableColumns = [
    { id: 'name', label: 'Product Name' },
    { id: 'category', label: 'Category' },
    { id: 'sku', label: 'SKU' },
    { id: 'price', label: 'Price' },
    { id: 'status', label: 'Status' },
    { id: 'created', label: 'Created' },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <div className="space-y-6">
      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize the look and feel of your workspace
          </p>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting('theme', theme)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    settings.theme === theme
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm capitalize">{theme}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {theme === 'light' && 'Always light'}
                    {theme === 'dark' && 'Always dark'}
                    {theme === 'system' && 'Match system'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Interface Density
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => updateSetting('density', density)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    settings.density === density
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm capitalize">{density}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Sidebar Behavior
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['expanded', 'collapsed', 'auto'] as const).map((behavior) => (
                <button
                  key={behavior}
                  onClick={() => updateSetting('sidebar', behavior)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    settings.sidebar === behavior
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm capitalize">{behavior}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {behavior === 'expanded' && 'Always open'}
                    {behavior === 'collapsed' && 'Always closed'}
                    {behavior === 'auto' && 'Auto hide'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Table Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure how tables display data
          </p>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Items per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Items per page
            </label>
            <select
              value={settings.tableSettings.itemsPerPage}
              onChange={(e) => updateSetting('tableSettings.itemsPerPage', Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Visible columns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Visible Columns
            </label>
            <div className="space-y-2">
              {availableColumns.map((column) => (
                <label key={column.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.tableSettings.visibleColumns.includes(column.id)}
                    onChange={(e) => {
                      const newColumns = e.target.checked
                        ? [...settings.tableSettings.visibleColumns, column.id]
                        : settings.tableSettings.visibleColumns.filter((id) => id !== column.id);
                      updateSetting('tableSettings.visibleColumns', newColumns);
                    }}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Dashboard Widgets */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Widgets</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose which widgets to display on your dashboard
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {settings.dashboardWidgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {widget.id.replace('-', ' ')}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={widget.visible}
                    onChange={(e) => {
                      const newWidgets = settings.dashboardWidgets.map((w) =>
                        w.id === widget.id ? { ...w, visible: e.target.checked } : w
                      );
                      updateSetting('dashboardWidgets', newWidgets);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Accessibility</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Make the interface more accessible
          </p>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.accessibility.reducedMotion}
                onChange={(e) => updateSetting('accessibility.reducedMotion', e.target.checked)}
                className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900 dark:text-white">
                Reduce motion and animations
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.accessibility.highContrast}
                onChange={(e) => updateSetting('accessibility.highContrast', e.target.checked)}
                className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900 dark:text-white">High contrast mode</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Size
            </label>
            <select
              value={settings.accessibility.fontSize}
              onChange={(e) => updateSetting('accessibility.fontSize', e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={resetSettings}>
          Reset to Defaults
        </Button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Settings are saved automatically
        </div>
      </div>
    </div>
  );
}

// Hook to use workspace settings
export function useWorkspaceSettings() {
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('workspace-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load workspace settings:', error);
    }
  }, []);

  return settings;
}
