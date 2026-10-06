import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import type { Env } from '@app/config';

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

  getEmployeeMe() {
    return this.forward('Employee', () => this.employeeClient.get('/employee/me'));
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
