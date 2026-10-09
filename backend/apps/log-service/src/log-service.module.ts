import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeClient } from '@app/clients';
import { AppConfigModule, readDatabaseConfig, toPostgresConnection } from '@app/config';
import { AdminNotificationState } from './admin-notification-state.entity.js';
import { AuditLogService } from './audit-log.service.js';
import { LogServiceController } from './log-service.controller.js';
import { NotificationController } from './notification.controller.js';
import { Notification } from './notification.entity.js';
import { NotificationService } from './notification.service.js';
import { ProfileChangeLog } from './profile-change-log.entity.js';
import { ProfileEventsConsumer } from './profile-events.consumer.js';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...toPostgresConnection(readDatabaseConfig((key) => config.get<string>(key), 'LOGS_DB')),
        entities: [ProfileChangeLog, Notification, AdminNotificationState],
        synchronize: false,
        migrationsRun: false,
        retryAttempts: 3,
        retryDelay: 2000,
      }),
    }),
    TypeOrmModule.forFeature([ProfileChangeLog, Notification, AdminNotificationState]),
  ],
  controllers: [LogServiceController, NotificationController],
  providers: [AuditLogService, NotificationService, EmployeeClient, ProfileEventsConsumer],
})
export class LogServiceModule {}
