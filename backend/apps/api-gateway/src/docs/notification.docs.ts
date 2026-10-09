import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ErrorResponse } from '../types/common.js';
import { NotificationListResponse, UnreadCountResponse } from '../types/notification.js';
import { AdminRoute } from './common.docs.js';

const TAG = 'Admin: notifications';

export const ListNotificationsDocs = () =>
  applyDecorators(
    AdminRoute(TAG),
    ApiOperation({
      summary: 'Profile changes made by employees',
      description: 'Newest first, with how many are new to this admin. The page asks for it every 15 seconds.',
    }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: '1 to 50. Default 20.', example: 20 }),
    ApiOkResponse({ description: 'The newest notifications and how many are new.', type: NotificationListResponse }),
    ApiBadRequestResponse({ description: 'limit is not valid.', type: ErrorResponse }),
  );

export const MarkNotificationsSeenDocs = () =>
  applyDecorators(
    AdminRoute(TAG),
    ApiOperation({
      summary: 'Mark notifications as seen',
      description: 'Everything up to seenUntil counts as seen for this admin. A time in the past never moves it back.',
    }),
    ApiOkResponse({ description: 'How many are still new.', type: UnreadCountResponse }),
    ApiBadRequestResponse({ description: 'seenUntil is missing or not an ISO time.', type: ErrorResponse }),
  );
