// Not from '@app/config': its index loads the configuration of the app as soon as it is imported, before the tests have set theirs.
import { USER_ID_HEADER, USER_ROLE_HEADER } from '@app/config/auth-context.js';
import { startGateway, type TestGateway } from './support/gateway-app.js';
import { ROUTES, SAMPLE_ID, type RouteCase } from './support/routes.js';
import { ADMIN, ANDI } from './support/tokens.js';

describe('Gateway forwarding (HTTP, fake services behind it)', () => {
  let gateway: TestGateway;

  beforeAll(async () => {
    gateway = await startGateway();
  });
  afterAll(() => gateway.stop());
  beforeEach(() => gateway.resetServices());

  const bearer = async (token?: Promise<string>) => (token ? { Authorization: `Bearer ${await token}` } : {});
  const asAdmin = () => bearer(gateway.tokens.admin());
  const asAndi = () => bearer(gateway.tokens.employee(ANDI));

  describe('where each route goes', () => {
    it.each(ROUTES.map((route) => [`${route.method.toUpperCase()} ${route.path}`, route] as const))(
      '%s is forwarded to the right service, with the right method and path, and to no other',
      async (_name, route: RouteCase) => {
        const headers = route.access === 'public' ? {} : await asAdmin();
        const pending = gateway.http[route.method](route.path).set(headers);

        await (route.body ? pending.send(route.body) : pending).expect(route.okStatus);

        for (const [name, service] of Object.entries(gateway.services)) {
          if (name !== route.service) expect(service.calls, `${name} was called`).toHaveLength(0);
        }
        const [forwarded, ...others] = gateway.services[route.service].calls;
        expect(others).toHaveLength(0);
        expect(forwarded).toMatchObject({ method: route.method.toUpperCase(), url: route.upstreamPath, body: route.body });
      },
    );

    it('gives the answer of the service back unchanged', async () => {
      const answer = { accessToken: 'abc', tokenType: 'Bearer', expiresIn: 3600, user: { id: ANDI, email: 'a@b.co', role: 'EMPLOYEE' } };
      gateway.services.auth.respondWith(200, answer);

      const { body } = await gateway.http.post('/auth/login').send({ email: 'a@b.co', password: 'password-123' }).expect(200);

      expect(body).toEqual(answer);
    });
  });

  describe('who the services are told is calling', () => {
    it('sends the id and role from the token, and not the token itself', async () => {
      await gateway.http.get('/employee/me').set(await asAdmin()).expect(200);

      const { headers } = gateway.services.employee.calls[0]!;
      expect(headers[USER_ID_HEADER]).toBe(ADMIN);
      expect(headers[USER_ROLE_HEADER]).toBe('HR_ADMIN');
      expect(headers.authorization).toBeUndefined();
    });

    it('sends no identity for the login, which has none yet', async () => {
      await gateway.http.post('/auth/login').send({ email: 'a@b.co', password: 'password-123' }).expect(200);

      const { headers } = gateway.services.auth.calls[0]!;
      expect(headers[USER_ID_HEADER]).toBeUndefined();
      expect(headers[USER_ROLE_HEADER]).toBeUndefined();
    });
  });

  describe('what is passed on', () => {
    it('passes the body on as it came: the gateway does not check or change it', async () => {
      const body = { phone: '0812-3456 7890', photoUrl: null, somethingElse: true };

      await gateway.http.patch('/employee/me').set(await asAndi()).send(body).expect(200);

      expect(gateway.services.employee.calls[0]!.body).toEqual(body);
    });

    it.each([
      ['/admin/employees?page=2&pageSize=5&search=jane', 'employee', '/employees?page=2&pageSize=5&search=jane'],
      ['/admin/attendance?from=2026-10-01&to=2026-10-09&employeeId=abc&page=2&pageSize=5', 'attendance', '/attendance?from=2026-10-01&to=2026-10-09&employeeId=abc&page=2&pageSize=5'],
      ['/attendance/summary?from=2026-10-01&to=2026-10-09', 'attendance', '/attendance/summary?from=2026-10-01&to=2026-10-09'],
      ['/admin/notifications?limit=5', 'log', '/notifications?limit=5'],
    ] as const)('passes the query of %s on', async (path, service, expected) => {
      await gateway.http.get(path).set(await asAdmin()).expect(200);

      expect(gateway.services[service].calls[0]!.url).toBe(expected);
    });

    it('drops query values it does not know, so a caller cannot add parameters of its own', async () => {
      await gateway.http.get('/admin/employees?search=jane&isAdmin=true&role=HR_ADMIN').set(await asAdmin()).expect(200);

      expect(gateway.services.employee.calls[0]!.url).toBe('/employees?search=jane');
    });

    it('writes an id from the path so that it cannot reach another path of the service', async () => {
      await gateway.http.get('/admin/employees/..%2Fadmin%2Fsecret').set(await asAdmin()).expect(200);

      expect(gateway.services.employee.calls[0]!.url).toBe('/employees/..%2Fadmin%2Fsecret');
    });
  });

  describe('when a service answers with an error', () => {
    it.each([
      [400, { statusCode: 400, message: ['name is required', 'email must be a valid email address'], error: 'Bad Request' }],
      [404, { statusCode: 404, message: 'Employee not found', error: 'Not Found' }],
      [409, { statusCode: 409, message: 'An employee with this email already exists', error: 'Conflict' }],
      [422, { statusCode: 422, message: 'You have not clocked in today', error: 'Unprocessable Entity' }],
      [503, { statusCode: 503, message: 'The login account could not be created.', error: 'Service Unavailable' }],
    ])('gives the same status %i and the same body to the caller', async (status, answer) => {
      gateway.services.employee.respondWith(status, answer);

      const response = await gateway.http.patch(`/admin/employees/${SAMPLE_ID}`).set(await asAdmin()).send({ name: 'Jane' });

      expect(response.status).toBe(status);
      expect(response.body).toEqual(answer);
    });
  });

  describe('when a service cannot be reached', () => {
    afterEach(() => gateway.services.employee.start());

    it('answers 502 with a short message that does not show where the service lives, and the other services keep working', async () => {
      await gateway.services.employee.stop();

      const { body } = await gateway.http.get('/employee/me').set(await asAndi()).expect(502);

      expect(body.message).toBe('Employee service is unreachable');
      expect(JSON.stringify(body)).not.toMatch(/127\.0\.0\.1|ECONNREFUSED/);
      await gateway.http.get('/attendance/today').set(await asAndi()).expect(200);
    });
  });
});
