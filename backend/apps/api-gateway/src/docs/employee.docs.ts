import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { EmployeeProfile } from '../types/employee.js';
import { ErrorResponse } from '../types/common.js';
import { ProtectedRoute } from './common.docs.js';

export const GetMyProfileDocs = () =>
  applyDecorators(
    ProtectedRoute('Employee'),
    ApiOperation({ summary: 'My profile', description: 'The profile of the logged-in employee.' }),
    ApiOkResponse({ description: 'The profile of the logged-in employee.', type: EmployeeProfile }),
    ApiNotFoundResponse({ description: 'The token is valid but there is no profile for it.', type: ErrorResponse }),
  );

export const UpdateMyProfileDocs = () =>
  applyDecorators(
    ProtectedRoute('Employee'),
    ApiOperation({
      summary: 'Change my phone number or photo address',
      description:
        'Send at least one of phone or photoUrl. The admins are told which fields changed (never the values).',
    }),
    ApiOkResponse({ description: 'The profile after the change.', type: EmployeeProfile }),
    ApiBadRequestResponse({
      description: 'Nothing to change, or a field is not valid.',
      type: ErrorResponse,
    }),
    ApiNotFoundResponse({ description: 'There is no profile for this token.', type: ErrorResponse }),
  );
