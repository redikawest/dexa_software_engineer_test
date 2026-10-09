import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';
import type { ProfileFieldChange } from '@app/messaging';

@Entity({ name: 'profile_change_logs' })
@Unique('UQ_profile_change_logs_event_id', ['eventId'])
@Index('IDX_profile_change_logs_employee_occurred', ['employeeId', 'occurredAt'])
@Index('IDX_profile_change_logs_occurred_at', ['occurredAt'])
export class ProfileChangeLog {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_profile_change_logs_id' })
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy: string;

  @Column({ name: 'changed_by_role', type: 'enum', enum: ['EMPLOYEE', 'HR_ADMIN'] })
  changedByRole: 'EMPLOYEE' | 'HR_ADMIN';

  @Column({ type: 'jsonb' })
  changes: ProfileFieldChange[];

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ name: 'recorded_at', type: 'timestamptz', default: () => 'now()' })
  recordedAt: Date;
}
