import type { InjectionKey } from "vue";

export function nowIso() {
  return new Date().toISOString();
}

export const SITE_TIMEZONE_KEY: InjectionKey<string> = Symbol("siteTimezone");

export function formatDateInTimezone(value: string | Date, timezone: string): string {
  return new Date(value).toLocaleString("zh-CN", { timeZone: timezone });
}

function parseDateInTimezone(date: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value) - 1,
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

export function getStartOfDay(date: string | Date, timezone: string): Date {
  const { year, month, day } = parseDateInTimezone(date, timezone);
  return new Date(Date.UTC(year, month, day));
}

export function getEndOfDay(date: string | Date, timezone: string): Date {
  const { year, month, day } = parseDateInTimezone(date, timezone);
  return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
}
