import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

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

interface RewriteRequest {
  message: string;
  scenario?: string;
  recipient?: string;
  channel?: string;
  relationshipContext?: string;
  customAdjustment?: string;
}

// Fallback generator for edge situations or sandbox demonstration
function generateFallbackRewrites(input: RewriteRequest) {
  const msg = input.message.trim();
  const channel = input.channel || 'text';
  const recipient = input.recipient || 'recipient';

  return {
    dreadAnalysis: "You're dreading this because setting boundaries or having uncomfortable conversations feels like a risk to the relationship—but honesty delivered with respect actually preserves trust.",
    keyRule: "Clear is kind. Unclear is unkind. You don't need to over-explain or apologize for having limits.",
    versions: [
      {
        toneId: "warm",
        title: "Warm & Gentle",
        subject: channel === 'email' ? "Thinking of you + a quick update" : null,
        text: `Hey, thank you so much for thinking of me and for reaching out. I've given this a lot of thought, and while I truly appreciate you and our connection, I'm not in a position to take this on right now. I wanted to be honest with you rather than leave you waiting. Wishing you all the best with everything!`,
        whyItWorks: "Validates the connection first, removes ambiguity without harshness, and leaves the other person feeling respected rather than rejected.",
        deliveryTip: "Send when you have 15 minutes of quiet time so you aren't anxiously checking notifications.",
        wordCount: 48,
        readingTimeSeconds: 12
      },
      {
        toneId: "direct",
        title: "Direct & Professional",
        subject: channel === 'email' ? "Update regarding recent discussion" : null,
        text: `Hi there, thank you for checking in. After reviewing my current commitments and priorities, I won't be able to move forward with this. I wanted to let you know as soon as possible so you can plan accordingly. Best regards.`,
        whyItWorks: "Objective and composed. Focuses on capacity and facts rather than personal feelings, giving no room for unproductive negotiation.",
        deliveryTip: "Deliver during regular work hours so it's handled like standard business communication.",
        wordCount: 39,
        readingTimeSeconds: 10
      },
      {
        toneId: "short",
        title: "Short & Firm",
        subject: channel === 'email' ? "Update on this" : null,
        text: `Thanks for reaching out, but I won't be able to do this. Appreciate your understanding.`,
        whyItWorks: "Maximum clarity with zero defensive padding. A firm boundary that avoids the trap of inviting debate.",
        deliveryTip: "Press send and step away from your phone for at least 30 minutes.",
        wordCount: 16,
        readingTimeSeconds: 4
      }
    ]
  };
}

