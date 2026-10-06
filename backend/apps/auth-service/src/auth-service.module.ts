import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { AuthServiceController } from './auth-service.controller.js';
import { AuthServiceService } from './auth-service.service.js';

@Module({
  imports: [
    AppConfigModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
