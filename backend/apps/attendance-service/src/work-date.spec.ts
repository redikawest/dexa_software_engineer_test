import { toWorkDate } from './work-date.js';

// A working day is a day in Jakarta (UTC+7), whatever time zone the server runs in.
describe('toWorkDate', () => {
  it.each([
    ['09:00 in Jakarta', '2026-10-09T02:00:00Z', '2026-10-09'],
    ['23:59 in Jakarta, still the same day', '2026-10-09T16:59:59Z', '2026-10-09'],
    ['00:00 in Jakarta, already the next day', '2026-10-09T17:00:00Z', '2026-10-10'],
    ['the turn of the year', '2026-12-31T17:00:00Z', '2027-01-01'],
    ['29 February of a leap year', '2028-02-28T17:30:00Z', '2028-02-29'],
  ])('%s', (_case, utc, expected) => {
    expect(toWorkDate(new Date(utc))).toBe(expected);
  });
});
