import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService, type JwtVerifyOptions } from '@nestjs/jwt';
import { JWT_ALGORITHM, ROLES, readJwtVerifyConfig, type Role } from '@app/config';
import type { AuthenticatedRequest } from './auth-user.js';
import { IS_PUBLIC_KEY } from './decorators.js';

interface TokenPayload {
  sub?: unknown;
  role?: unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly verifyOptions: JwtVerifyOptions;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    const { publicKey, issuer, audience } = readJwtVerifyConfig((key) => config.get<string>(key));
    this.verifyOptions = { publicKey, algorithms: [JWT_ALGORITHM], issuer, audience };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readBearerToken(request.headers.authorization);

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token, this.verifyOptions);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (typeof payload.sub !== 'string' || !UUID.test(payload.sub) || !ROLES.includes(payload.role as Role)) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = { id: payload.sub, role: payload.role as Role };
    return true;
  }

  private readBearerToken(header: string | undefined): string {
    const [scheme, token] = header?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return token;
  }
}
