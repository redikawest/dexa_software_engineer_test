import { useEffect, useState } from "react";

import type { Route } from "./+types/attendance";
import { Card, Chip, primaryButton, secondaryButton } from "~/components/ui";
import { formatDate, todayISO } from "~/lib/date";

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

export default function Attendance() {
  const clock = useClock();

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="space-y-4 py-6 text-center md:col-span-3 md:py-8">
        <p className="text-sm text-gray-500">{formatDate(todayISO(), true)}</p>
        <p className="text-5xl font-medium tabular-nums" suppressHydrationWarning>
          {clock ?? "--:--:--"}
        </p>
        <Chip tone="amber">Not clocked in</Chip>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button type="button" className={`${primaryButton} py-4 text-base`}>
            Clock in
          </button>
          <button type="button" className={`${secondaryButton} py-4 text-base`}>
            Clock out
          </button>
        </div>
      </Card>

      <Card title="Today's record" className="md:col-span-2">
        <dl className="divide-y divide-gray-100 text-sm">
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Clock in</dt>
            <dd className="tabular-nums">--:--</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-gray-500">Clock out</dt>
            <dd className="tabular-nums">--:--</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
