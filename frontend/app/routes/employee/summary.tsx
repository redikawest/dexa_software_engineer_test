import { isRouteErrorResponse, Link, useLoaderData, useNavigation, useSearchParams } from "react-router";

import type { Route } from "./+types/summary";
import { DateRangeFilter, type DateRange } from "~/components/date-range-filter";
import { Stat } from "~/components/stat";
import { Card } from "~/components/ui";
import { getSummary } from "~/lib/attendance";
import { formatDate, formatDuration, formatTime, monthStartISO, todayISO } from "~/lib/date";
import { loadWithSession } from "~/lib/guards";

const MAX_DAYS = 366;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Attendance Summary" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const { searchParams } = new URL(request.url);
  const range = { from: searchParams.get("from") ?? undefined, to: searchParams.get("to") ?? undefined };
  return { summary: await loadWithSession("EMPLOYEE", (token) => getSummary(token, range)) };
}
clientLoader.hydrate = true as const;

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <Card className="text-center">
      <p className="text-sm text-gray-700">
        {isRouteErrorResponse(error) || !(error instanceof Error) ? "Could not load the summary." : error.message}
      </p>
      <Link to="/summary" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
        Show this month
      </Link>
    </Card>
  );
}

export default function Summary() {
  const { summary } = useLoaderData<typeof clientLoader>();
  const [, setSearchParams] = useSearchParams();
  const loading = useNavigation().state === "loading";

  const today = todayISO();
  const defaultRange: DateRange = { from: monthStartISO(today), to: today };
  const range: DateRange = { from: summary.from, to: summary.to };

  function handleChange(next: DateRange) {
    const isDefault = next.from === defaultRange.from && next.to === defaultRange.to;
    setSearchParams(isDefault ? {} : { from: next.from, to: next.to });
  }

  const { totals, days } = summary;

  return (
    <div className="space-y-4">
      <DateRangeFilter
        key={`${range.from}_${range.to}`}
        value={range}
        defaultValue={defaultRange}
        onChange={handleChange}
        maxDays={MAX_DAYS}
      />

      <div className={`space-y-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Present" value={`${totals.daysPresent} ${totals.daysPresent === 1 ? "day" : "days"}`} />
          <Stat label="Total hours" value={formatDuration(totals.totalMinutes)} />
          <Stat label="Average" value={formatDuration(totals.averageMinutes)} />
        </div>

        <Card className="!p-0">
          {days.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">No attendance records for this period.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {days.map((day) => (
                <li key={day.workDate} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(day.workDate)}</p>
                    <p className="text-sm tabular-nums text-gray-500">
                      {day.clockIn ? formatTime(day.clockIn) : "--:--"} &ndash;{" "}
                      {day.clockOut ? formatTime(day.clockOut) : "--:--"}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
                    {day.workedMinutes !== null
                      ? formatDuration(day.workedMinutes)
                      : // No clock out yet: still working if it is today, forgotten if it is an earlier day.
                        day.workDate === today
                        ? "In progress"
                        : "No clock out"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
