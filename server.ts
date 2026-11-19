import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  express.json({
    limit: '2mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// Initialize Google GenAI
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Supabase server helpers
const getSupabaseEnv = () => ({
  url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim(),
  anonKey: (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  serviceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
});

const getSupabaseAdmin = () => {
  const { url, serviceRoleKey } = getSupabaseEnv();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

async function verifySupabaseUserAndPro(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, isPro: false };
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return { user: null, isPro: false };

  const { url, anonKey, serviceRoleKey } = getSupabaseEnv();
  if (!url || (!serviceRoleKey && !anonKey)) {
    return { user: null, isPro: false };
  }

  const client = serviceRoleKey
    ? createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });

  const { data: userData, error: userErr } = await client.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { user: null, isPro: false };
  }

  const { data: profile } = await client
    .from('profiles')
    .select('is_pro, email, license_key')
    .eq('id', userData.user.id)
    .maybeSingle();

  return {
    user: userData.user,
    isPro: Boolean(profile?.is_pro),
  };
}

function isProhibitedContent(text: string): boolean {
  const blocked =
    /\b(kill yourself|kys|suicide|murder|bomb threat|terrorist|rape|molest|child porn|pornography|nude|nsfw|slur|nigger|faggot)\b/i;
  return blocked.test(text || '');
}

interface RewriteRequest {
  message: string;
  scenario?: string;
  recipient?: string;
  channel?: string;
  relationshipContext?: string;
  customAdjustment?: string;
}

function enforcePaywallOnVersions(versions: any[], isPro: boolean) {
  return (versions || []).map((v, idx) => {
    if (isPro || idx === 0) {
      return {
        toneId: v.toneId,
        title: v.title,
        text: v.text,
        locked: false,
      };
    }
    // Real server-side paywall: never send paid tone text to unverified / free clients
    return {
      toneId: v.toneId,
      title: v.title,
      text: '',
      locked: true,
    };
  });
}

// Fallback generator for edge situations when GEMINI_API_KEY is not set
function generateFallbackRewrites(input: RewriteRequest) {
  const raw = (input.message || '').trim();
  const lower = raw.toLowerCase();
  const scenario = (input.scenario || '').toLowerCase();

  if (scenario.includes('apology') || lower.includes('sorry') || lower.includes('apolog')) {
    return {
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "I'm genuinely sorry for how I handled that earlier. I know it wasn't fair to you, and I take full responsibility. I truly value our relationship and would appreciate the chance to make it right whenever you're ready.",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: 'I want to apologize for my earlier actions. I take responsibility for how I handled the situation, and I am committed to communicating more clearly and constructively going forward.',
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: 'I apologize for how I handled that—I take full responsibility and appreciate your patience as we move forward.',
        },
      ],
    };
  }

  if (scenario.includes('raise') || lower.includes('salary') || lower.includes('raise') || lower.includes('pay')) {
    return {
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "I've really enjoyed taking on additional responsibilities over the past few months and contributing to the team's growth. I'd love to schedule 15 minutes next week to discuss aligning my compensation with my expanded role.",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: 'Over recent months, my scope and contributions have grown well beyond my original role. I would like to schedule time this week to review my compensation so that it reflects these added responsibilities.',
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: "Given the expanded responsibilities I've taken on recently, I'd like to schedule a brief meeting this week to discuss a compensation review. Please let me know what time works best.",
        },
      ],
    };
  }

  if (scenario.includes('invite') || lower.includes('wedding') || lower.includes('invite') || lower.includes('flight') || lower.includes("can't come")) {
    return {
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "Thank you so much for thinking of me and inviting me—it genuinely means a lot. Unfortunately, I won't be able to make it work this time, and I'm really sorry to miss it. I'll be cheering you on and hope you have an unforgettable time!",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: "Thank you for the invitation. Unfortunately, I won't be able to attend due to current commitments. I wanted to let you know as soon as possible so you can plan accordingly, and I wish you all the best.",
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: "Thank you so much for the invite! Unfortunately I won't be able to make it this time, but I hope it goes wonderfully.",
        },
      ],
    };
  }

  return {
    versions: [
      {
        toneId: 'warm',
        title: 'Warm & gentle',
        text: `Hey, thank you so much for thinking of me and for reaching out. I've given this a lot of thought, and while I truly appreciate you and our connection, I'm not in a position to take this on right now. I wanted to be honest with you rather than leave you waiting. Wishing you all the best with everything!`,
      },
      {
        toneId: 'direct',
        title: 'Direct & professional',
        text: `Hi there, thank you for checking in. After reviewing my current commitments and priorities, I won't be able to move forward with this. I wanted to let you know as soon as possible so you can plan accordingly. Best regards.`,
      },
      {
        toneId: 'short',
        title: 'Short & firm',
        text: `Thanks for reaching out, but I won't be able to do this. Appreciate your understanding.`,
      },
    ],
  };
}

