import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthServiceService {
  getHello(): string {
    return 'Hello World From Auth Service!';
  }

  login() {
    return {
      accessToken: 'dummy-access-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: '312lkm-2mlk12312-kjn12321k-21321nkln',
        email: 'johndoe@company.com',
        role: 'EMPLOYEE',
      },
    };
  }
}
