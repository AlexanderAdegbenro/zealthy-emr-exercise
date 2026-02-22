const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns items whose date field falls within the next 7 days (from now).
 * Excludes past dates and dates 8+ days out. Handles missing/invalid dates by skipping.
 */
export function getUpcomingItems<T extends Record<string, unknown>>(
  items: T[],
  dateKey: keyof T
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const now = Date.now();
  const cutoff = now + SEVEN_DAYS_MS;
  return items.filter((item) => {
    const raw = item[dateKey];
    if (raw == null) return false;
    const dateMs = typeof raw === "string" ? new Date(raw).getTime() : Number(raw);
    if (Number.isNaN(dateMs)) return false;
    return dateMs >= now && dateMs < cutoff;
  });
}
