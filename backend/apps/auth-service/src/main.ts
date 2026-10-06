import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@app/config';
import { AuthServiceModule } from './auth-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('AUTH_SERVICE_PORT', { infer: true }));
}
await bootstrap();
