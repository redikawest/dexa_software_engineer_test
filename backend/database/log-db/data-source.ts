import { readDatabaseConfig, toPostgresConnection } from '@app/config';
import { DataSource } from 'typeorm';

export const logMigrations = [];

export default new DataSource({
  ...toPostgresConnection(readDatabaseConfig((key) => process.env[key], 'LOGS_DB')),
  entities: [],
  migrations: logMigrations,
  synchronize: false,
});
