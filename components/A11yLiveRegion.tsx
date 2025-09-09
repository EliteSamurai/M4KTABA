"use client";
import { useEffect, useRef } from "react";

let setGlobalMessage: ((msg: string) => void) | null = null;

export function A11yLiveRegion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setGlobalMessage = (msg: string) => {
      if (ref.current) ref.current.textContent = msg;
    };
    return () => {
      setGlobalMessage = null;
    };
  }, []);
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only" ref={ref} />
  );
}

export function announce(msg: string) {
  setGlobalMessage?.(msg);
}
