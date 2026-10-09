import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import type { Env } from '@app/config';

export interface EmployeeSummary {
  id: string;
  name: string;
  position: string;
}

@Injectable()
export class EmployeeClient {
  private readonly logger = new Logger(EmployeeClient.name);
  private readonly http: AxiosInstance;

  constructor(config: ConfigService<Env, true>) {
    this.http = axios.create({ baseURL: config.get('EMPLOYEE_SERVICE_URL', { infer: true }), timeout: 2000 });
  }

  async findByIds(ids: string[]): Promise<Map<string, EmployeeSummary>> {
    if (ids.length === 0) return new Map();
    try {
      const { data } = await this.http.get<EmployeeSummary[]>('/internal/employees', {
        params: { ids: ids.join(',') },
      });
      return new Map(data.map((employee) => [employee.id, employee]));
    } catch (error) {
      this.logger.warn(`Could not load employee names: ${(error as Error).message}`);
      return new Map();
    }
  }
}
