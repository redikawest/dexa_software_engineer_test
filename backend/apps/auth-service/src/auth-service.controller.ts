import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service.js';

type LoginBody = { email: string; password: string };

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Get()
  getHello(): string {
    return this.authServiceService.getHello();
  }

  @Post('auth/login')
  @HttpCode(200)
  login(@Body() body: LoginBody) {
    return this.authServiceService.login(body.email, body.password);
  }
}
