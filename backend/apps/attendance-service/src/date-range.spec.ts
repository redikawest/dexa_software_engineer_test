import { BadRequestException } from '@nestjs/common';
import { resolveDateRange } from './date-range.js';

// 15:00 in Jakarta on 9 October 2026.
const NOW = new Date('2026-10-09T08:00:00Z');

describe('resolveDateRange', () => {
  it('is this month up to today when nothing is given', () => {
    expect(resolveDateRange({}, NOW)).toEqual({ from: '2026-10-01', to: '2026-10-09' });
  });

  it('counts "today" in Jakarta, not in UTC', () => {
    // 00:30 on 10 October in Jakarta is still 9 October in UTC.
    expect(resolveDateRange({}, new Date('2026-10-09T17:30:00Z'))).toEqual({ from: '2026-10-01', to: '2026-10-10' });
  });

  it('starts at the first day of the month of "to" when only "to" is given', () => {
    expect(resolveDateRange({ to: '2026-09-15' }, NOW)).toEqual({ from: '2026-09-01', to: '2026-09-15' });
  });

  it('ends today when only "from" is given', () => {
    expect(resolveDateRange({ from: '2026-10-05' }, NOW)).toEqual({ from: '2026-10-05', to: '2026-10-09' });
  });

  it('keeps both dates when both are given, and allows a single day', () => {
    expect(resolveDateRange({ from: '2026-10-09', to: '2026-10-09' }, NOW)).toEqual({ from: '2026-10-09', to: '2026-10-09' });
  });

  it('refuses a "from" after "to"', () => {
    expect(() => resolveDateRange({ from: '2026-10-09', to: '2026-10-01' }, NOW)).toThrow(
      new BadRequestException('from must not be after to'),
    );
  });

  it('refuses a "from" after today when "to" is not given', () => {
    expect(() => resolveDateRange({ from: '2026-10-20' }, NOW)).toThrow(BadRequestException);
  });

  describe('the longest period is 366 days', () => {
    it('accepts exactly 366 days, counting both ends (a leap year)', () => {
      expect(resolveDateRange({ from: '2028-01-01', to: '2028-12-31' }, NOW)).toEqual({ from: '2028-01-01', to: '2028-12-31' });
    });

    it('refuses 367 days', () => {
      expect(() => resolveDateRange({ from: '2027-12-31', to: '2028-12-31' }, NOW)).toThrow(
        new BadRequestException('The date range must be at most 366 days'),
      );
    });
  });
});
