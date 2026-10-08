import { BadRequestException } from '@nestjs/common';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

export interface EmployeeListQuery {
  page: number;
  pageSize: number;
  search: string | null;
}

function readPositiveInt(value: unknown, name: string, fallback: number, max: number): number {
  if (value === undefined || value === '') return fallback;
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < 1 || number > max) {
    throw new BadRequestException(`${name} must be a whole number between 1 and ${max}`);
  }
  return number;
}

export function parseEmployeeListQuery(page: unknown, pageSize: unknown, search: unknown): EmployeeListQuery {
  if (search !== undefined && typeof search !== 'string') {
    throw new BadRequestException('search must be text');
  }
  const trimmed = search?.trim() ?? '';
  if (trimmed.length > MAX_SEARCH_LENGTH) {
    throw new BadRequestException(`search must be at most ${MAX_SEARCH_LENGTH} characters`);
  }

  return {
    page: readPositiveInt(page, 'page', 1, 1_000_000),
    pageSize: readPositiveInt(pageSize, 'pageSize', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    search: trimmed || null,
  };
}
