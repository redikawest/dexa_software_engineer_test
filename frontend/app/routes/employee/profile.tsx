import { useState } from "react";

import type { Route } from "./+types/profile";
import { ExpandableRow } from "~/components/expandable-row";
import { FormField } from "~/components/form-field";
import { Alert, Avatar, Card, inputClass, primaryButton } from "~/components/ui";
import { ApiError } from "~/lib/api";
import { changePassword, updatePhone } from "~/lib/employee";
import { useEmployee } from "~/lib/employee-context";
import { useAuthorized } from "~/lib/use-authorized";
import { PHONE_PATTERN, cleanPhone } from "~/lib/validation";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Profile" }];
}

const MAX_PASSWORD_BYTES = 72; // the API (bcrypt) cannot use more than this

type Section = "phone" | "password";

export default function Profile() {
  const { employee, setEmployee } = useEmployee();
  const call = useAuthorized("EMPLOYEE");

  const [open, setOpen] = useState<Section | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Phone number
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  function toggle(section: Section) {
    setSuccess(null);
    if (open === section) return setOpen(null);
    if (section === "phone") {
      setPhone(employee.phone);
      setPhoneError(null);
    }
    setOpen(section);
  }

  async function handlePhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleaned = cleanPhone(phone);
    if (!PHONE_PATTERN.test(cleaned)) {
      setPhoneError("Enter a valid phone number, e.g. 081234567890.");
      return;
    }

    setSaving(true);
    setPhoneError(null);
    try {
      const updated = await call((token) => updatePhone(token, cleaned));
      if (!updated) return;
      setEmployee(updated);
      setOpen(null);
      setSuccess("Phone number updated.");
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.current = "Current password is required.";
    if (newPassword.length < 8) errors.next = "New password must be at least 8 characters.";
    else if (new TextEncoder().encode(newPassword).length > MAX_PASSWORD_BYTES) {
      errors.next = `New password must be at most ${MAX_PASSWORD_BYTES} characters.`;
    } else if (newPassword === currentPassword) errors.next = "New password must be different from the current one.";
    if (confirmPassword !== newPassword) errors.confirm = "Passwords don't match.";

    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const done = await call((token) => changePassword(token, currentPassword, newPassword));
      if (done === null) return;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOpen(null);
      setSuccess("Password changed.");
    } catch (err) {
      if (err instanceof ApiError && err.message === "Current password is incorrect") {
        setPasswordErrors({ current: "Current password is incorrect." });
      } else {
        setPasswordErrors({ form: err instanceof Error ? err.message : "Could not save. Try again." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {success && <Alert kind="success">{success}</Alert>}

      <Card className="text-center">
        <div className="flex justify-center">
          <Avatar name={employee.name} src={employee.photoUrl} size="lg" />
        </div>

        <h1 className="mt-3 text-lg font-semibold">{employee.name}</h1>
        <p className="text-sm text-gray-500">{employee.position}</p>
      </Card>

      <Card className="!p-0">
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3.5 text-sm">
            <span className="text-gray-500">Email</span>
            <span className="break-all">{employee.email}</span>
          </div>

          <ExpandableRow label="Phone number" value={employee.phone} open={open === "phone"} onToggle={() => toggle("phone")}>
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              <FormField id="phone" label="Phone number" error={phoneError ?? undefined}>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!phoneError}
                  className={inputClass(!!phoneError)}
                />
              </FormField>
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? "Saving..." : "Save"}
              </button>
            </form>
          </ExpandableRow>

          <ExpandableRow label="Password" value="Change" open={open === "password"} onToggle={() => toggle("password")}>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              {passwordErrors.form && <Alert kind="error">{passwordErrors.form}</Alert>}
              <FormField id="currentPassword" label="Current password" error={passwordErrors.current}>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass(!!passwordErrors.current)}
                />
              </FormField>
              <FormField id="newPassword" label="New password" error={passwordErrors.next}>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass(!!passwordErrors.next)}
                />
              </FormField>
              <FormField id="confirmPassword" label="Confirm new password" error={passwordErrors.confirm}>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass(!!passwordErrors.confirm)}
                />
              </FormField>
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? "Saving..." : "Change password"}
              </button>
            </form>
          </ExpandableRow>
        </div>
      </Card>

      <p className="px-1 text-xs text-gray-500">Name, email, and position can only be changed by HR.</p>
    </div>
  );
}
