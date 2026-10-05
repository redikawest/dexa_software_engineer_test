import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/profile";
import { ExpandableRow } from "~/components/expandable-row";
import { FormField } from "~/components/form-field";
import {
  Alert,
  Avatar,
  Card,
  inputClass,
  primaryButton,
  secondaryButton,
} from "~/components/ui";
import { useEmployee } from "~/lib/employee-context";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Profile" }];
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHONE_PATTERN = /^(\+62|62|0)8\d{8,12}$/;

type Section = "phone" | "password";

export default function Profile() {
  const { employee, setEmployee } = useEmployee();

  const [open, setOpen] = useState<Section | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Photo
  const fileInput = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Phone number
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!photoFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function toggle(section: Section) {
    setSuccess(null);
    if (open === section) return setOpen(null);
    if (section === "phone") {
      setPhone(employee.phone);
      setPhoneError(null);
    }
    setOpen(section);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSuccess(null);
    setPhotoError(null);

    if (file && !file.type.startsWith("image/")) {
      setPhotoError("File must be an image.");
    } else if (file && file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Photo must be 2 MB or smaller.");
    } else {
      setPhotoFile(file);
      return;
    }
    cancelPhoto(true);
  }

  function cancelPhoto(keepError = false) {
    setPhotoFile(null);
    if (!keepError) setPhotoError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function handlePhotoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!photoFile) return;

    // TODO: send the photo to the API (multipart). For now it only updates local state.
    setEmployee({ ...employee, photoUrl: URL.createObjectURL(photoFile) });
    cancelPhoto();
    setSuccess("Photo updated.");
  }

  function handlePhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleaned = phone.replace(/[\s-]/g, "");
    if (!PHONE_PATTERN.test(cleaned)) {
      setPhoneError("Enter a valid phone number, e.g. 081234567890.");
      return;
    }

    // TODO: send to the update profile API.
    setEmployee({ ...employee, phone: cleaned });
    setOpen(null);
    setSuccess("Phone number updated.");
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.current = "Current password is required.";
    if (newPassword.length < 8) errors.next = "New password must be at least 8 characters.";
    else if (newPassword === currentPassword) errors.next = "New password must be different from the current one.";
    if (confirmPassword !== newPassword) errors.confirm = "Passwords don't match.";

    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    // TODO: send to the change password API.
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOpen(null);
    setSuccess("Password changed.");
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {success && <Alert kind="success">{success}</Alert>}

      <Card className="text-center">
        <form onSubmit={handlePhotoSubmit} className="flex flex-col items-center gap-2">
          <Avatar name={employee.name} src={preview ?? employee.photoUrl} size="lg" />

          {photoFile ? (
            <div className="flex gap-2">
              <button type="submit" className={`${primaryButton} !px-3 !py-1.5`}>
                Save photo
              </button>
              <button type="button" onClick={() => cancelPhoto()} className={`${secondaryButton} !px-3 !py-1.5`}>
                Cancel
              </button>
            </div>
          ) : (
            <label htmlFor="photo" className="cursor-pointer text-sm text-blue-600 hover:underline">
              Change photo
            </label>
          )}
          <input
            ref={fileInput}
            id="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          {photoError && <p className="text-xs text-red-600">{photoError}</p>}
        </form>

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
              <button type="submit" className={primaryButton}>
                Save
              </button>
            </form>
          </ExpandableRow>

          <ExpandableRow label="Password" value="Change" open={open === "password"} onToggle={() => toggle("password")}>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
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
              <button type="submit" className={primaryButton}>
                Change password
              </button>
            </form>
          </ExpandableRow>
        </div>
      </Card>

      <p className="px-1 text-xs text-gray-500">Name, email, and position can only be changed by HR.</p>

      <Link to="/login" className={`${secondaryButton} w-full md:hidden`}>
        Log out
      </Link>
    </div>
  );
}
