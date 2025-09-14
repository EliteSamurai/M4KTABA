'use client';

import { useEffect } from 'react';

declare global {
  interface Navigator {
    connection?: { effectiveType?: string };
  }
}

/**
 * Lightweight Web Vitals emitter.
 * - Disabled with NEXT_PUBLIC_DISABLE_VITALS=true
 * - Lazy-loads web-vitals to keep main bundle lean
 * - Uses sendBeacon with fetch keepalive fallback
 */
export default function VitalsClient() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_VITALS === 'true') return;
    if (typeof window === 'undefined') return;

    let stopped = false;

    import('web-vitals')
      .then(({ onCLS, onINP, onLCP }) => {
        const uid = (() => {
          try {
            const k = 'uid';
            let v = localStorage.getItem(k);
            if (!v) {
              v = crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
              localStorage.setItem(k, v);
            }
            return v;
          } catch {
            return 'anon';
          }
        })();

        const send = (metric: {
          id: string;
          name: string;
          value: number;
          delta: number;
          rating: string;
        }) => {
          if (stopped) return;
          try {
            const body = JSON.stringify({
              id: metric.id,
              name: metric.name,
              value: metric.value,
              delta: metric.delta,
              rating: metric.rating,
              path: location.pathname,
              ua: navigator.userAgent,
              effectiveType: navigator.connection?.effectiveType,
              variant:
                document.documentElement.getAttribute('data-variant') ??
                'default',
              uid,
              ts: Date.now(),
            });

            if (navigator.sendBeacon) {
              navigator.sendBeacon('/api/vitals', body);
            } else {
              fetch('/api/vitals', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body,
                keepalive: true,
              }).catch(() => {});
            }
          } catch {
            // swallow
          }
        };

        onCLS(send);
        onINP(send);
        onLCP(send);
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      stopped = true;
    };
  }, []);

  return null;
}
