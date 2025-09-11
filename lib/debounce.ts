export type DebouncedFunction<TArgs extends any[]> = ((
  ...args: TArgs
) => void) & { cancel: () => void };

export function debounce<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  waitMs: number
): DebouncedFunction<TArgs> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const wrapped = ((...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, waitMs);
  }) as DebouncedFunction<TArgs>;

  wrapped.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return wrapped;
}


