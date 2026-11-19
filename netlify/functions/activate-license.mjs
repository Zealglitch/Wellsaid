import { getSupabaseAdmin, verifySupabaseUserAndPro, corsHeaders } from './_shared.mjs';

async function verifyWithDodoPayments(licenseKey, instanceName) {
  const env = (process.env.DODO_PAYMENTS_ENV || 'live').toLowerCase();
  const baseUrl = env === 'test' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';

  // 1. Try activating the license key for this user/instance
  try {
    const activateRes = await fetch(`${baseUrl}/licenses/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        name: instanceName,
      }),
    });

    if (activateRes.ok) {
      const data = await activateRes.json().catch(() => ({}));
      return {
        valid: true,
        instanceId: data.id || null,
        source: 'dodo-activate',
      };
    }
  } catch (err) {
    console.warn('Dodo activate request failed:', err?.message);
  }

  // 2. Fallback: validate an already-active key
  try {
    const validateRes = await fetch(`${baseUrl}/licenses/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
      }),
    });

    if (validateRes.ok) {
      const data = await validateRes.json().catch(() => ({}));
      if (data?.valid === true) {
        return {
          valid: true,
          instanceId: null,
          source: 'dodo-validate',
        };
      }
    }
  } catch (err) {
    console.warn('Dodo validate request failed:', err?.message);
  }

  return { valid: false, instanceId: null, source: null };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const { user } = await verifySupabaseUserAndPro(authHeader);

    if (!user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Please sign in to your account before activating a license key.' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';

    if (!licenseKey || licenseKey.length < 6) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Please enter a valid Dodo Payments license key.' }),
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Server license verification is not configured (missing SUPABASE_SERVICE_ROLE_KEY).',
        }),
      };
    }

    // 1. Check internal Supabase licenses table first (for manual / reviewer keys)
    const { data: internalLic } = await supabaseAdmin
      .from('licenses')
      .select('key, is_active, max_uses, uses')
      .ilike('key', licenseKey)
      .maybeSingle();

    let verified = false;
    let instanceId = null;

    if (internalLic && internalLic.is_active && internalLic.uses < internalLic.max_uses) {
      await supabaseAdmin
        .from('licenses')
        .update({ uses: internalLic.uses + 1 })
        .eq('key', internalLic.key);
      verified = true;
    } else {
      // 2. Verify live with Dodo Payments License API
      const dodoResult = await verifyWithDodoPayments(
        licenseKey,
        `WellSaid Web (${user.email || user.id})`
      );
      if (dodoResult.valid) {
        verified = true;
        instanceId = dodoResult.instanceId;
      }
    }

    if (!verified) {
      return {
        statusCode: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid, expired, or already used license key. Please check your Dodo Payments receipt.',
        }),
      };
    }

    // 3. Upgrade the user's profile in Supabase using Service Role (bypasses client RLS safely on server)
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .upsert(
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
      console.error('Failed to update Supabase profile:', updateErr);
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'License verified, but failed to save account status.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        isPro: true,
        message: 'Lifetime Pro activated! All 3 tones are now unlocked.',
      }),
    };
  } catch (err) {
    console.error('Activate license error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to verify license key.' }),
    };
  }
}
