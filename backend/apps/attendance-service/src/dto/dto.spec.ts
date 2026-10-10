import { ValidationPipe, type Type } from '@nestjs/common';
import { validationOptions } from '../setup-app.js';
import { AdminAttendanceQueryDto } from './admin-attendance-query.dto.js';
import { DateRangeQueryDto } from './date-range-query.dto.js';

// The same pipe with the same options as the real app.
const pipe = new ValidationPipe(validationOptions);
const run = <T>(metatype: Type<T>, input: unknown) => pipe.transform(input, { type: 'query', metatype }) as Promise<T>;

const messagesOf = async <T>(metatype: Type<T>, input: unknown) => {
  const error = (await run(metatype, input).then(
    () => null,
    (rejected: unknown) => rejected,
  )) as { getResponse(): { message: string[] } } | null;
  if (!error) throw new Error('the input was accepted');
  return error.getResponse().message;
};

describe('DateRangeQueryDto', () => {
  it('accepts no dates, and real dates written as YYYY-MM-DD', async () => {
    expect(await run(DateRangeQueryDto, {})).toMatchObject({});
    expect(await run(DateRangeQueryDto, { from: '2026-10-01', to: '2028-02-29' })).toMatchObject({
      from: '2026-10-01',
      to: '2028-02-29',
    });
  });

  it.each([
    ['text', 'abc'],
    ['an empty value', ''],
    ['a date that does not exist', '2026-02-30'],
    ['29 February of a year that is not a leap year', '2027-02-29'],
    ['a month 13', '2026-13-01'],
    ['a date with a time', '2026-10-09T00:00:00Z'],
    ['a date without leading zeros', '2026-1-9'],
  ])('rejects %s', async (_case, value) => {
    expect(await messagesOf(DateRangeQueryDto, { from: value })).toEqual(['from must be a date written as YYYY-MM-DD']);
    expect(await messagesOf(DateRangeQueryDto, { to: value })).toEqual(['to must be a date written as YYYY-MM-DD']);
  });

  it('names each field that is wrong', async () => {
    expect(await messagesOf(DateRangeQueryDto, { from: 'bad', to: 'bad' })).toEqual([
      'from must be a date written as YYYY-MM-DD',
      'to must be a date written as YYYY-MM-DD',
    ]);
  });
});

describe('AdminAttendanceQueryDto', () => {
  const ID = '54f0a24b-dd13-4ed4-b3eb-4cc1c481dbcd';

  it('uses page 1 and 20 per page when nothing is given', async () => {
    expect(await run(AdminAttendanceQueryDto, {})).toMatchObject({ page: 1, pageSize: 20 });
  });

  it('reads numbers from the query string, lowercases the employee id, and treats empty values as not given', async () => {
    const dto = await run(AdminAttendanceQueryDto, { page: '2', pageSize: '', employeeId: ID.toUpperCase() });

    expect(dto).toMatchObject({ page: 2, pageSize: 20, employeeId: ID });
    expect(await run(AdminAttendanceQueryDto, { employeeId: '' })).toHaveProperty('employeeId', undefined);
  });

  it.each([
    ['page=0', { page: '0' }, 'page must be a whole number between 1 and 1000000'],
    ['page=abc', { page: 'abc' }, 'page must be a whole number between 1 and 1000000'],
    ['pageSize=101', { pageSize: '101' }, 'pageSize must be a whole number between 1 and 100'],
    ['an employee id that is not a UUID', { employeeId: 'nope' }, 'employeeId must be a UUID'],
  ])('rejects %s', async (_case, input, message) => {
    expect(await messagesOf(AdminAttendanceQueryDto, input)).toEqual([message]);
  });
});
