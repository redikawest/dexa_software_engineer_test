import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@app/config';
import { ApiGatewayController } from './api-gateway.controller.js';
import { ApiGatewayService } from './api-gateway.service.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { RolesGuard } from './auth/roles.guard.js';

@Module({
  imports: [
    AppConfigModule,
    // Only used to verify tokens. The key and rules are passed per call in JwtAuthGuard.
    JwtModule.register({}),
  ],
  controllers: [ApiGatewayController],
  providers: [
    ApiGatewayService,
    // Registered globally: every route needs a valid token unless it is marked @Public().
    // The order matters: first "who are you?", then "are you allowed?".
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class ApiGatewayModule {}
