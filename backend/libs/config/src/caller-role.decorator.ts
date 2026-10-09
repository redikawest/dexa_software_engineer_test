import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ROLES, USER_ROLE_HEADER, type Role } from './auth-context.js';

export const CallerRole = createParamDecorator((_data: unknown, context: ExecutionContext): Role => {
  const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
  const role = request.headers[USER_ROLE_HEADER];
  if (!ROLES.includes(role as Role)) throw new UnauthorizedException('Missing caller role');
  return role as Role;
});
