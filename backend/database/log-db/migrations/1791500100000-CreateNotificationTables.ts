import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTables1791500100000 implements MigrationInterface {
  name = 'CreateNotificationTables1791500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        -- The id of the event. Unique, so an event delivered twice makes one notification.
        "event_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        -- Which fields changed, e.g. ["phone","password"]. Names only, never the values.
        "fields" jsonb NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        -- When this notification was made. "Unread" is decided by this, not by occurred_at: an event
        -- that waited in the queue is still new to the admin.
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notifications_event_id" UNIQUE ("event_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at")`);

    await queryRunner.query(`
      CREATE TABLE "admin_notification_state" (
        "admin_id" uuid NOT NULL,
        "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_admin_notification_state_admin_id" PRIMARY KEY ("admin_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_notification_state"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
