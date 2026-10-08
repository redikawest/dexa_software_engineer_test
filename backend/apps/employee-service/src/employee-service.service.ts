import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { ILike, In, QueryFailedError, Repository } from 'typeorm';
import { AuthClient } from './auth-client.js';
import type { EmployeeListQuery } from './employee-list-query.js';
import { Employee } from './employee.entity.js';
import type { EmployeeUpdate } from './employee-update.js';
import type { NewEmployee } from './new-employee.js';
import type { ProfileUpdate } from './profile-update.js';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class EmployeeServiceService {
  private readonly logger = new Logger(EmployeeServiceService.name);

  constructor(
    @InjectRepository(Employee) private readonly employees: Repository<Employee>,
    private readonly auth: AuthClient,
  ) {}

  getHello(): string {
    return 'Hello World From Employee Service!';
  }

  async getMe(id: string) {
    return toProfile(await this.findOrFail(id));
  }

  async updateMe(id: string, update: ProfileUpdate) {
    const employee = await this.findOrFail(id);
    Object.assign(employee, update);
    return toProfile(await this.employees.save(employee));
  }

  async list({ page, pageSize, search }: EmployeeListQuery) {
    const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : null;
    const where = pattern ? [{ fullName: ILike(pattern) }, { email: ILike(pattern) }] : undefined;

    const [rows, total] = await this.employees.findAndCount({
      where,
      order: { fullName: 'ASC', id: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map((employee) => ({
        id: employee.id,
        name: employee.fullName,
        email: employee.email,
        position: employee.position,
        phone: employee.phone,
        photoUrl: employee.photoUrl,
        isActive: employee.isActive,
        createdAt: employee.createdAt,
      })),
      page,
      pageSize,
      total,
    };
  }

  async getById(id: string) {
    const employee = await this.findOrFail(id);
    return {
      ...toProfile(employee),
      isActive: employee.isActive,
      createdBy: employee.createdBy,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  async create(adminId: string, input: NewEmployee) {
    const { password, ...profile } = input;
    const id = randomUUID();

    try {
      await this.employees.insert({ id, ...profile, createdBy: adminId });
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictException('An employee with this email already exists');
      }
      throw error;
    }

    const login = await this.auth.createLogin({ id, email: profile.email, password });
    if (login.ok) return this.getById(id);

    await this.undoCreate(id);
    if (login.reason === 'conflict') {
      throw new ConflictException('A login account with this email already exists');
    }
    throw new ServiceUnavailableException('The login account could not be created. Nothing was saved, try again.');
  }

  async update(adminId: string, id: string, input: EmployeeUpdate) {
    const employee = await this.findOrFail(id);
    const { isActive, ...fields } = input;

    if (isActive === false && id === adminId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const previouslyActive = employee.isActive;
    let loginChanged = false;
    if (isActive !== undefined) {
      const result = await this.auth.setLoginActive(id, isActive);
      if (result === 'unavailable') {
        throw new ServiceUnavailableException('The login account could not be updated. Nothing was changed, try again.');
      }
      if (result === 'not_found') this.logger.warn(`Employee ${id} has no login account to ${isActive ? 'enable' : 'disable'}`);
      loginChanged = result === 'ok';
      employee.isActive = isActive;
    }
    Object.assign(employee, fields);

    try {
      await this.employees.save(employee);
    } catch (error) {
      if (loginChanged && !(await this.auth.setLoginActive(id, previouslyActive) === 'ok')) {
        this.logger.error(`Could not put the login of employee ${id} back to active=${previouslyActive}. Fix it by hand.`);
      }
      throw error;
    }
    return this.getById(id);
  }

  private async undoCreate(id: string) {
    const loginRemoved = await this.auth.deleteLogin(id);
    const profileRemoved = await this.employees.delete({ id }).then(
      () => true,
      () => false,
    );
    if (!loginRemoved || !profileRemoved) {
      this.logger.error(
        `Could not fully undo adding employee ${id} (login removed: ${loginRemoved}, profile removed: ${profileRemoved}). Clean it up by hand.`,
      );
    }
  }

  async findSummaries(ids: string[]) {
    const rows = ids.length ? await this.employees.find({ where: { id: In(ids) } }) : [];
    return rows.map((employee) => ({ id: employee.id, name: employee.fullName, position: employee.position }));
  }

  private async findOrFail(id: string) {
    const employee = await this.employees.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }
}

function toProfile(employee: Employee) {
  return {
    id: employee.id,
    name: employee.fullName,
    email: employee.email,
    position: employee.position,
    phone: employee.phone,
    photoUrl: employee.photoUrl,
  };
}
