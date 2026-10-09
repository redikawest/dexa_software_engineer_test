export type UpdateMyProfileBody = { phone?: string; photoUrl?: string | null };

export type CreateEmployeeBody = { name: string; email: string; position: string; phone: string; password: string };

export type UpdateEmployeeBody = { name?: string; position?: string; phone?: string; isActive?: boolean };

export type ListEmployeesQuery = { page?: string; pageSize?: string; search?: string };
