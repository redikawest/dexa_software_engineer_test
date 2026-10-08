import { apiFetch } from "./api";

export type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  photoUrl: string | null;
};

export function getMe(token: string): Promise<Employee> {
  return apiFetch<Employee>("/employee/me", { token });
}

export function updatePhone(token: string, phone: string): Promise<Employee> {
  return apiFetch<Employee>("/employee/me", { method: "PATCH", token, body: { phone } });
}

export function changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
  return apiFetch<void>("/auth/password", { method: "PATCH", token, body: { currentPassword, newPassword } });
}
