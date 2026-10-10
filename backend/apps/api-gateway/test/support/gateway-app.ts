import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../../src/setup-app.js';
import { FakeService } from './fake-service.js';
import type { ServiceName } from './routes.js';
import { AUDIENCE, ISSUER, TokenFactory, createKeyPair } from './tokens.js';

export const ALLOWED_ORIGIN = 'http://localhost:5173';

export interface TestGateway {
  app: INestApplication<App>;
  http: ReturnType<typeof request>;
  services: Record<ServiceName, FakeService>;
  /** Tokens that are signed with the key the gateway trusts. */
  tokens: TokenFactory;
  /** Makes tokens with a key the gateway does not trust. */
  strangerTokens: TokenFactory;
  /** What the services received, all together. */
  resetServices(): void;
  stop(): Promise<void>;
}

const ENV_KEYS = ['AUTH_SERVICE_URL', 'EMPLOYEE_SERVICE_URL', 'ATTENDANCE_SERVICE_URL', 'LOG_SERVICE_URL', 'JWT_PUBLIC_KEY_PATH', 'JWT_ISSUER', 'JWT_AUDIENCE', 'CORS_ORIGINS'];

/**
 * The real gateway, with fake services behind it and its own key pair for the tokens.
 * Nothing here depends on the development database, the development keys or the other containers.
 */
export async function startGateway(): Promise<TestGateway> {
  const services = { auth: new FakeService(), employee: new FakeService(), attendance: new FakeService(), log: new FakeService() };
  await Promise.all(Object.values(services).map((service) => service.start()));

  const trusted = createKeyPair();
  const stranger = createKeyPair();
  const keyDirectory = mkdtempSync(join(tmpdir(), 'gateway-test-'));
  const publicKeyPath = join(keyDirectory, 'public.pem');
  writeFileSync(publicKeyPath, trusted.publicKey);

  const previousEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    AUTH_SERVICE_URL: services.auth.url,
    EMPLOYEE_SERVICE_URL: services.employee.url,
    ATTENDANCE_SERVICE_URL: services.attendance.url,
    LOG_SERVICE_URL: services.log.url,
    JWT_PUBLIC_KEY_PATH: publicKeyPath,
    JWT_ISSUER: ISSUER,
    JWT_AUDIENCE: AUDIENCE,
    CORS_ORIGINS: ALLOWED_ORIGIN,
  });

  // Imported only now: the module reads its configuration at the moment it is imported, so the values above must be in place first.
  const { ApiGatewayModule } = await import('../../src/api-gateway.module.js');
  const moduleRef = await Test.createTestingModule({ imports: [ApiGatewayModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app, [ALLOWED_ORIGIN]);
  await app.init();

  return {
    app,
    http: request(app.getHttpServer()),
    services,
    tokens: new TokenFactory(trusted.privateKey, trusted.publicKey),
    strangerTokens: new TokenFactory(stranger.privateKey, stranger.publicKey),
    resetServices: () => Object.values(services).forEach((service) => service.reset()),
    stop: async () => {
      await app.close();
      await Promise.all(Object.values(services).map((service) => service.stop()));
      rmSync(keyDirectory, { recursive: true, force: true });
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    },
  };
}
