import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'notifications' })
@Unique('UQ_notifications_event_id', ['eventId'])
@Index('IDX_notifications_created_at', ['createdAt'])
export class Notification {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_notifications_id' })
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ type: 'jsonb' })
  fields: string[];

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
