import { IsISO8601, Matches, ValidateIf } from 'class-validator';

const dateMessage = (name: string) => `${name} must be a date written as YYYY-MM-DD`;

export class DateRangeQueryDto {
  /** First day, YYYY-MM-DD. Defaults to the first day of the month of `to`. */
  @ValidateIf((dto: DateRangeQueryDto) => dto.from !== undefined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: dateMessage('from') })
  @IsISO8601({ strict: true }, { message: dateMessage('from') })
  from?: string;

  /** Last day, YYYY-MM-DD. Defaults to today. */
  @ValidateIf((dto: DateRangeQueryDto) => dto.to !== undefined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: dateMessage('to') })
  @IsISO8601({ strict: true }, { message: dateMessage('to') })
  to?: string;
}
