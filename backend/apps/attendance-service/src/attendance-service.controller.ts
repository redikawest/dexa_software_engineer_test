import { Controller, Get, Post, Query } from '@nestjs/common';
import { CallerId } from '@app/config';
import { parseAdminAttendanceQuery } from './admin-attendance-query.js';
import { parseDateRange } from './date-range.js';
import { AttendanceServiceService } from './attendance-service.service.js';

@Controller()
export class AttendanceServiceController {
  constructor(private readonly attendanceServiceService: AttendanceServiceService) {}

  @Get()
  getHello(): string {
    return this.attendanceServiceService.getHello();
  }

  @Get('attendance/today')
  getToday(@CallerId() employeeId: string) {
    return this.attendanceServiceService.getToday(employeeId);
  }

  @Get('attendance/summary')
  getSummary(@CallerId() employeeId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.attendanceServiceService.getSummary(employeeId, parseDateRange(from, to));
  }

  @Get('attendance')
  listAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.attendanceServiceService.listAll(parseAdminAttendanceQuery({ from, to, employeeId, page, pageSize }));
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
