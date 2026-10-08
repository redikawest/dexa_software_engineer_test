import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity.js';

@Injectable()
export class EmployeeServiceService {
  constructor(@InjectRepository(Employee) private readonly employees: Repository<Employee>) {}

  getHello(): string {
    return 'Hello World From Employee Service!';
  }

  async getMe(id: string) {
    const employee = await this.employees.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');

    return {
      id: employee.id,
      name: employee.fullName,
      email: employee.email,
      position: employee.position,
      phone: employee.phone,
      photoUrl: employee.photoUrl,
    };
  }
}
