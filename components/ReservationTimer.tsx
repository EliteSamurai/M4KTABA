'use client';
import { useEffect, useState } from 'react';

export function ReservationTimer({
  keyId,
  seconds,
  onExpire,
}: {
  keyId: string;
  seconds: number;
  onExpire: () => void;
}) {
  const storageKey = `reserve:${keyId}`;
  const [remaining, setRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const until = Number(saved);
        const rem = Math.max(0, Math.floor((until - Date.now()) / 1000));
        return rem;
      }
    } catch {}
    const until = Date.now() + seconds * 1000;
    try {
      localStorage.setItem(storageKey, String(until));
    } catch {}
    return seconds;
  });

  useEffect(() => {
    if (remaining <= 0) return onExpire();
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return (
    <div aria-live='polite' className='text-sm text-muted-foreground'>
      Reservation expires in {mm}:{ss}
    </div>
  );
}
