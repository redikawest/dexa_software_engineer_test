import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CallerId } from '@app/config';
import { parseNewEmployee } from './new-employee.js';
import { parseEmployeeListQuery } from './employee-list-query.js';
import { parseProfileUpdate } from './profile-update.js';
import { EmployeeServiceService } from './employee-service.service.js';

@Controller()
export class EmployeeServiceController {
  constructor(private readonly employeeServiceService: EmployeeServiceService) {}

  @Get()
  getHello(): string {
    return this.employeeServiceService.getHello();
  }

  @Get('employee/me')
  getMe(@CallerId() id: string) {
    return this.employeeServiceService.getMe(id);
  }

  @Patch('employee/me')
  updateMe(@CallerId() id: string, @Body() body: unknown) {
    return this.employeeServiceService.updateMe(id, parseProfileUpdate(body));
  }

  @Get('employees')
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string) {
    return this.employeeServiceService.list(parseEmployeeListQuery(page, pageSize, search));
  }

  @Post('employees')
  create(@CallerId() adminId: string, @Body() body: unknown) {
    return this.employeeServiceService.create(adminId, parseNewEmployee(body));
  }

  @Get('employees/:id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.employeeServiceService.getById(id);
  }
}
