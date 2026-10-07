export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  logging: boolean;
}

export function readDatabaseConfig(get: (key: string) => string | undefined): DatabaseConfig {
  const errors: string[] = [];
  const required = (key: string) => {
    const value = get(key)?.trim();
    if (!value) errors.push(`${key} is required`);
    return value ?? '';
  };

  const port = Number(required('DB_PORT'));
  if (get('DB_PORT') && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    errors.push(`DB_PORT must be a port number between 1 and 65535 (got "${get('DB_PORT')}")`);
  }

  const config: DatabaseConfig = {
    host: required('DB_HOST'),
    port,
    username: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    logging: get('DB_LOGGING') === 'true',
  };

  if (errors.length > 0) {
    throw new Error(
      `Invalid database configuration:\n - ${errors.join('\n - ')}\n` +
        'Add the DB_* values to backend/.env (see backend/.env.example).',
    );
  }
  return config;
}

export function toPostgresConnection(config: DatabaseConfig) {
  return {
    type: 'postgres' as const,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    logging: config.logging,
  };
}
