import { apiFetch } from "./api";

export type AdminAttendanceItem = {
  employeeId: string;
  employeeName: string | null;
  position: string | null;
  workDate: string;
  clockIn: string | null;
  clockOut: string | null;
  workedMinutes: number | null;
};

export type AdminAttendanceList = {
  from: string;
  to: string;
  items: AdminAttendanceItem[];
  page: number;
  pageSize: number;
  total: number;
};

export const ATTENDANCE_PAGE_SIZE = 20;

type Query = { from?: string; to?: string; employeeId?: string; page?: number };

export function getAdminAttendance(token: string, query: Query): Promise<AdminAttendanceList> {
  const params = new URLSearchParams({ pageSize: String(ATTENDANCE_PAGE_SIZE) });
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.employeeId) params.set("employeeId", query.employeeId);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  return apiFetch<AdminAttendanceList>(`/admin/attendance?${params}`, { token });
}
