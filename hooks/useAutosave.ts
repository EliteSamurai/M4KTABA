import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

interface AutosaveOptions {
  delay?: number;
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useAutosave<T>(data: T, options: AutosaveOptions) {
  const { delay = 1500, onSave, onError, enabled = true } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<T>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce the data changes
  const debouncedData = useDebounce(data, delay);

  // Check if data has actually changed
  const hasDataChanged = useCallback((current: T, previous: T) => {
    return JSON.stringify(current) !== JSON.stringify(previous);
  }, []);

  // Save function
  const save = useCallback(
    async (dataToSave: T) => {
      if (!enabled || !hasDataChanged(dataToSave, previousDataRef.current)) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        await onSave(dataToSave);
        setLastSaved(new Date());
        previousDataRef.current = dataToSave;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Save failed');
        setError(error);
        onError?.(error);
      } finally {
        setIsSaving(false);
      }
    },
    [enabled, hasDataChanged, onSave, onError]
  );

  // Effect to trigger save when debounced data changes
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      save(debouncedData);
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedData, delay, save, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Manual save function
  const manualSave = useCallback(async () => {
    await save(data);
  }, [save, data]);

  return {
    isSaving,
    lastSaved,
    error,
    manualSave,
  };
}
