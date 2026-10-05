import { NestFactory } from '@nestjs/core';
import { AttendanceServiceModule } from './attendance-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AttendanceServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
