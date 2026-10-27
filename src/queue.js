import { Queue } from 'bullmq';
import { config } from './config.js';

export const purchaseQueueName = 'ticket-purchased';
export const redisConnection = { url: config.redisUrl };
let purchaseQueue;

function getPurchaseQueue() {
  purchaseQueue ??= new Queue(purchaseQueueName, { connection: redisConnection });
  return purchaseQueue;
}

export async function queuePurchaseConfirmation(orderId) {
  return getPurchaseQueue().add('ticket-purchased', { orderId }, {
    jobId: `order:${orderId}`,
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 1000
  });
}
