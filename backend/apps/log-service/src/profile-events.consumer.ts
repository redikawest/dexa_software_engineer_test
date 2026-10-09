import { Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AUDIT_QUEUE,
  NOTIFY_QUEUE,
  readRabbitUrl,
  startEventConsumers,
  type RunningConsumers,
} from '@app/messaging';
import { AuditLogService } from './audit-log.service.js';
import { NotificationService } from './notification.service.js';

@Injectable()
export class ProfileEventsConsumer implements OnApplicationBootstrap, OnApplicationShutdown {
  private running: RunningConsumers | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const url = readRabbitUrl((key) => this.config.get<string>(key));
    this.running = await startEventConsumers(url, [
      { queue: AUDIT_QUEUE, handle: (event) => this.auditLog.record(event) },
      { queue: NOTIFY_QUEUE, handle: (event) => this.notifications.createFromEvent(event) },
    ]);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.running?.close();
  }
}
