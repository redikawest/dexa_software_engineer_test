import { Injectable } from '@nestjs/common';

@Injectable()
export class AttendanceServiceService {
  getHello(): string {
    return 'Hello World From Attendance Service!';
  }
}
