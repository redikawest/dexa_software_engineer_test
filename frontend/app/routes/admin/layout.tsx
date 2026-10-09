import { Outlet, useLoaderData } from "react-router";

import { AppShell, type NavItem } from "~/components/app-shell";
import { getMe } from "~/lib/employee";
import { loadWithSession } from "~/lib/guards";
import { clearSession } from "~/lib/session";

const navItems: NavItem[] = [
  {
    to: "/admin/employees",
    label: "Employees",
    icon: (
      <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 19c0-2.8 2.7-5 6-5s6 2.2 6 5M14.4 14.2c.5-.1 1.1-.2 1.6-.2 3.3 0 6 2.2 6 5" />
    ),
  },
  {
    to: "/admin/attendance",
    label: "Attendance",
    icon: (
      <path d="M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    ),
  },
];

export async function clientLoader() {
  return { admin: await loadWithSession("HR_ADMIN", getMe) };
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
      <a href="/admin/employees" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
        Try again
      </a>
    </main>
  );
}

export default function AdminLayout() {
  const { admin } = useLoaderData<typeof clientLoader>();

  return (
    <AppShell
      brand="Employee Monitoring"
      homePath="/admin/employees"
      items={navItems}
      userName={admin.name}
      userPhotoUrl={admin.photoUrl}
      logoutPath="/admin/login"
      onLogout={clearSession}
      widthClass="max-w-5xl"
    >
      <Outlet />
    </AppShell>
  );
}
