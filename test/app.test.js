import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';

const database = {
  async query(sql) {
    if (sql.includes('SELECT 1')) return { rows: [{ '?column?': 1 }] };
    if (sql.includes('FROM events')) return { rows: [] };
    throw new Error(`Unexpected query: ${sql}`);
  }
};

test('health reports a reachable database', async () => {
  const app = buildApp({ database, enqueue: async () => {} });
  const response = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
  await app.close();
});

test('dashboard is served from the API container', async () => {
  const app = buildApp({ database, enqueue: async () => {} });
  const response = await app.inject({ method: 'GET', url: '/' });
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Capacity you can trust/);
  await app.close();
});

test('events endpoint returns an empty collection from an empty database', async () => {
  const app = buildApp({ database, enqueue: async () => {} });
  const response = await app.inject({ method: 'GET', url: '/api/events' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), []);
  await app.close();
});

test('order endpoint rejects incomplete orders before touching inventory', async () => {
  const app = buildApp({ database, enqueue: async () => {} });
  const response = await app.inject({ method: 'POST', url: '/api/orders', payload: { quantity: 0 } });
  assert.equal(response.statusCode, 400);
  assert.match(response.json().error, /ticketTypeId/);
  await app.close();
});
