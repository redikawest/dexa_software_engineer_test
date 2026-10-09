import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AdminAttendanceResponse, AttendanceRecordResponse, SummaryResponse, TodayResponse } from '../types/attendance.js';
import { ErrorResponse } from '../types/common.js';
import { AdminRoute, PageQueries, ProtectedRoute } from './common.docs.js';

const TAG = 'Attendance';
const dateQuery = (name: 'from' | 'to', description: string) =>
  ApiQuery({ name, required: false, description: `${description} Written as YYYY-MM-DD.`, example: '2026-10-01' });

export const GetTodayDocs = () =>
  applyDecorators(
    ProtectedRoute(TAG),
    ApiOperation({ summary: 'My attendance today', description: 'Tells which button to offer: clock in or clock out.' }),
    ApiOkResponse({ description: 'The status of today and the times so far.', type: TodayResponse }),
  );

export const GetSummaryDocs = () =>
  applyDecorators(
    ProtectedRoute(TAG),
    ApiOperation({
      summary: 'My attendance over a period',
      description: 'This month up to today by default. The period can be at most 366 days.',
    }),
    dateQuery('from', 'First day. Default: the first day of the month of `to`.'),
    dateQuery('to', 'Last day. Default: today.'),
    ApiOkResponse({ description: 'One entry per day with attendance, and the totals.', type: SummaryResponse }),
    ApiBadRequestResponse({
      description: 'A date is not valid, from is after to, or the period is longer than 366 days.',
      type: ErrorResponse,
    }),
  );

export const ClockInDocs = () =>
  applyDecorators(
    ProtectedRoute(TAG),
    ApiOperation({ summary: 'Clock in', description: 'Once a day. The time is taken by the server.' }),
    ApiCreatedResponse({ description: 'The clock in that was saved.', type: AttendanceRecordResponse }),
    ApiConflictResponse({ description: 'Already clocked in today.', type: ErrorResponse }),
  );

export const ClockOutDocs = () =>
  applyDecorators(
    ProtectedRoute(TAG),
    ApiOperation({ summary: 'Clock out', description: 'Only after clocking in, once a day.' }),
    ApiCreatedResponse({ description: 'The clock out that was saved.', type: AttendanceRecordResponse }),
    ApiUnprocessableEntityResponse({ description: 'Has not clocked in today.', type: ErrorResponse }),
    ApiConflictResponse({ description: 'Already clocked out today.', type: ErrorResponse }),
  );

export const ListAllAttendanceDocs = () =>
  applyDecorators(
    AdminRoute('Admin: attendance'),
    ApiOperation({
      summary: 'Attendance of all employees',
      description: 'Read only. One row per employee per day. With no dates, only today is shown.',
    }),
    dateQuery('from', 'First day.'),
    dateQuery('to', 'Last day.'),
    ApiQuery({ name: 'employeeId', required: false, description: 'Only this employee.', format: 'uuid' }),
    PageQueries(100),
    ApiOkResponse({ description: 'One page of days, with the total over all pages.', type: AdminAttendanceResponse }),
    ApiBadRequestResponse({ description: 'A date, employeeId, page or pageSize is not valid.', type: ErrorResponse }),
  );
