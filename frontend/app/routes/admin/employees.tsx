import { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigation, useRevalidator, useSearchParams } from "react-router";

import type { Route } from "./+types/employees";
import { EmployeeForm, type EmployeeFormValues } from "~/components/employee-form";
import { Alert, Avatar, Card, Chip, inputClass, primaryButton, secondaryButton } from "~/components/ui";
import {
  EMPLOYEE_PAGE_SIZE,
  createEmployee,
  getEmployees,
  updateEmployee,
  type AdminEmployee,
  type EmployeeChanges,
} from "~/lib/admin-employees";
import { loadWithSession } from "~/lib/guards";
import { loadSession } from "~/lib/session";
import { useAuthorized } from "~/lib/use-authorized";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Employees" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || undefined;
  const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1);
  return { list: await loadWithSession("HR_ADMIN", (token) => getEmployees(token, { search, page })) };
}
clientLoader.hydrate = true as const;

const SEARCH_DELAY_MS = 300;

export default function AdminEmployees() {
  const { list } = useLoaderData<typeof clientLoader>();
  const [params, setParams] = useSearchParams();
  const loading = useNavigation().state === "loading";
  const call = useAuthorized("HR_ADMIN");
  const { revalidate } = useRevalidator();

  const [editing, setEditing] = useState<AdminEmployee | "new" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const myId = loadSession()?.user.id;

  const search = params.get("search") ?? "";
  const [query, setQuery] = useState(search);

  useEffect(() => setQuery(search), [search]);

  useEffect(() => {
    if (query.trim() === search.trim()) return;
    const timer = setTimeout(() => {
      setParams(query.trim() ? { search: query.trim() } : {}, { replace: true });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, search, setParams]);

  function startEditing(next: AdminEmployee | "new") {
    setSuccess(null);
    setEditing(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(values: EmployeeFormValues) {
    if (editing === "new") {
      const { name, email, position, phone, password } = values;
      const created = await call((token) => createEmployee(token, { name, email, position, phone, password }));
      if (!created) return;
      setSuccess(`${created.name} added.`);
    } else if (editing) {
      const changes: EmployeeChanges = {};
      if (values.name !== editing.name) changes.name = values.name;
      if (values.position !== editing.position) changes.position = values.position;
      if (values.phone !== editing.phone) changes.phone = values.phone;
      if (values.isActive !== editing.isActive) changes.isActive = values.isActive;
      if (Object.keys(changes).length === 0) throw new Error("No changes to save.");

      const updated = await call((token) => updateEmployee(token, editing.id, changes));
      if (!updated) return;
      setSuccess(`${updated.name} updated.`);
    }
    setEditing(null);
    revalidate();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const lastPage = Math.max(1, Math.ceil(list.total / EMPLOYEE_PAGE_SIZE));

  function pageLink(page: number) {
    const next = new URLSearchParams(params);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    return `?${next}`;
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
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          canDeactivate={editing === "new" || editing.id !== myId}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email"
        aria-label="Search employees"
        className={inputClass()}
      />

      <div className={`space-y-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <Card className="!p-0">
          {list.items.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              <p>No employees found.</p>
              {list.page > 1 && (
                <Link to={pageLink(1)} className="mt-2 inline-block text-blue-700 hover:underline">
                  Back to the first page
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.items.map((employee) => (
                <li key={employee.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={employee.name} src={employee.photoUrl} size="md" />
                  <div className={`min-w-0 flex-1 ${employee.isActive ? "" : "opacity-60"}`}>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{employee.name}</span>
                      {!employee.isActive && <Chip tone="gray">Inactive</Chip>}
                    </p>
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

        {list.total > 0 && (
          <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
            <span>
              Page {list.page} of {lastPage} &middot; {list.total} {list.total === 1 ? "employee" : "employees"}
            </span>
            <span className="flex gap-2">
              {list.page > 1 && (
                <Link to={pageLink(list.page - 1)} className={`${secondaryButton} !px-3 !py-1.5`}>
                  Previous
                </Link>
              )}
              {list.page < lastPage && (
                <Link to={pageLink(list.page + 1)} className={`${secondaryButton} !px-3 !py-1.5`}>
                  Next
                </Link>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
