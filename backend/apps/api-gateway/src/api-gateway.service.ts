import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { USER_ID_HEADER, USER_ROLE_HEADER, type Env } from '@app/config';
import type { AuthUser } from './auth/auth-user.js';

@Injectable()
export class ApiGatewayService {
  private readonly authClient: AxiosInstance;
  private readonly employeeClient: AxiosInstance;

  constructor(config: ConfigService<Env, true>) {
    this.authClient = axios.create({
      baseURL: config.get('AUTH_SERVICE_URL', { infer: true }),
      timeout: 5000,
    });
    this.employeeClient = axios.create({
      baseURL: config.get('EMPLOYEE_SERVICE_URL', { infer: true }),
      timeout: 5000,
    });
  }

  getHello(): string {
    return 'Hello World From Api Gateway Service!';
  }

  login(body: unknown) {
    return this.forward('Auth', () => this.authClient.post('/auth/login', body ?? {}));
  }

  getEmployeeMe(user: AuthUser) {
    return this.forward('Employee', () =>
      this.employeeClient.get('/employee/me', { headers: this.identityHeaders(user) }),
    );
  }

  private identityHeaders(user: AuthUser) {
    return { [USER_ID_HEADER]: user.id, [USER_ROLE_HEADER]: user.role };
  }

  private async forward(serviceName: string, call: () => Promise<AxiosResponse>) {
    try {
      const { data } = await call();
      return data;
    } catch (error) {
      throw this.toHttpException(serviceName, error);
    }
  }

  private toHttpException(serviceName: string, error: unknown): HttpException {
    if (isAxiosError(error) && error.response) {
      return new HttpException(error.response.data ?? `${serviceName} service error`, error.response.status);
    }
    return new BadGatewayException(`${serviceName} service is unreachable`);
  }
}
