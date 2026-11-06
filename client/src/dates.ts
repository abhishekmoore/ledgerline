import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

export function formatWhen(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  return format(date, "PPp");
}

export function formatRelative(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function tryFormatDate(raw?: string): string | null {
  if (!raw) return null;
  const parsed = parseISO(raw);
  if (isValid(parsed)) return format(parsed, "PP");
  return null;
}
