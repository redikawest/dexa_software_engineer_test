import type { TransformFnParams } from 'class-transformer';

export const PHONE_PATTERN = /^(\+62|62|0)8\d{8,12}$/;
export const PHONE_MESSAGE = 'phone must be an Indonesian mobile number (08..., 628... or +628...)';
export const MAX_TEXT_LENGTH = 100;

export const trimText = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim() : value);

export const cleanPhone = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

export const lowerEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
