import type { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto.js';
import { resolveDateRange, type DateRange } from './date-range.js';
import { toWorkDate } from './work-date.js';

export interface AdminAttendanceQuery extends DateRange {
  employeeId: string | null;
  page: number;
  pageSize: number;
}

/** With no dates at all, the list shows today only. */
export function toAdminAttendanceQuery(dto: AdminAttendanceQueryDto, now = new Date()): AdminAttendanceQuery {
  const today = toWorkDate(now);
  const noDates = dto.from === undefined && dto.to === undefined;
  const range = resolveDateRange(noDates ? { from: today, to: today } : dto, now);

  return { ...range, employeeId: dto.employeeId ?? null, page: dto.page, pageSize: dto.pageSize };
}
