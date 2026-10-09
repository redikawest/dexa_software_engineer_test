import { ApiProperty } from '@nestjs/swagger';

export type ListAttendanceQuery = {
  from?: string;
  to?: string;
  employeeId?: string;
  page?: string;
  pageSize?: string;
};

export class AttendanceRecordResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['CLOCK_IN', 'CLOCK_OUT'] })
  type!: string;

  @ApiProperty({ description: 'Taken by the server.', type: String, format: 'date-time' })
  recordedAt!: string;

  @ApiProperty({ description: 'The working day (Asia/Jakarta).', example: '2026-10-09' })
  workDate!: string;
}

export class TodayResponse {
  @ApiProperty({ example: '2026-10-09' })
  workDate!: string;

  @ApiProperty({
    enum: ['NOT_STARTED', 'WORKING', 'DONE'],
    description: 'NOT_STARTED: offer clock in. WORKING: offer clock out. DONE: nothing left today.',
  })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  clockIn!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  clockOut!: string | null;
}

export class SummaryDay {
  @ApiProperty({ example: '2026-10-09' })
  workDate!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  clockIn!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  clockOut!: string | null;

  @ApiProperty({ description: 'null while there is no clock out yet.', type: Number, nullable: true, example: 480 })
  workedMinutes!: number | null;
}

export class SummaryTotals {
  @ApiProperty({ description: 'Days with a clock in.', example: 5 })
  daysPresent!: number;

  @ApiProperty({ description: 'Over the days that have both a clock in and a clock out.', example: 2400 })
  totalMinutes!: number;

  @ApiProperty({ description: 'Per finished day. 0 when no day is finished.', example: 480 })
  averageMinutes!: number;
}

export class SummaryResponse {
  @ApiProperty({ example: '2026-10-01' })
  from!: string;

  @ApiProperty({ example: '2026-10-09' })
  to!: string;

  @ApiProperty({ description: 'Newest day first.', type: [SummaryDay] })
  days!: SummaryDay[];

  @ApiProperty({ type: SummaryTotals })
  totals!: SummaryTotals;
}

export class AdminAttendanceItem {
  @ApiProperty({ format: 'uuid' })
  employeeId!: string;

  @ApiProperty({ description: 'null if the employee service could not be reached.', type: String, nullable: true })
  employeeName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  position!: string | null;

  @ApiProperty({ example: '2026-10-09' })
  workDate!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  clockIn!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  clockOut!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 480 })
  workedMinutes!: number | null;
}

export class AdminAttendanceResponse {
  @ApiProperty({ example: '2026-10-09' })
  from!: string;

  @ApiProperty({ example: '2026-10-09' })
  to!: string;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ description: 'Days (one per employee per day) over all pages.', example: 7 })
  total!: number;

  @ApiProperty({ type: [AdminAttendanceItem] })
  items!: AdminAttendanceItem[];
}
