import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";

import { Avatar } from "~/components/ui";
import { dummyEmployee } from "~/lib/dummy-data";
import type { EmployeeContext } from "~/lib/employee-context";

const navItems = [
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
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-6 px-4">
          <Link to="/attendance" className="font-semibold">
            WFH Attendance
          </Link>

          <nav aria-label="Main menu" className="hidden gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 md:inline">{employee.name}</span>
            <Avatar name={employee.name} src={employee.photoUrl} size="sm" />
            <Link to="/login" className="hidden text-sm text-gray-500 hover:text-gray-800 md:inline">
              Log out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5 md:py-8">
        <Outlet context={{ employee, setEmployee } satisfies EmployeeContext} />
      </main>

      <nav
        aria-label="Main menu"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-xs ${
                isActive ? "font-medium text-blue-600" : "text-gray-500"
              }`
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
              aria-hidden
            >
              {item.icon}
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
