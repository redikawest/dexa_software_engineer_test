import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Res } from '@nestjs/common';
import { CallerId } from '@app/config';
import type { Response } from 'express';
import { parseCreateLogin } from './create-login.js';
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

  @Post('internal/logins')
  async createLogin(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { created, login } = await this.authServiceService.createLogin(parseCreateLogin(body));
    res.status(created ? 201 : 200);
    return login;
  }

  @Patch('internal/logins/:id')
  setLoginActive(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: { isActive?: unknown }) {
    if (typeof body?.isActive !== 'boolean') throw new BadRequestException('isActive must be true or false');
    return this.authServiceService.setLoginActive(id, body.isActive);
  }

  @Delete('internal/logins/:id')
  @HttpCode(204)
  async deleteLogin(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.authServiceService.deleteLogin(id);
  }
}
