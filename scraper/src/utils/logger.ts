import pino, { type Logger as PinoLogger } from 'pino';

let _logger: PinoLogger | null = null;

function createLogger(): PinoLogger {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  });
}

export const logger: PinoLogger = new Proxy({} as PinoLogger, {
  get(_, prop) {
    if (!_logger) {
      _logger = createLogger();
    }
    return (_logger as any)[prop];
  },
});

export type Logger = PinoLogger;
