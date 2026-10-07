import type { DataSourceOptions } from 'typeorm';
import { EmployeeLogin } from '../apps/auth-service/src/employee-login.entity.js';
import { Employee } from '../apps/employee-service/src/employee.entity.js';
import { toPostgresConnection, type DatabaseConfig } from '@app/config';
import { CreateEmployeesTable1791273026088 } from './migrations/1791273026088-CreateEmployeesTable.js';
import { CreateEmployeeLoginsTable1791273600000 } from './migrations/1791273600000-CreateEmployeeLoginsTable.js';
import { CreateAttendanceRecordsTable1791273660000 } from './migrations/1791273660000-CreateAttendanceRecordsTable.js';

export const entities = [Employee, EmployeeLogin];
export const migrations = [
  CreateEmployeesTable1791273026088,
  CreateEmployeeLoginsTable1791273600000,
  CreateAttendanceRecordsTable1791273660000,
];

type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

export function buildDataSourceOptions(config: DatabaseConfig): PostgresOptions {
  return {
    ...toPostgresConnection(config),
    entities,
    migrations,
    synchronize: false,
  };
}
