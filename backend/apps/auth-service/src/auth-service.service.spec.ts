import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { EventPublisher } from '@app/messaging';
import { compare, hash } from 'bcryptjs';
import type { Repository } from 'typeorm';
import { AuthServiceService } from './auth-service.service.js';
import type { EmployeeLogin } from './employee-login.entity.js';

vi.mock('@app/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/config')>()),
  readJwtSigningConfig: () => ({ privateKey: '', expiresInSeconds: 3600, issuer: 'test', audience: 'test' }),
}));

const ACCOUNT_ID = '11111111-1111-4111-8111-111111111111';

describe('AuthServiceService.changePassword', () => {
  const findOne = vi.fn<(options: unknown) => Promise<EmployeeLogin | null>>();
  const save = vi.fn<(login: EmployeeLogin) => Promise<EmployeeLogin>>();
  const announceProfileChanged = vi.fn<(event: unknown) => void>();
  let service: AuthServiceService;
  let account: EmployeeLogin;

  beforeEach(async () => {
    vi.clearAllMocks();
    account = { id: ACCOUNT_ID, passwordHash: await hash('current-password', 4), isActive: true } as EmployeeLogin;
    findOne.mockResolvedValue(account);
    save.mockImplementation(async (login) => login);

    service = new AuthServiceService(
      { findOne, save } as unknown as Repository<EmployeeLogin>,
      {} as JwtService,
      { announceProfileChanged } as unknown as EventPublisher,
      { get: vi.fn() } as unknown as ConfigService,
    );
  });

  it('rejects a new password that equals the current one, without touching the database', async () => {
    await expect(
      service.changePassword(ACCOUNT_ID, 'EMPLOYEE', { currentPassword: 'same-password', newPassword: 'same-password' }),
    ).rejects.toThrow(new BadRequestException('New password must be different from the current password'));

    expect(findOne).not.toHaveBeenCalled();
  });

  it.each([
    ['does not exist', null],
    ['is switched off', { id: ACCOUNT_ID, passwordHash: 'x', isActive: false } as EmployeeLogin],
  ])('rejects when the account %s', async (_case, found) => {
    findOne.mockResolvedValue(found);

    await expect(
      service.changePassword(ACCOUNT_ID, 'EMPLOYEE', { currentPassword: 'current-password', newPassword: 'brand-new-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects a wrong current password and saves nothing', async () => {
    await expect(
      service.changePassword(ACCOUNT_ID, 'EMPLOYEE', { currentPassword: 'wrong-password', newPassword: 'brand-new-password' }),
    ).rejects.toThrow(new BadRequestException('Current password is incorrect'));

    expect(save).not.toHaveBeenCalled();
    expect(announceProfileChanged).not.toHaveBeenCalled();
  });

  it('saves a hash of the new password and announces the change without the password in it', async () => {
    const result = await service.changePassword(ACCOUNT_ID, 'EMPLOYEE', {
      currentPassword: 'current-password',
      newPassword: 'brand-new-password',
    });

    expect(result).toEqual({ message: 'Password changed' });

    const saved = save.mock.calls[0]![0];
    expect(saved.passwordHash).not.toBe('brand-new-password');
    expect(await compare('brand-new-password', saved.passwordHash)).toBe(true);

    expect(announceProfileChanged).toHaveBeenCalledOnce();
    const event = announceProfileChanged.mock.calls[0]![0];
    expect(event).toMatchObject({ employeeId: ACCOUNT_ID, changedBy: { id: ACCOUNT_ID, role: 'EMPLOYEE' }, changes: [{ field: 'password' }] });
    expect(JSON.stringify(event)).not.toContain('brand-new-password');
  });
});
