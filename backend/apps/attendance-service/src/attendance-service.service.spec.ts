import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import type { EmployeeClient, EmployeeSummary } from '@app/clients';
import { QueryFailedError, type Repository } from 'typeorm';
import type { AttendanceRecord, AttendanceType } from './attendance-record.entity.js';
import { AttendanceServiceService } from './attendance-service.service.js';

const EMPLOYEE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';

const uniqueViolation = () =>
  new QueryFailedError('INSERT', [], Object.assign(new Error('duplicate key'), { code: '23505' }));

const record = (type: AttendanceType, workDate: string, utc: string) =>
  ({ employeeId: EMPLOYEE_ID, type, workDate, recordedAt: new Date(utc) }) as AttendanceRecord;

// The database and the employee service are replaced by fakes: these tests are about the calculations.
describe('AttendanceServiceService', () => {
  const create = vi.fn<(row: Partial<AttendanceRecord>) => AttendanceRecord>();
  const insert = vi.fn<(row: AttendanceRecord) => Promise<unknown>>();
  const existsBy = vi.fn<(where: unknown) => Promise<boolean>>();
  const findBy = vi.fn<(where: unknown) => Promise<AttendanceRecord[]>>();
  const find = vi.fn<(options: unknown) => Promise<AttendanceRecord[]>>();
  const query = vi.fn<(sql: string, params: unknown[]) => Promise<unknown>>();
  const findByIds = vi.fn<(ids: string[]) => Promise<Map<string, EmployeeSummary>>>();
  let service: AttendanceServiceService;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-09T08:00:00Z')); // 15:00 on 9 October in Jakarta

    create.mockImplementation((row) => row as AttendanceRecord);
    insert.mockResolvedValue(undefined);
    findByIds.mockResolvedValue(new Map());

    service = new AttendanceServiceService(
      { create, insert, existsBy, findBy, find, query } as unknown as Repository<AttendanceRecord>,
      { findByIds } as unknown as EmployeeClient,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('clockIn', () => {
    it('takes the time from the server, and the working day from Jakarta time', async () => {
      vi.setSystemTime(new Date('2026-10-09T17:05:00Z')); // 00:05 on 10 October in Jakarta

      const result = await service.clockIn(EMPLOYEE_ID);

      expect(result).toMatchObject({ type: 'CLOCK_IN', workDate: '2026-10-10', recordedAt: new Date('2026-10-09T17:05:00Z') });
      expect(insert).toHaveBeenCalledOnce();
    });

    it('says so when the employee has already clocked in today', async () => {
      insert.mockRejectedValue(uniqueViolation());

      await expect(service.clockIn(EMPLOYEE_ID)).rejects.toThrow(new ConflictException('You have already clocked in today'));
    });

    it('does not hide an error that is not a duplicate', async () => {
      insert.mockRejectedValue(new Error('database is down'));

      await expect(service.clockIn(EMPLOYEE_ID)).rejects.toThrow('database is down');
    });
  });

  describe('clockOut', () => {
    it('is refused before a clock in, and then nothing is saved', async () => {
      existsBy.mockResolvedValue(false);

      await expect(service.clockOut(EMPLOYEE_ID)).rejects.toThrow(
        new UnprocessableEntityException('You have not clocked in today'),
      );
      expect(insert).not.toHaveBeenCalled();
    });

    it('looks for the clock in of the same working day', async () => {
      existsBy.mockResolvedValue(true);

      await service.clockOut(EMPLOYEE_ID);

      expect(existsBy).toHaveBeenCalledWith({ employeeId: EMPLOYEE_ID, workDate: '2026-10-09', type: 'CLOCK_IN' });
      expect(insert).toHaveBeenCalledWith(expect.objectContaining({ type: 'CLOCK_OUT', workDate: '2026-10-09' }));
    });

    it('says so when the employee has already clocked out today', async () => {
      existsBy.mockResolvedValue(true);
      insert.mockRejectedValue(uniqueViolation());

      await expect(service.clockOut(EMPLOYEE_ID)).rejects.toThrow(new ConflictException('You have already clocked out today'));
    });
  });

  describe('getToday', () => {
    const clockedIn = record('CLOCK_IN', '2026-10-09', '2026-10-09T01:00:00Z');
    const clockedOut = record('CLOCK_OUT', '2026-10-09', '2026-10-09T09:30:00Z');

    it.each([
      ['before the first clock in', 'NOT_STARTED', [], null, null],
      ['after the clock in', 'WORKING', [clockedIn], '2026-10-09T01:00:00.000Z', null],
      ['after the clock out', 'DONE', [clockedIn, clockedOut], '2026-10-09T01:00:00.000Z', '2026-10-09T09:30:00.000Z'],
    ])('is %s: %s', async (_when, status, records, clockIn, clockOut) => {
      findBy.mockResolvedValue(records);

      const today = await service.getToday(EMPLOYEE_ID);

      expect(today).toMatchObject({ status, workDate: '2026-10-09' });
      expect(today.clockIn?.toISOString() ?? null).toBe(clockIn);
      expect(today.clockOut?.toISOString() ?? null).toBe(clockOut);
    });
  });

  describe('getSummary', () => {
    const range = { from: '2026-10-01', to: '2026-10-09' };

    it('is empty and zero when there is no attendance', async () => {
      find.mockResolvedValue([]);

      expect(await service.getSummary(EMPLOYEE_ID, range)).toEqual({
        ...range,
        days: [],
        totals: { daysPresent: 0, totalMinutes: 0, averageMinutes: 0 },
      });
    });

    it('works out the minutes per day (whole minutes, rounded down) and the totals', async () => {
      // As the database gives them: newest day first.
      find.mockResolvedValue([
        record('CLOCK_OUT', '2026-10-08', '2026-10-08T09:00:59Z'),
        record('CLOCK_IN', '2026-10-08', '2026-10-08T01:00:00Z'),
        record('CLOCK_OUT', '2026-10-07', '2026-10-07T08:30:00Z'),
        record('CLOCK_IN', '2026-10-07', '2026-10-07T01:00:00Z'),
      ]);

      const summary = await service.getSummary(EMPLOYEE_ID, range);

      expect(summary.days.map((day) => [day.workDate, day.workedMinutes])).toEqual([
        ['2026-10-08', 480], // 8 hours and 59 seconds
        ['2026-10-07', 450],
      ]);
      expect(summary.totals).toEqual({ daysPresent: 2, totalMinutes: 930, averageMinutes: 465 });
    });

    it('counts a day without a clock out as present, but not in the minutes or the average', async () => {
      find.mockResolvedValue([
        record('CLOCK_IN', '2026-10-09', '2026-10-09T01:00:00Z'),
        record('CLOCK_OUT', '2026-10-08', '2026-10-08T09:00:00Z'),
        record('CLOCK_IN', '2026-10-08', '2026-10-08T01:00:00Z'),
      ]);

      const summary = await service.getSummary(EMPLOYEE_ID, range);

      expect(summary.days[0]).toMatchObject({ workDate: '2026-10-09', clockOut: null, workedMinutes: null });
      expect(summary.totals).toEqual({ daysPresent: 2, totalMinutes: 480, averageMinutes: 480 });
    });

    it('rounds the average to a whole minute', async () => {
      find.mockResolvedValue([
        record('CLOCK_OUT', '2026-10-08', '2026-10-08T01:01:00Z'),
        record('CLOCK_IN', '2026-10-08', '2026-10-08T01:00:00Z'),
        record('CLOCK_OUT', '2026-10-07', '2026-10-07T01:02:00Z'),
        record('CLOCK_IN', '2026-10-07', '2026-10-07T01:00:00Z'),
      ]);

      expect((await service.getSummary(EMPLOYEE_ID, range)).totals).toMatchObject({ totalMinutes: 3, averageMinutes: 2 });
    });
  });

  describe('listAll', () => {
    const rows = [
      { employee_id: EMPLOYEE_ID, work_date: '2026-10-09', clock_in: new Date('2026-10-09T01:00:00Z'), clock_out: new Date('2026-10-09T09:15:00Z') },
      { employee_id: OTHER_ID, work_date: '2026-10-09', clock_in: new Date('2026-10-09T02:00:00Z'), clock_out: null },
    ];
    const filter = { from: '2026-10-09', to: '2026-10-09', employeeId: null, page: 1, pageSize: 20 };

    beforeEach(() => {
      query.mockResolvedValueOnce(rows).mockResolvedValueOnce([{ total: 2 }]);
    });

    it('adds the name and position of each employee, and the minutes worked', async () => {
      findByIds.mockResolvedValue(new Map([[EMPLOYEE_ID, { id: EMPLOYEE_ID, name: 'Andi Pratama', position: 'Backend Developer' }]]));

      const result = await service.listAll(filter);

      expect(result).toMatchObject({ from: '2026-10-09', to: '2026-10-09', page: 1, pageSize: 20, total: 2 });
      expect(result.items[0]).toEqual({
        employeeId: EMPLOYEE_ID,
        employeeName: 'Andi Pratama',
        position: 'Backend Developer',
        workDate: '2026-10-09',
        clockIn: rows[0]!.clock_in,
        clockOut: rows[0]!.clock_out,
        workedMinutes: 495,
      });
    });

    it('still answers when the employee service cannot be reached: names are null', async () => {
      const result = await service.listAll(filter);

      expect(result.items[0]).toMatchObject({ employeeName: null, position: null });
    });

    it('has no minutes for a day without a clock out', async () => {
      const result = await service.listAll(filter);

      expect(result.items[1]).toMatchObject({ clockOut: null, workedMinutes: null });
    });

    it('asks for each employee name only once', async () => {
      await service.listAll(filter);

      expect(findByIds).toHaveBeenCalledWith([EMPLOYEE_ID, OTHER_ID]);
    });

    it('skips the right number of rows for the page', async () => {
      await service.listAll({ ...filter, page: 3, pageSize: 10 });

      expect(query.mock.calls[0]![1]).toEqual(['2026-10-09', '2026-10-09', null, 10, 20]);
    });
  });
});
