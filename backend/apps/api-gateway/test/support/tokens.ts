import { createHmac, generateKeyPairSync } from 'node:crypto';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { Role } from '@app/config';

export const ISSUER = 'dexa-auth';
export const AUDIENCE = 'dexa-api';
export const ANDI = '22222222-2222-4222-8222-222222222222';
export const ADMIN = '11111111-1111-4111-8111-111111111111';

export const createKeyPair = () =>
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** Makes tokens the way the auth service does, with a key pair that belongs to the tests. */
export class TokenFactory {
  private readonly jwt = new JwtService();

  constructor(
    private readonly privateKey: string,
    private readonly publicKey: string,
  ) {}

  /** A token that is good. Claims and signing options can be overridden to make it bad in one way. */
  async sign(claims: Record<string, unknown> = {}, options: JwtSignOptions = {}, privateKey = this.privateKey): Promise<string> {
    const payload = { sub: ANDI, role: 'EMPLOYEE', ...claims };
    return this.jwt.signAsync(payload, {
      privateKey,
      algorithm: 'RS256',
      issuer: ISSUER,
      audience: AUDIENCE,
      // A token that sets its own "exp" is a way to make an expired one.
      ...('exp' in payload ? {} : { expiresIn: 3600 }),
      ...options,
    });
  }

  employee(id = ANDI): Promise<string> {
    return this.sign({ sub: id, role: 'EMPLOYEE' satisfies Role });
  }

  admin(id = ADMIN): Promise<string> {
    return this.sign({ sub: id, role: 'HR_ADMIN' satisfies Role });
  }

  /** "alg": "none": a token without a signature, which a careless server would accept. */
  unsigned(claims: Record<string, unknown> = {}): string {
    const payload = { sub: ADMIN, role: 'HR_ADMIN', iss: ISSUER, aud: AUDIENCE, exp: Math.floor(Date.now() / 1000) + 3600, ...claims };
    return `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(payload)}.`;
  }

  /**
   * The classic trick: sign with HS256, using the public key (which everybody can read) as the secret.
   * A server that lets the token choose its algorithm would check it with the same public key and accept it.
   */
  hmacWithPublicKey(claims: Record<string, unknown> = {}): string {
    const payload = { sub: ADMIN, role: 'HR_ADMIN', iss: ISSUER, aud: AUDIENCE, exp: Math.floor(Date.now() / 1000) + 3600, ...claims };
    const signingInput = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}`;
    return `${signingInput}.${createHmac('sha256', this.publicKey).update(signingInput).digest('base64url')}`;
  }
}
