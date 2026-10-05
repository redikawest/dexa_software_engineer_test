import { Controller, Get } from '@nestjs/common';
import { AttendanceServiceService } from './attendance-service.service.js';

@Controller()
export class AttendanceServiceController {
  constructor(private readonly attendanceServiceService: AttendanceServiceService) {}

  @Get()
  getHello(): string {
    return this.attendanceServiceService.getHello();
  }
}
