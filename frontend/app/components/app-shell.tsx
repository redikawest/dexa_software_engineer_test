import { Link, NavLink } from "react-router";

import { Avatar } from "~/components/ui";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

type AppShellProps = {
  brand: string;
  homePath: string;
  items: NavItem[];
  userName: string;
  userPhotoUrl?: string | null;
  logoutPath: string;
  onLogout?: () => void;
  headerExtra?: React.ReactNode;
  widthClass?: string;
  children: React.ReactNode;
};

/** Header with top menu on desktop and a bottom menu on mobile. */
export function AppShell({
  brand,
  homePath,
  items,
  userName,
  userPhotoUrl,
  logoutPath,
  onLogout,
  headerExtra,
  widthClass = "max-w-4xl",
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className={`mx-auto flex h-14 items-center gap-6 px-4 ${widthClass}`}>
          <Link to={homePath} className="font-semibold">
            {brand}
          </Link>

          <nav aria-label="Main menu" className="hidden gap-1 md:flex">
            {items.map((item) => (
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
            {headerExtra}
            <span className="hidden text-sm text-gray-600 md:inline">{userName}</span>
            <Avatar name={userName} src={userPhotoUrl} size="sm" />
            <Link to={logoutPath} onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-800">
              Log out
            </Link>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-5 md:py-8 ${widthClass}`}>{children}</main>

      <nav
        aria-label="Main menu"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map((item) => (
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
