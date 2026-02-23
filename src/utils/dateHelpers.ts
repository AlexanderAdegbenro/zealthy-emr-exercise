const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Returns true if the ISO date is in the future and within 48 hours from now.
 */
export function within48Hours(isoDate: string): boolean {
  const ms = new Date(isoDate).getTime() - Date.now();
  return ms > 0 && ms <= FORTY_EIGHT_HOURS_MS;
}

/**
 * Returns true if the ISO date is in the future and within N days from now.
 */
export function withinDays(isoDate: string, days: number): boolean {
  const ms = new Date(isoDate).getTime() - Date.now();
  return ms > 0 && ms <= days * 24 * 60 * 60 * 1000;
}

/**
 * Returns a human-readable month range string for the next 90 days.
 * e.g. "Feb - May 2026"
 */
export function get90DayRange(): string {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 90);
  const startMonth = now.toLocaleDateString(undefined, { month: "short" });
  const endMonth = end.toLocaleDateString(undefined, { month: "short" });
  return `${startMonth} - ${endMonth} ${now.getFullYear()}`;
}

/**
 * Parses a YYYY-MM-DD ISO string as a local date (avoids UTC timezone shift)
 * and formats it with the given options.
 */
export function formatDateLocal(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
): string {
  const [y, m, d] = isoDate.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}
