import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from './audit-log.service.js';
import {
  AUDIT_QUEUE,
  NOTIFY_QUEUE,
  readRabbitUrl,
  startEventConsumers,
  type ProfileChangedEvent,
  type RunningConsumers,
} from '@app/messaging';

@Injectable()
export class ProfileEventsConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ProfileEventsConsumer.name);
  private running: RunningConsumers | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const url = readRabbitUrl((key) => this.config.get<string>(key));
    this.running = await startEventConsumers(url, [
      { queue: AUDIT_QUEUE, handle: (event) => this.audit(event) },
      { queue: NOTIFY_QUEUE, handle: (event) => this.notify(event) },
    ]);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.running?.close();
  }

  private audit(event: ProfileChangedEvent): Promise<void> {
    return this.auditLog.record(event);
  }

  private async notify(event: ProfileChangedEvent): Promise<void> {
    this.logger.log(`[notify] ${this.describe(event)}`);
  }

  private describe(event: ProfileChangedEvent): string {
    const fields = event.changes.map((change) => change.field).join(', ');
    return `event ${event.eventId}: employee ${event.employeeId} changed ${fields} (by ${event.changedBy.role})`;
  }
}
