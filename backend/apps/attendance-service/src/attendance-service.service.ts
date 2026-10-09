import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Between, QueryFailedError, Repository } from 'typeorm';
import { AttendanceRecord, type AttendanceType } from './attendance-record.entity.js';
import type { AdminAttendanceQuery } from './admin-attendance-query.js';
import type { DateRange } from './date-range.js';
import { EmployeeClient } from '@app/clients';
import { toWorkDate } from './work-date.js';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class AttendanceServiceService {
  constructor(
    @InjectRepository(AttendanceRecord) private readonly records: Repository<AttendanceRecord>,
    private readonly employees: EmployeeClient,
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

  async listAll({ from, to, employeeId, page, pageSize }: AdminAttendanceQuery) {
    const filter = `
      FROM attendance_records
      WHERE work_date BETWEEN $1 AND $2 AND ($3::uuid IS NULL OR employee_id = $3::uuid)
      GROUP BY employee_id, work_date`;

    const rows: { employee_id: string; work_date: string; clock_in: Date | null; clock_out: Date | null }[] =
      await this.records.query(
        `SELECT employee_id,
                to_char(work_date, 'YYYY-MM-DD') AS work_date,
                min(recorded_at) FILTER (WHERE type = 'CLOCK_IN') AS clock_in,
                max(recorded_at) FILTER (WHERE type = 'CLOCK_OUT') AS clock_out
         ${filter}
         ORDER BY work_date DESC, clock_in ASC NULLS LAST, employee_id ASC
         LIMIT $4 OFFSET $5`,
        [from, to, employeeId, pageSize, (page - 1) * pageSize],
      );
    const [{ total }]: { total: number }[] = await this.records.query(
      `SELECT count(*)::int AS total FROM (SELECT 1 ${filter}) days`,
      [from, to, employeeId],
    );

    const names = await this.employees.findByIds([...new Set(rows.map((row) => row.employee_id))]);

    return {
      from,
      to,
      page,
      pageSize,
      total,
      items: rows.map((row) => ({
        employeeId: row.employee_id,
        employeeName: names.get(row.employee_id)?.name ?? null,
        position: names.get(row.employee_id)?.position ?? null,
        workDate: row.work_date,
        clockIn: row.clock_in,
        clockOut: row.clock_out,
        workedMinutes:
          row.clock_in && row.clock_out ? Math.floor((row.clock_out.getTime() - row.clock_in.getTime()) / 60_000) : null,
      })),
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
