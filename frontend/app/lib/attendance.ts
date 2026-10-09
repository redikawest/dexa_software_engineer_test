import { apiFetch } from "./api";

export type TodayStatus = "NOT_STARTED" | "WORKING" | "DONE";

export type Today = {
  workDate: string;
  status: TodayStatus;
  clockIn: string | null;
  clockOut: string | null;
};

export function getToday(token: string): Promise<Today> {
  return apiFetch<Today>("/attendance/today", { token });
}

export function clockIn(token: string): Promise<unknown> {
  return apiFetch("/attendance/clock-in", { method: "POST", token });
}

export function clockOut(token: string): Promise<unknown> {
  return apiFetch("/attendance/clock-out", { method: "POST", token });
}

export type SummaryDay = {
  workDate: string;
  clockIn: string | null;
  clockOut: string | null;
  workedMinutes: number | null;
};

export type Summary = {
  from: string;
  to: string;
  days: SummaryDay[];
  totals: {
    daysPresent: number;
    totalMinutes: number;
    averageMinutes: number;
  };
};

export function getSummary(token: string, range: { from?: string; to?: string }): Promise<Summary> {
  const query = new URLSearchParams();
  if (range.from) query.set("from", range.from);
  if (range.to) query.set("to", range.to);
  const suffix = query.size ? `?${query}` : "";
  return apiFetch<Summary>(`/attendance/summary${suffix}`, { token });
}
