import { ADMIN, ANDI } from './support/tokens.js';
import { startGateway, type TestGateway } from './support/gateway-app.js';
import { ROUTES, type RouteCase } from './support/routes.js';

describe('Gateway security (HTTP)', () => {
  let gateway: TestGateway;

  beforeAll(async () => {
    gateway = await startGateway();
  });
  afterAll(() => gateway.stop());
  beforeEach(() => gateway.resetServices());

  const everythingServicesReceived = () => Object.values(gateway.services).flatMap((service) => service.calls);

  const call = (route: RouteCase, token?: string) => {
    const pending = gateway.http[route.method](route.path);
    if (token) pending.set('Authorization', `Bearer ${token}`);
    return route.body ? pending.send(route.body) : pending;
  };

  describe('the token', () => {
    // GET /employee/me is just a route that needs a token. What matters is that no service ever hears about the request.
    const probe = (authorization?: string) => {
      const pending = gateway.http.get('/employee/me');
      return authorization ? pending.set('Authorization', authorization) : pending;
    };

    const INVALID = 'Invalid or expired token';

    it.each([
      ['no Authorization header', async () => undefined, 'Missing bearer token'],
      ['another scheme than Bearer', async () => 'Basic dXNlcjpwYXNz', 'Missing bearer token'],
      ['the word Bearer without a token', async () => 'Bearer', 'Missing bearer token'],
      ['a token that is not a token', async () => 'Bearer not-a-token', INVALID],
      ['an expired token', async () => `Bearer ${await gateway.tokens.sign({ exp: Math.floor(Date.now() / 1000) - 60 })}`, INVALID],
      ['a token signed with a key the gateway does not trust', async () => `Bearer ${await gateway.strangerTokens.admin()}`, INVALID],
      ['a token without a signature ("alg": "none")', async () => `Bearer ${gateway.tokens.unsigned()}`, INVALID],
      ['a token signed with HS256 and the public key as the secret', async () => `Bearer ${gateway.tokens.hmacWithPublicKey()}`, INVALID],
      ['a token from another issuer', async () => `Bearer ${await gateway.tokens.sign({}, { issuer: 'someone-else' })}`, INVALID],
      ['a token for another audience', async () => `Bearer ${await gateway.tokens.sign({}, { audience: 'another-api' })}`, INVALID],
      ['a good signature but a subject that is not a UUID', async () => `Bearer ${await gateway.tokens.sign({ sub: 'admin' })}`, INVALID],
      ['a good signature but a role that does not exist', async () => `Bearer ${await gateway.tokens.sign({ role: 'SUPERUSER' })}`, INVALID],
      ['a good signature but no role', async () => `Bearer ${await gateway.tokens.sign({ role: undefined })}`, INVALID],
    ])('refuses %s, and no service hears about it', async (_case, header, message) => {
      const { body } = await probe(await header()).expect(401);

      expect(body.message).toBe(message);
      expect(everythingServicesReceived()).toHaveLength(0);
    });

    it('accepts a good token, also when the scheme is written in lower case', async () => {
      await probe(`bearer ${await gateway.tokens.employee()}`).expect(200);

      expect(gateway.services.employee.calls).toHaveLength(1);
    });
  });

  describe('who may call which route', () => {
    const protectedRoutes = ROUTES.filter((route) => route.access !== 'public');
    const adminRoutes = ROUTES.filter((route) => route.access === 'admin');
    const everyoneRoutes = ROUTES.filter((route) => route.access === 'any');

    it.each(protectedRoutes.map((route) => [`${route.method.toUpperCase()} ${route.path}`, route] as const))(
      '%s needs a token',
      async (_name, route) => {
        await call(route).expect(401);

        expect(everythingServicesReceived()).toHaveLength(0);
      },
    );

    it.each(adminRoutes.map((route) => [`${route.method.toUpperCase()} ${route.path}`, route] as const))(
      '%s is for HR admins only: an employee is refused and no service hears about it',
      async (_name, route) => {
        const { body } = await call(route, await gateway.tokens.employee()).expect(403);

        expect(body.message).toBe('You do not have access to this resource');
        expect(everythingServicesReceived()).toHaveLength(0);
      },
    );

    it.each(adminRoutes.map((route) => [`${route.method.toUpperCase()} ${route.path}`, route] as const))(
      '%s is open to an HR admin',
      async (_name, route) => {
        await call(route, await gateway.tokens.admin()).expect(route.okStatus);

        expect(everythingServicesReceived()).toHaveLength(1);
      },
    );

    it.each(everyoneRoutes.map((route) => [`${route.method.toUpperCase()} ${route.path}`, route] as const))(
      '%s is open to employees and HR admins',
      async (_name, route) => {
        await call(route, await gateway.tokens.employee()).expect(route.okStatus);
        await call(route, await gateway.tokens.admin()).expect(route.okStatus);
      },
    );

    it('needs no token to log in', async () => {
      const login = ROUTES.find((route) => route.access === 'public')!;

      await call(login).expect(login.okStatus);

      expect(gateway.services.auth.calls).toHaveLength(1);
    });
  });

  describe('a caller who claims an identity in the headers', () => {
    const spoof = { 'x-user-id': ADMIN, 'x-user-role': 'HR_ADMIN' };

    it('does not become an HR admin: the role comes from the token only', async () => {
      await gateway.http
        .get('/admin/employees')
        .set('Authorization', `Bearer ${await gateway.tokens.employee()}`)
        .set(spoof)
        .expect(403);

      expect(everythingServicesReceived()).toHaveLength(0);
    });

    it('does not become somebody else: the services get the id and the role of the token', async () => {
      await gateway.http
        .get('/employee/me')
        .set('Authorization', `Bearer ${await gateway.tokens.employee(ANDI)}`)
        .set(spoof)
        .expect(200);

      expect(gateway.services.employee.calls[0]!.headers).toMatchObject({ 'x-user-id': ANDI, 'x-user-role': 'EMPLOYEE' });
    });
  });
});
