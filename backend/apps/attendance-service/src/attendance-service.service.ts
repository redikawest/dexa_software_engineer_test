import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { AttendanceRecord, type AttendanceType } from './attendance-record.entity.js';
import { toWorkDate } from './work-date.js';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class AttendanceServiceService {
  constructor(
    @InjectRepository(AttendanceRecord) private readonly records: Repository<AttendanceRecord>,
  ) {}

  getHello(): string {
    return 'Hello World From Attendance Service!';
  }

  clockIn(employeeId: string) {
    return this.record(employeeId, 'CLOCK_IN', 'You have already clocked in today');
  }

  async clockOut(employeeId: string) {
    const recordedAt = new Date();
    const workDate = toWorkDate(recordedAt);

    const clockedIn = await this.records.existsBy({ employeeId, workDate, type: 'CLOCK_IN' });
    if (!clockedIn) throw new UnprocessableEntityException('You have not clocked in today');

    return this.record(employeeId, 'CLOCK_OUT', 'You have already clocked out today', recordedAt);
  }

  private async record(
    employeeId: string,
    type: AttendanceType,
    duplicateMessage: string,
    recordedAt = new Date(),
  ) {
    const record = this.records.create({
      id: randomUUID(),
      employeeId,
      type,
      recordedAt,
      workDate: toWorkDate(recordedAt),
    });

    try {
      await this.records.insert(record);
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictException(duplicateMessage);
      }
      throw error;
    }

    return {
      id: record.id,
      type: record.type,
      recordedAt: record.recordedAt,
      workDate: record.workDate,
    };
  }
}
