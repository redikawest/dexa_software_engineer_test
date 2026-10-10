import { NestFactory } from '@nestjs/core';
import { EmployeeServiceModule } from './employee-service.module.js';
import { configureApp } from './setup-app.js';
import type { Env } from '@app/config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(EmployeeServiceModule);

  configureApp(app);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('EMPLOYEE_SERVICE_PORT', { infer: true }));
}
await bootstrap();
