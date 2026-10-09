import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { LogServiceController } from './log-service.controller.js';
import { ProfileEventsConsumer } from './profile-events.consumer.js';

@Module({
  imports: [AppConfigModule],
  controllers: [LogServiceController],
  providers: [ProfileEventsConsumer],
})
export class LogServiceModule {}
