import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import type { EmployeeListQuery } from './employee-list-query.js';
import { Employee } from './employee.entity.js';
import type { ProfileUpdate } from './profile-update.js';

@Injectable()
export class EmployeeServiceService {
  constructor(@InjectRepository(Employee) private readonly employees: Repository<Employee>) {}

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
