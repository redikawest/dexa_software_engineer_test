import { BadRequestException } from '@nestjs/common';
import { parseDateRange, type DateRange } from './date-range.js';
import { toWorkDate } from './work-date.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface AdminAttendanceQuery extends DateRange {
  employeeId: string | null;
  page: number;
  pageSize: number;
}

function readPositiveInt(value: unknown, name: string, fallback: number, max: number): number {
  if (value === undefined || value === '') return fallback;
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < 1 || number > max) {
    throw new BadRequestException(`${name} must be a whole number between 1 and ${max}`);
  }
  return number;
}

export function parseAdminAttendanceQuery(raw: {
  from?: unknown;
  to?: unknown;
  employeeId?: unknown;
  page?: unknown;
  pageSize?: unknown;
}): AdminAttendanceQuery {
  const today = toWorkDate(new Date());
  const noDates = raw.from === undefined && raw.to === undefined;
  const range = parseDateRange(noDates ? today : raw.from, noDates ? today : raw.to);

  const employeeId = raw.employeeId === undefined || raw.employeeId === '' ? null : raw.employeeId;
  if (employeeId !== null && (typeof employeeId !== 'string' || !UUID.test(employeeId))) {
    throw new BadRequestException('employeeId must be a UUID');
  }

  return {
    ...range,
    employeeId: employeeId?.toLowerCase() ?? null,
    page: readPositiveInt(raw.page, 'page', 1, 1_000_000),
    pageSize: readPositiveInt(raw.pageSize, 'pageSize', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}
