import { Check, Column, CreateDateColumn, Entity, PrimaryColumn, Unique, UpdateDateColumn } from 'typeorm';

export type LoginRole = 'EMPLOYEE' | 'HR_ADMIN';

@Entity({ name: 'employee_logins' })
@Unique('UQ_employee_logins_email', ['email'])
@Check('CHK_employee_logins_email_lowercase', '"email" = lower("email")')
export class EmployeeLogin {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_employee_logins_id' })
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'enum', enum: ['EMPLOYEE', 'HR_ADMIN'] })
  role: LoginRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
