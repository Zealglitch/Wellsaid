import { GoogleGenAI, Type } from '@google/genai';
import {
  verifySupabaseUserAndPro,
  isProhibitedContent,
  generateServerFallbackRewrites,
  enforcePaywallOnVersions,
  corsHeaders,
} from './_shared.mjs';

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
    const body = JSON.parse(event.body || '{}');
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const scenario = typeof body.scenario === 'string' ? body.scenario : 'General';
    const channel = typeof body.channel === 'string' ? body.channel : 'text';
    const recipient = typeof body.recipient === 'string' ? body.recipient : 'recipient';

    if (!message) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Please paste or type a message first.' }),
      };
    }

    if (message.length > 2000) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Message exceeds 2,000 character limit.' }),
      };
    }

    if (isProhibitedContent(message)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error:
            'This message violates our Safety & Content Moderation Policy (prohibited or harmful content) and cannot be processed.',
        }),
      };
    }

    // Verify Supabase JWT and check real database is_pro status
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const { isPro } = await verifySupabaseUserAndPro(authHeader);

    let rawVersions = null;
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are WellSaid, an expert interpersonal communication coach and master editor.
Help people say the hard thing, well.
Produce EXACTLY THREE ready-to-send versions:
1. toneId "warm", title "Warm & gentle": empathetic, softens the sting without groveling.
2. toneId "direct", title "Direct & professional": clear, objective, assertive, polite.
3. toneId "short", title "Short & firm": 1-3 sentences max, decisive, respectful.
Preserve key details naturally. Refuse harmful/abusive requests.`;

        const userPrompt = `Scenario: ${scenario}
Channel: ${channel}
Recipient: ${recipient}
Message draft:
"""
${message}
"""`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
      } catch (aiErr) {
        console.warn('Gemini rewrite error on Netlify function, using server fallback:', aiErr?.message);
      }
    }

    if (!rawVersions) {
      rawVersions = generateServerFallbackRewrites(message, scenario);
    }

    // Server-side paywall enforcement: strips Tone 2 & 3 text unless isPro === true
    const versions = enforcePaywallOnVersions(rawVersions, isPro);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ versions, isPro }),
    };
  } catch (err) {
    console.error('Rewrite function error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unable to process rewrite request.' }),
    };
  }
}
