export type RetryOptions = {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  factor?: number; // backoff factor
  jitter?: boolean;
  onRetry?: (attempt: number, error: unknown) => void;
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    minDelayMs = 200,
    maxDelayMs = 4000,
    factor = 2,
    jitter = true,
    onRetry,
  } = opts;
  let attempt = 0;
  let delay = minDelayMs;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      onRetry?.(attempt + 1, err);
      let wait = delay;
      if (jitter) wait = Math.random() * delay;
      await sleep(wait);
      delay = Math.min(maxDelayMs, delay * factor);
      attempt++;
    }
  }
}
