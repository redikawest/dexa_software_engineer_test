import { Logger } from '@nestjs/common';
import { connect, type ChannelModel, type ConsumeMessage, type RecoveringChannelModel } from 'amqplib';
import { parseProfileChangedEvent, type ProfileChangedEvent } from './events.js';
import { assertProfileEventsTopology, DELIVERY_LIMIT } from './topology.js';

export interface EventConsumer {
  queue: string;
  handle: (event: ProfileChangedEvent) => Promise<void>;
}

const PREFETCH = 10;
const DEFAULT_RETRY_STEP_MS = 2000;
const RETRY_MAX_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ConsumerOptions {
  retryStepMs?: number;
}

export interface RunningConsumers {
  close(): Promise<void>;
}

export async function startEventConsumers(
  url: string,
  consumers: EventConsumer[],
  { retryStepMs = DEFAULT_RETRY_STEP_MS }: ConsumerOptions = {},
): Promise<RunningConsumers> {
  const logger = new Logger('EventConsumers');

  const connection: RecoveringChannelModel = await connect(url, {
    recovery: {
      waitForConnect: false,
      setup: async (model: ChannelModel) => {
        const channel = await model.createChannel();
        await assertProfileEventsTopology(channel);
        await channel.prefetch(PREFETCH);
        channel.on('error', (error) => logger.warn(`Channel error: ${error.message}`));

        for (const { queue, handle } of consumers) {
          await channel.consume(queue, async (message: ConsumeMessage | null) => {
            if (!message) return;
            await process(message);

            async function process(msg: ConsumeMessage) {
              let event: ProfileChangedEvent;
              try {
                event = parseProfileChangedEvent(JSON.parse(msg.content.toString('utf8')));
              } catch (error) {
                logger.error(`[${queue}] Unreadable message, sending it to the dead queue: ${(error as Error).message}`);
                channel.nack(msg, false, false);
                return;
              }

              try {
                await handle(event);
                channel.ack(msg);
              } catch (error) {
                const attempt = Number(msg.properties.headers?.['x-acquired-count'] ?? 0) + 1;
                if (attempt >= DELIVERY_LIMIT) {
                  logger.error(
                    `[${queue}] Handling ${event.eventId} failed ${attempt} times, sending it to the dead queue: ${(error as Error).message}`,
                  );
                  channel.nack(msg, false, false);
                  return;
                }
                logger.warn(`[${queue}] Handling ${event.eventId} failed (attempt ${attempt}): ${(error as Error).message}`);
                await sleep(Math.min(attempt * retryStepMs, RETRY_MAX_MS));
                channel.nack(msg, false, true);
              }
            }
          });
          logger.log(`Listening on ${queue}`);
        }
      },
    },
  });

  connection.on('error', (error) => logger.warn(`Broker connection error: ${error.message}`));
  connection.on('disconnect', (error) => logger.warn(`Lost the message broker: ${error.message}`));
  connection.on('reconnect-scheduled', ({ attempt, delay }) =>
    logger.warn(`Reconnecting to the broker (attempt ${attempt}, in ${delay} ms)`),
  );

  return { close: () => connection.close().catch(() => undefined) };
}
