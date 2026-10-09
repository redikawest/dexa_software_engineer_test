import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";

import type { Route } from "./+types/attendance";
import { Alert, Card, Chip, primaryButton, secondaryButton } from "~/components/ui";
import { clockIn, clockOut, getToday, type Today } from "~/lib/attendance";
import { formatDate, formatDuration, formatTime } from "~/lib/date";
import { loadWithSession } from "~/lib/guards";
import { useAuthorized } from "~/lib/use-authorized";

export async function clientLoader() {
  return { today: await loadWithSession("EMPLOYEE", getToday) };
}
clientLoader.hydrate = true as const;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Attendance" }];
}

function useClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Jakarta" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const STATUS_CHIP = {
  NOT_STARTED: { tone: "amber", label: "Not clocked in" },
  WORKING: { tone: "green", label: "Working" },
  DONE: { tone: "gray", label: "Done for today" },
} as const;

export default function Attendance() {
  const clock = useClock();
  const call = useAuthorized("EMPLOYEE");
  const { today: loaded } = useLoaderData<typeof clientLoader>();

  const [today, setToday] = useState<Today>(loaded);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: (token: string) => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      const done = await call(action);
      if (done === null) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
    try {
      const latest = await call(getToday);
      if (latest) setToday(latest);
    } catch {
    } finally {
      setBusy(false);
    }
  }

  const chip = STATUS_CHIP[today.status];
  const worked =
    today.clockIn && today.clockOut
      ? Math.floor((new Date(today.clockOut).getTime() - new Date(today.clockIn).getTime()) / 60_000)
      : null;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="space-y-4 py-6 text-center md:col-span-3 md:py-8">
        <p className="text-sm text-gray-500">{formatDate(today.workDate, true)}</p>
        <p className="text-5xl font-medium tabular-nums" suppressHydrationWarning>
          {clock ?? "--:--:--"}
        </p>
        <Chip tone={chip.tone}>{chip.label}</Chip>

        {error && <Alert kind="error">{error}</Alert>}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={busy || today.status !== "NOT_STARTED"}
            onClick={() => run(clockIn)}
            className={`${primaryButton} py-4 text-base`}
          >
            Clock in
          </button>
          <button
            type="button"
            disabled={busy || today.status !== "WORKING"}
            onClick={() => run(clockOut)}
            className={`${secondaryButton} py-4 text-base`}
          >
            Clock out
          </button>
        </div>
      </Card>

      <Card title="Today's record" className="md:col-span-2">
        <dl className="divide-y divide-gray-100 text-sm">
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Clock in</dt>
            <dd className="tabular-nums">{today.clockIn ? formatTime(today.clockIn) : "--:--"}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Clock out</dt>
            <dd className="tabular-nums">{today.clockOut ? formatTime(today.clockOut) : "--:--"}</dd>
          </div>
          {worked !== null && (
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Worked</dt>
              <dd className="tabular-nums">{formatDuration(worked)}</dd>
            </div>
          )}
        </dl>
      </Card>
    </div>
  );
}
