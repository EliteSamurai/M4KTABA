// tests/helpers/drain.ts
import { act } from '@testing-library/react';

export async function flushMicrotasks() {
  // Drain microtasks in a few turns
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

export async function drainAll() {
  // Use fake timers while we drain; then restore.
  jest.useFakeTimers();
  await act(async () => {
    // Loop until no pending timers/microtasks remain
    for (let i = 0; i < 20; i++) {
      jest.runOnlyPendingTimers();
      await flushMicrotasks();
      if (jest.getTimerCount() === 0) break;
    }
  });
  jest.useRealTimers();
}
