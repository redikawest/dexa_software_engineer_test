import { redirect } from "react-router";

import { loadSession, type Role, type Session } from "./session";

const LOGIN_PATH: Record<Role, string> = { EMPLOYEE: "/login", HR_ADMIN: "/admin/login" };
const HOME_PATH: Record<Role, string> = { EMPLOYEE: "/attendance", HR_ADMIN: "/admin/employees" };

export function requireRole(role: Role): Session {
  const session = loadSession();
  if (!session) throw redirect(LOGIN_PATH[role]);
  if (session.user.role !== role) throw redirect(HOME_PATH[session.user.role]);
  return session;
}

export function redirectIfLoggedIn(): null {
  const session = loadSession();
  if (session) throw redirect(HOME_PATH[session.user.role]);
  return null;
}
