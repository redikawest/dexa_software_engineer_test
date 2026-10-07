import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'employees' })
@Unique('UQ_employees_email', ['email'])
export class Employee {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_employees_id' })
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  position: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'FK_employees_created_by' })
  creator: Employee | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
