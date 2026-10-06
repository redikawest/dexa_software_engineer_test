import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service.js';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @Post('auth/login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    return this.apiGatewayService.login(body);
  }

  @Get('employee/me')
  getEmployeeMe() {
    return this.apiGatewayService.getEmployeeMe();
  }
}
