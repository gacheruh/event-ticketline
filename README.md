# Ticketline

An event-ticketing reference service that demonstrates an event-driven purchase flow:

```text
Browser → Fastify API → PostgreSQL transaction → Redis queue → worker → Mailpit
```

The API creates the order and decrements inventory in one PostgreSQL transaction. It then queues only the `orderId`. The worker reads the canonical order data from PostgreSQL, atomically claims the notification, and sends the confirmation email.

## Run locally

1. Copy `.env.example` to `.env` if you want to override defaults.
2. Run `docker compose up --build`.
3. Open `http://localhost:3000` for the operations dashboard.
4. Open `http://localhost:8025` to inspect confirmation emails in Mailpit.

## API

- `POST /api/events` — create an event (`title`, `venue`, `startsAt`)
- `POST /api/events/:eventId/ticket-types` — create allocation (`name`, `priceCents`, `quantityAvailable`)
- `GET /api/events` — list events and remaining inventory
- `POST /api/orders` — confirm an order (`ticketTypeId`, `buyerName`, `buyerEmail`, `quantity`)
- `GET /api/orders/:orderId` — retrieve order and notification status
- `GET /health` — dependency health probe

## Verification

Run `npm test` for route-level checks. Docker is required for the full Postgres, Redis, worker, and Mailpit flow.

## Next production hardening step

Use a transactional outbox table plus a publisher process. It closes the small gap where PostgreSQL commits an order but Redis is unavailable before the queue job is created.
