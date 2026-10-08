import { Controller, Get } from '@nestjs/common';
import { CallerId } from '@app/config';
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
}
