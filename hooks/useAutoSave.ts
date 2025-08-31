'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface AutoSaveOptions {
  key: string;
  data: any;
  delay?: number; // milliseconds
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
  enabled?: boolean;
}

export function useAutoSave({
  key,
  data,
  delay = 2000, // 2 seconds default
  onSave,
  onRestore,
  enabled = true,
}: AutoSaveOptions) {
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const isRestoredRef = useRef(false);

  // Create a unique key based on user and provided key
  const storageKey = user?.userId ? `autosave_${user.userId}_${key}` : `autosave_${key}`;

  // Save data to localStorage
  const saveToStorage = useCallback((dataToSave: any) => {
    try {
      const serializedData = JSON.stringify({
        data: dataToSave,
        timestamp: Date.now(),
        version: '1.0',
      });
      
      localStorage.setItem(storageKey, serializedData);
      lastSavedRef.current = serializedData;
      
      if (onSave) {
        onSave(dataToSave);
      }
    } catch (error) {
      console.warn('Failed to auto-save data:', error);
    }
  }, [storageKey, onSave]);

  // Restore data from localStorage
  const restoreFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const { data: savedData, timestamp } = JSON.parse(saved);
      
      // Check if data is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return savedData;
    } catch (error) {
      console.warn('Failed to restore auto-saved data:', error);
      return null;
    }
  }, [storageKey]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(storageKey);
    lastSavedRef.current = '';
  }, [storageKey]);

  // Check if there's saved data available
  const hasSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return !!saved;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if data hasn't changed
    const currentData = JSON.stringify({ data, timestamp: 0 });
    const lastSaved = lastSavedRef.current.replace(/"timestamp":\d+/, '"timestamp":0');
    
    if (currentData === lastSaved) {
      return;
    }

    // Don't auto-save empty or initial data
    if (!data || Object.keys(data).length === 0) {
      return;
    }

    // Set timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveToStorage(data);
    }, delay);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveToStorage]);

  // Restore data on mount (only once)
  useEffect(() => {
    if (!enabled || isRestoredRef.current) return;

    const savedData = restoreFromStorage();
    if (savedData && onRestore) {
      onRestore(savedData);
      isRestoredRef.current = true;
    }
  }, [enabled, restoreFromStorage, onRestore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveNow: () => saveToStorage(data),
    restoreData: restoreFromStorage,
    clearSavedData,
    hasSavedData,
  };
}