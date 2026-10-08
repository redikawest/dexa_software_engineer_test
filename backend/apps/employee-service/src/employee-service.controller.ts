import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CallerId } from '@app/config';
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
}
