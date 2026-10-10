import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';

export interface RecordedCall {
  method: string;
  /** The path and the query string, exactly as the gateway sent them. */
  url: string;
  headers: IncomingHttpHeaders;
  body: unknown;
}

/** A small HTTP server that stands in for one of the services behind the gateway and writes down what it receives. */
export class FakeService {
  calls: RecordedCall[] = [];
  private reply: { status: number; body: unknown } = { status: 200, body: { ok: true } };
  private server: Server | null = null;
  private port = 0;

  get url(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  respondWith(status: number, body: unknown): void {
    this.reply = { status, body };
  }

  reset(): void {
    this.calls = [];
    this.reply = { status: 200, body: { ok: true } };
  }

  /** Starts on a free port the first time, and on the same port after a stop(). */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((request, response) => {
        const chunks: Buffer[] = [];
        request.on('data', (chunk: Buffer) => chunks.push(chunk));
        request.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          this.calls.push({
            method: request.method ?? '',
            url: request.url ?? '',
            headers: request.headers,
            body: text ? (JSON.parse(text) as unknown) : undefined,
          });
          response.writeHead(this.reply.status, { 'content-type': 'application/json' });
          response.end(JSON.stringify(this.reply.body));
        });
      });
      this.server.listen(this.port, '127.0.0.1', () => {
        const address = this.server!.address();
        if (address && typeof address === 'object') this.port = address.port;
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) return resolve();
      this.server.closeAllConnections();
      this.server.close(() => resolve());
      this.server = null;
    });
  }
}
