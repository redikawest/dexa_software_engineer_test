import { Controller, Get, Post } from '@nestjs/common';
import { CallerId } from '@app/config';
import { AttendanceServiceService } from './attendance-service.service.js';

@Controller()
export class AttendanceServiceController {
  constructor(private readonly attendanceServiceService: AttendanceServiceService) {}

  @Get()
  getHello(): string {
    return this.attendanceServiceService.getHello();
  }

  @Post('attendance/clock-in')
  clockIn(@CallerId() employeeId: string) {
    return this.attendanceServiceService.clockIn(employeeId);
  }

  @Post('attendance/clock-out')
  clockOut(@CallerId() employeeId: string) {
    return this.attendanceServiceService.clockOut(employeeId);
  }
}
