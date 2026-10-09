import { Controller, Get } from '@nestjs/common';

@Controller()
export class LogServiceController {
  @Get()
  getHello(): string {
    return 'Hello World From Log Service!';
  }
}
