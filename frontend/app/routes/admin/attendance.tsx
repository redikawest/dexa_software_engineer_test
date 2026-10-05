import { useMemo, useState } from "react";

import type { Route } from "./+types/attendance";
import { DateRangeFilter } from "~/components/date-range-filter";
import { Card, inputClass } from "~/components/ui";
import { createDummyAllAttendance, dummyEmployees } from "~/lib/dummy-data";
import { formatDate, formatDuration, monthStartISO, toMinutes, todayISO } from "~/lib/date";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Employee Attendance" }];
}

const COLUMNS = "md:grid-cols-[9rem_1fr_6rem_6rem_6rem]";

export default function AdminAttendance() {
  const today = todayISO();
  const defaultRange = { from: monthStartISO(today), to: today };
  const [range, setRange] = useState(defaultRange);
  const [employeeId, setEmployeeId] = useState("");

  const allRecords = useMemo(() => createDummyAllAttendance(), []);
  const namesById = useMemo(() => new Map(dummyEmployees.map((e) => [e.id, e])), []);

  const rows = allRecords
    .filter(
      (r) =>
        r.date >= range.from && r.date <= range.to && (!employeeId || r.employeeId === employeeId),
    )
    .map((r) => ({
      ...r,
      employee: namesById.get(r.employeeId),
      minutes: toMinutes(r.pulang) - toMinutes(r.masuk),
    }))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (a.employee?.name ?? "").localeCompare(b.employee?.name ?? ""),
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Employee Attendance</h1>

      <DateRangeFilter value={range} defaultValue={defaultRange} onChange={setRange} />

      <div className="flex items-center justify-between gap-3">
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          aria-label="Filter by employee"
          className={`${inputClass()} sm:max-w-xs`}
        >
          <option value="">All employees</option>
          {dummyEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <p className="shrink-0 text-sm text-gray-500">
          {rows.length} {rows.length === 1 ? "record" : "records"}
        </p>
      </div>

      <Card className="!p-0">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No attendance records for this selection.</p>
        ) : (
          <>
            <div
              className={`hidden gap-3 border-b border-gray-100 px-4 py-2.5 text-xs font-medium text-gray-500 md:grid ${COLUMNS}`}
            >
              <span>Date</span>
              <span>Employee</span>
              <span>Clock in</span>
              <span>Clock out</span>
              <span>Duration</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {rows.map((row) => (
                <li
                  key={`${row.employeeId}-${row.date}`}
                  className={`grid grid-cols-3 gap-1 px-4 py-3 text-sm md:items-center md:gap-3 ${COLUMNS}`}
                >
                  <span className="col-span-3 text-gray-500 md:col-span-1 md:text-gray-900">{formatDate(row.date)}</span>
                  <span className="col-span-3 font-medium md:col-span-1">{row.employee?.name ?? "Unknown employee"}</span>
                  <span className="tabular-nums">
                    <span className="text-gray-500 md:hidden">In </span>
                    {row.masuk}
                  </span>
                  <span className="tabular-nums">
                    <span className="text-gray-500 md:hidden">Out </span>
                    {row.pulang}
                  </span>
                  <span className="tabular-nums">{formatDuration(row.minutes)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
