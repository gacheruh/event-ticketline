import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://ticketing:ticketing@localhost:5432/ticketing',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  smtpHost: process.env.SMTP_HOST ?? 'localhost',
  smtpPort: Number(process.env.SMTP_PORT ?? 1025)
};
