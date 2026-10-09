import { ApiProperty } from '@nestjs/swagger';

export class MarkSeenBody {
  @ApiProperty({
    description: 'The newest notification the admin has seen (use createdAt of the first item). Only moves forward.',
    type: String,
    format: 'date-time',
    example: '2026-10-09T08:39:52.138Z',
  })
  seenUntil!: string;
}

export class NotificationItem {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'The employee who changed their profile.', format: 'uuid' })
  employeeId!: string;

  @ApiProperty({ description: 'null if the employee service could not be reached.', type: String, nullable: true })
  employeeName!: string | null;

  @ApiProperty({ description: 'Which fields changed. Never the values.', type: [String], example: ['phone'] })
  fields!: string[];

  @ApiProperty({ description: 'When the employee made the change.', type: String, format: 'date-time' })
  occurredAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ description: 'Not seen yet by this admin.' })
  isNew!: boolean;
}

export class NotificationListResponse {
  @ApiProperty({ description: 'How many are new to this admin.', example: 2 })
  unreadCount!: number;

  @ApiProperty({ description: 'Newest first.', type: [NotificationItem] })
  items!: NotificationItem[];
}

export class UnreadCountResponse {
  @ApiProperty({ example: 0 })
  unreadCount!: number;
}
