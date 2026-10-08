import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service.js';
import { CurrentUser, type AuthUser } from './auth/auth-user.js';
import { Public } from './auth/decorators.js';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    return this.apiGatewayService.login(body);
  }

  @Get('employee/me')
  getEmployeeMe(@CurrentUser() user: AuthUser) {
    return this.apiGatewayService.getEmployeeMe(user);
  }
}
