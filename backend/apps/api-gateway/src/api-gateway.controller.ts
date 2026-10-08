import { Body, Controller, Get, HttpCode, Patch, Post, Query } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service.js';
import { CurrentUser, type AuthUser } from './auth/auth-user.js';
import { Public } from './auth/decorators.js';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    return this.apiGatewayService.login(body);
  }

  @Get('employee/me')
  getEmployeeMe(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.getEmployeeMe(user);
  }

  @Get('attendance/today')
  getAttendanceToday(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.getAttendanceToday(user);
  }

  @Get('attendance/summary')
  getAttendanceSummary(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.apiGatewayService.getAttendanceSummary(user, from, to);
  }

  @Post('attendance/clock-in')
  clockIn(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.clockIn(user);
  }

  @Post('attendance/clock-out')
  clockOut(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.clockOut(user);
  }
}
