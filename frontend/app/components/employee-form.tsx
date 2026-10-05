import { useState } from "react";

import { FormField } from "~/components/form-field";
import { Card, inputClass, primaryButton, secondaryButton } from "~/components/ui";
import type { Employee } from "~/lib/dummy-data";
import { EMAIL_PATTERN, PHONE_PATTERN, cleanPhone } from "~/lib/validation";

export type EmployeeFormValues = {
  name: string;
  email: string;
  position: string;
  phone: string;
  password: string;
};

type Errors = Partial<Record<keyof EmployeeFormValues, string>>;

type EmployeeFormProps = {
  /** Existing employee when editing; leave empty to add a new one. */
  initial?: Employee;
  isEmailTaken: (email: string) => boolean;
  onSubmit: (values: EmployeeFormValues) => void;
  onCancel: () => void;
};

export function EmployeeForm({ initial, isEmailTaken, onSubmit, onCancel }: EmployeeFormProps) {
  const isNew = !initial;
  const [values, setValues] = useState<EmployeeFormValues>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    position: initial?.position ?? "",
    phone: initial?.phone ?? "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const bind = (field: keyof EmployeeFormValues) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value })),
    "aria-invalid": !!errors[field],
    className: inputClass(!!errors[field]),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = values.name.trim();
    const email = values.email.trim();
    const position = values.position.trim();
    const phone = cleanPhone(values.phone);
    const next: Errors = {};

    if (!name) next.name = "Name is required.";
    if (!email) next.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(email)) next.email = "Enter a valid email address.";
    else if (isEmailTaken(email)) next.email = "This email is already used by another employee.";
    if (!position) next.position = "Position is required.";
    if (!PHONE_PATTERN.test(phone)) next.phone = "Enter a valid phone number, e.g. 081234567890.";
    if (isNew && values.password.length < 8) next.password = "Password must be at least 8 characters.";

    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({ name, email, position, phone, password: values.password });
  }

  return (
    <Card title={isNew ? "Add employee" : "Edit employee"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Full name" error={errors.name}>
            <input id="name" type="text" autoComplete="off" {...bind("name")} />
          </FormField>
          <FormField id="email" label="Company email" error={errors.email}>
            <input id="email" type="email" autoComplete="off" {...bind("email")} />
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

        <div className="flex gap-2">
          <button type="submit" className={primaryButton}>
            {isNew ? "Add employee" : "Save changes"}
          </button>
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
