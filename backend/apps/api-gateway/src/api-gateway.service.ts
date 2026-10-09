import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { USER_ID_HEADER, USER_ROLE_HEADER, type Env } from '@app/config';
import type { AuthUser } from './auth/auth-user.js';

@Injectable()
export class ApiGatewayService {
  private readonly authClient: AxiosInstance;
  private readonly employeeClient: AxiosInstance;
  private readonly attendanceClient: AxiosInstance;
  private readonly logClient: AxiosInstance;

  constructor(config: ConfigService<Env, true>) {
    this.authClient = axios.create({
      baseURL: config.get('AUTH_SERVICE_URL', { infer: true }),
      timeout: 5000,
    });
    this.employeeClient = axios.create({
      baseURL: config.get('EMPLOYEE_SERVICE_URL', { infer: true }),
      timeout: 5000,
    });
    this.attendanceClient = axios.create({
      baseURL: config.get('ATTENDANCE_SERVICE_URL', { infer: true }),
      timeout: 5000,
    });
    this.logClient = axios.create({
      baseURL: config.get('LOG_SERVICE_URL', { infer: true }),
      timeout: 5000,
    });
  }

  getHello(): string {
    return 'Hello World From Api Gateway Service!';
  }

  login(body: unknown) {
    return this.forward('Auth', () => this.authClient.post('/auth/login', body ?? {}));
  }

  changePassword(user: AuthUser, body: unknown) {
    return this.forward('Auth', () =>
      this.authClient.patch('/auth/password', body ?? {}, { headers: this.identityHeaders(user) }),
    );
  }

  getEmployeeMe(user: AuthUser) {
    return this.forward('Employee', () =>
      this.employeeClient.get('/employee/me', { headers: this.identityHeaders(user) }),
    );
  }

  updateEmployeeMe(user: AuthUser, body: unknown) {
    return this.forward('Employee', () =>
      this.employeeClient.patch('/employee/me', body ?? {}, { headers: this.identityHeaders(user) }),
    );
  }

  listEmployees(user: AuthUser, query: { page?: string; pageSize?: string; search?: string }) {
    return this.forward('Employee', () =>
      this.employeeClient.get('/employees', { headers: this.identityHeaders(user), params: query }),
    );
  }

  createEmployee(user: AuthUser, body: unknown) {
    return this.forward('Employee', () =>
      this.employeeClient.post('/employees', body ?? {}, { headers: this.identityHeaders(user) }),
    );
  }

  updateEmployee(user: AuthUser, id: string, body: unknown) {
    return this.forward('Employee', () =>
      this.employeeClient.patch(`/employees/${encodeURIComponent(id)}`, body ?? {}, {
        headers: this.identityHeaders(user),
      }),
    );
  }

  getEmployee(user: AuthUser, id: string) {
    return this.forward('Employee', () =>
      this.employeeClient.get(`/employees/${encodeURIComponent(id)}`, { headers: this.identityHeaders(user) }),
    );
  }

  listAllAttendance(user: AuthUser, query: Record<string, string | undefined>) {
    return this.forward('Attendance', () =>
      this.attendanceClient.get('/attendance', { headers: this.identityHeaders(user), params: query }),
    );
  }

  getAttendanceToday(user: AuthUser) {
    return this.forward('Attendance', () =>
      this.attendanceClient.get('/attendance/today', { headers: this.identityHeaders(user) }),
    );
  }

  getAttendanceSummary(user: AuthUser, from?: string, to?: string) {
    return this.forward('Attendance', () =>
      this.attendanceClient.get('/attendance/summary', {
        headers: this.identityHeaders(user),
        params: { from, to },
      }),
    );
  }

  clockIn(user: AuthUser) {
    return this.forward('Attendance', () =>
      this.attendanceClient.post('/attendance/clock-in', undefined, { headers: this.identityHeaders(user) }),
    );
  }

  clockOut(user: AuthUser) {
    return this.forward('Attendance', () =>
      this.attendanceClient.post('/attendance/clock-out', undefined, { headers: this.identityHeaders(user) }),
    );
  }

  listNotifications(user: AuthUser, limit?: string) {
    return this.forward('Log', () =>
      this.logClient.get('/notifications', { headers: this.identityHeaders(user), params: { limit } }),
    );
  }

  markNotificationsSeen(user: AuthUser, body: unknown) {
    return this.forward('Log', () =>
      this.logClient.post('/notifications/seen', body ?? {}, { headers: this.identityHeaders(user) }),
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
