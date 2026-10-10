import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Role } from '@app/config';
import type { AuthUser } from './auth-user.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const getAllAndOverride = vi.fn<() => Role[] | undefined>();
  const guard = new RolesGuard({ getAllAndOverride } as unknown as Reflector);

  const contextOf = (user?: AuthUser) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => vi.resetAllMocks());

  it.each([
    ['no roles are asked for', undefined],
    ['an empty list of roles is asked for', []],
  ])('lets everybody in when %s', (_case, allowed) => {
    getAllAndOverride.mockReturnValue(allowed);

    expect(guard.canActivate(contextOf({ id: 'x', role: 'EMPLOYEE' }))).toBe(true);
  });

  it('lets in a user with the role that is asked for', () => {
    getAllAndOverride.mockReturnValue(['HR_ADMIN']);

    expect(guard.canActivate(contextOf({ id: 'x', role: 'HR_ADMIN' }))).toBe(true);
  });

  it('keeps out a user with another role', () => {
    getAllAndOverride.mockReturnValue(['HR_ADMIN']);

    expect(() => guard.canActivate(contextOf({ id: 'x', role: 'EMPLOYEE' }))).toThrow(
      new ForbiddenException('You do not have access to this resource'),
    );
  });

  it('keeps out a request that has no user at all, instead of failing open', () => {
    getAllAndOverride.mockReturnValue(['HR_ADMIN']);

    expect(() => guard.canActivate(contextOf(undefined))).toThrow(ForbiddenException);
  });
});
