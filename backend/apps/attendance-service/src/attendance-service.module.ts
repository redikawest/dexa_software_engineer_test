import { Module } from '@nestjs/common';
import { AttendanceServiceController } from './attendance-service.controller.js';
import { AttendanceServiceService } from './attendance-service.service.js';

@Module({
  imports: [],
  controllers: [AttendanceServiceController],
  providers: [AttendanceServiceService],
})
export class AttendanceServiceModule {}
