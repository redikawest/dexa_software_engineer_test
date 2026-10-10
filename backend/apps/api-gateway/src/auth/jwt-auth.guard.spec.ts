import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// The guard reads the public key from a file when it is created. A unit test has no use for a real key.
vi.mock('@app/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/config')>()),
  readJwtVerifyConfig: () => ({ publicKey: 'PUBLIC-KEY', issuer: 'the-issuer', audience: 'the-audience' }),
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('JwtAuthGuard', () => {
  const getAllAndOverride = vi.fn<() => boolean | undefined>();
  const verifyAsync = vi.fn<(token: string, options: unknown) => Promise<unknown>>();
  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.resetAllMocks();
    guard = new JwtAuthGuard(
      { getAllAndOverride } as unknown as Reflector,
      { verifyAsync } as unknown as JwtService,
      { get: vi.fn() } as unknown as ConfigService,
    );
  });

  const requestWith = (authorization?: string) => ({ headers: { authorization }, user: undefined as unknown });
  const contextOf = (request: object) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  it('lets a public route through without looking at the token', async () => {
    getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(contextOf(requestWith()))).resolves.toBe(true);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  describe('on a route that needs a token', () => {
    it.each([
      ['no Authorization header', undefined],
      ['another scheme than Bearer', 'Basic dXNlcjpwYXNz'],
      ['the word Bearer without a token', 'Bearer'],
      ['an empty token', 'Bearer '],
    ])('refuses %s, and does not try to verify anything', async (_case, header) => {
      await expect(guard.canActivate(contextOf(requestWith(header)))).rejects.toThrow(
        new UnauthorizedException('Missing bearer token'),
      );
      expect(verifyAsync).not.toHaveBeenCalled();
    });

    it('accepts the scheme in any case, and puts the user on the request', async () => {
      verifyAsync.mockResolvedValue({ sub: USER_ID, role: 'HR_ADMIN' });
      const request = requestWith('bearer the-token');

      await expect(guard.canActivate(contextOf(request))).resolves.toBe(true);

      expect(request.user).toEqual({ id: USER_ID, role: 'HR_ADMIN' });
    });

    it('verifies with the public key, only the RS256 algorithm, and the expected issuer and audience', async () => {
      verifyAsync.mockResolvedValue({ sub: USER_ID, role: 'EMPLOYEE' });

      await guard.canActivate(contextOf(requestWith('Bearer the-token')));

      expect(verifyAsync).toHaveBeenCalledWith('the-token', {
        publicKey: 'PUBLIC-KEY',
        algorithms: ['RS256'],
        issuer: 'the-issuer',
        audience: 'the-audience',
      });
    });

    it('gives the same answer for any token that does not verify, so a caller learns nothing', async () => {
      verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(guard.canActivate(contextOf(requestWith('Bearer old')))).rejects.toThrow(
        new UnauthorizedException('Invalid or expired token'),
      );
    });

    it.each([
      ['no sub', { role: 'EMPLOYEE' }],
      ['a sub that is not a UUID', { sub: 'admin', role: 'EMPLOYEE' }],
      ['a sub that is not text', { sub: 12345, role: 'EMPLOYEE' }],
      ['no role', { sub: USER_ID }],
      ['a role that does not exist', { sub: USER_ID, role: 'SUPERUSER' }],
    ])('refuses a signed token with %s', async (_case, payload) => {
      verifyAsync.mockResolvedValue(payload);
      const request = requestWith('Bearer the-token');

      await expect(guard.canActivate(contextOf(request))).rejects.toThrow(
        new UnauthorizedException('Invalid or expired token'),
      );
      expect(request.user).toBeUndefined();
    });
  });
});
