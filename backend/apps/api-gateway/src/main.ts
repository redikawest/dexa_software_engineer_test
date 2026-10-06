import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@app/config';
import { ApiGatewayModule } from './api-gateway.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('GATEWAY_PORT', { infer: true }));
}
await bootstrap();
