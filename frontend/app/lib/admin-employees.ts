import { apiFetch } from "./api";
import type { Employee } from "./employee";

export type AdminEmployee = Employee & {
  isActive: boolean;
  createdAt: string;
};

export type EmployeeList = {
  items: AdminEmployee[];
  page: number;
  pageSize: number;
  total: number;
};

export const EMPLOYEE_PAGE_SIZE = 20;

export function getEmployees(
  token: string,
  params: { search?: string; page?: number; pageSize?: number },
): Promise<EmployeeList> {
  const query = new URLSearchParams({ pageSize: String(params.pageSize ?? EMPLOYEE_PAGE_SIZE) });
  if (params.search) query.set("search", params.search);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  return apiFetch<EmployeeList>(`/admin/employees?${query}`, { token });
}

export type NewEmployee = {
  name: string;
  email: string;
  position: string;
  phone: string;
  password: string;
};

export type EmployeeChanges = {
  name?: string;
  position?: string;
  phone?: string;
  isActive?: boolean;
};

export function createEmployee(token: string, employee: NewEmployee): Promise<AdminEmployee> {
  return apiFetch<AdminEmployee>("/admin/employees", { method: "POST", token, body: employee });
}

export function updateEmployee(token: string, id: string, changes: EmployeeChanges): Promise<AdminEmployee> {
  return apiFetch<AdminEmployee>(`/admin/employees/${id}`, { method: "PATCH", token, body: changes });
}
