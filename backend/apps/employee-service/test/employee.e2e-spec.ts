import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventPublisher } from '@app/messaging';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AuthClient } from '../src/auth-client.js';
import { Employee } from '../src/employee.entity.js';
import { EmployeeServiceModule } from '../src/employee-service.module.js';
import { configureApp } from '../src/setup-app.js';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const ANDI_ID = '22222222-2222-4222-8222-222222222222';
const BUDI_ID = '33333333-3333-4333-8333-333333333333';

const seedRows = [
  { id: ADMIN_ID, email: 'admin@example.com', fullName: 'Hana Admin', position: 'HR Manager', phone: '081200000001' },
  { id: ANDI_ID, email: 'andi@example.com', fullName: 'Andi Pratama', position: 'Backend Developer', phone: '081200000002' },
  { id: BUDI_ID, email: 'budi@example.com', fullName: 'Budi Santoso', position: 'Frontend Developer', phone: '081200000003' },
];

const newEmployee = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  position: 'QA Engineer',
  phone: '0812-3456 7890',
  password: 'password-123',
};

describe('Employee service (HTTP, real database)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let db: DataSource;

  // The other services are replaced: the auth service by a fake that tests can switch to "down",
  // the message queue by a recorder. HTTP, validation, the service and the database are the real ones.
  const auth = {
    createLogin: vi.fn<AuthClient['createLogin']>(),
    setLoginActive: vi.fn<AuthClient['setLoginActive']>(),
    deleteLogin: vi.fn<AuthClient['deleteLogin']>(),
  };
  const announceProfileChanged = vi.fn<(event: unknown) => void>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [EmployeeServiceModule] })
      .overrideProvider(AuthClient)
      .useValue(auth)
      .overrideProvider(EventPublisher)
      .useValue({ announceProfileChanged })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
    db = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    auth.createLogin.mockResolvedValue({ ok: true });
    auth.setLoginActive.mockResolvedValue('ok');
    auth.deleteLogin.mockResolvedValue(true);

    await db.query('TRUNCATE employees CASCADE');
    await db.getRepository(Employee).insert(seedRows);
  });

  /** The gateway adds these two headers after it has checked the token. */
  const as = (id: string, role: 'EMPLOYEE' | 'HR_ADMIN') => ({ 'x-user-id': id, 'x-user-role': role });
  const asAdmin = as(ADMIN_ID, 'HR_ADMIN');
  const asAndi = as(ANDI_ID, 'EMPLOYEE');
  const countEmployees = async () => (await db.getRepository(Employee).count());

  describe('GET /employee/me', () => {
    it('gives the profile of the caller and nothing that is only for admins', async () => {
      const { body } = await http.get('/employee/me').set(asAndi).expect(200);

      expect(body).toEqual({
        id: ANDI_ID,
        name: 'Andi Pratama',
        email: 'andi@example.com',
        position: 'Backend Developer',
        phone: '081200000002',
        photoUrl: null,
      });
    });

    it('answers 404 when the token is valid but there is no profile', async () => {
      await http.get('/employee/me').set(as('99999999-9999-4999-8999-999999999999', 'EMPLOYEE')).expect(404);
    });

    it('answers 401 without the identity headers', async () => {
      await http.get('/employee/me').expect(401);
    });
  });

  describe('PATCH /employee/me', () => {
    it('saves the cleaned phone number and announces the old and the new value', async () => {
      const { body } = await http.patch('/employee/me').set(asAndi).send({ phone: '0812-3456 7890' }).expect(200);

      expect(body.phone).toBe('081234567890');
      expect((await db.getRepository(Employee).findOneByOrFail({ id: ANDI_ID })).phone).toBe('081234567890');

      expect(announceProfileChanged).toHaveBeenCalledOnce();
      expect(announceProfileChanged.mock.calls[0]![0]).toMatchObject({
        employeeId: ANDI_ID,
        changedBy: { id: ANDI_ID, role: 'EMPLOYEE' },
        changes: [{ field: 'phone', from: '081200000002', to: '081234567890' }],
      });
    });

    it('sets and removes the photo address', async () => {
      await http.patch('/employee/me').set(asAndi).send({ photoUrl: 'https://example.com/a.png' }).expect(200);
      const { body } = await http.patch('/employee/me').set(asAndi).send({ photoUrl: null }).expect(200);

      expect(body.photoUrl).toBeNull();
      expect(announceProfileChanged).toHaveBeenCalledTimes(2);
      expect(announceProfileChanged.mock.calls[1]![0]).toMatchObject({
        changes: [{ field: 'photoUrl', from: 'https://example.com/a.png', to: null }],
      });
    });

    it('announces nothing when the value stays the same', async () => {
      await http.patch('/employee/me').set(asAndi).send({ phone: '081200000002' }).expect(200);

      expect(announceProfileChanged).not.toHaveBeenCalled();
    });

    it('ignores fields a caller must not change', async () => {
      await http.patch('/employee/me').set(asAndi).send({ phone: '081234567890', position: 'CEO', isActive: false }).expect(200);

      const saved = await db.getRepository(Employee).findOneByOrFail({ id: ANDI_ID });
      expect(saved).toMatchObject({ position: 'Backend Developer', isActive: true });
    });

    it.each([
      ['an empty change', {}, 'Send at least one of: phone, photoUrl'],
      ['a wrong phone number', { phone: 'abc' }, ['phone must be an Indonesian mobile number (08..., 628... or +628...)']],
      ['a photo address that is not http(s)', { photoUrl: 'ftp://example.com/a.png' }, ['photoUrl must be an http(s) URL of at most 2048 characters, or null']],
    ])('rejects %s', async (_case, body, message) => {
      const response = await http.patch('/employee/me').set(asAndi).send(body).expect(400);

      expect(response.body.message).toEqual(message);
      expect(announceProfileChanged).not.toHaveBeenCalled();
    });
  });

  describe('POST /employees', () => {
    it('adds the profile and asks the auth service for the login with the same id', async () => {
      const { body } = await http.post('/employees').set(asAdmin).send(newEmployee).expect(201);

      expect(body).toMatchObject({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '081234567890',
        isActive: true,
        createdBy: ADMIN_ID,
      });
      expect(JSON.stringify(body)).not.toContain('password');
      expect(auth.createLogin).toHaveBeenCalledExactlyOnceWith({
        id: body.id,
        email: 'jane.doe@example.com',
        password: 'password-123',
      });
    });

    it('answers 409 for an email that is already used, without asking the auth service', async () => {
      await http.post('/employees').set(asAdmin).send({ ...newEmployee, email: 'ANDI@example.com' }).expect(409);

      expect(auth.createLogin).not.toHaveBeenCalled();
      expect(await countEmployees()).toBe(seedRows.length);
    });

    it('saves nothing when the auth service already has that email', async () => {
      auth.createLogin.mockResolvedValue({ ok: false, reason: 'conflict' });

      const { body } = await http.post('/employees').set(asAdmin).send(newEmployee).expect(409);

      expect(body.message).toBe('A login account with this email already exists');
      expect(await countEmployees()).toBe(seedRows.length);
      expect(auth.deleteLogin).toHaveBeenCalledOnce();
    });

    it('saves nothing and answers 503 when the auth service is down', async () => {
      auth.createLogin.mockResolvedValue({ ok: false, reason: 'unavailable' });

      await http.post('/employees').set(asAdmin).send(newEmployee).expect(503);

      expect(await countEmployees()).toBe(seedRows.length);
    });

    it('reports every wrong field at once', async () => {
      const { body } = await http.post('/employees').set(asAdmin).send({}).expect(400);

      expect(body.message).toHaveLength(5);
      expect(auth.createLogin).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /employees/:id', () => {
    it('changes the fields that are sent and leaves the others', async () => {
      const { body } = await http
        .patch(`/employees/${ANDI_ID}`)
        .set(asAdmin)
        .send({ position: ' Team Lead ', phone: '0899 1111 2222' })
        .expect(200);

      expect(body).toMatchObject({ name: 'Andi Pratama', position: 'Team Lead', phone: '089911112222' });
      expect(auth.setLoginActive).not.toHaveBeenCalled();
    });

    it('switches the login off together with the profile, and on again', async () => {
      await http.patch(`/employees/${ANDI_ID}`).set(asAdmin).send({ isActive: false }).expect(200);
      expect(auth.setLoginActive).toHaveBeenLastCalledWith(ANDI_ID, false);
      expect((await db.getRepository(Employee).findOneByOrFail({ id: ANDI_ID })).isActive).toBe(false);

      await http.patch(`/employees/${ANDI_ID}`).set(asAdmin).send({ isActive: true }).expect(200);
      expect(auth.setLoginActive).toHaveBeenLastCalledWith(ANDI_ID, true);
    });

    it('does not let an admin switch off their own account', async () => {
      const { body } = await http.patch(`/employees/${ADMIN_ID}`).set(asAdmin).send({ isActive: false }).expect(400);

      expect(body.message).toBe('You cannot deactivate your own account');
      expect(auth.setLoginActive).not.toHaveBeenCalled();
    });

    it('changes nothing when the auth service is down', async () => {
      auth.setLoginActive.mockResolvedValue('unavailable');

      await http.patch(`/employees/${ANDI_ID}`).set(asAdmin).send({ isActive: false }).expect(503);

      expect((await db.getRepository(Employee).findOneByOrFail({ id: ANDI_ID })).isActive).toBe(true);
    });

    it.each([
      ['an empty change', {}, 400],
      ['an empty name', { name: '  ' }, 400],
    ])('rejects %s', async (_case, body, status) => {
      await http.patch(`/employees/${ANDI_ID}`).set(asAdmin).send(body).expect(status);
    });

    it('answers 404 for an unknown employee and 400 for an id that is not a UUID', async () => {
      await http.patch('/employees/99999999-9999-4999-8999-999999999999').set(asAdmin).send({ name: 'X' }).expect(404);
      await http.patch('/employees/not-a-uuid').set(asAdmin).send({ name: 'X' }).expect(400);
    });
  });

  describe('GET /employees', () => {
    it('lists everyone sorted by name, with the total', async () => {
      const { body } = await http.get('/employees').set(asAdmin).expect(200);

      expect(body.items.map((item: { name: string }) => item.name)).toEqual(['Andi Pratama', 'Budi Santoso', 'Hana Admin']);
      expect(body).toMatchObject({ page: 1, pageSize: 20, total: 3 });
    });

    it('gives one page at a time and counts all of them', async () => {
      const { body } = await http.get('/employees?page=2&pageSize=2').set(asAdmin).expect(200);

      expect(body.items.map((item: { name: string }) => item.name)).toEqual(['Hana Admin']);
      expect(body).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    });

    it.each([
      ['part of the name, in any case', 'PRATA', ['Andi Pratama']],
      ['part of the email', 'budi@', ['Budi Santoso']],
      ['a text nobody has', 'zzzz', []],
      ['a percent sign, which is a character and not a wildcard', '%', []],
    ])('searches by %s', async (_case, search, names) => {
      const { body } = await http.get('/employees').query({ search }).set(asAdmin).expect(200);

      expect(body.items.map((item: { name: string }) => item.name)).toEqual(names);
      expect(body.total).toBe(names.length);
    });

    it('rejects a wrong page', async () => {
      await http.get('/employees?page=0').set(asAdmin).expect(400);
    });
  });

  describe('GET /employees/:id', () => {
    it('gives the details, including who added the employee', async () => {
      const { body } = await http.get(`/employees/${ANDI_ID}`).set(asAdmin).expect(200);

      expect(body).toMatchObject({ id: ANDI_ID, isActive: true, createdBy: null });
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    });

    it('answers 404 for an unknown employee and 400 for an id that is not a UUID', async () => {
      await http.get('/employees/99999999-9999-4999-8999-999999999999').set(asAdmin).expect(404);
      await http.get('/employees/not-a-uuid').set(asAdmin).expect(400);
    });
  });

  describe('GET /internal/employees', () => {
    it('gives the name and position for the ids that exist and skips the others', async () => {
      const unknown = '99999999-9999-4999-8999-999999999999';
      const { body } = await http.get(`/internal/employees?ids=${ANDI_ID},${unknown}`).expect(200);

      expect(body).toEqual([{ id: ANDI_ID, name: 'Andi Pratama', position: 'Backend Developer' }]);
    });

    it('gives an empty list without ids and rejects ids that are not UUIDs', async () => {
      await http.get('/internal/employees').expect(200).expect([]);
      await http.get('/internal/employees?ids=nope').expect(400);
    });
  });
});
