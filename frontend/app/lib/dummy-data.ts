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

export type EmployeeAttendanceRecord = AttendanceRecord & { employeeId: string };

export const dummyEmployee: Employee = {
  id: "emp-001",
  name: "Budi Santoso",
  email: "budi.santoso@company.com",
  position: "Frontend Developer",
  phone: "081234567890",
  photoUrl: null,
};

/** The logged-in HR admin. */
export const dummyAdmin = {
  name: "Sinta Wulandari",
  position: "HR Admin",
};

export const dummyEmployees: Employee[] = [
  dummyEmployee,
  {
    id: "emp-002",
    name: "Andi Pratama",
    email: "andi.pratama@company.com",
    position: "Backend Developer",
    phone: "081298765432",
    photoUrl: null,
  },
  {
    id: "emp-003",
    name: "Dewi Lestari",
    email: "dewi.lestari@company.com",
    position: "UI/UX Designer",
    phone: "082112345678",
    photoUrl: null,
  },
  {
    id: "emp-004",
    name: "Rizky Hidayat",
    email: "rizky.hidayat@company.com",
    position: "QA Engineer",
    phone: "085712348765",
    photoUrl: null,
  },
  {
    id: "emp-005",
    name: "Maya Putri",
    email: "maya.putri@company.com",
    position: "Product Manager",
    phone: "081377788899",
    photoUrl: null,
  },
  {
    id: "emp-006",
    name: "Fajar Nugroho",
    email: "fajar.nugroho@company.com",
    position: "DevOps Engineer",
    phone: "087855566677",
    photoUrl: null,
  },
];

/**
 * Attendance history from the start of this month until yesterday (skips weekends and a few days).
 * `variant` shifts the times and absent days so each employee looks different.
 */
export function createDummyAttendance(variant = 0): AttendanceRecord[] {
  const today = todayISO();
  const start = new Date(`${monthStartISO(today)}T00:00:00Z`);
  const end = new Date(`${today}T00:00:00Z`);
  const pad = (v: number) => String(v).padStart(2, "0");
  const records: AttendanceRecord[] = [];

  for (let d = start; d < end; d = new Date(d.getTime() + 86_400_000)) {
    const dow = d.getUTCDay();
    const n = d.getUTCDate();
    if (dow === 0 || dow === 6 || (n + variant) % 9 === 0) continue;

    const inMin = 7 * 60 + 50 + ((n * 7 + variant * 11) % 45); // 07:50 - 08:34
    const outMin = 17 * 60 + ((n * 11 + variant * 7) % 40); // 17:00 - 17:39
    records.push({
      date: d.toISOString().slice(0, 10),
      masuk: `${pad(Math.floor(inMin / 60))}:${pad(inMin % 60)}`,
      pulang: `${pad(Math.floor(outMin / 60))}:${pad(outMin % 60)}`,
    });
  }
  return records;
}

/** Attendance of every dummy employee, for the HR admin view. */
export function createDummyAllAttendance(): EmployeeAttendanceRecord[] {
  return dummyEmployees.flatMap((employee, index) =>
    createDummyAttendance(index).map((record) => ({ ...record, employeeId: employee.id })),
  );
}