// POST /api/rewrite - Main rewriting engine
app.post('/api/rewrite', async (req: Request, res: Response) => {
  try {
    const { message, scenario, recipient, channel, relationshipContext, customAdjustment } = req.body as RewriteRequest;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter or paste a message draft to rewrite.' });
    }

    const ai = getAIClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY is not set. Returning curated communication fallback.');
      const fallback = generateFallbackRewrites({ message, scenario, recipient, channel, relationshipContext, customAdjustment });
      return res.json(fallback);
    }

    const systemPrompt = `You are WellSaid, an expert interpersonal communication coach and master editor.
Your purpose: Help people say the hard thing, well.
People paste raw, emotionally charged, awkward, or dread-inducing drafts (e.g., asking for a raise, declining an invite, setting a boundary with family/boss/friend, giving critical feedback, breaking up, apologizing without groveling, declining money requests).

You will produce EXACTLY THREE ready-to-send versions in distinct tones:
1. "Warm & gentle": Empathetic, softens the sting with genuine care, preserves warmth and relationship goodwill, but DOES NOT apologize for having a boundary or invalidate the user's needs.
2. "Direct & professional": Clean, balanced, objective, assertive, polite, zero passive-aggression or beating around the bush. Workplace- or adult-grade clarity.
3. "Short & firm": Economical (1 to 3 sentences maximum), decisive, leaves zero room for debate, excuses, or negotiations. Unapologetic yet respectful.

Formatting Rules:
- The rewritten messages must be ready to copy and send immediately.
- If channel is 'email', provide an appropriate clear subject line for each version. If SMS, Slack, or spoken, subject should be null.
- If the user's original message contained names, placeholders, or specific numbers, preserve them naturally.
- Do not use cheesy clichés like "I hope this email finds you well" unless ironically appropriate.
- Include a "dreadAnalysis": A 1-2 sentence reassuring coaching reflection analyzing why this message feels hard and reminding them that clear communication is an act of care.
- Include a "keyRule": A punchy 1-sentence golden rule for this situation.
- For each tone, include "whyItWorks" (1-2 sentences on psychological mechanics) and "deliveryTip" (practical tip on sending timing or posture).`;

    const userPrompt = `Dreaded Message Draft to Rewrite:
"""
${message}
"""

Contextual details:
- Scenario Type: ${scenario || 'General / Unspecified'}
- Recipient / Relationship: ${recipient || 'Not specified'}
- Preferred Channel / Medium: ${channel || 'Text / SMS'}
- Relationship Nuance: ${relationshipContext || 'None provided'}
${customAdjustment ? `- Additional Specific Request: ${customAdjustment}` : ''}

Generate the three tone versions following the JSON schema precisely.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dreadAnalysis: {
              type: Type.STRING,
              description: "A short, empathetic coaching insight into why this conversation feels scary.",
            },
            keyRule: {
              type: Type.STRING,
              description: "A punchy 1-sentence golden rule for navigating this scenario.",
            },
            versions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  toneId: {
                    type: Type.STRING,
                    description: "One of 'warm', 'direct', or 'short'",
                  },
                  title: {
                    type: Type.STRING,
                    description: "Title of the tone, e.g. 'Warm & Gentle', 'Direct & Professional', 'Short & Firm'",
                  },
                  subject: {
                    type: Type.STRING,
                    description: "Email subject line if applicable, or null",
                  },
                  text: {
                    type: Type.STRING,
                    description: "The complete, ready-to-send rewritten text.",
                  },
                  whyItWorks: {
                    type: Type.STRING,
                    description: "Psychological explanation of why this phrasing protects the sender while being respectful.",
                  },
                  deliveryTip: {
                    type: Type.STRING,
                    description: "Actionable tip on delivery timing, mindset, or follow-up boundary.",
                  },
                  wordCount: {
                    type: Type.INTEGER,
                    description: "Total word count of the rewritten text",
                  },
                  readingTimeSeconds: {
                    type: Type.INTEGER,
                    description: "Approximate seconds to read",
                  },
                },
                required: ['toneId', 'title', 'text', 'whyItWorks', 'deliveryTip', 'wordCount', 'readingTimeSeconds'],
              },
            },
          },
          required: ['dreadAnalysis', 'keyRule', 'versions'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Empty response from model');
    }

    const data = JSON.parse(rawText);
    return res.json(data);
  } catch (error: any) {
    console.warn('AI call encountered error, returning curated fallback rewrites:', error?.message);
    const { message, scenario, recipient, channel, relationshipContext, customAdjustment } = req.body as RewriteRequest;
    const fallback = generateFallbackRewrites({ message, scenario, recipient, channel, relationshipContext, customAdjustment });
    return res.json(fallback);
  }
});

// POST /api/refine - Tweaks a single version based on specific user feedback
app.post('/api/refine', async (req: Request, res: Response) => {
  try {
    const { originalText, currentVersion, instruction, toneId } = req.body;

    if (!currentVersion || !instruction) {
      return res.status(400).json({ error: 'Current text and refinement instruction are required.' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.json({
        text: currentVersion + ` (Refined: ${instruction})`,
        whyItWorks: "Refined based on your specific instruction.",
      });
    }

    const prompt = `You are WellSaid's precision editor.
Original raw message:
"""
${originalText || 'N/A'}
"""

Current rewritten draft (${toneId || 'version'}):
"""
${currentVersion}
"""

User refinement instruction: "${instruction}"

Keep the core tone intact but adjust the message to satisfy the user's specific feedback.
Return a clean JSON object with:
- "text": The updated rewritten message ready to send.
- "whyItWorks": Brief 1-sentence explanation of what was changed and why it helps.
- "wordCount": number of words in new text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            whyItWorks: { type: Type.STRING },
            wordCount: { type: Type.INTEGER },
          },
          required: ['text', 'whyItWorks', 'wordCount'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Refine error:', err);
    return res.status(500).json({ error: 'Failed to refine message.', details: err?.message });
  }
});

// Dedicated download routes for the browser extension package
app.get(['/wellsaid-extension.zip', '/download/extension'], (_req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'public', 'wellsaid-extension.zip');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="wellsaid-extension.zip"');
  return res.download(zipPath, 'wellsaid-extension.zip');
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
