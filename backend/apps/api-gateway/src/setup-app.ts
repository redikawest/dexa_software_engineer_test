import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Shared by main.ts and the tests, so the tests run the app the way it really runs. */
export function configureApp(app: INestApplication, corsOrigins: string[]): void {
  app.enableCors({
    origin: corsOrigins,
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
}
