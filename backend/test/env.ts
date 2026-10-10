export const TEST_DB_NAME = 'dexa_test';

export function loadTestEnv(): void {
  try {
    process.loadEnvFile('.env');
  } catch {
   
  }
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = TEST_DB_NAME;
}
