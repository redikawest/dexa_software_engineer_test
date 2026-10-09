import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Res } from '@nestjs/common';
import { CallerId, CallerRole, type Role } from '@app/config';
import type { Response } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateLoginDto } from './dto/create-login.dto.js';
import { SetLoginActiveDto } from './dto/set-login-active.dto.js';
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
  login(@Body() body: LoginDto) {
    return this.authServiceService.login(body);
  }

  @Patch('auth/password')
  changePassword(@CallerId() accountId: string, @CallerRole() role: Role, @Body() body: ChangePasswordDto) {
    return this.authServiceService.changePassword(accountId, role, body);
  }

  @Post('internal/logins')
  async createLogin(@Body() body: CreateLoginDto, @Res({ passthrough: true }) res: Response) {
    const { created, login } = await this.authServiceService.createLogin(body);
    res.status(created ? 201 : 200);
    return login;
  }

  @Patch('internal/logins/:id')
  setLoginActive(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: SetLoginActiveDto) {
    return this.authServiceService.setLoginActive(id, body.isActive);
  }

  @Delete('internal/logins/:id')
  @HttpCode(204)
  async deleteLogin(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.authServiceService.deleteLogin(id);
  }
}
