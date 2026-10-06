import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service.js';

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Get()
  getHello(): string {
    return this.authServiceService.getHello();
  }

  @Post('auth/login')
  @HttpCode(200)
  login() {
    return this.authServiceService.login();
  }
}
