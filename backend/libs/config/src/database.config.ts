export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  logging: boolean;
}

export function readDatabaseConfig(get: (key: string) => string | undefined, prefix = 'DB'): DatabaseConfig {
  const errors: string[] = [];
  const required = (key: string) => {
    const value = get(key)?.trim();
    if (!value) errors.push(`${key} is required`);
    return value ?? '';
  };

  const port = Number(required(`${prefix}_PORT`));
  if (get(`${prefix}_PORT`) && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    errors.push(`${prefix}_PORT must be a port number between 1 and 65535 (got "${get(`${prefix}_PORT`)}")`);
  }

  const config: DatabaseConfig = {
    host: required(`${prefix}_HOST`),
    port,
    username: required(`${prefix}_USER`),
    password: required(`${prefix}_PASSWORD`),
    database: required(`${prefix}_NAME`),
    logging: get(`${prefix}_LOGGING`) === 'true',
  };

  if (errors.length > 0) {
    throw new Error(
      `Invalid database configuration:\n - ${errors.join('\n - ')}\n` +
        `Add the ${prefix}_* values to backend/.env (see backend/.env.example).`,
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
