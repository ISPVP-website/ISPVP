import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  early: {
    regular: process.env.STRIPE_PRICE_EARLY_REGULAR,
    research: process.env.STRIPE_PRICE_EARLY_RESEARCH,
    student: process.env.STRIPE_PRICE_EARLY_STUDENT
  },
  general: {
    regular: process.env.STRIPE_PRICE_GENERAL_REGULAR,
    research: process.env.STRIPE_PRICE_GENERAL_RESEARCH,
    student: process.env.STRIPE_PRICE_GENERAL_STUDENT
  },
  late: {
    regular: process.env.STRIPE_PRICE_LATE_REGULAR,
    research: process.env.STRIPE_PRICE_LATE_RESEARCH,
    student: process.env.STRIPE_PRICE_LATE_STUDENT
  }
};

const DONATION_PRICE_ID = process.env.STRIPE_PRICE_DONATION || '';

function toUtcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

function getCurrentPricingWindow() {
  const now = new Date();
  const todayUtc = toUtcDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());

  const earlyStart = toUtcDate(2026, 5, 15);
  const generalStart = toUtcDate(2026, 8, 2);
  const generalEnd = toUtcDate(2026, 8, 23);
  const lateStart = toUtcDate(2026, 8, 24);
  const lateEnd = toUtcDate(2026, 9, 25);

  if (todayUtc < earlyStart) {
    return '';
  }

  // Early bird is available from May 15 until general registration opens.
  if (todayUtc < generalStart) {
    return 'early';
  }

  if (todayUtc >= generalStart && todayUtc <= generalEnd) {
    return 'general';
  }

  if (todayUtc >= lateStart && todayUtc <= lateEnd) {
    return 'late';
  }

  return '';
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function addCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || '';
  const origin = req.headers.origin || '';
  if (allowed && origin === allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getPriceId(pricingWindow, ticketType) {
  return PRICE_MAP[pricingWindow]?.[ticketType] || '';
}

export default async function handler(req, res) {
  addCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const {
      firstName,
      lastName,
      name,
      email,
      affiliation,
      businessTitle,
      ticketType,
      pricingWindow,
      checkoutType
    } = req.body || {};

    const isDonation = checkoutType === 'donation';
    const resolvedName = name || [firstName, lastName].filter(Boolean).join(' ').trim();

    if (!resolvedName || !email) {
      sendJson(res, 400, { error: 'Missing required fields.' });
      return;
    }

    if (!isDonation && (!affiliation || !businessTitle || !ticketType || !pricingWindow)) {
      sendJson(res, 400, { error: 'Missing required fields.' });
      return;
    }

    if (!isDonation) {
      const activeWindow = getCurrentPricingWindow();
      if (!activeWindow) {
        sendJson(res, 400, {
          error: 'Registration is currently closed. Please check the registration schedule.'
        });
        return;
      }

      if (pricingWindow !== activeWindow) {
        sendJson(res, 400, {
          error: `Only ${activeWindow} pricing is currently available.`
        });
        return;
      }
    }

    const priceId = isDonation ? DONATION_PRICE_ID : getPriceId(pricingWindow, ticketType);
    if (!priceId) {
      sendJson(res, 400, { error: 'No configured Stripe price for this selection.' });
      return;
    }

    const abstractToken = isDonation ? '' : crypto.randomBytes(16).toString('hex');
    const successPath = isDonation ? '/payment-success-donation/' : '/payment-success/';
    const receiptDescription = isDonation
      ? `${resolvedName} | International Symposium for Plant Vascular Pathosystems (ISPVP 2026) Fundraising Support | October 20-23, 2026 | South Padre Island, Texas`
      : `${resolvedName} | International Symposium for Plant Vascular Pathosystems (ISPVP 2026) Registration | October 20-23, 2026 | South Padre Island, Texas | ${businessTitle || ''}`.trim();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      payment_intent_data: {
        receipt_email: email,
        description: receiptDescription
      },
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled/`,
      metadata: {
        checkoutType: isDonation ? 'donation' : 'registration',
        firstName: firstName || '',
        lastName: lastName || '',
        name: resolvedName,
        email,
        affiliation: affiliation || '',
        businessTitle: businessTitle || '',
        ticketType: ticketType || '',
        pricingWindow: pricingWindow || '',
        abstractToken
      }
    });

    sendJson(res, 200, { url: session.url });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unable to create checkout session.' });
  }
}
