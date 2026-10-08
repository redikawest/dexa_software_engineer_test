import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { CallerId } from '@app/config';
import { AuthServiceService } from './auth-service.service.js';

type LoginBody = { email: string; password: string };
type ChangePasswordBody = { currentPassword?: unknown; newPassword?: unknown };

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

  @Patch('auth/password')
  changePassword(@CallerId() accountId: string, @Body() body: ChangePasswordBody) {
    return this.authServiceService.changePassword(accountId, body?.currentPassword, body?.newPassword);
  }
}
