import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import type { ProfileChangedEvent } from '@app/messaging';
import { ProfileChangeLog } from './profile-change-log.entity.js';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(@InjectRepository(ProfileChangeLog) private readonly logs: Repository<ProfileChangeLog>) {}

  async record(event: ProfileChangedEvent): Promise<void> {
    const result = await this.logs
      .createQueryBuilder()
      .insert()
      .into(ProfileChangeLog)
      .values({
        id: randomUUID(),
        eventId: event.eventId,
        employeeId: event.employeeId,
        changedBy: event.changedBy.id,
        changedByRole: event.changedBy.role,
        changes: event.changes,
        occurredAt: new Date(event.occurredAt),
      })
      .orIgnore()
      .returning('id')
      .execute();

    const written = result.raw.length > 0;
    this.logger.log(written ? `Recorded event ${event.eventId}` : `Event ${event.eventId} was already recorded, skipped`);
  }
}
