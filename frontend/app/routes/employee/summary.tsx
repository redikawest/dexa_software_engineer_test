import { useMemo, useState } from "react";

import type { Route } from "./+types/summary";
import { Stat } from "~/components/stat";
import { Alert, Card, inputClass, primaryButton, secondaryButton } from "~/components/ui";
import { createDummyAttendance } from "~/lib/dummy-data";
import { formatDate, formatDuration, monthStartISO, toMinutes, todayISO } from "~/lib/date";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Attendance Summary" }];
}

export default function Summary() {
  const today = todayISO();
  const defaultFrom = monthStartISO(today);

  const [fromInput, setFromInput] = useState(defaultFrom);
  const [toInput, setToInput] = useState(today);
  const [applied, setApplied] = useState({ from: defaultFrom, to: today });
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  const allRecords = useMemo(createDummyAttendance, []);
  const rows = allRecords
    .filter((r) => r.date >= applied.from && r.date <= applied.to)
    .map((r) => ({ ...r, minutes: toMinutes(r.pulang) - toMinutes(r.masuk) }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
  const avgMinutes = rows.length ? Math.round(totalMinutes / rows.length) : 0;
  const isDefaultRange = applied.from === defaultFrom && applied.to === today;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fromInput || !toInput) {
      setFilterError("Enter a start date and an end date.");
      return;
    }
    if (fromInput > toInput) {
      setFilterError("Start date can't be after the end date.");
      return;
    }
    setFilterError(null);
    setApplied({ from: fromInput, to: toInput });
    setFilterOpen(false);
  }

  function resetFilter() {
    setFromInput(defaultFrom);
    setToInput(today);
    setFilterError(null);
    setApplied({ from: defaultFrom, to: today });
    setFilterOpen(false);
  }

  return (
    <div className="space-y-4">
      <details
        className="group rounded-xl border border-gray-200 bg-white"
        open={filterOpen}
        onToggle={(e) => setFilterOpen(e.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
          <span>
            <span className="text-gray-500">Period: </span>
            <span className="font-medium">
              {formatDate(applied.from)} &ndash; {formatDate(applied.to)}
            </span>
            {isDefaultRange && <span className="ml-2 text-gray-400">(this month)</span>}
          </span>
          <span className="text-blue-600 group-open:hidden">Change</span>
          <span className="hidden text-blue-600 group-open:inline">Close</span>
        </summary>

        <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="from" className="mb-1.5 block text-sm text-gray-600">
                From
              </label>
              <input
                id="from"
                type="date"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label htmlFor="to" className="mb-1.5 block text-sm text-gray-600">
                To
              </label>
              <input
                id="to"
                type="date"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>
          {filterError && <Alert kind="error">{filterError}</Alert>}
          <div className="flex gap-2">
            <button type="submit" className={primaryButton}>
              Apply
            </button>
            <button type="button" onClick={resetFilter} className={secondaryButton}>
              This month
            </button>
          </div>
        </form>
      </details>

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
