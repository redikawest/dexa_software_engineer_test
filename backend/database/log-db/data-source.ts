import { readDatabaseConfig, toPostgresConnection } from '@app/config';
import { DataSource } from 'typeorm';
import { ProfileChangeLog } from '../../apps/log-service/src/profile-change-log.entity.js';
import { CreateProfileChangeLogsTable1791500000000 } from './migrations/1791500000000-CreateProfileChangeLogsTable.js';

export const entities = [ProfileChangeLog];
export const logMigrations = [CreateProfileChangeLogsTable1791500000000];

export default new DataSource({
  ...toPostgresConnection(readDatabaseConfig((key) => process.env[key], 'LOGS_DB')),
  entities,
  migrations: logMigrations,
  synchronize: false,
});
