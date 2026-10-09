import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'admin_notification_state' })
export class AdminNotificationState {
  @PrimaryColumn({ name: 'admin_id', type: 'uuid', primaryKeyConstraintName: 'PK_admin_notification_state_admin_id' })
  adminId: string;

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt: Date;
}
