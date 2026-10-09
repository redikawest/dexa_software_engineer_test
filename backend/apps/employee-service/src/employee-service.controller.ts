import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CallerId, CallerRole, type Role } from '@app/config';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { FindSummariesQueryDto } from './dto/find-summaries-query.dto.js';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
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
  updateMe(@CallerId() id: string, @CallerRole() role: Role, @Body() body: UpdateProfileDto) {
    return this.employeeServiceService.updateMe(id, role, body);
  }

  @Get('employees')
  list(@Query() query: ListEmployeesQueryDto) {
    return this.employeeServiceService.list(query);
  }

  @Post('employees')
  create(@CallerId() adminId: string, @Body() body: CreateEmployeeDto) {
    return this.employeeServiceService.create(adminId, body);
  }

  @Get('internal/employees')
  findSummaries(@Query() { ids }: FindSummariesQueryDto) {
    return this.employeeServiceService.findSummaries(ids);
  }

  @Get('employees/:id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.employeeServiceService.getById(id);
  }

  @Patch('employees/:id')
  update(
    @CallerId() adminId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateEmployeeDto,
  ) {
    return this.employeeServiceService.update(adminId, id, body);
  }
}
