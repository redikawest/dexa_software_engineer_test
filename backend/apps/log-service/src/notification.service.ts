import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { MoreThan, Repository } from 'typeorm';
import { EmployeeClient } from '@app/clients';
import type { ProfileChangedEvent } from '@app/messaging';
import { AdminNotificationState } from './admin-notification-state.entity.js';
import { Notification } from './notification.entity.js';

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 30;

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(AdminNotificationState) private readonly states: Repository<AdminNotificationState>,
    private readonly employees: EmployeeClient,
  ) {}

  async createFromEvent(event: ProfileChangedEvent): Promise<void> {
    if (event.changedBy.role !== 'EMPLOYEE') {
      this.logger.log(`Event ${event.eventId} was made by an admin, no notification`);
      return;
    }

    const result = await this.notifications
      .createQueryBuilder()
      .insert()
      .into(Notification)
      .values({
        id: randomUUID(),
        eventId: event.eventId,
        employeeId: event.employeeId,
        fields: event.changes.map((change) => change.field),
        occurredAt: new Date(event.occurredAt),
        createdAt: new Date(),
      })
      .orIgnore()
      .returning('id')
      .execute();

    this.logger.log(
      result.raw.length > 0
        ? `Notification made for event ${event.eventId}`
        : `Event ${event.eventId} already has a notification, skipped`,
    );
  }

  async list(adminId: string, limit: number) {
    const since = await this.unreadSince(adminId);
    const windowStart = this.windowStart();

    const [rows, unreadCount] = await Promise.all([
      this.notifications.find({
        where: { createdAt: MoreThan(windowStart) },
        order: { createdAt: 'DESC', id: 'DESC' },
        take: limit,
      }),
      this.notifications.count({ where: { createdAt: MoreThan(since) } }),
    ]);

    const names = await this.employees.findByIds([...new Set(rows.map((row) => row.employeeId))]);

    return {
      unreadCount,
      items: rows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        employeeName: names.get(row.employeeId)?.name ?? null,
        fields: row.fields,
        occurredAt: row.occurredAt,
        createdAt: row.createdAt,
        isNew: row.createdAt > since,
      })),
    };
  }

  async markSeen(adminId: string, seenUntil: string): Promise<{ unreadCount: number }> {
    const moment = new Date(Math.min(new Date(seenUntil).getTime(), Date.now()));

    await this.states.query(
      `INSERT INTO admin_notification_state (admin_id, last_seen_at) VALUES ($1, $2)
       ON CONFLICT (admin_id) DO UPDATE
       SET last_seen_at = GREATEST(admin_notification_state.last_seen_at, EXCLUDED.last_seen_at)`,
      [adminId, moment],
    );

    return { unreadCount: await this.notifications.count({ where: { createdAt: MoreThan(await this.unreadSince(adminId)) } }) };
  }

  private async unreadSince(adminId: string): Promise<Date> {
    const state = await this.states.findOne({ where: { adminId } });
    const windowStart = this.windowStart();
    return state && state.lastSeenAt > windowStart ? state.lastSeenAt : windowStart;
  }

  private windowStart(): Date {
    return new Date(Date.now() - WINDOW_DAYS * DAY_MS);
  }
}
