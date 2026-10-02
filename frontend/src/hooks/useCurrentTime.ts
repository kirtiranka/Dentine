import { useState, useEffect } from 'react';

/**
 * Returns a stable current timestamp in ms, re-rendering periodically (default: every 60s).
 */
export function useCurrentTime(refreshIntervalMs = 60000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  return now;
}