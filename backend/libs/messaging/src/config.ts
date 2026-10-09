export function readRabbitUrl(get: (key: string) => string | undefined): string {
  const url = get('RABBITMQ_URL')?.trim();
  if (!url) {
    throw new Error('RABBITMQ_URL is required, e.g. amqp://user:password@localhost:5672 (see backend/.env.example)');
  }
  try {
    const { protocol } = new URL(url);
    if (protocol !== 'amqp:' && protocol !== 'amqps:') throw new Error();
  } catch {
    throw new Error('RABBITMQ_URL must be an amqp:// or amqps:// address');
  }
  return url;
}
