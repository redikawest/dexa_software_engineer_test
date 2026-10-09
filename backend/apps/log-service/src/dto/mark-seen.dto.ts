import { IsISO8601 } from 'class-validator';

export class MarkSeenDto {
  @IsISO8601({}, { message: 'seenUntil must be an ISO time' })
  seenUntil!: string;
}