// POST /api/rewrite - Server-enforced paywall rewriting engine
app.post('/api/rewrite', async (req: Request, res: Response) => {
  try {
    const { message, scenario, recipient, channel, relationshipContext, customAdjustment } = req.body as RewriteRequest;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter or paste a message draft to rewrite.' });
    }

    if (isProhibitedContent(message)) {
      return res.status(400).json({
        error:
          'This message violates our Safety & Content Moderation Policy (prohibited or harmful content) and cannot be processed.',
      });
    }

    // Check verified Supabase session & database is_pro status
    const { isPro } = await verifySupabaseUserAndPro(req.headers.authorization);

    let rawVersions: any[] | null = null;
    const ai = getAIClient();

    if (ai) {
      try {
        const systemPrompt = `You are WellSaid, an expert interpersonal communication coach and master editor.
Your purpose: Help people say the hard thing, well.
Produce EXACTLY THREE ready-to-send versions in distinct tones:
1. "warm" / "Warm & gentle": Empathetic, softens the sting with genuine care, preserves goodwill without groveling.
2. "direct" / "Direct & professional": Clean, balanced, objective, assertive, polite.
3. "short" / "Short & firm": Economical (1 to 3 sentences maximum), decisive, respectful.
Preserve key names or details naturally.`;

        const userPrompt = `Dreaded Message Draft to Rewrite:
"""
${message}
"""

Contextual details:
- Scenario Type: ${scenario || 'General / Unspecified'}
- Recipient / Relationship: ${recipient || 'Not specified'}
- Preferred Channel / Medium: ${channel || 'Text / SMS'}
- Relationship Nuance: ${relationshipContext || 'None provided'}
${customAdjustment ? `- Additional Specific Request: ${customAdjustment}` : ''}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                versions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      toneId: { type: Type.STRING },
                      title: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['toneId', 'title', 'text'],
                  },
                },
              },
              required: ['versions'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (Array.isArray(parsed.versions) && parsed.versions.length >= 3) {
          rawVersions = parsed.versions;
        }
      } catch (aiError: any) {
        console.warn('AI call encountered error, using fallback rewrites:', aiError?.message);
      }
    }

    if (!rawVersions) {
      rawVersions = generateFallbackRewrites({
        message,
        scenario,
        recipient,
        channel,
        relationshipContext,
        customAdjustment,
      }).versions;
    }

    const versions = enforcePaywallOnVersions(rawVersions, isPro);
    return res.json({ versions, isPro });
  } catch (error: any) {
    console.error('Rewrite error:', error);
    return res.status(500).json({ error: 'Unable to rewrite message right now.' });
  }
});

// POST /api/activate-license - Verify Dodo Payments or Supabase license key and unlock Pro
app.post('/api/activate-license', async (req: Request, res: Response) => {
  try {
    const { user } = await verifySupabaseUserAndPro(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Please sign in before activating a license key.' });
    }

    const licenseKey = typeof req.body?.licenseKey === 'string' ? req.body.licenseKey.trim() : '';
    if (!licenseKey || licenseKey.length < 6) {
      return res.status(400).json({ error: 'Please enter a valid Dodo Payments license key.' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({
        error: 'Server license verification is not configured (missing SUPABASE_SERVICE_ROLE_KEY).',
      });
    }

    // 1. Check internal Supabase licenses table first
    const { data: internalLic } = await supabaseAdmin
      .from('licenses')
      .select('key, is_active, max_uses, uses')
      .ilike('key', licenseKey)
      .maybeSingle();

    let verified = false;
    let instanceId: string | null = null;

    if (internalLic && internalLic.is_active && internalLic.uses < internalLic.max_uses) {
      await supabaseAdmin
        .from('licenses')
        .update({ uses: internalLic.uses + 1 })
        .eq('key', internalLic.key);
      verified = true;
    } else {
      // 2. Verify with Dodo Payments official License API
      const dodoEnv = (process.env.DODO_PAYMENTS_ENV || 'live').toLowerCase();
      const baseUrl = dodoEnv === 'test' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';

      try {
        const activateRes = await fetch(`${baseUrl}/licenses/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_key: licenseKey,
            name: `WellSaid Web (${user.email || user.id})`,
          }),
        });
        if (activateRes.ok) {
          const data: any = await activateRes.json().catch(() => ({}));
          verified = true;
          instanceId = data?.id || null;
        }
      } catch {}

      if (!verified) {
        try {
          const validateRes = await fetch(`${baseUrl}/licenses/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: licenseKey }),
          });
          if (validateRes.ok) {
            const data: any = await validateRes.json().catch(() => ({}));
            if (data?.valid === true) {
              verified = true;
            }
          }
        } catch {}
      }
    }

    if (!verified) {
      return res.status(403).json({
        error: 'Invalid, expired, or already used license key. Please check your Dodo Payments receipt.',
      });
    }

    const { error: updateErr } = await supabaseAdmin.from('profiles').upsert(
      {
        id: user.id,
        email: (user.email || '').toLowerCase(),
        is_pro: true,
        license_key: licenseKey,
        license_instance_id: instanceId,
        pro_activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (updateErr) {
      return res.status(500).json({ error: 'License verified, but failed to save account status.' });
    }

    return res.json({
      success: true,
      isPro: true,
      message: 'Lifetime Pro activated! All 3 tones are now unlocked.',
    });
  } catch (err: any) {
    console.error('Activate license error:', err);
    return res.status(500).json({ error: 'Failed to verify license key.' });
  }
});

// POST /api/dodo-webhook - Auto-upgrade Supabase profile on verified Dodo payment
app.post('/api/dodo-webhook', async (req: any, res: Response) => {
  try {
    const secret = (process.env.DODO_WEBHOOK_SECRET || '').trim();
    if (secret) {
      const webhookId = (req.headers['webhook-id'] as string) || '';
      const webhookTimestamp = (req.headers['webhook-timestamp'] as string) || '';
      const webhookSignature = (req.headers['webhook-signature'] as string) || '';
      const rawBody = req.rawBody || JSON.stringify(req.body || {});
      const secretBytes = secret.startsWith('whsec_')
        ? Buffer.from(secret.slice('whsec_'.length), 'base64')
        : Buffer.from(secret, 'utf8');
      const expected = crypto
        .createHmac('sha256', secretBytes)
        .update(`${webhookId}.${webhookTimestamp}.${rawBody}`)
        .digest('base64');
      const signatures = webhookSignature
        .split(' ')
        .map((s) => (s.includes(',') ? s.split(',')[1] : s))
        .filter(Boolean);
      const validSig = signatures.some((sig) => {
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      });
      if (!validSig) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const payload = req.body || {};
    const eventType = payload.type || payload.event_type || '';
    const data = payload.data || payload;
    const isPaid =
      eventType === 'payment.succeeded' ||
      eventType === 'subscription.active' ||
      data?.status === 'succeeded';

    if (!isPaid) {
      return res.json({ received: true, ignored: eventType });
    }

    const customerEmail = (data?.customer?.email || data?.customer_email || data?.email || '')
      .trim()
      .toLowerCase();
    const paymentId = data?.payment_id || data?.id || null;
    const licenseKey = data?.license_key || null;

    if (!customerEmail) {
      return res.json({ received: true });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    await supabaseAdmin.from('paid_emails').upsert(
      {
        email: customerEmail,
        payment_id: paymentId,
        license_key: licenseKey,
        paid_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

    await supabaseAdmin
      .from('profiles')
      .update({
        is_pro: true,
        license_key: licenseKey,
        pro_activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .ilike('email', customerEmail);

    return res.json({ received: true, upgraded: customerEmail });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

// Serve public directory statically with proper MIME types
app.use(express.static(path.resolve(__dirname, 'public')));

// Vite Middleware & Static Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WellSaid server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
