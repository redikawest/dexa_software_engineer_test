import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash, hashSync } from 'bcryptjs';
import { readJwtSigningConfig } from '@app/config';
import { Repository } from 'typeorm';
import { EmployeeLogin } from './employee-login.entity.js';

const MAX_PASSWORD_LENGTH = 72;
const MIN_NEW_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 10;
const TIMING_HASH = hashSync('timing-equalizer', 10);

const invalidLogin = () => new UnauthorizedException('Invalid email or password');

@Injectable()
export class AuthServiceService {
  private readonly expiresIn: number;

  constructor(
    @InjectRepository(EmployeeLogin) private readonly logins: Repository<EmployeeLogin>,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.expiresIn = readJwtSigningConfig((key) => config.get<string>(key)).expiresInSeconds;
  }

  getHello(): string {
    return 'Hello World From Auth Service!';
  }

  async login(email: string, password: string) {
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      throw new BadRequestException('Email and password are required');
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new BadRequestException(`Password must be at most ${MAX_PASSWORD_LENGTH} characters`);
    }

    const account = await this.logins.findOne({ where: { email: email.trim().toLowerCase() } });

    if (!account) {
      await compare(password, TIMING_HASH);
      throw invalidLogin();
    }

    const passwordMatches = await compare(password, account.passwordHash);
    if (!passwordMatches || !account.isActive) throw invalidLogin();

    const accessToken = await this.jwt.signAsync({ sub: account.id, role: account.role });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.expiresIn,
      user: { id: account.id, email: account.email, role: account.role },
    };
  }

  async changePassword(accountId: string, currentPassword: unknown, newPassword: unknown) {
    if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string') {
      throw new BadRequestException('currentPassword and newPassword are required');
    }
    if (newPassword.length < MIN_NEW_PASSWORD_LENGTH || Buffer.byteLength(newPassword) > MAX_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `New password must be ${MIN_NEW_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters`,
      );
    }
    if (newPassword === currentPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const account = await this.logins.findOne({ where: { id: accountId } });
    if (!account || !account.isActive) throw new UnauthorizedException('Account not available');

    if (!(await compare(currentPassword, account.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }

    account.passwordHash = await hash(newPassword, BCRYPT_COST);
    await this.logins.save(account);

    return { message: 'Password changed' };
  }
}
