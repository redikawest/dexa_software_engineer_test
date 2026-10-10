import { ALLOWED_ORIGIN, startGateway, type TestGateway } from './support/gateway-app.js';
import { ROUTES, docKey } from './support/routes.js';

interface Operation {
  tags?: string[];
  summary?: string;
  security?: unknown[];
  responses: Record<string, { description?: string; content?: Record<string, { schema?: unknown }> }>;
}

describe('Gateway documentation and CORS (HTTP)', () => {
  let gateway: TestGateway;

  beforeAll(async () => {
    gateway = await startGateway();
  });
  afterAll(() => gateway.stop());

  describe('the documentation', () => {
    let operations: Map<string, Operation>;

    beforeAll(async () => {
      const { body } = await gateway.http.get('/docs-json').expect(200);
      operations = new Map(
        Object.entries(body.paths as Record<string, Record<string, Operation>>).flatMap(([path, methods]) =>
          Object.entries(methods).map(([method, operation]) => [`${method.toUpperCase()} ${path}`, operation] as const),
        ),
      );
    });

    it('is a page for people and a JSON file for tools, both without a token', async () => {
      const page = await gateway.http.get('/docs').expect(200);

      expect(page.headers['content-type']).toMatch(/html/);
    });

    it('describes exactly the routes the gateway has: no route missing, none that is gone', () => {
      expect([...operations.keys()].sort()).toEqual(ROUTES.map(docKey).sort());
    });

    it.each(ROUTES.map((route) => [docKey(route), route] as const))('%s is documented in full', (key, route) => {
      const operation = operations.get(key)!;

      expect(operation.tags?.length, 'tag').toBeGreaterThan(0);
      expect(operation.summary, 'summary').toBeTruthy();

      const success = Object.entries(operation.responses).find(([status]) => status.startsWith('2'))!;
      expect(success, 'a success response').toBeDefined();
      expect(success[1].description, 'description of the success response').toBeTruthy();
      expect(success[1].content?.['application/json']?.schema, 'schema of the success response').toBeDefined();

      // The padlock and the 401 and 403 answers must tell the truth about what the guards do.
      // (The login documents a 401 too, for a wrong password, but it has no padlock.)
      expect(operation.security !== undefined, 'padlock').toBe(route.access !== 'public');
      expect('401' in operation.responses, '401').toBe(true);
      expect('403' in operation.responses, '403').toBe(route.access === 'admin');
    });
  });

  describe('CORS', () => {
    it('lets the front end read the answers', async () => {
      const response = await gateway.http.get('/employee/me').set('Origin', ALLOWED_ORIGIN);

      expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    });

    it('gives no permission to any other website', async () => {
      const response = await gateway.http.get('/employee/me').set('Origin', 'https://evil.example.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('answers the check before a PATCH request, and only for the methods and headers the front end needs', async () => {
      const response = await gateway.http
        .options('/employee/me')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'PATCH')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
      expect(response.headers['access-control-allow-methods']).toBe('GET,POST,PATCH,DELETE');
      expect(response.headers['access-control-allow-headers']).toBe('Authorization,Content-Type');
    });

    it('does not answer the check of another website', async () => {
      const response = await gateway.http
        .options('/employee/me')
        .set('Origin', 'https://evil.example.com')
        .set('Access-Control-Request-Method', 'PATCH');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
