# Project working agreement

## Ticketing service

- Keep the API, queue worker, and infrastructure as separate Docker Compose services.
- Treat ticket inventory changes and order creation as one PostgreSQL transaction.
- Queue only an order identifier; the worker must load the authoritative order data from PostgreSQL.
- Make notification handling idempotent so a retry cannot send a second confirmation.
- Prefer small, tested modules and update the README whenever the local setup changes.

## Verification

- Run the test suite before handing off a change.
- Use `docker compose up --build` as the end-to-end local command.
