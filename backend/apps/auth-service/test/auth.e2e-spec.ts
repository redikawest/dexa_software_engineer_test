import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventPublisher } from '@app/messaging';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AuthServiceModule } from '../src/auth-service.module.js';
import { configureApp } from '../src/setup-app.js';

const ACCOUNT_ID = '22222222-2222-4222-8222-222222222222';
const EMAIL = 'tester@example.com';
const PASSWORD = 'first-password-123';

describe('Auth service (HTTP, real database)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  const announceProfileChanged = vi.fn<(event: unknown) => void>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AuthServiceModule] })
      .overrideProvider(EventPublisher)
      .useValue({ announceProfileChanged })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    announceProfileChanged.mockClear();
    await app.get(DataSource).query('TRUNCATE employee_logins');
    await http.post('/internal/logins').send({ id: ACCOUNT_ID, email: EMAIL, password: PASSWORD }).expect(201);
  });

  const login = (email: string, password: string) => http.post('/auth/login').send({ email, password });
  const changePassword = (body: object) =>
    http.patch('/auth/password').set('x-user-id', ACCOUNT_ID).set('x-user-role', 'EMPLOYEE').send(body);

  describe('POST /auth/login', () => {
    it('gives a token and the user, and ignores case and spaces in the email', async () => {
      const { body } = await login('  TESTER@Example.com ', PASSWORD).expect(200);

      expect(body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { id: ACCOUNT_ID, email: EMAIL, role: 'EMPLOYEE' },
      });
      expect(body.accessToken.split('.')).toHaveLength(3);
    });

    it('answers a wrong password and an unknown email in exactly the same way', async () => {
      const wrongPassword = await login(EMAIL, 'wrong-password').expect(401);
      const unknownEmail = await login('nobody@example.com', PASSWORD).expect(401);

      expect(wrongPassword.body).toEqual(unknownEmail.body);
    });

    it('refuses an account that is switched off', async () => {
      await http.patch(`/internal/logins/${ACCOUNT_ID}`).send({ isActive: false }).expect(200);

      await login(EMAIL, PASSWORD).expect(401);
    });

    it('rejects an empty body with a message per field', async () => {
      const { body } = await http.post('/auth/login').send({}).expect(400);

      expect(body.message).toEqual(['email is required', 'password is required']);
    });
  });

  describe('PATCH /auth/password', () => {
    it('changes the password: the old one stops working, the new one works, and the change is announced', async () => {
      await changePassword({ currentPassword: PASSWORD, newPassword: 'second-password-456' })
        .expect(200)
        .expect({ message: 'Password changed' });

      await login(EMAIL, PASSWORD).expect(401);
      await login(EMAIL, 'second-password-456').expect(200);

      expect(announceProfileChanged).toHaveBeenCalledOnce();
      const event = announceProfileChanged.mock.calls[0]![0];
      expect(event).toMatchObject({ employeeId: ACCOUNT_ID, changes: [{ field: 'password' }] });
      expect(JSON.stringify(event)).not.toContain('second-password-456');
    });

    it('refuses a wrong current password and keeps the old one', async () => {
      const { body } = await changePassword({ currentPassword: 'wrong-password', newPassword: 'second-password-456' }).expect(400);

      expect(body.message).toBe('Current password is incorrect');
      await login(EMAIL, PASSWORD).expect(200);
      expect(announceProfileChanged).not.toHaveBeenCalled();
    });

    it.each([
      ['a new password that is too short', { currentPassword: PASSWORD, newPassword: 'short' }, ['New password must be 8 to 72 characters']],
      ['a missing current password', { newPassword: 'second-password-456' }, ['currentPassword is required']],
    ])('rejects %s', async (_case, body, messages) => {
      const response = await changePassword(body).expect(400);

      expect(response.body.message).toEqual(messages);
    });

    it('does not let a caller without an identity change anything', async () => {
      await http.patch('/auth/password').send({ currentPassword: PASSWORD, newPassword: 'second-password-456' }).expect(401);
    });
  });
});
