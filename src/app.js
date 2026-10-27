import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pool, withTransaction } from './db.js';
import { queuePurchaseConfirmation } from './queue.js';

const orderQuery = `
  SELECT o.id, o.buyer_name, o.buyer_email, o.quantity, o.total_cents, o.status, o.created_at,
         tt.name AS ticket_type_name, e.title AS event_title, e.venue, e.starts_at
  FROM orders o
  JOIN ticket_types tt ON tt.id = o.ticket_type_id
  JOIN events e ON e.id = tt.event_id
  WHERE o.id = $1`;

export function buildApp({ database = pool, enqueue = queuePurchaseConfirmation } = {}) {
  const app = Fastify({ logger: true });
  app.register(fastifyStatic, { root: fileURLToPath(new URL('../public/', import.meta.url)), prefix: '/' });

  app.get('/health', async () => {
    await database.query('SELECT 1');
    return { status: 'ok' };
  });

  app.get('/api/events', async () => {
    const { rows } = await database.query(`
      SELECT e.id, e.title, e.venue, e.starts_at,
             COALESCE(json_agg(json_build_object('id', tt.id, 'name', tt.name, 'priceCents', tt.price_cents, 'quantityAvailable', tt.quantity_available)
             ORDER BY tt.price_cents) FILTER (WHERE tt.id IS NOT NULL), '[]') AS ticket_types
      FROM events e LEFT JOIN ticket_types tt ON tt.event_id = e.id
      GROUP BY e.id ORDER BY e.starts_at ASC`);
    return rows;
  });

  app.post('/api/events', async (request, reply) => {
    const { title, venue, startsAt } = request.body ?? {};
    if (!title || !venue || !startsAt || Number.isNaN(Date.parse(startsAt))) {
      return reply.code(400).send({ error: 'title, venue, and a valid startsAt are required' });
    }
    const id = randomUUID();
    const { rows } = await database.query(
      'INSERT INTO events (id, title, venue, starts_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, title.trim(), venue.trim(), startsAt]
    );
    return reply.code(201).send(rows[0]);
  });

  app.post('/api/events/:eventId/ticket-types', async (request, reply) => {
    const { name, priceCents, quantityAvailable } = request.body ?? {};
    if (!name || !Number.isInteger(priceCents) || priceCents < 0 || !Number.isInteger(quantityAvailable) || quantityAvailable < 0) {
      return reply.code(400).send({ error: 'name, non-negative integer priceCents, and quantityAvailable are required' });
    }
    const id = randomUUID();
    try {
      const { rows } = await database.query(
        'INSERT INTO ticket_types (id, event_id, name, price_cents, quantity_available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, request.params.eventId, name.trim(), priceCents, quantityAvailable]
      );
      return reply.code(201).send(rows[0]);
    } catch (error) {
      if (error.code === '23503') return reply.code(404).send({ error: 'event not found' });
      throw error;
    }
  });

  app.post('/api/orders', async (request, reply) => {
    const { ticketTypeId, buyerName, buyerEmail, quantity } = request.body ?? {};
    if (!ticketTypeId || !buyerName || !buyerEmail || !Number.isInteger(quantity) || quantity < 1) {
      return reply.code(400).send({ error: 'ticketTypeId, buyerName, buyerEmail, and a positive integer quantity are required' });
    }

    let order;
    try {
      order = await withTransaction(async (client) => {
        const ticket = await client.query(
          'SELECT id, price_cents, quantity_available FROM ticket_types WHERE id = $1 FOR UPDATE', [ticketTypeId]
        );
        if (!ticket.rowCount) {
          const error = new Error('ticket type not found'); error.statusCode = 404; throw error;
        }
        if (ticket.rows[0].quantity_available < quantity) {
          const error = new Error('not enough tickets available'); error.statusCode = 409; throw error;
        }
        const orderId = randomUUID();
        const totalCents = ticket.rows[0].price_cents * quantity;
        await client.query('UPDATE ticket_types SET quantity_available = quantity_available - $1 WHERE id = $2', [quantity, ticketTypeId]);
        await client.query(
          'INSERT INTO orders (id, ticket_type_id, buyer_name, buyer_email, quantity, total_cents) VALUES ($1, $2, $3, $4, $5, $6)',
          [orderId, ticketTypeId, buyerName.trim(), buyerEmail.trim().toLowerCase(), quantity, totalCents]
        );
        await client.query('INSERT INTO notifications (id, order_id) VALUES ($1, $2)', [randomUUID(), orderId]);
        const result = await client.query(orderQuery, [orderId]);
        return result.rows[0];
      });
    } catch (error) {
      if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
      throw error;
    }

    try {
      await enqueue(order.id);
    } catch (error) {
      request.log.error(error, 'Order confirmed but notification enqueue failed');
      return reply.code(202).send({ ...order, notification: 'pending-queue-retry' });
    }
    return reply.code(201).send({ ...order, notification: 'queued' });
  });

  app.get('/api/orders/:orderId', async (request, reply) => {
    const { rows } = await database.query(`
      SELECT o.id, o.buyer_name, o.buyer_email, o.quantity, o.total_cents, o.status, o.created_at,
             n.status AS notification_status, tt.name AS ticket_type_name, e.title AS event_title, e.venue, e.starts_at
      FROM orders o JOIN ticket_types tt ON tt.id = o.ticket_type_id JOIN events e ON e.id = tt.event_id
      LEFT JOIN notifications n ON n.order_id = o.id WHERE o.id = $1`, [request.params.orderId]);
    if (!rows.length) return reply.code(404).send({ error: 'order not found' });
    return rows[0];
  });

  return app;
}
