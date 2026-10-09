import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Env } from '@app/config';
import { ApiGatewayModule } from './api-gateway.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('WFH Attendance API').setVersion('1.0').addBearerAuth().build(),
    { autoTagControllers: false },
  );
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.get('GATEWAY_PORT', { infer: true }));
}
await bootstrap();
