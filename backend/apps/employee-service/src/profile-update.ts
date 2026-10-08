import { BadRequestException } from '@nestjs/common';

const PHONE_PATTERN = /^(\+62|62|0)8\d{8,12}$/;
const MAX_PHOTO_URL_LENGTH = 2048;

export interface ProfileUpdate {
  phone?: string;
  photoUrl?: string | null;
}

export function parseProfileUpdate(body: unknown): ProfileUpdate {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('A JSON object is required');
  }
  const input = body as Record<string, unknown>;
  const update: ProfileUpdate = {};
  const errors: string[] = [];

  if ('phone' in input) {
    const phone = typeof input.phone === 'string' ? input.phone.replace(/[\s-]/g, '') : '';
    if (PHONE_PATTERN.test(phone)) update.phone = phone;
    else errors.push('phone must be an Indonesian mobile number (08..., 628... or +628...)');
  }

  if ('photoUrl' in input) {
    if (input.photoUrl === null) {
      update.photoUrl = null; // removes the photo
    } else if (isHttpUrl(input.photoUrl)) {
      update.photoUrl = input.photoUrl;
    } else {
      errors.push(`photoUrl must be an http(s) URL of at most ${MAX_PHOTO_URL_LENGTH} characters, or null`);
    }
  }

  if (errors.length > 0) throw new BadRequestException(errors);
  if (Object.keys(update).length === 0) throw new BadRequestException('Send at least one of: phone, photoUrl');
  return update;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > MAX_PHOTO_URL_LENGTH) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}
