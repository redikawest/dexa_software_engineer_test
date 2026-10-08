import { readFileSync } from 'node:fs';

export const JWT_ALGORITHM = 'RS256';

interface JwtClaimsConfig {
  issuer: string;
  audience: string;
}

export interface JwtSigningConfig extends JwtClaimsConfig {
  privateKey: string;
  expiresInSeconds: number;
}

export interface JwtVerifyConfig extends JwtClaimsConfig {
  publicKey: string;
}

type Get = (key: string) => string | undefined;

function readClaims(get: Get): JwtClaimsConfig {
  return {
    issuer: get('JWT_ISSUER')?.trim() || 'dexa-auth',
    audience: get('JWT_AUDIENCE')?.trim() || 'dexa-api',
  };
}

function readPem(get: Get, key: string, header: string, errors: string[]): string {
  const path = get(key)?.trim();
  if (!path) {
    errors.push(`${key} is required (path to a PEM file, create the pair with: npm run keys:generate)`);
    return '';
  }
  try {
    const pem = readFileSync(path, 'utf8');
    if (!pem.includes(header)) errors.push(`${key}: ${path} is not a "${header}" PEM file`);
    return pem;
  } catch {
    errors.push(`${key}: cannot read file "${path}"`);
    return '';
  }
}

function fail(errors: string[]): never {
  throw new Error(
    `Invalid JWT configuration:\n - ${errors.join('\n - ')}\n` +
      'Add the JWT_* values to backend/.env (see backend/.env.example).',
  );
}

/**
 * Auth-service only. It holds the private key, so it is the only service that can create tokens.
 */
export function readJwtSigningConfig(get: Get): JwtSigningConfig {
  const errors: string[] = [];
  const privateKey = readPem(get, 'JWT_PRIVATE_KEY_PATH', 'PRIVATE KEY', errors);

  const rawExpiry = get('JWT_EXPIRES_IN_SECONDS')?.trim();
  const expiresInSeconds = rawExpiry ? Number(rawExpiry) : 3600;
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1) {
    errors.push(`JWT_EXPIRES_IN_SECONDS must be a positive whole number (got "${rawExpiry}")`);
  }

  if (errors.length > 0) fail(errors);
  return { privateKey, expiresInSeconds, ...readClaims(get) };
}

/**
 * Gateway only. A public key can check a token but can never create one.
 */
export function readJwtVerifyConfig(get: Get): JwtVerifyConfig {
  const errors: string[] = [];
  const publicKey = readPem(get, 'JWT_PUBLIC_KEY_PATH', 'PUBLIC KEY', errors);
  if (errors.length > 0) fail(errors);
  return { publicKey, ...readClaims(get) };
}
