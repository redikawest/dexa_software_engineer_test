import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeesTable1791273026088 implements MigrationInterface {
  name = 'CreateEmployeesTable1791273026088';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "position" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "photo_url" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_employees_email" UNIQUE ("email"),
        CONSTRAINT "PK_employees_id" PRIMARY KEY ("id"),
        -- Who created this employee (an HR admin). Empty only for the very first account.
        CONSTRAINT "FK_employees_created_by" FOREIGN KEY ("created_by") REFERENCES "employees" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "employees"`);
  }
}
