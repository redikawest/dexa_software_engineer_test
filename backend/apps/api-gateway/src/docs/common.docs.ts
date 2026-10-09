import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorResponse } from '../types/common.js';

/** A route that needs a token. */
export const ProtectedRoute = (tag: string) =>
  applyDecorators(
    ApiTags(tag),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'No token, or the token is not valid.', type: ErrorResponse }),
  );

/** A route that needs a token of an HR admin. */
export const AdminRoute = (tag: string) =>
  applyDecorators(
    ProtectedRoute(tag),
    ApiForbiddenResponse({ description: 'The token is not of an HR admin.', type: ErrorResponse }),
  );

export const PageQueries = (maxPageSize: number) =>
  applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Starts at 1.', example: 1 }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: `1 to ${maxPageSize}. Default 20.`,
      example: 20,
    }),
  );
