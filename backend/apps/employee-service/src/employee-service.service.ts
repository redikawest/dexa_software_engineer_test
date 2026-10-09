import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventPublisher, type ProfileFieldChange } from '@app/messaging';
import type { Role } from '@app/config';
import { randomUUID } from 'node:crypto';
import { ILike, In, QueryFailedError, Repository } from 'typeorm';
import { AuthClient } from './auth-client.js';
import type { ListEmployeesQueryDto } from './dto/list-employees-query.dto.js';
import { Employee } from './employee.entity.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class EmployeeServiceService {
  private readonly logger = new Logger(EmployeeServiceService.name);

  constructor(
    @InjectRepository(Employee) private readonly employees: Repository<Employee>,
    private readonly auth: AuthClient,
    private readonly events: EventPublisher,
  ) {}

  getHello(): string {
    return 'Hello World From Employee Service!';
  }

  async getMe(id: string) {
    return toProfile(await this.findOrFail(id));
  }

  async updateMe(id: string, role: Role, update: UpdateProfileDto) {
    if (update.phone === undefined && update.photoUrl === undefined) {
      throw new BadRequestException('Send at least one of: phone, photoUrl');
    }
    const employee = await this.findOrFail(id);

    const changes: ProfileFieldChange[] = [];
    if (update.phone !== undefined && update.phone !== employee.phone) {
      changes.push({ field: 'phone', from: employee.phone, to: update.phone });
    }
    if (update.photoUrl !== undefined && update.photoUrl !== employee.photoUrl) {
      changes.push({ field: 'photoUrl', from: employee.photoUrl, to: update.photoUrl });
    }

    if (update.phone !== undefined) employee.phone = update.phone;
    if (update.photoUrl !== undefined) employee.photoUrl = update.photoUrl;
    const saved = await this.employees.save(employee);

    this.announce(id, { id, role }, changes);
    return toProfile(saved);
  }

  private announce(employeeId: string, changedBy: { id: string; role: Role }, changes: ProfileFieldChange[]) {
    if (changes.length === 0) return;
    this.events.announceProfileChanged({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      employeeId,
      changedBy,
      changes,
    });
  }

  async list({ page, pageSize, search }: ListEmployeesQueryDto) {
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

  async create(adminId: string, input: CreateEmployeeDto) {
    const { password, name, email, position, phone } = input;
    const profile = { fullName: name, email, position, phone };
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

  async update(adminId: string, id: string, input: UpdateEmployeeDto) {
    const { isActive, name, position, phone } = input;
    if (isActive === undefined && name === undefined && position === undefined && phone === undefined) {
      throw new BadRequestException('Send at least one of: name, position, phone, isActive');
    }
    const employee = await this.findOrFail(id);

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
    if (name !== undefined) employee.fullName = name;
    if (position !== undefined) employee.position = position;
    if (phone !== undefined) employee.phone = phone;

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
