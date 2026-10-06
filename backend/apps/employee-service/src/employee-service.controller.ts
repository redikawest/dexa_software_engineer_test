import { Controller, Get } from '@nestjs/common';
import { EmployeeServiceService } from './employee-service.service.js';

@Controller()
export class EmployeeServiceController {
  constructor(private readonly employeeServiceService: EmployeeServiceService) {}

  @Get()
  getHello(): string {
    return this.employeeServiceService.getHello();
  }

  @Get('employee/me')
  getMe() {
    return this.employeeServiceService.getMe();
  }
}
