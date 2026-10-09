import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash, hashSync } from 'bcryptjs';
import { readJwtSigningConfig, type Role } from '@app/config';
import { EventPublisher } from '@app/messaging';
import { randomUUID } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { CreateLoginDto } from './dto/create-login.dto.js';
import { EmployeeLogin } from './employee-login.entity.js';

const MAX_PASSWORD_LENGTH = 72;
const BCRYPT_COST = 10;
const UNIQUE_VIOLATION = '23505';
const TIMING_HASH = hashSync('timing-equalizer', 10);

const invalidLogin = () => new UnauthorizedException('Invalid email or password');

@Injectable()
export class AuthServiceService {
  private readonly expiresIn: number;

  constructor(
    @InjectRepository(EmployeeLogin) private readonly logins: Repository<EmployeeLogin>,
    private readonly jwt: JwtService,
    private readonly events: EventPublisher,
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

  async changePassword(accountId: string, role: Role, { currentPassword, newPassword }: ChangePasswordDto) {
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

    this.events.announceProfileChanged({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      employeeId: accountId,
      changedBy: { id: accountId, role },
      changes: [{ field: 'password' }],
    });

    return { message: 'Password changed' };
  }

  async createLogin({ id, email, password }: CreateLoginDto) {
    const login = this.logins.create({
      id,
      email,
      passwordHash: await hash(password, BCRYPT_COST),
      role: 'EMPLOYEE',
      isActive: true,
    });

    try {
      await this.logins.insert(login);
      return { created: true, login: toLoginView(login) };
    } catch (error) {
      if (!(error instanceof QueryFailedError) || (error.driverError as { code?: string }).code !== UNIQUE_VIOLATION) {
        throw error;
      }
      const existing = await this.logins.findOne({ where: { id } });
      if (existing && existing.email === email) return { created: false, login: toLoginView(existing) };
      throw new ConflictException('An account with this id or email already exists');
    }
  }

  async setLoginActive(id: string, isActive: boolean) {
    const login = await this.logins.findOne({ where: { id } });
    if (!login) throw new NotFoundException('Login account not found');
    login.isActive = isActive;
    await this.logins.save(login);
    return toLoginView(login);
  }

  async deleteLogin(id: string) {
    await this.logins.delete({ id });
  }
}

function toLoginView(login: EmployeeLogin) {
  return { id: login.id, email: login.email, role: login.role, isActive: login.isActive };
}
