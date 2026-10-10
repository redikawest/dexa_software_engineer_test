import { readDatabaseConfig, toPostgresConnection } from '@app/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../database/data-source-options.js';
import { TEST_DB_NAME, loadTestEnv } from './env.js';

async function withAdminConnection(run: (admin: DataSource) => Promise<void>): Promise<void> {
  const config = readDatabaseConfig((key) => process.env[key]);
  const admin = new DataSource({ ...toPostgresConnection(config), database: 'postgres' });
  await admin.initialize();
  try {
    await run(admin);
  } finally {
    await admin.destroy();
  }
}

export default async function setup(): Promise<() => Promise<void>> {
  loadTestEnv();

  await withAdminConnection(async (admin) => {
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  });

  const schema = new DataSource(buildDataSourceOptions(readDatabaseConfig((key) => process.env[key])));
  await schema.initialize();
  await schema.runMigrations();
  await schema.destroy();

  return async () => {
    await withAdminConnection(async (admin) => {
      await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
    });
  };
}
