import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { EmployeeServiceController } from './employee-service.controller.js';
import { EmployeeServiceService } from './employee-service.service.js';

@Module({
  imports: [AppConfigModule],
  controllers: [EmployeeServiceController],
  providers: [EmployeeServiceService],
})
export class EmployeeServiceModule {}
