'use client';
import { useEffect, useRef } from 'react';

export function useFocusRestore(active: boolean) {
  const prev = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (active && !prev.current) {
      prev.current = (document.activeElement as HTMLElement) || null;
    }
    if (!active && prev.current) {
      prev.current.focus?.();
      prev.current = null;
    }
  }, [active]);
}
