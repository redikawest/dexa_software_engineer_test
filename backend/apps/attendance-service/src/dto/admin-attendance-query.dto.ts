import { Transform, type TransformFnParams } from 'class-transformer';
import { IsInt, Matches, Max, Min, ValidateIf } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PAGE_SIZE = 100;

/** '' means "not given" and keeps the default; digits become a number; anything else stays text so IsInt rejects it. */
const wholeNumber =
  (fallback: number) =>
  ({ value }: TransformFnParams): unknown => {
    if (value === '' || value === undefined) return fallback;
    return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  };

const optionalUuid = ({ value }: TransformFnParams): unknown => {
  if (value === '') return undefined;
  return typeof value === 'string' ? value.toLowerCase() : value;
};

export class AdminAttendanceQueryDto extends DateRangeQueryDto {
  @Transform(optionalUuid)
  @ValidateIf((dto: AdminAttendanceQueryDto) => dto.employeeId !== undefined)
  @Matches(UUID, { message: 'employeeId must be a UUID' })
  employeeId?: string;

  @Transform(wholeNumber(1))
  @IsInt({ message: 'page must be a whole number between 1 and 1000000' })
  @Min(1, { message: 'page must be a whole number between 1 and 1000000' })
  @Max(1_000_000, { message: 'page must be a whole number between 1 and 1000000' })
  page: number = 1;

  @Transform(wholeNumber(20))
  @IsInt({ message: `pageSize must be a whole number between 1 and ${MAX_PAGE_SIZE}` })
  @Min(1, { message: `pageSize must be a whole number between 1 and ${MAX_PAGE_SIZE}` })
  @Max(MAX_PAGE_SIZE, { message: `pageSize must be a whole number between 1 and ${MAX_PAGE_SIZE}` })
  pageSize: number = 20;
}
