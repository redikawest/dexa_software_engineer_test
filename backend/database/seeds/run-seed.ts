import { hash } from 'bcryptjs';
import { DataSource } from 'typeorm';
import { readDatabaseConfig } from '@app/config';
import { buildDataSourceOptions } from '../data-source-options.js';
import { seedPeople } from './seed-data.js';

// Run with: npm run seed
// Inserts the people from seed-data.ts. Safe to run again: rows that already exist are skipped,
// so nothing is duplicated and existing passwords are never overwritten.

const BCRYPT_COST = 10;
const MIN_PASSWORD_LENGTH = 8;

function readPassword(key: string): string {
  const value = process.env[key];
  if (!value || value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${key} must be set in backend/.env (at least ${MIN_PASSWORD_LENGTH} characters).`);
  }
  return value;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed development data when NODE_ENV=production.');
  }

  const adminPasswordHash = await hash(readPassword('SEED_ADMIN_PASSWORD'), BCRYPT_COST);
  const employeePasswordHash = await hash(readPassword('SEED_EMPLOYEE_PASSWORD'), BCRYPT_COST);

  const dataSource = new DataSource(buildDataSourceOptions(readDatabaseConfig((key) => process.env[key])));
  await dataSource.initialize();

  try {
    let created = 0;
    let skipped = 0;

    await dataSource.transaction(async (manager) => {
      for (const person of seedPeople) {
        const employee = await manager.query(
          `INSERT INTO "employees" ("id", "email", "full_name", "position", "phone", "created_by")
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING
           RETURNING "id"`,
          [person.id, person.email, person.fullName, person.position, person.phone, person.createdBy],
        );
        const login = await manager.query(
          `INSERT INTO "employee_logins" ("id", "email", "password_hash", "role")
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING
           RETURNING "id"`,
          [person.id, person.email, person.role === 'HR_ADMIN' ? adminPasswordHash : employeePasswordHash, person.role],
        );

        const inserted = employee.length > 0 || login.length > 0;
        if (inserted) created += 1;
        else skipped += 1;
        console.log(`${inserted ? 'created' : 'exists '}  ${person.role.padEnd(8)}  ${person.email}`);
      }
    });

    console.log(`\nDone: ${created} created, ${skipped} already existed.`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  if ((error as { code?: string }).code === '42P01') {
    console.error('The tables do not exist yet. Run `npm run migration:run` first.');
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});
