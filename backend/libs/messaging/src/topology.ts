import type { Channel } from 'amqplib';

export const PROFILE_EVENTS_EXCHANGE = 'profile.events';

export const DEAD_EXCHANGE = 'profile.events.dead';
export const DEAD_QUEUE = 'profile.events.dead';

export const AUDIT_QUEUE = 'log-service.audit'; // writes the change to the log database
export const NOTIFY_QUEUE = 'log-service.notify'; // makes a notification for the HR admins

export const DELIVERY_LIMIT = 5;

export async function assertProfileEventsTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(PROFILE_EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertExchange(DEAD_EXCHANGE, 'fanout', { durable: true });

  await channel.assertQueue(DEAD_QUEUE, { durable: true, arguments: { 'x-queue-type': 'quorum' } });
  await channel.bindQueue(DEAD_QUEUE, DEAD_EXCHANGE, '');

  for (const queue of [AUDIT_QUEUE, NOTIFY_QUEUE]) {
    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
        'x-delivery-limit': DELIVERY_LIMIT,
        'x-dead-letter-exchange': DEAD_EXCHANGE,
      },
    });
    await channel.bindQueue(queue, PROFILE_EVENTS_EXCHANGE, 'profile.#');
  }
}
