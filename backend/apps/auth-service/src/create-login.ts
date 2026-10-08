import { BadRequestException } from '@nestjs/common';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

export interface CreateLoginInput {
  id: string;
  email: string;
  password: string;
}

export function parseCreateLogin(body: unknown): CreateLoginInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('A JSON object is required');
  }
  const { id, email, password } = body as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof id !== 'string' || !UUID.test(id)) errors.push('id must be a UUID');

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL.test(normalizedEmail) || normalizedEmail.length > MAX_EMAIL_LENGTH) {
    errors.push('email must be a valid email address');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    errors.push(`password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_BYTES} characters`);
  }

  if (errors.length > 0) throw new BadRequestException(errors);
  return { id: (id as string).toLowerCase(), email: normalizedEmail, password: password as string };
}
