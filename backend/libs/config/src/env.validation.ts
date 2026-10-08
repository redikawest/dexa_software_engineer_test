export interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  GATEWAY_PORT: number;
  AUTH_SERVICE_PORT: number;
  EMPLOYEE_SERVICE_PORT: number;
  ATTENDANCE_SERVICE_PORT: number;
  AUTH_SERVICE_URL: string;
  EMPLOYEE_SERVICE_URL: string;
  ATTENDANCE_SERVICE_URL: string;
}

type RawEnv = Record<string, unknown>;

function readString(raw: RawEnv, key: string, errors: string[], fallback?: string): string {
  const value = raw[key];
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (fallback !== undefined) return fallback;
  errors.push(`${key} is required`);
  return '';
}

function readPort(raw: RawEnv, key: string, errors: string[], fallback?: number): number {
  const value = raw[key];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    errors.push(`${key} is required`);
    return 0;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push(`${key} must be a port number between 1 and 65535 (got "${String(value)}")`);
    return 0;
  }
  return port;
}

function readUrl(raw: RawEnv, key: string, errors: string[], fallback: string): string {
  const value = readString(raw, key, errors, fallback);
  try {
    new URL(value);
  } catch {
    errors.push(`${key} must be a valid URL (got "${value}")`);
  }
  return value.replace(/\/+$/, '');
}

export function validateEnv(raw: RawEnv): Env {
  const errors: string[] = [];

  const nodeEnv = readString(raw, 'NODE_ENV', errors, 'development');
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push(`NODE_ENV must be development, production, or test (got "${nodeEnv}")`);
  }

  const env: Env = {
    NODE_ENV: nodeEnv as Env['NODE_ENV'],

    GATEWAY_PORT: readPort(raw, 'GATEWAY_PORT', errors, 3000),
    AUTH_SERVICE_PORT: readPort(raw, 'AUTH_SERVICE_PORT', errors, 3001),
    EMPLOYEE_SERVICE_PORT: readPort(raw, 'EMPLOYEE_SERVICE_PORT', errors, 3002),
    ATTENDANCE_SERVICE_PORT: readPort(raw, 'ATTENDANCE_SERVICE_PORT', errors, 3003),

    AUTH_SERVICE_URL: readUrl(raw, 'AUTH_SERVICE_URL', errors, 'http://localhost:3001'),
    EMPLOYEE_SERVICE_URL: readUrl(raw, 'EMPLOYEE_SERVICE_URL', errors, 'http://localhost:3002'),
    ATTENDANCE_SERVICE_URL: readUrl(raw, 'ATTENDANCE_SERVICE_URL', errors, 'http://localhost:3003'),
  };

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n - ${errors.join('\n - ')}\n` +
        'Copy backend/.env.example to backend/.env and adjust the values.',
    );
  }
  
  return { ...raw, ...env } as Env;
}
