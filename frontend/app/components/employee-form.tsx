import { useState } from "react";

import { FormField } from "~/components/form-field";
import { Alert, Card, inputClass, primaryButton, secondaryButton } from "~/components/ui";
import type { AdminEmployee } from "~/lib/admin-employees";
import { ApiError } from "~/lib/api";
import { EMAIL_PATTERN, PHONE_PATTERN, cleanPhone } from "~/lib/validation";

export type EmployeeFormValues = {
  name: string;
  email: string;
  position: string;
  phone: string;
  password: string;
  isActive: boolean;
};

type Errors = Partial<Record<keyof EmployeeFormValues | "form", string>>;

const MAX_TEXT_LENGTH = 100;
const MAX_PASSWORD_BYTES = 72;

type EmployeeFormProps = {
  /** Existing employee when editing; leave empty to add a new one. */
  initial?: AdminEmployee;
  canDeactivate?: boolean;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onCancel: () => void;
};

export function EmployeeForm({ initial, canDeactivate = true, onSubmit, onCancel }: EmployeeFormProps) {
  const isNew = !initial;
  const [values, setValues] = useState<EmployeeFormValues>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    position: initial?.position ?? "",
    phone: initial?.phone ?? "",
    password: "",
    isActive: initial?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const bind = (field: "name" | "email" | "position" | "phone" | "password") => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value })),
    "aria-invalid": !!errors[field],
    className: inputClass(!!errors[field]),
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = values.name.trim();
    const email = values.email.trim();
    const position = values.position.trim();
    const phone = cleanPhone(values.phone);
    const next: Errors = {};

    if (!name) next.name = "Name is required.";
    else if (name.length > MAX_TEXT_LENGTH) next.name = `Name must be at most ${MAX_TEXT_LENGTH} characters.`;
    if (!email) next.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(email)) next.email = "Enter a valid email address.";
    if (!position) next.position = "Position is required.";
    else if (position.length > MAX_TEXT_LENGTH) next.position = `Position must be at most ${MAX_TEXT_LENGTH} characters.`;
    if (!PHONE_PATTERN.test(phone)) next.phone = "Enter a valid phone number, e.g. 081234567890.";
    if (isNew) {
      if (values.password.length < 8) next.password = "Password must be at least 8 characters.";
      else if (new TextEncoder().encode(values.password).length > MAX_PASSWORD_BYTES) {
        next.password = `Password must be at most ${MAX_PASSWORD_BYTES} characters.`;
      }
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({ name, email, position, phone, password: values.password, isActive: values.isActive });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save. Try again.";
      // "Email already used" belongs next to the email field, anything else above the buttons.
      setErrors(err instanceof ApiError && err.status === 409 ? { email: message } : { form: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={isNew ? "Add employee" : "Edit employee"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Full name" error={errors.name}>
            <input id="name" type="text" autoComplete="off" {...bind("name")} />
          </FormField>
          <FormField id="email" label="Company email" error={errors.email}>
            {/* The email is also the login name, so it is fixed once the employee exists. */}
            <input id="email" type="email" autoComplete="off" readOnly={!isNew} {...bind("email")} />
          </FormField>
          <FormField id="position" label="Position" error={errors.position}>
            <input id="position" type="text" autoComplete="off" {...bind("position")} />
          </FormField>
          <FormField id="phone" label="Phone number" error={errors.phone}>
            <input id="phone" type="tel" autoComplete="off" {...bind("phone")} />
          </FormField>
          {isNew && (
            <FormField id="password" label="Initial password" error={errors.password}>
              <input id="password" type="password" autoComplete="new-password" {...bind("password")} />
            </FormField>
          )}
        </div>

        {!isNew && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.isActive}
              disabled={!canDeactivate}
              onChange={(e) => setValues((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              Account active
              <span className="block text-xs text-gray-500">
                {canDeactivate
                  ? "An inactive employee can no longer log in."
                  : "You cannot switch off your own account."}
              </span>
            </span>
          </label>
        )}

        {errors.form && <Alert kind="error">{errors.form}</Alert>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? "Saving..." : isNew ? "Add employee" : "Save changes"}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className={secondaryButton}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
