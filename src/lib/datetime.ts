/**
 * Date helpers for the product's operating timezone.
 *
 * Presciya serves Bangladesh, a single fixed offset (UTC+6) with no daylight
 * saving. Day-scoped UI (today's queue counts, daily limits) must agree with the
 * backend, which computes all day boundaries in Bangladesh time — so we key
 * dates by the Bangladesh calendar day rather than the device timezone.
 */
export const BD_UTC_OFFSET_MINUTES = 6 * 60;

/** Bangladesh calendar day key (yyyy-mm-dd) for an instant. */
export const bangladeshDateKey = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const bd = new Date(date.getTime() + BD_UTC_OFFSET_MINUTES * 60 * 1000);
  const month = String(bd.getUTCMonth() + 1).padStart(2, "0");
  const day = String(bd.getUTCDate()).padStart(2, "0");
  return `${bd.getUTCFullYear()}-${month}-${day}`;
};

/** True when the given instant falls on today's date in Bangladesh. */
export const isTodayInBangladesh = (value: string | Date): boolean =>
  bangladeshDateKey(value) === bangladeshDateKey(new Date());
