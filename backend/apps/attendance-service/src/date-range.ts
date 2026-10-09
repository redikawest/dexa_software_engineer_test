import { BadRequestException } from '@nestjs/common';
import type { DateRangeQueryDto } from './dto/date-range-query.dto.js';
import { toWorkDate } from './work-date.js';

const MAX_RANGE_DAYS = 366;
const DAY_MS = 86_400_000;

export interface DateRange {
  from: string;
  to: string;
}

/** The format of each date is checked by DateRangeQueryDto; this fills in the defaults and checks the two together. */
export function resolveDateRange({ from, to }: DateRangeQueryDto, now = new Date()): DateRange {
  const end = to ?? toWorkDate(now);
  const start = from ?? `${end.slice(0, 8)}01`;

  if (start > end) throw new BadRequestException('from must not be after to');

  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS + 1;
  if (days > MAX_RANGE_DAYS) {
    throw new BadRequestException(`The date range must be at most ${MAX_RANGE_DAYS} days`);
  }

  return { from: start, to: end };
}
