import { toAdminAttendanceQuery } from './admin-attendance-query.js';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto.js';

const NOW = new Date('2026-10-09T08:00:00Z');

/** What the pipe hands over: the defaults of the class, with the given values on top. */
const query = (values: Partial<AdminAttendanceQueryDto> = {}) => Object.assign(new AdminAttendanceQueryDto(), values);

describe('toAdminAttendanceQuery', () => {
  it('shows only today when no dates are given', () => {
    expect(toAdminAttendanceQuery(query(), NOW)).toEqual({
      from: '2026-10-09',
      to: '2026-10-09',
      employeeId: null,
      page: 1,
      pageSize: 20,
    });
  });

  it('goes up to today when only "from" is given', () => {
    expect(toAdminAttendanceQuery(query({ from: '2026-10-01' }), NOW)).toMatchObject({ from: '2026-10-01', to: '2026-10-09' });
  });

  it('starts at the first of the month of "to" when only "to" is given', () => {
    expect(toAdminAttendanceQuery(query({ to: '2026-10-06' }), NOW)).toMatchObject({ from: '2026-10-01', to: '2026-10-06' });
  });

  it('passes the employee and the page on', () => {
    const id = '11111111-1111-4111-8111-111111111111';

    expect(toAdminAttendanceQuery(query({ employeeId: id, page: 3, pageSize: 50 }), NOW)).toMatchObject({
      employeeId: id,
      page: 3,
      pageSize: 50,
    });
  });
});
