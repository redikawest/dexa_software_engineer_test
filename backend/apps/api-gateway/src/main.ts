import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@app/config';
import { ApiGatewayModule } from './api-gateway.module.js';
import { configureApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  configureApp(app, config.get('CORS_ORIGINS', { infer: true }));
  await app.listen(config.get('GATEWAY_PORT', { infer: true }));
}
await bootstrap();
