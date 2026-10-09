import { readDatabaseConfig } from '@app/config';
import pg from 'pg';

async function main() {
  const admin = readDatabaseConfig((key) => process.env[key]);
  const logs = readDatabaseConfig((key) => process.env[key], 'LOGS_DB');

  if (logs.database === admin.database) throw new Error('LOGS_DB_NAME must differ from DB_NAME.');
  if (logs.username === admin.username) throw new Error('LOGS_DB_USER must differ from DB_USER.');

  const client = new pg.Client({
    host: admin.host,
    port: admin.port,
    user: admin.username,
    password: admin.password,
    database: admin.database,
  });
  await client.connect();

  try {
    const role = client.escapeIdentifier(logs.username);
    const password = client.escapeLiteral(logs.password);

    const roleExists = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [logs.username]);
    if (roleExists.rowCount === 0) {
      await client.query(`CREATE ROLE ${role} LOGIN PASSWORD ${password}`);
      console.log(`Created role ${logs.username}`);
    } else {
      await client.query(`ALTER ROLE ${role} LOGIN PASSWORD ${password}`);
      console.log(`Role ${logs.username} already exists`);
    }

    const databaseExists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [logs.database]);
    if (databaseExists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${client.escapeIdentifier(logs.database)} OWNER ${role}`);
      console.log(`Created database ${logs.database}`);
    } else {
      console.log(`Database ${logs.database} already exists`);
    }
  } finally {
    await client.end();
  }
}

await main();
