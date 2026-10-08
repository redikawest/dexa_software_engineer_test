import { BadRequestException } from '@nestjs/common';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^(\+62|62|0)8\d{8,12}$/;
const MAX_TEXT_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

export interface NewEmployee {
  fullName: string;
  email: string;
  position: string;
  phone: string;
  password: string;
}

export function parseNewEmployee(body: unknown): NewEmployee {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('A JSON object is required');
  }
  const input = body as Record<string, unknown>;
  const errors: string[] = [];

  const text = (key: string, label: string) => {
    const value = typeof input[key] === 'string' ? (input[key] as string).trim() : '';
    if (!value || value.length > MAX_TEXT_LENGTH) errors.push(`${label} is required (at most ${MAX_TEXT_LENGTH} characters)`);
    return value;
  };

  const fullName = text('name', 'name');
  const position = text('position', 'position');

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > MAX_EMAIL_LENGTH) errors.push('email must be a valid email address');

  const phone = typeof input.phone === 'string' ? input.phone.replace(/[\s-]/g, '') : '';
  if (!PHONE.test(phone)) errors.push('phone must be an Indonesian mobile number (08..., 628... or +628...)');

  const password = input.password;
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    errors.push(`password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_BYTES} characters`);
  }

  if (errors.length > 0) throw new BadRequestException(errors);
  return { fullName, email, position, phone, password: password as string };
}
