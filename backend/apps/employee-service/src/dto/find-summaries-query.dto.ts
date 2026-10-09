import { Transform } from 'class-transformer';
import { ArrayMaxSize, Matches } from 'class-validator';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDS_MESSAGE = 'ids must be at most 100 comma-separated UUIDs';

export class FindSummariesQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  @ArrayMaxSize(100, { message: IDS_MESSAGE })
  @Matches(UUID, { each: true, message: IDS_MESSAGE })
  ids: string[] = [];
}
