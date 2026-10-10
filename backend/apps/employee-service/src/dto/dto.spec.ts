import { ValidationPipe, type Type } from '@nestjs/common';
import { validationOptions } from '../setup-app.js';
import { CreateEmployeeDto } from './create-employee.dto.js';
import { FindSummariesQueryDto } from './find-summaries-query.dto.js';
import { ListEmployeesQueryDto } from './list-employees-query.dto.js';
import { UpdateEmployeeDto } from './update-employee.dto.js';
import { UpdateProfileDto } from './update-profile.dto.js';

// The same pipe with the same options as the real app, so these tests check what a request really meets.
const pipe = new ValidationPipe(validationOptions);

const run = <T>(metatype: Type<T>, input: unknown, type: 'body' | 'query' = 'body') =>
  pipe.transform(input, { type, metatype }) as Promise<T>;

/** The list of messages of a rejected input. */
const messagesOf = async <T>(metatype: Type<T>, input: unknown, type: 'body' | 'query' = 'body') => {
  const error = (await run(metatype, input, type).then(
    () => null,
    (rejected: unknown) => rejected,
  )) as { getResponse(): { message: string[] } } | null;
  if (!error) throw new Error('the input was accepted');
  return error.getResponse().message;
};

const validEmployee = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  position: 'Backend Developer',
  phone: '081234567890',
  password: 'password-123',
};

describe('CreateEmployeeDto', () => {
  it('cleans the input: trims text, lowercases the email, removes spaces and dashes from the phone', async () => {
    const dto = await run(CreateEmployeeDto, {
      ...validEmployee,
      name: '  Jane Doe  ',
      email: ' Jane.Doe@Example.COM ',
      phone: '0812-3456 7890',
    });

    expect(dto).toMatchObject({ name: 'Jane Doe', email: 'jane.doe@example.com', phone: '081234567890' });
  });

  it('drops fields it does not know, so a caller cannot slip in isActive or role', async () => {
    const dto = await run(CreateEmployeeDto, { ...validEmployee, isActive: false, role: 'HR_ADMIN' });

    expect(dto).not.toHaveProperty('isActive');
    expect(dto).not.toHaveProperty('role');
  });

  it('reports one message per wrong field', async () => {
    expect(await messagesOf(CreateEmployeeDto, {})).toEqual([
      'name is required (at most 100 characters)',
      'position is required (at most 100 characters)',
      'email must be a valid email address',
      'phone must be an Indonesian mobile number (08..., 628... or +628...)',
      'password must be 8 to 72 characters',
    ]);
  });

  it.each([
    ['a blank name', { name: '   ' }, 'name is required (at most 100 characters)'],
    ['a name over 100 characters', { name: 'x'.repeat(101) }, 'name is required (at most 100 characters)'],
    ['an email without a domain', { email: 'jane@' }, 'email must be a valid email address'],
    ['a foreign phone number', { phone: '+14155550100' }, 'phone must be an Indonesian mobile number (08..., 628... or +628...)'],
    ['a short password', { password: 'short' }, 'password must be 8 to 72 characters'],
    ['a password over 72 bytes', { password: 'é'.repeat(37) }, 'password must be 8 to 72 characters'],
  ])('rejects %s', async (_case, change, message) => {
    expect(await messagesOf(CreateEmployeeDto, { ...validEmployee, ...change })).toEqual([message]);
  });
});

describe('UpdateEmployeeDto', () => {
  it('accepts a part of the fields', async () => {
    expect(await run(UpdateEmployeeDto, { position: ' Team Lead ' })).toMatchObject({ position: 'Team Lead' });
  });

  it.each([
    ['name: null', { name: null }, 'name must not be empty (at most 100 characters)'],
    ['a blank position', { position: '  ' }, 'position must not be empty (at most 100 characters)'],
    ['isActive as text', { isActive: 'false' }, 'isActive must be true or false'],
  ])('rejects %s', async (_case, input, message) => {
    expect(await messagesOf(UpdateEmployeeDto, input)).toEqual([message]);
  });
});

describe('UpdateProfileDto', () => {
  it('accepts null as the photo, which removes it', async () => {
    expect(await run(UpdateProfileDto, { photoUrl: null })).toMatchObject({ photoUrl: null });
  });

  it('rejects null as the phone, because a phone cannot be removed', async () => {
    expect(await messagesOf(UpdateProfileDto, { phone: null })).toEqual([
      'phone must be an Indonesian mobile number (08..., 628... or +628...)',
    ]);
  });

  it.each(['ftp://example.com/a.png', 'not a url', `https://example.com/${'a'.repeat(2048)}`])(
    'rejects the photo address %j',
    async (photoUrl) => {
      expect(await messagesOf(UpdateProfileDto, { photoUrl })).toEqual([
        'photoUrl must be an http(s) URL of at most 2048 characters, or null',
      ]);
    },
  );
});

describe('ListEmployeesQueryDto', () => {
  it('uses page 1, 20 per page and no search when nothing is given', async () => {
    expect(await run(ListEmployeesQueryDto, {}, 'query')).toMatchObject({ page: 1, pageSize: 20, search: '' });
  });

  it('reads numbers from the text of the query string, and treats an empty value as not given', async () => {
    expect(await run(ListEmployeesQueryDto, { page: '3', pageSize: '' }, 'query')).toMatchObject({ page: 3, pageSize: 20 });
  });

  it.each([
    ['page=0', { page: '0' }, 'page must be a whole number between 1 and 1000000'],
    ['page=abc', { page: 'abc' }, 'page must be a whole number between 1 and 1000000'],
    ['page=1e3', { page: '1e3' }, 'page must be a whole number between 1 and 1000000'],
    ['pageSize=101', { pageSize: '101' }, 'pageSize must be a whole number between 1 and 100'],
    ['a search over 100 characters', { search: 'x'.repeat(101) }, 'search must be at most 100 characters'],
  ])('rejects %s', async (_case, input, message) => {
    expect(await messagesOf(ListEmployeesQueryDto, input, 'query')).toEqual([message]);
  });
});

describe('FindSummariesQueryDto', () => {
  const ID = '11111111-1111-4111-8111-111111111111';

  it('splits the ids and gives an empty list when there are none', async () => {
    expect((await run(FindSummariesQueryDto, { ids: `${ID},${ID.replace(/1/g, '2')}` }, 'query')).ids).toHaveLength(2);
    expect((await run(FindSummariesQueryDto, {}, 'query')).ids).toEqual([]);
  });

  it('rejects an id that is not a UUID and more than 100 ids', async () => {
    const message = 'ids must be at most 100 comma-separated UUIDs';
    expect(await messagesOf(FindSummariesQueryDto, { ids: 'nope' }, 'query')).toEqual([message]);
    expect(await messagesOf(FindSummariesQueryDto, { ids: Array(101).fill(ID).join(',') }, 'query')).toEqual([message]);
  });
});
