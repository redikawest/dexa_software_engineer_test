import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readRabbitUrl } from './config.js';
import { EventPublisher } from './event-publisher.js';

@Module({
  providers: [
    {
      provide: EventPublisher,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const publisher = new EventPublisher();
        await publisher.connect(readRabbitUrl((key) => config.get<string>(key)));
        return publisher;
      },
    },
  ],
  exports: [EventPublisher],
})
export class MessagingModule {}
