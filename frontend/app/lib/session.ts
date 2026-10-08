export type Role = "EMPLOYEE" | "HR_ADMIN";

export type Session = {
  accessToken: string;
  expiresAt: number;
  user: { id: string; email: string; role: Role };
};

const STORAGE_KEY = "dexa.session";

export function saveSession(session: Session): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    
  }
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (typeof session.accessToken !== "string" || session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    
  }
}
