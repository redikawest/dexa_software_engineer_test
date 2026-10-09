const TZ = "Asia/Jakarta";

export function todayISO(d = new Date()): string {
  return d.toLocaleDateString("sv-SE", { timeZone: TZ });
}

export function monthStartISO(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

export function formatDate(iso: string, long = false): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: long ? "long" : "short",
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

export function formatRelative(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ });
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
