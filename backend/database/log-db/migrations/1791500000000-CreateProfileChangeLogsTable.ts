import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfileChangeLogsTable1791500000000 implements MigrationInterface {
  name = 'CreateProfileChangeLogsTable1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "profile_change_logs_changed_by_role_enum" AS ENUM ('EMPLOYEE', 'HR_ADMIN')`,
    );
    await queryRunner.query(`
      CREATE TABLE "profile_change_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        -- The id of the event. Unique, so an event delivered twice is recorded once.
        "event_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "changed_by" uuid NOT NULL,
        "changed_by_role" "profile_change_logs_changed_by_role_enum" NOT NULL,
        -- What changed, e.g. [{"field":"phone","from":"0811...","to":"0812..."},{"field":"password"}].
        -- A password change has no values.
        "changes" jsonb NOT NULL,
        -- When the change happened (from the event) and when this row was written.
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profile_change_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_profile_change_logs_event_id" UNIQUE ("event_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_profile_change_logs_employee_occurred" ON "profile_change_logs" ("employee_id", "occurred_at")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_profile_change_logs_occurred_at" ON "profile_change_logs" ("occurred_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "profile_change_logs"`);
    await queryRunner.query(`DROP TYPE "profile_change_logs_changed_by_role_enum"`);
  }
}
