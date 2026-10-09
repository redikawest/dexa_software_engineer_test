import { readDatabaseConfig, toPostgresConnection } from '@app/config';
import { DataSource } from 'typeorm';
import { AdminNotificationState } from '../../apps/log-service/src/admin-notification-state.entity.js';
import { Notification } from '../../apps/log-service/src/notification.entity.js';
import { ProfileChangeLog } from '../../apps/log-service/src/profile-change-log.entity.js';
import { CreateProfileChangeLogsTable1791500000000 } from './migrations/1791500000000-CreateProfileChangeLogsTable.js';
import { CreateNotificationTables1791500100000 } from './migrations/1791500100000-CreateNotificationTables.js';

export const entities = [ProfileChangeLog, Notification, AdminNotificationState];
export const logMigrations = [CreateProfileChangeLogsTable1791500000000, CreateNotificationTables1791500100000];

export default new DataSource({
  ...toPostgresConnection(readDatabaseConfig((key) => process.env[key], 'LOGS_DB')),
  entities,
  migrations: logMigrations,
  synchronize: false,
});
