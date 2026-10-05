// Temporary dummy data, to be replaced with data from the REST API.
import { monthStartISO, todayISO } from "./date";

export type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  photoUrl: string | null;
};

export type AttendanceRecord = {
  date: string; // YYYY-MM-DD
  masuk: string; // HH:mm
  pulang: string; // HH:mm
};

export const dummyEmployee: Employee = {
  id: "emp-001",
  name: "Budi Santoso",
  email: "budi.santoso@company.com",
  position: "Frontend Developer",
  phone: "081234567890",
  photoUrl: null,
};

/** Attendance history from the start of this month until yesterday (skips weekends and a few days). */
export function createDummyAttendance(): AttendanceRecord[] {
  const today = todayISO();
  const start = new Date(`${monthStartISO(today)}T00:00:00Z`);
  const end = new Date(`${today}T00:00:00Z`);
  const pad = (v: number) => String(v).padStart(2, "0");
  const records: AttendanceRecord[] = [];

  for (let d = start; d < end; d = new Date(d.getTime() + 86_400_000)) {
    const dow = d.getUTCDay();
    const n = d.getUTCDate();
    if (dow === 0 || dow === 6 || n % 9 === 0) continue;

    const inMin = 7 * 60 + 50 + ((n * 7) % 45); // 07:50 - 08:34
    const outMin = 17 * 60 + ((n * 11) % 40); // 17:00 - 17:39
    records.push({
      date: d.toISOString().slice(0, 10),
      masuk: `${pad(Math.floor(inMin / 60))}:${pad(inMin % 60)}`,
      pulang: `${pad(Math.floor(outMin / 60))}:${pad(outMin % 60)}`,
    });
  }
  return records;
}
