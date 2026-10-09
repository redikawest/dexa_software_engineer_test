import { isRouteErrorResponse, Link, useLoaderData, useNavigation, useSearchParams } from "react-router";

import type { Route } from "./+types/attendance";
import { DateRangeFilter, type DateRange } from "~/components/date-range-filter";
import { Card, inputClass, secondaryButton } from "~/components/ui";
import { ATTENDANCE_PAGE_SIZE, getAdminAttendance } from "~/lib/admin-attendance";
import { getEmployees } from "~/lib/admin-employees";
import { formatDate, formatDuration, formatTime, todayISO } from "~/lib/date";
import { loadWithSession } from "~/lib/guards";

const MAX_DAYS = 366;
const MAX_EMPLOYEES_IN_FILTER = 100;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Employee Attendance" }];
}

const COLUMNS = "md:grid-cols-[9rem_1fr_6rem_6rem_6rem]";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const { searchParams } = new URL(request.url);
  const query = {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
    page: Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1),
  };

  return loadWithSession("HR_ADMIN", async (token) => {
    const [attendance, employees] = await Promise.all([
      getAdminAttendance(token, query),
      getEmployees(token, { pageSize: MAX_EMPLOYEES_IN_FILTER }),
    ]);
    return { attendance, employees: employees.items };
  });
}
clientLoader.hydrate = true as const;

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <Card className="text-center">
      <p className="text-sm text-gray-700">
        {isRouteErrorResponse(error) || !(error instanceof Error) ? "Could not load the attendance." : error.message}
      </p>
      <Link to="/admin/attendance" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
        Show today
      </Link>
    </Card>
  );
}

export default function AdminAttendance() {
  const { attendance, employees } = useLoaderData<typeof clientLoader>();
  const [params, setParams] = useSearchParams();
  const loading = useNavigation().state === "loading";

  const today = todayISO();
  const defaultRange: DateRange = { from: today, to: today };
  const range: DateRange = { from: attendance.from, to: attendance.to };
  const employeeId = params.get("employeeId") ?? "";

  const lastPage = Math.max(1, Math.ceil(attendance.total / ATTENDANCE_PAGE_SIZE));

  /** Changing a filter starts again from the first page. */
  function updateFilters(change: { range?: DateRange; employeeId?: string }) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (change.range) {
      const isDefault = change.range.from === defaultRange.from && change.range.to === defaultRange.to;
      if (isDefault) {
        next.delete("from");
        next.delete("to");
      } else {
        next.set("from", change.range.from);
        next.set("to", change.range.to);
      }
    }
    if (change.employeeId !== undefined) {
      if (change.employeeId) next.set("employeeId", change.employeeId);
      else next.delete("employeeId");
    }
    setParams(next);
  }

  function pageLink(page: number) {
    const next = new URLSearchParams(params);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    return `?${next}`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Employee Attendance</h1>

      <DateRangeFilter
        key={`${range.from}_${range.to}`}
        value={range}
        defaultValue={defaultRange}
        onChange={(next) => updateFilters({ range: next })}
        maxDays={MAX_DAYS}
        defaultLabel="today"
        resetLabel="Today"
      />

      <div className="flex items-center justify-between gap-3">
        <select
          value={employeeId}
          onChange={(e) => updateFilters({ employeeId: e.target.value })}
          aria-label="Filter by employee"
          className={`${inputClass()} sm:max-w-xs`}
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <p className="shrink-0 text-sm text-gray-500">
          {attendance.total} {attendance.total === 1 ? "record" : "records"}
        </p>
      </div>

      <div className={`space-y-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <Card className="!p-0">
          {attendance.items.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              <p>No attendance records for this selection.</p>
              {attendance.page > 1 && (
                <Link to={pageLink(1)} className="mt-2 inline-block text-blue-700 hover:underline">
                  Back to the first page
                </Link>
              )}
            </div>
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
                {attendance.items.map((row) => (
                  <li
                    key={`${row.employeeId}-${row.workDate}`}
                    className={`grid grid-cols-3 gap-1 px-4 py-3 text-sm md:items-center md:gap-3 ${COLUMNS}`}
                  >
                    <span className="col-span-3 text-gray-500 md:col-span-1 md:text-gray-900">
                      {formatDate(row.workDate)}
                    </span>
                    <span className="col-span-3 font-medium md:col-span-1">
                      {row.employeeName ?? "Unknown employee"}
                    </span>
                    <span className="tabular-nums">
                      <span className="text-gray-500 md:hidden">In </span>
                      {row.clockIn ? formatTime(row.clockIn) : "--:--"}
                    </span>
                    <span className="tabular-nums">
                      <span className="text-gray-500 md:hidden">Out </span>
                      {row.clockOut ? formatTime(row.clockOut) : "--:--"}
                    </span>
                    <span className="tabular-nums">
                      {row.workedMinutes !== null
                        ? formatDuration(row.workedMinutes)
                        : // No clock out yet: still working if it is today, forgotten if it is an earlier day.
                          row.workDate === today
                          ? "In progress"
                          : "No clock out"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {attendance.total > 0 && (
          <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
            <span>
              Page {attendance.page} of {lastPage}
            </span>
            <span className="flex gap-2">
              {attendance.page > 1 && (
                <Link to={pageLink(attendance.page - 1)} className={`${secondaryButton} !px-3 !py-1.5`}>
                  Previous
                </Link>
              )}
              {attendance.page < lastPage && (
                <Link to={pageLink(attendance.page + 1)} className={`${secondaryButton} !px-3 !py-1.5`}>
                  Next
                </Link>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
