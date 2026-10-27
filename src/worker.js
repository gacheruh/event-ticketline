import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { pool } from './db.js';
import { config } from './config.js';
import { purchaseQueueName, redisConnection } from './queue.js';

const transporter = nodemailer.createTransport({ host: config.smtpHost, port: config.smtpPort, secure: false });

const worker = new Worker(purchaseQueueName, async (job) => {
  const claim = await pool.query(`UPDATE notifications SET status = 'processing', attempts = attempts + 1, last_error = NULL
    WHERE order_id = $1 AND status IN ('pending', 'failed') RETURNING id`, [job.data.orderId]);
  if (!claim.rowCount) return { skipped: 'already-claimed-or-sent' };
  const { rows } = await pool.query(`
    SELECT n.id AS notification_id, o.buyer_name, o.buyer_email, o.quantity, o.total_cents,
           tt.name AS ticket_type_name, e.title AS event_title, e.venue, e.starts_at
    FROM notifications n JOIN orders o ON o.id = n.order_id
    JOIN ticket_types tt ON tt.id = o.ticket_type_id JOIN events e ON e.id = tt.event_id
    WHERE o.id = $1`, [job.data.orderId]);
  if (!rows.length) throw new Error(`Order ${job.data.orderId} was not found`);
  const order = rows[0];
  await transporter.sendMail({
    from: 'tickets@ticketline.local', to: order.buyer_email,
    subject: `Confirmed: ${order.event_title}`,
    text: `Hi ${order.buyer_name}, your ${order.quantity} ${order.ticket_type_name} ticket(s) for ${order.event_title} are confirmed. Venue: ${order.venue}. Total: KES ${(order.total_cents / 100).toFixed(2)}.`
  });
  await pool.query('UPDATE notifications SET status = $1, sent_at = NOW() WHERE id = $2', ['sent', order.notification_id]);
  return { sent: true };
}, { connection: redisConnection });

worker.on('failed', async (job, error) => {
  if (job?.data?.orderId) await pool.query("UPDATE notifications SET status = 'failed', last_error = $1 WHERE order_id = $2 AND status = 'processing'", [error.message, job.data.orderId]);
});
worker.on('error', (error) => console.error('worker error', error));
