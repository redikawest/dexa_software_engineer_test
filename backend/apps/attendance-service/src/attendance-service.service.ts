import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Between, QueryFailedError, Repository } from 'typeorm';
import { AttendanceRecord, type AttendanceType } from './attendance-record.entity.js';
import type { DateRange } from './date-range.js';
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

  async getToday(employeeId: string) {
    const workDate = toWorkDate(new Date());
    const records = await this.records.findBy({ employeeId, workDate });

    const clockIn = records.find((r) => r.type === 'CLOCK_IN')?.recordedAt ?? null;
    const clockOut = records.find((r) => r.type === 'CLOCK_OUT')?.recordedAt ?? null;

    const status = !clockIn ? 'NOT_STARTED' : !clockOut ? 'WORKING' : 'DONE';

    return { workDate, status, clockIn, clockOut };
  }

  async getSummary(employeeId: string, { from, to }: DateRange) {
    const records = await this.records.find({
      where: { employeeId, workDate: Between(from, to) },
      order: { workDate: 'DESC' },
    });

    const byDay = new Map<string, { workDate: string; clockIn: Date | null; clockOut: Date | null }>();
    for (const record of records) {
      const day = byDay.get(record.workDate) ?? { workDate: record.workDate, clockIn: null, clockOut: null };
      if (record.type === 'CLOCK_IN') day.clockIn = record.recordedAt;
      else day.clockOut = record.recordedAt;
      byDay.set(record.workDate, day);
    }

    const days = [...byDay.values()].map((day) => ({
      ...day,
      workedMinutes:
        day.clockIn && day.clockOut ? Math.floor((day.clockOut.getTime() - day.clockIn.getTime()) / 60_000) : null,
    }));

    const completed = days.filter((day) => day.workedMinutes !== null);
    const totalMinutes = completed.reduce((sum, day) => sum + (day.workedMinutes ?? 0), 0);

    return {
      from,
      to,
      days,
      totals: {
        daysPresent: days.filter((day) => day.clockIn).length,
        totalMinutes,
        averageMinutes: completed.length ? Math.round(totalMinutes / completed.length) : 0,
      },
    };
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
