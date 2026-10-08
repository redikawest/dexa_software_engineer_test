import { apiFetch } from "./api";
import type { Role, Session } from "./session";

type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: { id: string; email: string; role: Role };
};

export async function login(email: string, password: string): Promise<Session> {
  const data = await apiFetch<LoginResponse>("/auth/login", { method: "POST", body: { email, password } });
  return {
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    user: data.user,
  };
}
