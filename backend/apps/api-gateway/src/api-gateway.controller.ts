import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service.js';
import { CurrentUser, type AuthUser } from './auth/auth-user.js';
import { Public, Roles } from './auth/decorators.js';
import { CreateEmployeeDocs, GetEmployeeDocs, ListEmployeesDocs, UpdateEmployeeDocs } from './docs/admin-employee.docs.js';
import {
  ClockInDocs,
  ClockOutDocs,
  GetSummaryDocs,
  GetTodayDocs,
  ListAllAttendanceDocs,
} from './docs/attendance.docs.js';
import { ChangePasswordDocs, LoginDocs } from './docs/auth.docs.js';
import { GetMyProfileDocs, UpdateMyProfileDocs } from './docs/employee.docs.js';
import { HealthDocs } from './docs/health.docs.js';
import { ListNotificationsDocs, MarkNotificationsSeenDocs } from './docs/notification.docs.js';
import { ChangePasswordBody, LoginBody } from './types/auth.js';
import { CreateEmployeeBody, UpdateEmployeeBody, UpdateMyProfileBody } from './types/employee.js';
import { MarkSeenBody } from './types/notification.js';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @HealthDocs()
  @Public()
  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @LoginDocs()
  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() body: LoginBody) {
    return this.apiGatewayService.login(body);
  }

  @ChangePasswordDocs()
  @Patch('auth/password')
  changePassword(@CurrentUser() user: AuthUser, @Body() body: ChangePasswordBody) {
    return this.apiGatewayService.changePassword(user, body);
  }

  @GetMyProfileDocs()
  @Get('employee/me')
  getEmployeeMe(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.getEmployeeMe(user);
  }

  @UpdateMyProfileDocs()
  @Patch('employee/me')
  updateEmployeeMe(@CurrentUser() user: AuthUser, @Body() body: UpdateMyProfileBody) {
    return this.apiGatewayService.updateEmployeeMe(user, body);
  }

  @ListEmployeesDocs()
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

  @CreateEmployeeDocs()
  @Roles('HR_ADMIN')
  @Post('admin/employees')
  createEmployee(@CurrentUser() user: AuthUser, @Body() body: CreateEmployeeBody) {
    return this.apiGatewayService.createEmployee(user, body);
  }

  @UpdateEmployeeDocs()
  @Roles('HR_ADMIN')
  @Patch('admin/employees/:id')
  updateEmployee(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateEmployeeBody) {
    return this.apiGatewayService.updateEmployee(user, id, body);
  }

  @GetEmployeeDocs()
  @Roles('HR_ADMIN')
  @Get('admin/employees/:id')
  getEmployee(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.apiGatewayService.getEmployee(user, id);
  }

  @ListNotificationsDocs()
  @Roles('HR_ADMIN')
  @Get('admin/notifications')
  listNotifications(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    return this.apiGatewayService.listNotifications(user, limit);
  }

  @MarkNotificationsSeenDocs()
  @Roles('HR_ADMIN')
  @Post('admin/notifications/seen')
  @HttpCode(200)
  markNotificationsSeen(@CurrentUser() user: AuthUser, @Body() body: MarkSeenBody) {
    return this.apiGatewayService.markNotificationsSeen(user, body);
  }

  @ListAllAttendanceDocs()
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

  @GetTodayDocs()
  @Get('attendance/today')
  getAttendanceToday(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.getAttendanceToday(user);
  }

  @GetSummaryDocs()
  @Get('attendance/summary')
  getAttendanceSummary(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.apiGatewayService.getAttendanceSummary(user, from, to);
  }

  @ClockInDocs()
  @Post('attendance/clock-in')
  clockIn(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.clockIn(user);
  }

  @ClockOutDocs()
  @Post('attendance/clock-out')
  clockOut(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.clockOut(user);
  }
}
