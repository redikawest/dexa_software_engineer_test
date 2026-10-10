import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EmployeeClient, type EmployeeSummary } from '@app/clients';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AttendanceRecord, type AttendanceType } from '../src/attendance-record.entity.js';
import { AttendanceServiceModule } from '../src/attendance-service.module.js';
import { configureApp } from '../src/setup-app.js';
import { toWorkDate } from '../src/work-date.js';

const ANDI = '22222222-2222-4222-8222-222222222222';
const BUDI = '33333333-3333-4333-8333-333333333333';

// 08:00 on Friday 9 October 2026 in Jakarta. The clock is fixed, so "today" does not change during a test.
const MORNING = '2026-10-09T01:00:00Z';

describe('Attendance service (HTTP, real database)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let db: DataSource;

  // Only the employee service is replaced: it gives the names for the HR list.
  const employeeClient = { findByIds: vi.fn<(ids: string[]) => Promise<Map<string, EmployeeSummary>>>() };
  const names = new Map<string, EmployeeSummary>([
    [ANDI, { id: ANDI, name: 'Andi Pratama', position: 'Backend Developer' }],
    [BUDI, { id: BUDI, name: 'Budi Santoso', position: 'Frontend Developer' }],
  ]);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AttendanceServiceModule] })
      .overrideProvider(EmployeeClient)
      .useValue(employeeClient)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
    db = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Only the date is faked: timers, sockets and the database driver keep working.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(MORNING));
    employeeClient.findByIds.mockImplementation(async (ids) => new Map(ids.flatMap((id) => (names.has(id) ? [[id, names.get(id)!] as const] : []))));
    await db.query('TRUNCATE attendance_records');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const as = (id: string) => ({ 'x-user-id': id, 'x-user-role': 'EMPLOYEE' });
  const at = (utc: string) => vi.setSystemTime(new Date(utc));

  /** Puts a record in the database directly, for days other than today. */
  const seed = (employeeId: string, type: AttendanceType, utc: string) =>
    db.getRepository(AttendanceRecord).insert({
      id: crypto.randomUUID(),
      employeeId,
      type,
      recordedAt: new Date(utc),
      workDate: toWorkDate(new Date(utc)),
    });

  const countRecords = () => db.getRepository(AttendanceRecord).count();

  describe('POST /attendance/clock-in and clock-out', () => {
    it('clocks in with the time of the server', async () => {
      const { body } = await http.post('/attendance/clock-in').set(as(ANDI)).expect(201);

      expect(body).toMatchObject({ type: 'CLOCK_IN', workDate: '2026-10-09', recordedAt: '2026-10-09T01:00:00.000Z' });
    });

    it('allows one clock in a day', async () => {
      await http.post('/attendance/clock-in').set(as(ANDI)).expect(201);

      const { body } = await http.post('/attendance/clock-in').set(as(ANDI)).expect(409);

      expect(body.message).toBe('You have already clocked in today');
      expect(await countRecords()).toBe(1);
    });

    it('refuses a clock out before a clock in, and saves nothing', async () => {
      const { body } = await http.post('/attendance/clock-out').set(as(ANDI)).expect(422);

      expect(body.message).toBe('You have not clocked in today');
      expect(await countRecords()).toBe(0);
    });

    it('allows one clock out a day', async () => {
      await http.post('/attendance/clock-in').set(as(ANDI)).expect(201);
      at('2026-10-09T09:30:00Z');
      await http.post('/attendance/clock-out').set(as(ANDI)).expect(201);

      const { body } = await http.post('/attendance/clock-out').set(as(ANDI)).expect(409);

      expect(body.message).toBe('You have already clocked out today');
    });

    it('keeps the attendance of each employee apart', async () => {
      await http.post('/attendance/clock-in').set(as(ANDI)).expect(201);

      await http.post('/attendance/clock-in').set(as(BUDI)).expect(201);
      await http.post('/attendance/clock-out').set(as(BUDI)).expect(201);
      const { body } = await http.get('/attendance/today').set(as(ANDI)).expect(200);

      expect(body.status).toBe('WORKING');
    });

    it('puts a clock in after midnight in Jakarta on the next day, although it is still the same day in UTC', async () => {
      at('2026-10-09T17:05:00Z');

      const { body } = await http.post('/attendance/clock-in').set(as(ANDI)).expect(201);

      expect(body.workDate).toBe('2026-10-10');
    });

    it('ends a working day at midnight in Jakarta: a clock out then needs a clock in of the new day', async () => {
      at('2026-10-09T16:50:00Z');
      await http.post('/attendance/clock-in').set(as(ANDI)).expect(201);

      at('2026-10-09T17:10:00Z');
      await http.post('/attendance/clock-out').set(as(ANDI)).expect(422);
    });

    it('does not know who is calling without the identity headers', async () => {
      await http.post('/attendance/clock-in').expect(401);
    });
  });

  describe('GET /attendance/today', () => {
    it('follows the day: NOT_STARTED, WORKING, DONE', async () => {
      const status = async () => (await http.get('/attendance/today').set(as(ANDI)).expect(200)).body;

      expect(await status()).toEqual({ workDate: '2026-10-09', status: 'NOT_STARTED', clockIn: null, clockOut: null });

      await http.post('/attendance/clock-in').set(as(ANDI)).expect(201);
      expect(await status()).toMatchObject({ status: 'WORKING', clockIn: '2026-10-09T01:00:00.000Z', clockOut: null });

      at('2026-10-09T09:30:00Z');
      await http.post('/attendance/clock-out').set(as(ANDI)).expect(201);
      expect(await status()).toMatchObject({ status: 'DONE', clockOut: '2026-10-09T09:30:00.000Z' });
    });
  });

  describe('GET /attendance/summary', () => {
    beforeEach(async () => {
      await seed(ANDI, 'CLOCK_IN', '2026-10-08T01:00:00Z');
      await seed(ANDI, 'CLOCK_OUT', '2026-10-08T09:30:00Z'); // 510 minutes
      await seed(ANDI, 'CLOCK_IN', '2026-10-07T01:00:00Z'); // forgot to clock out
      await seed(ANDI, 'CLOCK_IN', '2026-10-05T02:00:00Z');
      await seed(ANDI, 'CLOCK_OUT', '2026-10-05T10:00:00Z'); // 480 minutes
      await seed(ANDI, 'CLOCK_IN', '2026-09-30T01:00:00Z');
      await seed(ANDI, 'CLOCK_OUT', '2026-09-30T09:00:00Z'); // last month
      await seed(BUDI, 'CLOCK_IN', '2026-10-08T01:00:00Z'); // somebody else
    });

    const days = (body: { days: { workDate: string; workedMinutes: number | null }[] }) =>
      body.days.map((day) => [day.workDate, day.workedMinutes]);

    it('is this month up to today by default, newest day first, with the totals', async () => {
      const { body } = await http.get('/attendance/summary').set(as(ANDI)).expect(200);

      expect(body).toMatchObject({ from: '2026-10-01', to: '2026-10-09' });
      expect(days(body)).toEqual([
        ['2026-10-08', 510],
        ['2026-10-07', null],
        ['2026-10-05', 480],
      ]);
      expect(body.totals).toEqual({ daysPresent: 3, totalMinutes: 990, averageMinutes: 495 });
    });

    it('includes both end dates of the period that is asked for', async () => {
      const { body } = await http.get('/attendance/summary?from=2026-09-30&to=2026-10-05').set(as(ANDI)).expect(200);

      expect(days(body)).toEqual([
        ['2026-10-05', 480],
        ['2026-09-30', 480],
      ]);
    });

    it('is zero for an employee without attendance', async () => {
      const { body } = await http.get('/attendance/summary').set(as('99999999-9999-4999-8999-999999999999')).expect(200);

      expect(body.days).toEqual([]);
      expect(body.totals).toEqual({ daysPresent: 0, totalMinutes: 0, averageMinutes: 0 });
    });

    it.each([
      ['a date that does not exist', '?from=2026-02-30', ['from must be a date written as YYYY-MM-DD']],
      ['a date with a time', '?to=2026-10-09T00:00:00Z', ['to must be a date written as YYYY-MM-DD']],
      ['a "from" after the "to"', '?from=2026-10-09&to=2026-10-01', 'from must not be after to'],
      ['a period over 366 days', '?from=2024-01-01&to=2026-10-09', 'The date range must be at most 366 days'],
    ])('rejects %s', async (_case, query, message) => {
      const { body } = await http.get(`/attendance/summary${query}`).set(as(ANDI)).expect(400);

      expect(body.message).toEqual(message);
    });
  });

  describe('GET /attendance (the list for HR)', () => {
    beforeEach(async () => {
      await seed(BUDI, 'CLOCK_IN', '2026-10-09T00:30:00Z');
      await seed(BUDI, 'CLOCK_OUT', '2026-10-09T09:00:00Z');
      await seed(ANDI, 'CLOCK_IN', '2026-10-09T01:00:00Z'); // still working
      await seed(ANDI, 'CLOCK_IN', '2026-10-08T01:00:00Z');
      await seed(ANDI, 'CLOCK_OUT', '2026-10-08T09:30:00Z');
    });

    const rows = (body: { items: { employeeName: string | null; workDate: string }[] }) =>
      body.items.map((item) => [item.workDate, item.employeeName]);

    it('shows only today when no dates are given, the earliest clock in first', async () => {
      const { body } = await http.get('/attendance').set(as(ANDI)).expect(200);

      expect(body).toMatchObject({ from: '2026-10-09', to: '2026-10-09', page: 1, pageSize: 20, total: 2 });
      expect(rows(body)).toEqual([
        ['2026-10-09', 'Budi Santoso'],
        ['2026-10-09', 'Andi Pratama'],
      ]);
    });

    it('gives one row per employee per day, with name, position and the minutes worked', async () => {
      const { body } = await http.get('/attendance?from=2026-10-08').set(as(ANDI)).expect(200);

      expect(body.total).toBe(3); // 3 days, although there are 5 records
      expect(body.items).toEqual([
        expect.objectContaining({ employeeName: 'Budi Santoso', position: 'Frontend Developer', clockOut: '2026-10-09T09:00:00.000Z', workedMinutes: 510 }),
        expect.objectContaining({ employeeName: 'Andi Pratama', clockOut: null, workedMinutes: null }),
        expect.objectContaining({ employeeName: 'Andi Pratama', workDate: '2026-10-08', workedMinutes: 510 }),
      ]);
    });

    it('gives one page at a time and still counts all the days', async () => {
      const { body } = await http.get('/attendance?from=2026-10-08&pageSize=2&page=2').set(as(ANDI)).expect(200);

      expect(rows(body)).toEqual([['2026-10-08', 'Andi Pratama']]);
      expect(body).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    });

    it('can be limited to one employee, whatever the case of the id', async () => {
      const { body } = await http.get(`/attendance?from=2026-10-08&employeeId=${ANDI.toUpperCase()}`).set(as(BUDI)).expect(200);

      expect(rows(body)).toEqual([
        ['2026-10-09', 'Andi Pratama'],
        ['2026-10-08', 'Andi Pratama'],
      ]);
      expect(body.total).toBe(2);
    });

    it('is empty for an employee without attendance, and for days without attendance', async () => {
      const unknown = await http.get('/attendance?employeeId=99999999-9999-4999-8999-999999999999').set(as(ANDI)).expect(200);
      const quiet = await http.get('/attendance?from=2026-09-01&to=2026-09-02').set(as(ANDI)).expect(200);

      expect(unknown.body).toMatchObject({ total: 0, items: [] });
      expect(quiet.body).toMatchObject({ total: 0, items: [] });
    });

    it('still answers when the employee service is down: names are null', async () => {
      employeeClient.findByIds.mockResolvedValue(new Map());

      const { body } = await http.get('/attendance').set(as(ANDI)).expect(200);

      expect(body.total).toBe(2);
      expect(body.items[0]).toMatchObject({ employeeName: null, position: null });
    });

    it.each([
      ['an employee id that is not a UUID', '?employeeId=nope', 'employeeId must be a UUID'],
      ['pageSize over 100', '?pageSize=101', 'pageSize must be a whole number between 1 and 100'],
      ['page 0', '?page=0', 'page must be a whole number between 1 and 1000000'],
    ])('rejects %s', async (_case, query, message) => {
      const { body } = await http.get(`/attendance${query}`).set(as(ANDI)).expect(400);

      expect(body.message).toEqual([message]);
    });
  });
});
