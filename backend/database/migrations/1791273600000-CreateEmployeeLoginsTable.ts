import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Login accounts. Read by the auth-service; `id` equals `employees.id` (same UUID, no foreign key). */
export class CreateEmployeeLoginsTable1791273600000 implements MigrationInterface {
  name = 'CreateEmployeeLoginsTable1791273600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "employee_logins_role_enum" AS ENUM ('EMPLOYEE', 'HR_ADMIN')`);
    await queryRunner.query(`
      CREATE TABLE "employee_logins" (
        "id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "employee_logins_role_enum" NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_logins_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employee_logins_email" UNIQUE ("email"),
        CONSTRAINT "CHK_employee_logins_email_lowercase" CHECK ("email" = lower("email"))
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "employee_logins"`);
    await queryRunner.query(`DROP TYPE "employee_logins_role_enum"`);
  }
}
