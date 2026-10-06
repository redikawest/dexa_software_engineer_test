import { Injectable } from '@nestjs/common';

@Injectable()
export class EmployeeServiceService {
  getHello(): string {
    return 'Hello World From Employee Service!';
  }

  getMe() {
    return {
      id: '312lkm-2mlk12312-kjn12321k-21321nkln',
      name: 'John Doe',
      email: 'johndoe@company.com',
      position: 'Frontend Developer',
      phone: '081234567890',
      photoUrl: null,
    };
  }
}
