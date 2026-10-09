import { Transform, type TransformFnParams } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { trimText } from './transforms.js';

const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE_SIZE = 100;

const wholeNumber =
  (fallback: number) =>
  ({ value }: TransformFnParams): unknown => {
    if (value === '' || value === undefined) return fallback;
    return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  };

export class ListEmployeesQueryDto {
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

  @Transform(trimText)
  @IsString({ message: 'search must be text' })
  @MaxLength(MAX_SEARCH_LENGTH, { message: `search must be at most ${MAX_SEARCH_LENGTH} characters` })
  search: string = '';
}
