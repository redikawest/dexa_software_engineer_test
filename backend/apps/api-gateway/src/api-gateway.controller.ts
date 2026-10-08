import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service.js';
import { CurrentUser, type AuthUser } from './auth/auth-user.js';
import { Public, Roles } from './auth/decorators.js';

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

  @Patch('auth/password')
  changePassword(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.apiGatewayService.changePassword(user, body);
  }

  @Get('employee/me')
  getEmployeeMe(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.getEmployeeMe(user);
  }

  @Patch('employee/me')
  updateEmployeeMe(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.apiGatewayService.updateEmployeeMe(user, body);
  }

  @Roles('HR_ADMIN')
  @Get('admin/employees')
  listEmployees(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.apiGatewayService.listEmployees(user, { page, pageSize, search });
  }

  @Roles('HR_ADMIN')
  @Post('admin/employees')
  createEmployee(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.apiGatewayService.createEmployee(user, body);
  }

  @Roles('HR_ADMIN')
  @Patch('admin/employees/:id')
  updateEmployee(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.apiGatewayService.updateEmployee(user, id, body);
  }

  @Roles('HR_ADMIN')
  @Get('admin/employees/:id')
  getEmployee(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.apiGatewayService.getEmployee(user, id);
  }

  @Roles('HR_ADMIN')
  @Get('admin/attendance')
  listAllAttendance(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.apiGatewayService.listAllAttendance(user, { from, to, employeeId, page, pageSize });
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
