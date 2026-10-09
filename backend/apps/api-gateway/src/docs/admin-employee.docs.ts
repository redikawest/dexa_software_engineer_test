import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../types/common.js';
import { EmployeeDetail, EmployeeListResponse } from '../types/employee.js';
import { AdminRoute, PageQueries } from './common.docs.js';

const TAG = 'Admin: employees';
const idParam = () => ApiParam({ name: 'id', format: 'uuid', description: 'The id of the employee.' });

export const ListEmployeesDocs = () =>
  applyDecorators(
    AdminRoute(TAG),
    ApiOperation({ summary: 'List employees', description: 'Sorted by name.' }),
    PageQueries(100),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Part of the name or email, at most 100 characters.',
      example: 'jane',
    }),
    ApiOkResponse({ description: 'One page of employees, with the total over all pages.', type: EmployeeListResponse }),
    ApiBadRequestResponse({ description: 'page, pageSize or search is not valid.', type: ErrorResponse }),
  );

export const GetEmployeeDocs = () =>
  applyDecorators(
    AdminRoute(TAG),
    ApiOperation({ summary: 'One employee' }),
    idParam(),
    ApiOkResponse({ description: 'The employee.', type: EmployeeDetail }),
    ApiBadRequestResponse({ description: 'The id is not a UUID.', type: ErrorResponse }),
    ApiNotFoundResponse({ description: 'No employee with this id.', type: ErrorResponse }),
  );

export const CreateEmployeeDocs = () =>
  applyDecorators(
    AdminRoute(TAG),
    ApiOperation({
      summary: 'Add an employee',
      description:
        'Creates the profile and the login account together. If the login cannot be created, nothing is saved.',
    }),
    ApiCreatedResponse({ description: 'The new employee. They can log in right away.', type: EmployeeDetail }),
    ApiBadRequestResponse({ description: 'A field is missing or not valid.', type: ErrorResponse }),
    ApiConflictResponse({ description: 'The email is already used.', type: ErrorResponse }),
    ApiServiceUnavailableResponse({
      description: 'The login account could not be created. Nothing was saved, try again.',
      type: ErrorResponse,
    }),
  );

export const UpdateEmployeeDocs = () =>
  applyDecorators(
    AdminRoute(TAG),
    ApiOperation({
      summary: 'Change an employee',
      description: 'Name, position, phone, or switch the account on or off. Send at least one field.',
    }),
    idParam(),
    ApiOkResponse({ description: 'The employee after the change.', type: EmployeeDetail }),
    ApiBadRequestResponse({
      description: 'Nothing to change, a field is not valid, or an admin tried to switch off their own account.',
      type: ErrorResponse,
    }),
    ApiNotFoundResponse({ description: 'No employee with this id.', type: ErrorResponse }),
    ApiServiceUnavailableResponse({
      description: 'The login account could not be updated. Nothing was changed, try again.',
      type: ErrorResponse,
    }),
  );
