import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

export type AttendanceType = 'CLOCK_IN' | 'CLOCK_OUT';

@Entity({ name: 'attendance_records' })
@Unique('UQ_attendance_records_employee_date_type', ['employeeId', 'workDate', 'type'])
export class AttendanceRecord {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_attendance_records_id' })
  id: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ type: 'enum', enum: ['CLOCK_IN', 'CLOCK_OUT'] })
  type: AttendanceType;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;

  @Index('IDX_attendance_records_work_date')
  @Column({ name: 'work_date', type: 'date' })
  workDate: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
