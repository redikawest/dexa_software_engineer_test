export const WORK_TIME_ZONE = 'Asia/Jakarta';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WORK_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function toWorkDate(moment: Date): string {
  return formatter.format(moment);
}
