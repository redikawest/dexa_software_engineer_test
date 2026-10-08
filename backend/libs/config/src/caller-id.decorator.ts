import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { USER_ID_HEADER } from './auth-context.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CallerId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
  const id = request.headers[USER_ID_HEADER];
  if (!id || !UUID.test(id)) throw new UnauthorizedException('Missing caller identity');
  return id;
});
