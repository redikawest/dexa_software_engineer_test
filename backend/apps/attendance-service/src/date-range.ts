import { BadRequestException } from '@nestjs/common';
import { toWorkDate } from './work-date.js';

const MAX_RANGE_DAYS = 366;
const DAY_MS = 86_400_000;

export interface DateRange {
  from: string;
  to: string;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseDateRange(from: unknown, to: unknown, now = new Date()): DateRange {
  const today = toWorkDate(now);
  const end = to ?? today;
  const start = from ?? `${String(end).slice(0, 8)}01`;

  if (typeof start !== 'string' || typeof end !== 'string' || !isCalendarDate(start) || !isCalendarDate(end)) {
    throw new BadRequestException('from and to must be dates written as YYYY-MM-DD');
  }
  if (start > end) throw new BadRequestException('from must not be after to');

  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS + 1;
  if (days > MAX_RANGE_DAYS) {
    throw new BadRequestException(`The date range must be at most ${MAX_RANGE_DAYS} days`);
  }

  return { from: start, to: end };
}
