import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Clock in / clock out events. Owned by the attendance-service.
 * One row per event, so a full working day is two rows.
 * `employee_id` has no foreign key on purpose: the employee belongs to another service.
 */
export class CreateAttendanceRecordsTable1791273660000 implements MigrationInterface {
  name = 'CreateAttendanceRecordsTable1791273660000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "attendance_records_type_enum" AS ENUM ('CLOCK_IN', 'CLOCK_OUT')`);
    await queryRunner.query(`
      CREATE TABLE "attendance_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_id" uuid NOT NULL,
        "type" "attendance_records_type_enum" NOT NULL,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "work_date" date NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_records_id" PRIMARY KEY ("id"),
        -- At most one clock in and one clock out per employee per day.
        -- This index also serves lookups by (employee_id, work_date) for the personal summary.
        CONSTRAINT "UQ_attendance_records_employee_date_type" UNIQUE ("employee_id", "work_date", "type")
      )
    `);
    // For the HR list, which filters by date across all employees.
    await queryRunner.query(`CREATE INDEX "IDX_attendance_records_work_date" ON "attendance_records" ("work_date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "attendance_records"`);
    await queryRunner.query(`DROP TYPE "attendance_records_type_enum"`);
  }
}
