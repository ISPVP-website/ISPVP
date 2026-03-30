import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false
  }
};

function sendText(res, status, message) {
  res.statusCode = status;
  res.end(message);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function postToAppsScript(payload) {
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL || '';
  const missingOrPlaceholder =
    !webhookUrl ||
    webhookUrl.includes('DEPLOYMENT_ID') ||
    webhookUrl.includes('YOUR_DEPLOYMENT_ID');

  if (missingOrPlaceholder) {
    // Allow Stripe webhook handling to succeed until Apps Script is configured.
    return;
  }

  const response = await fetch(process.env.APPS_SCRIPT_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apps Script webhook failed: ${response.status} ${text}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendText(res, 405, 'Method not allowed');
    return;
  }

  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = await readRawBody(req);

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.payment_status === 'paid') {
        await postToAppsScript({
          secret: process.env.APPS_SCRIPT_SHARED_SECRET,
          eventType: event.type,
          eventId: event.id,
          sessionId: session.id,
          paymentIntentId: session.payment_intent || '',
          amountTotal: session.amount_total || 0,
          currency: session.currency || 'usd',
          paidAt: new Date().toISOString(),
          name: session.metadata?.name || '',
          email: session.metadata?.email || session.customer_email || '',
          affiliation: session.metadata?.affiliation || '',
          ticketType: session.metadata?.ticketType || '',
          pricingWindow: session.metadata?.pricingWindow || '',
          abstractToken: session.metadata?.abstractToken || ''
        });
      }
    }

    sendText(res, 200, 'ok');
  } catch (error) {
    sendText(res, 400, `Webhook error: ${error.message}`);
  }
}
