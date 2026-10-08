import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
