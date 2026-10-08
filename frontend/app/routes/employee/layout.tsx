import { useState } from "react";
import { Outlet, useLoaderData } from "react-router";

import { AppShell, type NavItem } from "~/components/app-shell";
import { getMe } from "~/lib/employee";
import type { EmployeeContext } from "~/lib/employee-context";
import { loadWithSession } from "~/lib/guards";
import { clearSession } from "~/lib/session";

const navItems: NavItem[] = [
  {
    to: "/attendance",
    label: "Attendance",
    icon: <path d="M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  },
  {
    to: "/summary",
    label: "Summary",
    icon: (
      <path d="M8 7h8M8 12h8M8 17h5M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />,
  },
];

export async function clientLoader() {
  return { employee: await loadWithSession("EMPLOYEE", getMe) };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <p className="p-6 text-center text-sm text-gray-500">Loading...</p>;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  return (
    <main className="mx-auto max-w-sm p-6 text-center">
      <h1 className="text-lg font-semibold">Could not load your page</h1>
      <p className="mt-2 text-sm text-gray-600">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <a href="/attendance" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
        Try again
      </a>
    </main>
  );
}

export default function EmployeeLayout() {
  const { employee: loaded } = useLoaderData<typeof clientLoader>();
  const [employee, setEmployee] = useState(loaded);

  return (
    <AppShell
      brand="WFH Attendance"
      homePath="/attendance"
      items={navItems}
      userName={employee.name}
      userPhotoUrl={employee.photoUrl}
      logoutPath="/login"
      onLogout={clearSession}
    >
      <Outlet context={{ employee, setEmployee } satisfies EmployeeContext} />
    </AppShell>
  );
}
