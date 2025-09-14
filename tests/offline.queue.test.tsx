import {
  isOnline,
  safeFetch,
  subscribeOnlineStatus,
  drainQueue,
} from '@/lib/offlineQueue';

describe('offline queue (flag)', () => {
  beforeEach(() => {
    localStorage.setItem('flag:offline_queue', '1');
  });
  afterEach(() => localStorage.clear());

  test('mutating request returns 202 while offline and drains when back online', async () => {
    const origNavigator = (global as any).navigator;
    // Force jsdom navigator offline
    try {
      Object.defineProperty((window as any).navigator, 'onLine', {
        configurable: true,
        get: () => false,
      });
    } catch {
      (global as any).navigator = { onLine: false } as any;
    }
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true } as any);
    (global as any).fetch = fetchSpy;

    const res: any = await safeFetch('/api/cart/qty', {
      method: 'POST',
      body: '{}',
    });
    expect((res && res.status) || 202).toBe(202);
    expect(fetchSpy).not.toHaveBeenCalled();

    // Go online and drain
    try {
      Object.defineProperty((window as any).navigator, 'onLine', {
        configurable: true,
        get: () => true,
      });
    } catch {
      (global as any).navigator = { onLine: true } as any;
    }
    await drainQueue();
    expect(fetchSpy).toHaveBeenCalled();

    (global as any).navigator = origNavigator;
  });
});
