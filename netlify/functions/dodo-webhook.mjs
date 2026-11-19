import crypto from 'crypto';
import { getSupabaseAdmin, corsHeaders } from './_shared.mjs';

function verifyWebhookSignature(rawBody, headers) {
  const secret = (process.env.DODO_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return true;
  }

  const webhookId = headers['webhook-id'] || headers['Webhook-Id'] || '';
  const webhookTimestamp = headers['webhook-timestamp'] || headers['Webhook-Timestamp'] || '';
  const webhookSignature = headers['webhook-signature'] || headers['Webhook-Signature'] || '';

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  try {
    // Standard Webhooks verification format (used by Dodo Payments)
    const secretBytes = secret.startsWith('whsec_')
      ? Buffer.from(secret.slice('whsec_'.length), 'base64')
      : Buffer.from(secret, 'utf8');

    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

    const signatures = webhookSignature
      .split(' ')
      .map((s) => (s.includes(',') ? s.split(',')[1] : s))
      .filter(Boolean);

    return signatures.some((sig) => {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
  } catch {
    return false;
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  try {
    const rawBody = event.body || '';
    if (!verifyWebhookSignature(rawBody, event.headers || {})) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }

    const payload = JSON.parse(rawBody || '{}');
    const eventType = payload.type || payload.event_type || '';
    const data = payload.data || payload;

    const isPaidEvent =
      eventType === 'payment.succeeded' ||
      eventType === 'subscription.active' ||
      data?.status === 'succeeded';

    if (!isPaidEvent) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, ignored: eventType }),
      };
    }

    const customerEmail = (
      data?.customer?.email ||
      data?.customer_email ||
      data?.email ||
      ''
    )
      .trim()
      .toLowerCase();

    const paymentId = data?.payment_id || data?.id || null;
    const licenseKey = data?.license_key || null;

    if (!customerEmail) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, warning: 'No customer email in payload' }),
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }),
      };
    }

    // 1. Record in paid_emails (so even if user signs up AFTER paying, trigger grants Pro automatically)
    await supabaseAdmin.from('paid_emails').upsert(
      {
        email: customerEmail,
        payment_id: paymentId,
        license_key: licenseKey,
        paid_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

    // 2. If user already has an account, upgrade their profile immediately
    await supabaseAdmin
      .from('profiles')
      .update({
        is_pro: true,
        license_key: licenseKey,
        pro_activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .ilike('email', customerEmail);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true, upgraded: customerEmail }),
    };
  } catch (err) {
    console.error('Dodo webhook error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Webhook processing error' }),
    };
  }
}
