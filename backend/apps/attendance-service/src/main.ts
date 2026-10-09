import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@app/config';
import { AttendanceServiceModule } from './attendance-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AttendanceServiceModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true }));
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('ATTENDANCE_SERVICE_PORT', { infer: true }));
}
await bootstrap();
