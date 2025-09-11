type CircuitState = "closed" | "open" | "half_open";

export type CircuitOptions = {
  failureThreshold?: number; // consecutive failures to open
  halfOpenAfterMs?: number; // cooldown
};

export function createCircuit(name: string, opts: CircuitOptions = {}) {
  const failureThreshold = opts.failureThreshold ?? 5;
  const halfOpenAfterMs = opts.halfOpenAfterMs ?? 10_000;
  let state: CircuitState = "closed";
  let failures = 0;
  let openedAt = 0;

  async function exec<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (state === "open") {
      if (now - openedAt > halfOpenAfterMs) {
        state = "half_open";
      } else {
        throw new Error(`circuit:${name}:open`);
      }
    }
    try {
      const res = await fn();
      // success path
      failures = 0;
      state = "closed";
      return res;
    } catch (err) {
      failures++;
      if (failures >= failureThreshold) {
        state = "open";
        openedAt = now;
      }
      throw err;
    }
  }

  return {
    exec,
    get state() {
      return state;
    },
    get failures() {
      return failures;
    },
  };
}
