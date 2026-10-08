import { redirect } from "react-router";

import { ApiError } from "./api";
import { clearSession, loadSession, type Role, type Session } from "./session";

const LOGIN_PATH: Record<Role, string> = { EMPLOYEE: "/login", HR_ADMIN: "/admin/login" };
const HOME_PATH: Record<Role, string> = { EMPLOYEE: "/attendance", HR_ADMIN: "/admin/employees" };

export function loginPathFor(role: Role): string {
  return LOGIN_PATH[role];
}

export async function loadWithSession<T>(role: Role, load: (token: string) => Promise<T>): Promise<T> {
  const session = requireRole(role);
  try {
    return await load(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSession();
      throw redirect(`${LOGIN_PATH[role]}?expired=1`);
    }
    throw error;
  }
}

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
