import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

const MAX_LIMIT = 50;
const LIMIT_MESSAGE = `limit must be a whole number between 1 and ${MAX_LIMIT}`;

export class ListNotificationsQueryDto {
  @Transform(({ value }): unknown => {
    if (value === '' || value === undefined) return 20;
    return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  })
  @IsInt({ message: LIMIT_MESSAGE })
  @Min(1, { message: LIMIT_MESSAGE })
  @Max(MAX_LIMIT, { message: LIMIT_MESSAGE })
  limit: number = 20;
}
