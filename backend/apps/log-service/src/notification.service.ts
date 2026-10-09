import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { MoreThan, Repository } from 'typeorm';
import { EmployeeClient } from '@app/clients';
import type { ProfileChangedEvent } from '@app/messaging';
import { AdminNotificationState } from './admin-notification-state.entity.js';
import { Notification } from './notification.entity.js';

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 30;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

  async list(adminId: string, rawLimit: unknown) {
    const limit = this.parseLimit(rawLimit);
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

  async markSeen(adminId: string, seenUntil: unknown): Promise<{ unreadCount: number }> {
    const until = typeof seenUntil === 'string' ? new Date(seenUntil) : null;
    if (!until || Number.isNaN(until.getTime())) throw new BadRequestException('seenUntil must be an ISO time');
    const moment = new Date(Math.min(until.getTime(), Date.now()));

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

  private parseLimit(value: unknown): number {
    if (value === undefined || value === '') return DEFAULT_LIMIT;
    const limit = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new BadRequestException(`limit must be a whole number between 1 and ${MAX_LIMIT}`);
    }
    return limit;
  }
}
