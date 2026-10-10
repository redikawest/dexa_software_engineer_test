import { Controller, Get, Post, Query } from '@nestjs/common';
import { CallerId } from '@app/config';
import { toAdminAttendanceQuery } from './admin-attendance-query.js';
import { resolveDateRange } from './date-range.js';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto.js';
import { DateRangeQueryDto } from './dto/date-range-query.dto.js';
import { AttendanceServiceService } from './attendance-service.service.js';

@Controller()
export class AttendanceServiceController {
  constructor(private readonly attendanceServiceService: AttendanceServiceService) {}

  @Get('attendance/today')
  getToday(@CallerId() employeeId: string) {
    return this.attendanceServiceService.getToday(employeeId);
  }

  @Get('attendance/summary')
  getSummary(@CallerId() employeeId: string, @Query() query: DateRangeQueryDto) {
    return this.attendanceServiceService.getSummary(employeeId, resolveDateRange(query));
  }

  @Get('attendance')
  listAll(@Query() query: AdminAttendanceQueryDto) {
    return this.attendanceServiceService.listAll(toAdminAttendanceQuery(query));
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
