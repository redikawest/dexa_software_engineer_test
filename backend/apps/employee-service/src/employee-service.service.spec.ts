import { BadRequestException, ConflictException, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { EventPublisher } from '@app/messaging';
import { QueryFailedError, type Repository } from 'typeorm';
import type { AuthClient } from './auth-client.js';
import type { Employee } from './employee.entity.js';
import { EmployeeServiceService } from './employee-service.service.js';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const EMPLOYEE_ID = '22222222-2222-4222-8222-222222222222';

const newEmployee = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  position: 'Backend Developer',
  phone: '081234567890',
  password: 'password-123',
};

const uniqueViolation = () =>
  new QueryFailedError('INSERT', [], Object.assign(new Error('duplicate key'), { code: '23505' }));

// The database, the auth service and the message queue are replaced by fakes.
// These tests are about the order of the steps and what is undone when one of them fails.
describe('EmployeeServiceService', () => {
  const insert = vi.fn<(row: unknown) => Promise<unknown>>();
  const remove = vi.fn<(criteria: unknown) => Promise<unknown>>();
  const findOne = vi.fn<(options: unknown) => Promise<Employee | null>>();
  const save = vi.fn<(employee: Employee) => Promise<Employee>>();
  const createLogin = vi.fn<AuthClient['createLogin']>();
  const setLoginActive = vi.fn<AuthClient['setLoginActive']>();
  const deleteLogin = vi.fn<AuthClient['deleteLogin']>();
  const announceProfileChanged = vi.fn<(event: unknown) => void>();
  let service: EmployeeServiceService;
  let employee: Employee;

  beforeEach(() => {
    vi.resetAllMocks();
    employee = {
      id: EMPLOYEE_ID,
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      position: 'Backend Developer',
      phone: '081234567890',
      photoUrl: null,
      isActive: true,
    } as Employee;

    insert.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
    findOne.mockResolvedValue(employee);
    save.mockImplementation(async (saved) => saved);
    createLogin.mockResolvedValue({ ok: true });
    setLoginActive.mockResolvedValue('ok');
    deleteLogin.mockResolvedValue(true);

    service = new EmployeeServiceService(
      { insert, delete: remove, findOne, save } as unknown as Repository<Employee>,
      { createLogin, setLoginActive, deleteLogin } as unknown as AuthClient,
      { announceProfileChanged } as unknown as EventPublisher,
    );
  });

  describe('create', () => {
    it('saves the profile first, then makes the login with the same id', async () => {
      await service.create(ADMIN_ID, newEmployee);

      const saved = insert.mock.calls[0]![0] as { id: string; fullName: string; createdBy: string };
      expect(saved).toMatchObject({ fullName: 'Jane Doe', email: 'jane.doe@example.com', createdBy: ADMIN_ID });
      expect(createLogin).toHaveBeenCalledWith({ id: saved.id, email: 'jane.doe@example.com', password: 'password-123' });
      expect(JSON.stringify(saved)).not.toContain('password-123');
      expect(remove).not.toHaveBeenCalled();
    });

    it('does not ask the auth service for a login when the email is already taken', async () => {
      insert.mockRejectedValue(uniqueViolation());

      await expect(service.create(ADMIN_ID, newEmployee)).rejects.toThrow(
        new ConflictException('An employee with this email already exists'),
      );
      expect(createLogin).not.toHaveBeenCalled();
    });

    it('removes the profile and the login again when the auth service says the email is taken', async () => {
      createLogin.mockResolvedValue({ ok: false, reason: 'conflict' });

      await expect(service.create(ADMIN_ID, newEmployee)).rejects.toThrow(
        new ConflictException('A login account with this email already exists'),
      );

      const { id } = insert.mock.calls[0]![0] as { id: string };
      expect(deleteLogin).toHaveBeenCalledWith(id);
      expect(remove).toHaveBeenCalledWith({ id });
    });

    it('removes the profile and asks the caller to try again when the auth service is down', async () => {
      createLogin.mockResolvedValue({ ok: false, reason: 'unavailable' });

      await expect(service.create(ADMIN_ID, newEmployee)).rejects.toBeInstanceOf(ServiceUnavailableException);

      const { id } = insert.mock.calls[0]![0] as { id: string };
      expect(remove).toHaveBeenCalledWith({ id });
    });

    it('still tries to remove the profile when removing the login fails, and says so in the log', async () => {
      const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      createLogin.mockResolvedValue({ ok: false, reason: 'unavailable' });
      deleteLogin.mockResolvedValue(false);

      await expect(service.create(ADMIN_ID, newEmployee)).rejects.toBeInstanceOf(ServiceUnavailableException);

      expect(remove).toHaveBeenCalledOnce();
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('Clean it up by hand'));
      logError.mockRestore();
    });
  });

  describe('update', () => {
    it('does not let an admin switch off their own account', async () => {
      findOne.mockResolvedValue(Object.assign(employee, { id: ADMIN_ID }));

      await expect(service.update(ADMIN_ID, ADMIN_ID, { isActive: false })).rejects.toThrow(
        new BadRequestException('You cannot deactivate your own account'),
      );
      expect(setLoginActive).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    });

    it('changes nothing when the auth service is down, so the profile and the login never disagree', async () => {
      setLoginActive.mockResolvedValue('unavailable');

      await expect(service.update(ADMIN_ID, EMPLOYEE_ID, { isActive: false })).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(save).not.toHaveBeenCalled();
      expect(employee.isActive).toBe(true);
    });

    it('puts the login back when the profile cannot be saved', async () => {
      save.mockRejectedValue(new Error('database is down'));

      await expect(service.update(ADMIN_ID, EMPLOYEE_ID, { isActive: false })).rejects.toThrow('database is down');

      expect(setLoginActive.mock.calls).toEqual([
        [EMPLOYEE_ID, false],
        [EMPLOYEE_ID, true],
      ]);
    });

    it('does not touch the login when isActive is not part of the change', async () => {
      await service.update(ADMIN_ID, EMPLOYEE_ID, { name: 'Jane Smith', phone: '089911112222' });

      expect(setLoginActive).not.toHaveBeenCalled();
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Jane Smith', phone: '089911112222' }));
    });

    it('refuses an empty change', async () => {
      await expect(service.update(ADMIN_ID, EMPLOYEE_ID, {})).rejects.toThrow(
        new BadRequestException('Send at least one of: name, position, phone, isActive'),
      );
    });
  });

  describe('updateMe', () => {
    it('announces what changed, with the old and the new value', async () => {
      await service.updateMe(EMPLOYEE_ID, 'EMPLOYEE', { phone: '081111111111' });

      expect(announceProfileChanged).toHaveBeenCalledOnce();
      expect(announceProfileChanged.mock.calls[0]![0]).toMatchObject({
        employeeId: EMPLOYEE_ID,
        changedBy: { id: EMPLOYEE_ID, role: 'EMPLOYEE' },
        changes: [{ field: 'phone', from: '081234567890', to: '081111111111' }],
      });
    });

    it('announces nothing when the new value equals the old one', async () => {
      await service.updateMe(EMPLOYEE_ID, 'EMPLOYEE', { phone: '081234567890' });

      expect(announceProfileChanged).not.toHaveBeenCalled();
    });

    it('refuses an empty change', async () => {
      await expect(service.updateMe(EMPLOYEE_ID, 'EMPLOYEE', {})).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
