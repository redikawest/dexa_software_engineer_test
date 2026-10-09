import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { connect, type ChannelModel, type ConfirmChannel, type RecoveringChannelModel } from 'amqplib';
import { PROFILE_CHANGED, type ProfileChangedEvent } from './events.js';
import { assertProfileEventsTopology, PROFILE_EVENTS_EXCHANGE } from './topology.js';

const CONFIRM_TIMEOUT_MS = 3000;

@Injectable()
export class EventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(EventPublisher.name);
  private connection: RecoveringChannelModel | null = null;
  private channel: ConfirmChannel | null = null;

  async connect(url: string): Promise<void> {
    this.connection = await connect(url, {
      recovery: {
        waitForConnect: false,
        setup: async (model: ChannelModel) => {
          const channel = await model.createConfirmChannel();
          await assertProfileEventsTopology(channel);
          channel.on('error', (error: Error) => this.logger.warn(`Publisher channel error: ${error.message}`));
          channel.on('close', () => {
            if (this.channel === channel) this.channel = null;
          });
          this.channel = channel;
          this.logger.log('Connected to the message broker');
        },
      },
    });
    this.connection.on('error', (error) => this.logger.warn(`Broker connection error: ${error.message}`));
    this.connection.on('disconnect', (error) => {
      this.channel = null;
      this.logger.warn(`Lost the message broker: ${error.message}`);
    });
    this.connection.on('reconnect-scheduled', ({ attempt, delay }) =>
      this.logger.warn(`Reconnecting to the broker (attempt ${attempt}, in ${delay} ms)`),
    );
  }

  async publishProfileChanged(event: ProfileChangedEvent): Promise<void> {
    const channel = this.channel;
    if (!channel) throw new Error('not connected to the message broker');

    const published = new Promise<void>((resolve, reject) => {
      channel.publish(
        PROFILE_EVENTS_EXCHANGE,
        PROFILE_CHANGED,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
          messageId: event.eventId,
          type: PROFILE_CHANGED,
          timestamp: Math.floor(Date.parse(event.occurredAt) / 1000),
        },
        (error) => (error ? reject(error) : resolve()),
      );
    });
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('the broker did not confirm in time')), CONFIRM_TIMEOUT_MS);
    });
    try {
      await Promise.race([published, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  announceProfileChanged(event: ProfileChangedEvent): void {
    this.publishProfileChanged(event).catch((error: Error) => {
      const fields = event.changes.map((change) => change.field).join(', ');
      this.logger.error(
        `Could not publish profile change ${event.eventId} (employee ${event.employeeId}, ${fields}): ${error.message}. The change itself was saved.`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.close().catch(() => undefined);
  }
}
