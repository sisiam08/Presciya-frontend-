
export const BD_UTC_OFFSET_MINUTES = 6 * 60;


export const bangladeshDateKey = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const bd = new Date(date.getTime() + BD_UTC_OFFSET_MINUTES * 60 * 1000);
  const month = String(bd.getUTCMonth() + 1).padStart(2, "0");
  const day = String(bd.getUTCDate()).padStart(2, "0");
  return `${bd.getUTCFullYear()}-${month}-${day}`;
};


export const isTodayInBangladesh = (value: string | Date): boolean =>
  bangladeshDateKey(value) === bangladeshDateKey(new Date());
