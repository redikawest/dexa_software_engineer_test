export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Indonesian mobile numbers: 08..., 628..., or +628...
export const PHONE_PATTERN = /^(\+62|62|0)8\d{8,12}$/;

/** Removes spaces and dashes so "0812 3456-7890" can be validated and stored as digits. */
export function cleanPhone(value: string): string {
  return value.replace(/[\s-]/g, "");
}
