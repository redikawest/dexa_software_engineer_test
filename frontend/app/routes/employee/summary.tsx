import { useMemo, useState } from "react";

import type { Route } from "./+types/summary";
import { DateRangeFilter } from "~/components/date-range-filter";
import { Stat } from "~/components/stat";
import { Card } from "~/components/ui";
import { createDummyAttendance } from "~/lib/dummy-data";
import { formatDate, formatDuration, monthStartISO, toMinutes, todayISO } from "~/lib/date";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Attendance Summary" }];
}

export default function Summary() {
  const today = todayISO();
  const defaultRange = { from: monthStartISO(today), to: today };
  const [range, setRange] = useState(defaultRange);

  const allRecords = useMemo(() => createDummyAttendance(), []);
  const rows = allRecords
    .filter((r) => r.date >= range.from && r.date <= range.to)
    .map((r) => ({ ...r, minutes: toMinutes(r.pulang) - toMinutes(r.masuk) }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
  const avgMinutes = rows.length ? Math.round(totalMinutes / rows.length) : 0;

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} defaultValue={defaultRange} onChange={setRange} />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Present" value={`${rows.length} ${rows.length === 1 ? "day" : "days"}`} />
        <Stat label="Total hours" value={formatDuration(totalMinutes)} />
        <Stat label="Average" value={formatDuration(avgMinutes)} />
      </div>

      <Card className="!p-0">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No attendance records for this period.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((row) => (
              <li key={row.date} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{formatDate(row.date)}</p>
                  <p className="text-sm tabular-nums text-gray-500">
                    {row.masuk} &ndash; {row.pulang}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatDuration(row.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
