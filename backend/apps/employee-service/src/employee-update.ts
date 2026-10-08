import { BadRequestException } from '@nestjs/common';

const PHONE = /^(\+62|62|0)8\d{8,12}$/;
const MAX_TEXT_LENGTH = 100;

export interface EmployeeUpdate {
  fullName?: string;
  position?: string;
  phone?: string;
  isActive?: boolean;
}

export function parseEmployeeUpdate(body: unknown): EmployeeUpdate {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('A JSON object is required');
  }
  const input = body as Record<string, unknown>;
  const update: EmployeeUpdate = {};
  const errors: string[] = [];

  const text = (key: string, label: string): string | undefined => {
    if (!(key in input)) return undefined;
    const value = typeof input[key] === 'string' ? (input[key] as string).trim() : '';
    if (!value || value.length > MAX_TEXT_LENGTH) errors.push(`${label} must not be empty (at most ${MAX_TEXT_LENGTH} characters)`);
    return value;
  };

  const fullName = text('name', 'name');
  if (fullName !== undefined) update.fullName = fullName;
  const position = text('position', 'position');
  if (position !== undefined) update.position = position;

  if ('phone' in input) {
    const phone = typeof input.phone === 'string' ? input.phone.replace(/[\s-]/g, '') : '';
    if (PHONE.test(phone)) update.phone = phone;
    else errors.push('phone must be an Indonesian mobile number (08..., 628... or +628...)');
  }

  if ('isActive' in input) {
    if (typeof input.isActive === 'boolean') update.isActive = input.isActive;
    else errors.push('isActive must be true or false');
  }

  if (errors.length > 0) throw new BadRequestException(errors);
  if (Object.keys(update).length === 0) {
    throw new BadRequestException('Send at least one of: name, position, phone, isActive');
  }
  return update;
}
