import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeServiceController } from './employee-service.controller.js';
import { EmployeeServiceService } from './employee-service.service.js';

describe('EmployeeServiceController', () => {
  let employeeServiceController: EmployeeServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeServiceController],
      providers: [EmployeeServiceService],
    }).compile();

    employeeServiceController = app.get<EmployeeServiceController>(EmployeeServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(employeeServiceController.getHello()).toBe('Hello World!');
    });
  });
});
