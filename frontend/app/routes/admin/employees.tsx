import { useState } from "react";

import type { Route } from "./+types/employees";
import { EmployeeForm, type EmployeeFormValues } from "~/components/employee-form";
import { Alert, Avatar, Card, inputClass, primaryButton, secondaryButton } from "~/components/ui";
import { dummyEmployees, type Employee } from "~/lib/dummy-data";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Employees" }];
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState(dummyEmployees);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Employee | "new" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const editingId = editing && editing !== "new" ? editing.id : null;

  const keyword = query.trim().toLowerCase();
  const visible = employees.filter(
    (e) =>
      !keyword ||
      e.name.toLowerCase().includes(keyword) ||
      e.email.toLowerCase().includes(keyword) ||
      e.position.toLowerCase().includes(keyword),
  );

  function isEmailTaken(email: string) {
    return employees.some((e) => e.email.toLowerCase() === email.toLowerCase() && e.id !== editingId);
  }

  function handleSubmit(values: EmployeeFormValues) {
    const { name, email, position, phone } = values;

    if (editingId) {
      setEmployees((prev) => prev.map((e) => (e.id === editingId ? { ...e, name, email, position, phone } : e)));
      setSuccess(`${name} updated.`);
    } else {
      const created: Employee = { id: `emp-${Date.now()}`, name, email, position, phone, photoUrl: null };
      setEmployees((prev) => [...prev, created]);
      setSuccess(`${name} added.`);
    }
    setEditing(null);
  }

  function startEditing(next: Employee | "new") {
    setSuccess(null);
    setEditing(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Employees</h1>
        {!editing && (
          <button type="button" onClick={() => startEditing("new")} className={primaryButton}>
            Add employee
          </button>
        )}
      </div>

      {success && <Alert kind="success">{success}</Alert>}

      {editing && (
        <EmployeeForm
          key={editingId ?? "new"}
          initial={editing === "new" ? undefined : editing}
          isEmailTaken={isEmailTaken}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, or position"
        aria-label="Search employees"
        className={inputClass()}
      />

      <Card className="!p-0">
        {visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No employees found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((employee) => (
              <li key={employee.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={employee.name} src={employee.photoUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{employee.name}</p>
                  <p className="truncate text-sm text-gray-500">{employee.position}</p>
                  <p className="truncate text-sm text-gray-500">
                    {employee.email} &middot; {employee.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEditing(employee)}
                  aria-label={`Edit ${employee.name}`}
                  className={`${secondaryButton} !px-3 !py-1.5`}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
