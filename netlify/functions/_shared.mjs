import { createClient } from '@supabase/supabase-js';

export function getSupabaseEnv() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, anonKey, serviceRoleKey };
}

export function getSupabaseAdmin() {
  const { url, serviceRoleKey } = getSupabaseEnv();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function verifySupabaseUserAndPro(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, isPro: false };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return { user: null, isPro: false };
  }

  const { url, anonKey, serviceRoleKey } = getSupabaseEnv();
  if (!url || (!serviceRoleKey && !anonKey)) {
    return { user: null, isPro: false };
  }

  // Prefer service role on server; fall back to user-scoped anon client (still verified by Supabase Auth & RLS!)
  const client = serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
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
    profile: profile || null,
  };
}

export function isProhibitedContent(text) {
  const blocked =
    /\b(kill yourself|kys|suicide|murder|bomb threat|terrorist|rape|molest|child porn|pornography|nude|nsfw|slur|nigger|faggot)\b/i;
  return blocked.test(text || '');
}

export function generateServerFallbackRewrites(rawText, scenarioKind) {
  const lower = (rawText || '').toLowerCase();
  const scenario = (scenarioKind || '').toLowerCase();

  if (scenario.includes('apology') || lower.includes('sorry') || lower.includes('apolog')) {
    return [
      {
        toneId: 'warm',
        title: 'Warm & gentle',
        text: "I'm genuinely sorry for how I handled that earlier. I know it wasn't fair to you, and I take full responsibility. I truly value our relationship and would appreciate the chance to make it right whenever you're ready.",
      },
      {
        toneId: 'direct',
        title: 'Direct & professional',
        text: "I want to apologize for my earlier actions. I take responsibility for how I handled the situation, and I am committed to communicating more clearly and constructively going forward.",
      },
      {
        toneId: 'short',
        title: 'Short & firm',
        text: "I apologize for how I handled that—I take full responsibility and appreciate your patience as we move forward.",
      },
    ];
  }

  if (scenario.includes('raise') || lower.includes('salary') || lower.includes('raise') || lower.includes('pay')) {
    return [
      {
        toneId: 'warm',
        title: 'Warm & gentle',
        text: "I've really enjoyed taking on additional responsibilities over the past few months and contributing to the team's growth. I'd love to schedule 15 minutes next week to discuss aligning my compensation with my expanded role.",
      },
      {
        toneId: 'direct',
        title: 'Direct & professional',
        text: "Over recent months, my scope and contributions have grown well beyond my original role. I would like to schedule time this week to review my compensation so that it reflects these added responsibilities.",
      },
      {
        toneId: 'short',
        title: 'Short & firm',
        text: "Given the expanded responsibilities I've taken on recently, I'd like to schedule a brief meeting this week to discuss a compensation review. Please let me know what time works best.",
      },
    ];
  }

  if (scenario.includes('invite') || lower.includes('wedding') || lower.includes('invite') || lower.includes('flight') || lower.includes("can't come")) {
    return [
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
    ];
  }

  if (scenario.includes('relationship') || lower.includes('break up') || lower.includes('breakup') || lower.includes('dating')) {
    return [
      {
        toneId: 'warm',
        title: 'Warm & gentle',
        text: "I've really appreciated the time we've spent together, and I care about you too much not to be completely honest. After a lot of reflection, I've realized we aren't the right long-term fit, and I think it's best for us to part ways. I genuinely wish you nothing but happiness.",
      },
      {
        toneId: 'direct',
        title: 'Direct & professional',
        text: "I've been doing some honest reflection, and I don't see a future for us moving forward. You deserve clarity rather than hesitation, so I want to end things respectfully. I wish you all the best.",
      },
      {
        toneId: 'short',
        title: 'Short & firm',
        text: "I've appreciated getting to know you, but I don't think we're the right match and want to end things here. Wishing you the very best.",
      },
    ];
  }

  if (scenario.includes('boundary') || lower.includes('boundary') || lower.includes('space') || lower.includes('uncomfortable')) {
    return [
      {
        toneId: 'warm',
        title: 'Warm & gentle',
        text: "I really value our connection, and I want to be open with you so things stay healthy between us. Right now I need to set a clear boundary around this to protect my time and energy. Thank you for understanding.",
      },
      {
        toneId: 'direct',
        title: 'Direct & professional',
        text: "I want to be transparent about my limits here. I am not able to accommodate this moving forward, and I need us to respect that boundary going ahead.",
      },
      {
        toneId: 'short',
        title: 'Short & firm',
        text: "I won't be able to do this going forward. Thanks for respecting my boundary.",
      },
    ];
  }

  if (scenario.includes('feedback') || lower.includes('feedback') || lower.includes('mistake')) {
    return [
      {
        toneId: 'warm',
        title: 'Warm & gentle',
        text: "I really appreciate the effort you've put into this. There are a few specific areas we need to tighten up to hit our quality bar, and I'd love to walk through them together so we get this across the finish line smoothly.",
      },
      {
        toneId: 'direct',
        title: 'Direct & professional',
        text: "After reviewing the latest draft, there are a few key gaps that need to be addressed before we can move forward. Please review the feedback and share an updated version when ready.",
      },
      {
        toneId: 'short',
        title: 'Short & firm',
        text: "This needs a few revisions before we can proceed. Please update the highlighted items and send it back over.",
      },
    ];
  }

  const cleaned = (rawText || '')
    .trim()
    .replace(/\bi\b/g, 'I')
    .replace(/\bdont\b/gi, "don't")
    .replace(/\bcant\b/gi, "can't")
    .replace(/\bpls\b/gi, 'please');

  return [
    {
      toneId: 'warm',
      title: 'Warm & gentle',
      text: `Hey, I wanted to be honest and share this with you thoughtfully: ${cleaned} I really value our connection and appreciate your understanding.`,
    },
    {
      toneId: 'direct',
      title: 'Direct & professional',
      text: `I wanted to follow up clearly regarding this: ${cleaned} Please let me know how you would like to proceed.`,
    },
    {
      toneId: 'short',
      title: 'Short & firm',
      text: `Quick note to be clear on my end: ${cleaned} Thanks for understanding.`,
    },
  ];
}

export function enforcePaywallOnVersions(versions, isPro) {
  return (versions || []).map((v, idx) => {
    if (isPro || idx === 0) {
      return {
        toneId: v.toneId,
        title: v.title,
        text: v.text,
        locked: false,
      };
    }
    // REAL PAYWALL SECURITY: Never transmit paid tone text to unverified / free clients!
    return {
      toneId: v.toneId,
      title: v.title,
      text: '',
      locked: true,
    };
  });
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
