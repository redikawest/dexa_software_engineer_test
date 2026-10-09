import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule, readDatabaseConfig, toPostgresConnection } from '@app/config';
import { AuditLogService } from './audit-log.service.js';
import { LogServiceController } from './log-service.controller.js';
import { ProfileChangeLog } from './profile-change-log.entity.js';
import { ProfileEventsConsumer } from './profile-events.consumer.js';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...toPostgresConnection(readDatabaseConfig((key) => config.get<string>(key), 'LOGS_DB')),
        entities: [ProfileChangeLog],
        synchronize: false,
        migrationsRun: false,
        retryAttempts: 3,
        retryDelay: 2000,
      }),
    }),
    TypeOrmModule.forFeature([ProfileChangeLog]),
  ],
  controllers: [LogServiceController],
  providers: [AuditLogService, ProfileEventsConsumer],
})
export class LogServiceModule {}
