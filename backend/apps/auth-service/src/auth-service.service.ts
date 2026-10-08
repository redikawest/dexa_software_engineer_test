import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hashSync } from 'bcryptjs';
import { readJwtSigningConfig } from '@app/config';
import { Repository } from 'typeorm';
import { EmployeeLogin } from './employee-login.entity.js';

const MAX_PASSWORD_LENGTH = 72;
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
}
