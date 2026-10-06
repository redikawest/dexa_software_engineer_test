import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { AttendanceServiceController } from './attendance-service.controller.js';
import { AttendanceServiceService } from './attendance-service.service.js';

@Module({
  imports: [
    AppConfigModule,
  ],
  controllers: [AttendanceServiceController],
  providers: [AttendanceServiceService],
})
export class AttendanceServiceModule {}
