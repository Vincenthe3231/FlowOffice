import { useState, useEffect } from "react";

const DEFAULT_MS = 1000;

/**
 * Returns a debounced value that updates after `delayMs` of no changes to `value`.
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds (default 1000)
 */
export function useDebounce<T>(value: T, delayMs: number = DEFAULT_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
