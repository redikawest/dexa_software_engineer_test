import { ROLES, type Role } from '@app/config';

export const PROFILE_CHANGED = 'profile.changed';

export type ProfileFieldChange =
  | { field: 'phone'; from: string | null; to: string | null }
  | { field: 'photoUrl'; from: string | null; to: string | null }
  | { field: 'password' };

export interface ProfileChangedEvent {
  eventId: string;
  occurredAt: string;
  employeeId: string;
  changedBy: { id: string; role: Role };
  changes: ProfileFieldChange[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_VALUE_LENGTH = 2048;
const MAX_CHANGES = 10;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && value.length <= MAX_VALUE_LENGTH);

export function parseProfileChangedEvent(payload: unknown): ProfileChangedEvent {
  if (!isObject(payload)) throw new Error('the event must be an object');
  const { eventId, occurredAt, employeeId, changedBy, changes } = payload;
  const problems: string[] = [];

  if (typeof eventId !== 'string' || !UUID.test(eventId)) problems.push('eventId must be a UUID');
  if (typeof occurredAt !== 'string' || Number.isNaN(Date.parse(occurredAt))) {
    problems.push('occurredAt must be an ISO time');
  }
  if (typeof employeeId !== 'string' || !UUID.test(employeeId)) problems.push('employeeId must be a UUID');

  const actor = isObject(changedBy) ? changedBy : {};
  if (typeof actor.id !== 'string' || !UUID.test(actor.id)) problems.push('changedBy.id must be a UUID');
  if (!ROLES.includes(actor.role as Role)) problems.push(`changedBy.role must be one of ${ROLES.join(', ')}`);

  const parsedChanges: ProfileFieldChange[] = [];
  if (!Array.isArray(changes) || changes.length === 0 || changes.length > MAX_CHANGES) {
    problems.push(`changes must be a list of 1 to ${MAX_CHANGES} entries`);
  } else {
    for (const change of changes) {
      if (!isObject(change)) {
        problems.push('every change must be an object');
      } else if (change.field === 'password') {
        parsedChanges.push({ field: 'password' }); // nothing else is kept
      } else if (
        (change.field === 'phone' || change.field === 'photoUrl') &&
        isNullableText(change.from) &&
        isNullableText(change.to)
      ) {
        parsedChanges.push({ field: change.field, from: change.from, to: change.to });
      } else {
        problems.push(`unknown or malformed change (field: ${String(change.field)})`);
      }
    }
  }

  if (problems.length > 0) throw new Error(`invalid ProfileChanged event: ${problems.join('; ')}`);

  return {
    eventId: eventId as string,
    occurredAt: new Date(occurredAt as string).toISOString(),
    employeeId: employeeId as string,
    changedBy: { id: actor.id as string, role: actor.role as Role },
    changes: parsedChanges,
  };
}
