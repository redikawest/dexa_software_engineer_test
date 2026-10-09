import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LoginResponse } from '../types/auth.js';
import { ErrorResponse, MessageResponse } from '../types/common.js';
import { ProtectedRoute } from './common.docs.js';

export const LoginDocs = () =>
  applyDecorators(
    ApiTags('Auth'),
    ApiOperation({
      summary: 'Log in',
      description: 'Returns a token for the other routes. Works for employees and HR admins. Needs no token.',
    }),
    ApiOkResponse({ description: 'Logged in.', type: LoginResponse }),
    ApiBadRequestResponse({ description: 'Email or password is missing.', type: ErrorResponse }),
    ApiUnauthorizedResponse({
      description: 'Wrong email or password, or the account is switched off. The message is the same for all three.',
      type: ErrorResponse,
    }),
  );

export const ChangePasswordDocs = () =>
  applyDecorators(
    ProtectedRoute('Auth'),
    ApiOperation({
      summary: 'Change my password',
      description: 'Changes the password of the logged-in user. Everyone can only change their own.',
    }),
    ApiOkResponse({ description: 'The password was changed.', type: MessageResponse }),
    ApiBadRequestResponse({
      description: 'A field is missing or too short or long, or the current password is wrong.',
      type: ErrorResponse,
    }),
  );
