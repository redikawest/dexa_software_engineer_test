import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@app/config';
import { LogServiceModule } from './log-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(LogServiceModule);
  app.enableShutdownHooks();
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('LOG_SERVICE_PORT', { infer: true }));
}
await bootstrap();
