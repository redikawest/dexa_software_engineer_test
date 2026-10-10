export type Access = 'public' | 'any' | 'admin';
export type ServiceName = 'auth' | 'employee' | 'attendance' | 'log';

export const SAMPLE_ID = '44444444-4444-4444-8444-444444444444';

export interface RouteCase {
  method: 'get' | 'post' | 'patch';
  path: string;
  /** public: no token. any: every logged-in user. admin: HR admins only. */
  access: Access;
  /** Where the gateway must send the request, and with which path. */
  service: ServiceName;
  upstreamPath: string;
  body?: object;
  /** What the gateway answers when the service answers well: 201 for a POST, unless the route sets its own code. */
  okStatus: 200 | 201;
}

/** Every route of the gateway. A test checks this list against the real routes, so a new route cannot be forgotten. */
export const ROUTES: RouteCase[] = [
  { method: 'post', path: '/auth/login', access: 'public', service: 'auth', upstreamPath: '/auth/login', body: { email: 'a@b.co', password: 'password-123' }, okStatus: 200 },
  { method: 'patch', path: '/auth/password', access: 'any', service: 'auth', upstreamPath: '/auth/password', body: { currentPassword: 'old-password', newPassword: 'new-password-1' }, okStatus: 200 },
  { method: 'get', path: '/employee/me', access: 'any', service: 'employee', upstreamPath: '/employee/me', okStatus: 200 },
  { method: 'patch', path: '/employee/me', access: 'any', service: 'employee', upstreamPath: '/employee/me', body: { phone: '081234567890' }, okStatus: 200 },
  { method: 'get', path: '/attendance/today', access: 'any', service: 'attendance', upstreamPath: '/attendance/today', okStatus: 200 },
  { method: 'get', path: '/attendance/summary', access: 'any', service: 'attendance', upstreamPath: '/attendance/summary', okStatus: 200 },
  { method: 'post', path: '/attendance/clock-in', access: 'any', service: 'attendance', upstreamPath: '/attendance/clock-in', okStatus: 201 },
  { method: 'post', path: '/attendance/clock-out', access: 'any', service: 'attendance', upstreamPath: '/attendance/clock-out', okStatus: 201 },
  { method: 'get', path: '/admin/employees', access: 'admin', service: 'employee', upstreamPath: '/employees', okStatus: 200 },
  { method: 'post', path: '/admin/employees', access: 'admin', service: 'employee', upstreamPath: '/employees', body: { name: 'Jane' }, okStatus: 201 },
  { method: 'get', path: `/admin/employees/${SAMPLE_ID}`, access: 'admin', service: 'employee', upstreamPath: `/employees/${SAMPLE_ID}`, okStatus: 200 },
  { method: 'patch', path: `/admin/employees/${SAMPLE_ID}`, access: 'admin', service: 'employee', upstreamPath: `/employees/${SAMPLE_ID}`, body: { name: 'Jane' }, okStatus: 200 },
  { method: 'get', path: '/admin/notifications', access: 'admin', service: 'log', upstreamPath: '/notifications', okStatus: 200 },
  { method: 'post', path: '/admin/notifications/seen', access: 'admin', service: 'log', upstreamPath: '/notifications/seen', body: { seenUntil: '2026-10-09T08:00:00Z' }, okStatus: 200 },
  { method: 'get', path: '/admin/attendance', access: 'admin', service: 'attendance', upstreamPath: '/attendance', okStatus: 200 },
];

/** The way the route is written in the generated documentation. */
export const docKey = (route: RouteCase) => `${route.method.toUpperCase()} ${route.path.replace(SAMPLE_ID, '{id}')}`;
