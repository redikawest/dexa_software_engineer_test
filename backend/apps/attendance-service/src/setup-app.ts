import { ValidationPipe, type INestApplication, type ValidationPipeOptions } from '@nestjs/common';

export const validationOptions: ValidationPipeOptions = { whitelist: true, transform: true, stopAtFirstError: true };

/** Shared by main.ts and the tests, so the tests run the app the way it really runs. */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe(validationOptions));
}
