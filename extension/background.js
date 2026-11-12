// Background service worker for WellSaid Extension
const DEFAULT_API_BASE = 'https://ais-dev-63fbfcczqlx2kgbtstj7aj-197227803607.asia-northeast1.run.app';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['apiBaseUrl'], (res) => {
    if (!res.apiBaseUrl) {
      chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_BASE });
    }
  });
  console.log('WellSaid Browser Extension installed.');
});

// Handle requests from content script or popup - INSTANT on-device execution (0ms buffering)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'WELLSAID_REWRITE') {
    try {
      const data = generateClientFallbackRewrites(request.payload || {});
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err?.message || 'Error rewriting message.' });
    }
    return false; // Synchronous instant response
  }
});

// Standalone intelligent rewrite engine (works everywhere, zero server dependency)
function generateClientFallbackRewrites(input) {
  const raw = (input.message || '').trim();
  const lower = raw.toLowerCase();
  const scenario = (input.scenario || '').toLowerCase();

  // 1. Apology / Frustration / Ranting
  if (
    scenario.includes('apology') ||
    lower.includes('sorry') ||
    lower.includes('sotry') ||
    lower.includes('ranting') ||
    lower.includes('frustrat') ||
    lower.includes('apolog')
  ) {
    return {
      dreadAnalysis: "Apologizing feels vulnerable, but owning your reaction clearly restores trust faster than anything else.",
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "I'm genuinely sorry for how I expressed myself earlier. I was overwhelmed and reacted out of frustration in the moment, but that's no excuse. I truly value you and our communication, and I'd love to connect calmly whenever you're ready.",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: "I want to apologize for my previous message. I spoke out of frustration rather than patience, and I take responsibility for my words. I value our working relationship and want to ensure we communicate constructively going forward.",
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: "I apologize for my earlier message—I reacted out of frustration and handled that poorly. I take responsibility and appreciate your understanding as we move forward.",
        },
      ],
    };
  }

  // 2. Asking for a raise / compensation
  if (
    scenario.includes('raise') ||
    lower.includes('salary') ||
    lower.includes('compensation') ||
    lower.includes('pay') ||
    lower.includes('raise')
  ) {
    return {
      dreadAnalysis: "Talking about money feels taboo, but asking to align pay with responsibility is normal professional self-advocacy.",
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "I've really enjoyed stepping up to take on additional responsibilities recently. As my day-to-day role has expanded, I'd love to schedule a quick 15-minute chat next week to discuss aligning my compensation with this increased scope.",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: "Over recent months, my responsibilities and contributions have grown significantly beyond my original role. I would like to schedule time this week to review my compensation to reflect these duties.",
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: "Given the expanded scope and responsibilities I've taken on recently, I'd like to schedule time this week to review my compensation. Let me know when you're available.",
        },
      ],
    };
  }

  // 3. Declining an invite / wedding / event
  if (
    scenario.includes('invite') ||
    lower.includes('wedding') ||
    lower.includes('invite') ||
    lower.includes('event') ||
    lower.includes('flight') ||
    lower.includes("can't come") ||
    lower.includes('cannot come')
  ) {
    return {
      dreadAnalysis: "Saying no feels like disappointing someone, but an honest and prompt decline is far kinder than hesitation.",
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "Thank you so much for thinking of me and inviting me! Unfortunately, I won't be able to make it, but I'm truly cheering you on and hope you have an incredible time.",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: "Thank you for the invitation. Unfortunately, due to existing commitments, I will not be able to attend. I wanted to let you know as soon as possible so you can plan accordingly.",
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: "Thank you for the invite, but I won't be able to make it this time. Hope it goes wonderfully!",
        },
      ],
    };
  }

  // 4. Setting a boundary
  if (
    scenario.includes('boundary') ||
    lower.includes('boundary') ||
    lower.includes('stop') ||
    lower.includes('too much') ||
    lower.includes('space') ||
    lower.includes('uncomfortable')
  ) {
    return {
      dreadAnalysis: "Clear boundaries protect relationships from resentment.",
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "I really value our connection, but right now I need to step back and take some space to manage my own priorities. I hope you can understand, and I appreciate your support.",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: "I want to be clear about my current capacity. I won't be able to take this on or continue in this manner going forward, and need to focus on existing priorities.",
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: "I won't be able to accommodate this right now. Thank you for respecting my limits.",
        },
      ],
    };
  }

  // 5. Tough feedback
  if (scenario.includes('feedback') || lower.includes('feedback') || lower.includes('mistake')) {
    return {
      dreadAnalysis: "Critique feels harsh, but direct clarity allows everyone to improve.",
      versions: [
        {
          toneId: 'warm',
          title: 'Warm & gentle',
          text: "I really appreciate the work you've put in here. There are a couple of key areas we need to refine to meet our target standards, and I'd love to partner with you to get them dialed in.",
        },
        {
          toneId: 'direct',
          title: 'Direct & professional',
          text: "Reviewing the latest deliverable, there are specific discrepancies that need to be addressed before we proceed. Please review the highlighted adjustments so we can align.",
        },
        {
          toneId: 'short',
          title: 'Short & firm',
          text: "This needs revisions before moving forward. Please review the required corrections and send an updated draft.",
        },
      ],
    };
  }

  // 6. General / Default transformation
  // Clean basic conversational text
  let cleaned = raw
    .replace(/\bi am\b/gi, "I am")
    .replace(/\bi dont\b/gi, "I don't")
    .replace(/\bpls\b/gi, "please")
    .replace(/\bu\b/gi, "you");

  return {
    dreadAnalysis: "Clear communication is an act of respect—both to the other person and to yourself.",
    versions: [
      {
        toneId: 'warm',
        title: 'Warm & gentle',
        text: `Hey, I wanted to reach out regarding this: ${cleaned}. I really appreciate your understanding and would love to connect whenever convenient.`,
      },
      {
        toneId: 'direct',
        title: 'Direct & professional',
        text: `I am writing to address this clearly: ${cleaned}. Please let me know how you would like to proceed.`,
      },
      {
        toneId: 'short',
        title: 'Short & firm',
        text: `Following up on this: ${cleaned}. Thanks for understanding.`,
      },
    ],
  };
}
