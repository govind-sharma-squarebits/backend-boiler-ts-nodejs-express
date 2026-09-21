/**
 * Parse duration strings used by JWT env vars into milliseconds.
 * Supports: s (seconds), m (minutes), h (hours), d (days).
 * Examples: "15m", "7d", "1h"
 */
export function parseDurationToMs(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration "${value}". Use formats like 15m, 1h, 7d`
    );
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * unitMs[unit];
}
