import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { isAxiosError, type AxiosInstance } from 'axios';
import type { Env } from '@app/config';

export type CreateLoginResult =
  | { ok: true }
  | { ok: false; reason: 'conflict' } // the auth-service already has this email (or id)
  | { ok: false; reason: 'unavailable' }; // unreachable, too slow, or an unexpected answer

/**
 * The employee-service's way to the auth-service, which owns the login accounts.
 * The timeouts are short on purpose: the whole request still has to finish inside the gateway's limit.
 */
@Injectable()
export class AuthClient {
  private readonly http: AxiosInstance;

  constructor(config: ConfigService<Env, true>) {
    this.http = axios.create({ baseURL: config.get('AUTH_SERVICE_URL', { infer: true }) });
  }

  async createLogin(login: { id: string; email: string; password: string }): Promise<CreateLoginResult> {
    try {
      await this.http.post('/internal/logins', login, { timeout: 2500 });
      return { ok: true };
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) return { ok: false, reason: 'conflict' };
      return { ok: false, reason: 'unavailable' };
    }
  }

  /** Undoes createLogin. Deleting an account that does not exist is fine. Returns false if it could not be reached. */
  async deleteLogin(id: string): Promise<boolean> {
    try {
      await this.http.delete(`/internal/logins/${id}`, { timeout: 1500 });
      return true;
    } catch {
      return false;
    }
  }
}
