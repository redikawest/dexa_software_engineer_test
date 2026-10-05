import { useState } from "react";
import { Outlet } from "react-router";

import { AppShell, type NavItem } from "~/components/app-shell";
import { dummyEmployee } from "~/lib/dummy-data";
import type { EmployeeContext } from "~/lib/employee-context";

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

export default function EmployeeLayout() {
  const [employee, setEmployee] = useState(dummyEmployee);

  return (
    <AppShell
      brand="WFH Attendance"
      homePath="/attendance"
      items={navItems}
      userName={employee.name}
      userPhotoUrl={employee.photoUrl}
      logoutPath="/login"
    >
      <Outlet context={{ employee, setEmployee } satisfies EmployeeContext} />
    </AppShell>
  );
}
