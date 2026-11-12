const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.resolve(__dirname, '../public/chrome-webstore-assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Store Icon (128x128, 24-bit RGB, no alpha)
const storeIconSvg = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="terracottaGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d9541e"/>
      <stop offset="100%" stop-color="#b43805"/>
    </linearGradient>
    <linearGradient id="goldNib" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="penBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <!-- Background Squircle -->
  <rect width="128" height="128" rx="28" fill="url(#terracottaGrad)"/>
  
  <!-- Subtle inner border -->
  <rect x="2" y="2" width="124" height="124" rx="26" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.25"/>

  <!-- Writing Hand & Fountain Pen -->
  <g transform="translate(64, 64) scale(0.24) translate(-256, -256)">
    <!-- Pen Barrel -->
    <path d="M194 320 L336 178 L368 210 L226 352 Z" fill="url(#penBody)"/>
    <!-- Pen Ring -->
    <path d="M308 206 L338 176 L350 188 L320 218 Z" fill="url(#goldNib)"/>
    <!-- Nib Point -->
    <path d="M194 320 L156 358 L146 368 L156 378 L166 368 L204 330 Z" fill="url(#goldNib)"/>
    <path d="M156 358 L138 382 L146 368 Z" fill="#1e1b18"/>
    <!-- Flourish -->
    <path d="M110 404 Q146 388 184 392 Q220 396 256 386" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-opacity="0.9"/>
    <!-- Hand Palm -->
    <path d="M228 350 C244 366 284 390 324 390 C364 390 400 354 400 310 C400 278 368 250 336 250 L264 322 Z" fill="#ffffff" opacity="0.95"/>
    <!-- Thumb -->
    <path d="M214 322 C204 308 210 284 230 274 C250 264 276 274 288 294 L252 334 Z" fill="#ffffff"/>
    <!-- Index Finger -->
    <path d="M260 242 C276 226 304 228 320 244 C334 258 334 282 318 298 L264 322 Z" fill="#f1f5f9"/>
    <!-- Detail Line -->
    <path d="M284 266 C290 272 298 280 302 288" stroke="#d97706" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
</svg>
`;

// 2. Small Promo Tile (440x280)
const smallPromoSvg = `
<svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b18"/>
      <stop offset="100%" stop-color="#12100e"/>
    </linearGradient>
    <linearGradient id="terraGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d9541e"/>
      <stop offset="100%" stop-color="#b43805"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="440" height="280" fill="url(#bgGrad)"/>
  
  <!-- Subtle accent blur glow -->
  <circle cx="380" cy="50" r="160" fill="#c2410c" opacity="0.22"/>
  <circle cx="40" cy="240" r="120" fill="#f59e0b" opacity="0.12"/>

  <!-- Border -->
  <rect x="0" y="0" width="440" height="280" fill="none" stroke="#332c25" stroke-width="2"/>

  <!-- Logo Icon -->
  <rect x="36" y="38" width="52" height="52" rx="14" fill="url(#terraGrad)"/>
  <text x="62" y="74" font-size="28" text-anchor="middle">✍️</text>

  <!-- Brand Name -->
  <text x="100" y="66" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#ffffff" letter-spacing="-0.5">WellSaid</text>
  <text x="100" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#c2410c" letter-spacing="1">CHROME EXTENSION</text>

  <!-- Headline -->
  <text x="36" y="136" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#faf7f2">Say the hard thing, well.</text>

  <!-- Subtitle -->
  <text x="36" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#a8a29e">
    Rewrite dreaded messages into 3 ready-to-send tones.
  </text>

  <!-- Tone Badges -->
  <g transform="translate(36, 196)">
    <!-- Warm -->
    <rect x="0" y="0" width="112" height="34" rx="17" fill="#292522" stroke="#443c35" stroke-width="1"/>
    <circle cx="16" cy="17" r="4" fill="#f59e0b"/>
    <text x="26" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#faf7f2">Warm &amp; Gentle</text>

    <!-- Direct -->
    <rect x="122" y="0" width="124" height="34" rx="17" fill="#292522" stroke="#443c35" stroke-width="1"/>
    <circle cx="138" cy="17" r="4" fill="#38bdf8"/>
    <text x="148" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#faf7f2">Direct &amp; Concise</text>

    <!-- Short -->
    <rect x="256" y="0" width="108" height="34" rx="17" fill="#292522" stroke="#443c35" stroke-width="1"/>
    <circle cx="272" cy="17" r="4" fill="#c2410c"/>
    <text x="282" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#faf7f2">Short &amp; Firm</text>
  </g>

  <!-- Bottom micro feature -->
  <text x="36" y="254" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#78716c">
    ⚡ 0ms buffering · Works in Gmail, WhatsApp, Slack &amp; LinkedIn
  </text>
</svg>
`;

// 3. Marquee Promo Tile (1400x560)
const marqueeSvg = `
<svg width="1400" height="560" viewBox="0 0 1400 560" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="marqBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b18"/>
      <stop offset="50%" stop-color="#161412"/>
      <stop offset="100%" stop-color="#0f0d0b"/>
    </linearGradient>
    <linearGradient id="marqTerra" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1400" height="560" fill="url(#marqBg)"/>

  <!-- Atmospheric Glows -->
  <circle cx="1200" cy="100" r="380" fill="#c2410c" opacity="0.18"/>
  <circle cx="200" cy="460" r="320" fill="#f59e0b" opacity="0.1"/>

  <!-- Left Column: Copy & Value Proposition -->
  <g transform="translate(100, 100)">
    <!-- Header Badge -->
    <rect x="0" y="0" width="70" height="70" rx="18" fill="url(#marqTerra)"/>
    <text x="35" y="47" font-size="36" text-anchor="middle">✍️</text>

    <text x="90" y="42" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ffffff" letter-spacing="-1">WellSaid</text>
    <text x="92" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#c2410c" letter-spacing="1.5">OFFICIAL CHROME EXTENSION</text>

    <!-- Main Headline -->
    <text x="0" y="145" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="#faf7f2" letter-spacing="-1">
      Say the hard thing, well.
    </text>

    <text x="0" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#d6d3d1" line-height="1.6">
      Paste the message you’re dreading to send.
    </text>
    <text x="0" y="225" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#d6d3d1">
      Get 3 ready-to-send versions instantly in Warm, Direct, and Short.
    </text>

    <!-- 3 Tone Pills -->
    <g transform="translate(0, 270)">
      <rect x="0" y="0" width="160" height="46" rx="23" fill="#292522" stroke="#443c35" stroke-width="1.5"/>
      <circle cx="24" cy="23" r="6" fill="#f59e0b"/>
      <text x="38" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#faf7f2">Warm &amp; Gentle</text>

      <rect x="175" y="0" width="180" height="46" rx="23" fill="#292522" stroke="#443c35" stroke-width="1.5"/>
      <circle cx="199" cy="23" r="6" fill="#38bdf8"/>
      <text x="213" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#faf7f2">Direct &amp; Professional</text>

      <rect x="370" y="0" width="160" height="46" rx="23" fill="#292522" stroke="#443c35" stroke-width="1.5"/>
      <circle cx="394" cy="23" r="6" fill="#c2410c"/>
      <text x="408" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#faf7f2">Short &amp; Firm</text>
    </g>

    <!-- Features Footnote -->
    <g transform="translate(0, 360)">
      <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e">
        ✓ 100% Private &amp; On-Device   ·   ✓ Instant 0ms Buffering   ·   ✓ Never Lose Your Draft
      </text>
    </g>
  </g>

  <!-- Right Column: Visual Extension UI Card Mockup -->
  <g transform="translate(860, 50)" filter="url(#shadow)">
    <!-- Extension Window Frame -->
    <rect width="440" height="460" rx="18" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>

    <!-- Window Header -->
    <rect x="0" y="0" width="440" height="64" rx="18" fill="#25211d"/>
    <text x="24" y="40" font-size="20">✍️</text>
    <text x="56" y="38" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#ffffff">WellSaid</text>
    <text x="24" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#a8a29e">Say the hard thing, well.</text>
    <!-- Close icon mock -->
    <circle cx="410" cy="32" r="12" fill="#332c25"/>
    <text x="410" y="36" font-size="12" text-anchor="middle" fill="#d6d3d1">✕</text>

    <!-- Category selector mock -->
    <text x="24" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#a8a29e" letter-spacing="0.5">WHAT IS IT?</text>
    <rect x="24" y="98" width="392" height="32" rx="8" fill="#141210" stroke="#332c25" stroke-width="1"/>
    <text x="36" y="119" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#faf7f2">An apology</text>
    <text x="400" y="119" font-size="10" fill="#a8a29e">▼</text>

    <!-- Input text mock -->
    <text x="24" y="150" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#a8a29e" letter-spacing="0.5">YOUR MESSAGE</text>
    <rect x="24" y="158" width="392" height="64" rx="8" fill="#141210" stroke="#332c25" stroke-width="1"/>
    <text x="36" y="180" font-family="Georgia, serif" font-size="12" fill="#d6d3d1">i am really sorry, i was just ranting out</text>
    <text x="36" y="198" font-family="Georgia, serif" font-size="12" fill="#d6d3d1">of frustration, please forgive me...</text>

    <!-- Rewrite Button -->
    <rect x="24" y="234" width="392" height="40" rx="10" fill="url(#marqTerra)"/>
    <text x="220" y="259" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Rewrite it</text>

    <!-- Result Card 1: Warm -->
    <rect x="24" y="288" width="392" height="74" rx="10" fill="#25211d" stroke="#38322c" stroke-width="1"/>
    <rect x="36" y="298" width="94" height="20" rx="10" fill="#f59e0b" fill-opacity="0.2"/>
    <text x="83" y="312" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#fbbf24" text-anchor="middle">Warm &amp; gentle</text>
    <!-- Arrow -->
    <circle cx="396" cy="308" r="10" fill="#c2410c"/>
    <text x="396" y="312" font-size="11" text-anchor="middle" fill="#fff">→</text>
    <text x="36" y="334" font-family="Georgia, serif" font-size="11" fill="#faf7f2">"I want to apologize sincerely for how I reacted earlier.</text>
    <text x="36" y="348" font-family="Georgia, serif" font-size="11" fill="#faf7f2">I was feeling overwhelmed and didn't express myself well."</text>

    <!-- Result Card 2: Direct -->
    <rect x="24" y="372" width="392" height="66" rx="10" fill="#25211d" stroke="#38322c" stroke-width="1"/>
    <rect x="36" y="382" width="124" height="20" rx="10" fill="#0284c7" fill-opacity="0.2"/>
    <text x="98" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#38bdf8" text-anchor="middle">Direct &amp; professional</text>
    <circle cx="396" cy="392" r="10" fill="#c2410c"/>
    <text x="396" y="396" font-size="11" text-anchor="middle" fill="#fff">→</text>
    <text x="36" y="416" font-family="Georgia, serif" font-size="11" fill="#faf7f2">"I apologize for my earlier tone. It was uncalled for."</text>
  </g>
</svg>
`;

// Helper for generating 1280x800 Screenshot templates
function makeScreenshot1Svg() {
  return `
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sc1Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#181513"/>
      <stop offset="100%" stop-color="#0d0b09"/>
    </linearGradient>
    <linearGradient id="sc1Terra" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <filter id="sc1Shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="800" fill="url(#sc1Bg)"/>

  <!-- Subtle glow -->
  <circle cx="940" cy="400" r="380" fill="#c2410c" opacity="0.16"/>
  <circle cx="200" cy="200" r="260" fill="#f59e0b" opacity="0.08"/>

  <!-- Left Header & Copy -->
  <g transform="translate(80, 160)">
    <!-- Pill tag -->
    <rect x="0" y="0" width="168" height="36" rx="18" fill="#292522" stroke="#443c35" stroke-width="1"/>
    <text x="84" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#c2410c" text-anchor="middle" letter-spacing="1">CHROME EXTENSION</text>

    <!-- Main Title -->
    <text x="0" y="90" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="#ffffff" letter-spacing="-1.5">
      Say the hard thing,
    </text>
    <text x="0" y="150" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="#c2410c" letter-spacing="-1.5">
      well.
    </text>

    <!-- Subtitle -->
    <text x="0" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" fill="#d6d3d1" line-height="1.6">
      Turn dreaded, stressful drafts into clear,
    </text>
    <text x="0" y="242" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" fill="#d6d3d1">
      thoughtful messages with zero anxiety.
    </text>

    <!-- Bullets -->
    <g transform="translate(0, 300)">
      <circle cx="8" cy="8" r="6" fill="#c2410c"/>
      <text x="26" y="13" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#faf7f2">3 tones in seconds: Warm, Direct &amp; Short</text>

      <circle cx="8" cy="48" r="6" fill="#f59e0b"/>
      <text x="26" y="53" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#faf7f2">Zero buffering — instant on-device rewrites</text>

      <circle cx="8" cy="88" r="6" fill="#38bdf8"/>
      <text x="26" y="93" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#faf7f2">Drafts auto-saved even when switching tabs</text>
    </g>
  </g>

  <!-- Right Side: Chrome Extension UI Window -->
  <g transform="translate(680, 80)" filter="url(#sc1Shadow)">
    <rect width="480" height="640" rx="20" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>

    <!-- Extension Header (Sticky) -->
    <rect x="0" y="0" width="480" height="80" rx="20" fill="#25211d"/>
    <text x="28" y="48" font-size="26">✍️</text>
    <text x="68" y="44" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#ffffff">WellSaid</text>
    <text x="28" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#a8a29e">Say the hard thing, well.</text>
    <!-- Close icon -->
    <circle cx="446" cy="40" r="14" fill="#332c25"/>
    <text x="446" y="45" font-size="14" text-anchor="middle" fill="#d6d3d1">✕</text>

    <!-- Content Area -->
    <text x="28" y="116" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#a8a29e" letter-spacing="0.5">WHAT IS IT?</text>
    <rect x="28" y="126" width="424" height="38" rx="8" fill="#141210" stroke="#332c25" stroke-width="1"/>
    <text x="42" y="150" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#faf7f2">An apology</text>
    <text x="430" y="150" font-size="12" fill="#a8a29e">▼</text>

    <text x="28" y="190" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#a8a29e" letter-spacing="0.5">YOUR MESSAGE</text>
    <rect x="28" y="200" width="424" height="88" rx="10" fill="#141210" stroke="#332c25" stroke-width="1"/>
    <text x="42" y="228" font-family="Georgia, serif" font-size="14" fill="#f5f5f4">i am really sorry. i was just ranting out of</text>
    <text x="42" y="250" font-family="Georgia, serif" font-size="14" fill="#f5f5f4">frustration and i dont know what i was saying</text>
    <text x="42" y="272" font-family="Georgia, serif" font-size="14" fill="#f5f5f4">please help me i am really sorry</text>

    <!-- Rewrite Button -->
    <rect x="28" y="304" width="424" height="46" rx="10" fill="url(#sc1Terra)"/>
    <text x="240" y="333" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#ffffff" text-anchor="middle">Rewrite it</text>

    <!-- Result Card 1: Warm -->
    <rect x="28" y="366" width="424" height="80" rx="10" fill="#25211d" stroke="#38322c" stroke-width="1"/>
    <rect x="40" y="378" width="102" height="22" rx="11" fill="#f59e0b" fill-opacity="0.2"/>
    <text x="91" y="393" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#fbbf24" text-anchor="middle">Warm &amp; gentle</text>
    <circle cx="430" cy="388" r="12" fill="#c2410c"/>
    <text x="430" y="392" font-size="12" text-anchor="middle" fill="#fff">→</text>
    <text x="40" y="418" font-family="Georgia, serif" font-size="13" fill="#faf7f2">"I want to apologize sincerely for how I reacted earlier.</text>
    <text x="40" y="436" font-family="Georgia, serif" font-size="13" fill="#faf7f2">I was feeling overwhelmed and didn't communicate well."</text>

    <!-- Result Card 2: Direct -->
    <rect x="28" y="456" width="424" height="74" rx="10" fill="#25211d" stroke="#38322c" stroke-width="1"/>
    <rect x="40" y="468" width="136" height="22" rx="11" fill="#0284c7" fill-opacity="0.2"/>
    <text x="108" y="483" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38bdf8" text-anchor="middle">Direct &amp; professional</text>
    <circle cx="430" cy="478" r="12" fill="#c2410c"/>
    <text x="430" y="482" font-size="12" text-anchor="middle" fill="#fff">→</text>
    <text x="40" y="508" font-family="Georgia, serif" font-size="13" fill="#faf7f2">"I apologize for my previous message. It was uncalled for</text>
    <text x="40" y="524" font-family="Georgia, serif" font-size="13" fill="#faf7f2">and I appreciate your patience."</text>

    <!-- Result Card 3: Short -->
    <rect x="28" y="540" width="424" height="70" rx="10" fill="#25211d" stroke="#38322c" stroke-width="1"/>
    <rect x="40" y="552" width="94" height="22" rx="11" fill="#c2410c" fill-opacity="0.2"/>
    <text x="87" y="567" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#ea580c" text-anchor="middle">Short &amp; firm</text>
    <circle cx="430" cy="562" r="12" fill="#c2410c"/>
    <text x="430" y="566" font-size="12" text-anchor="middle" fill="#fff">→</text>
    <text x="40" y="592" font-family="Georgia, serif" font-size="13" fill="#faf7f2">"I’m sorry for my earlier frustration. Please disregard."</text>
  </g>
</svg>
`;
}

function makeScreenshot2Svg() {
  return `
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sc2Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141210"/>
      <stop offset="100%" stop-color="#231f1c"/>
    </linearGradient>
    <filter id="sc2CardShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="1280" height="800" fill="url(#sc2Bg)"/>
  <circle cx="640" cy="100" r="400" fill="#c2410c" opacity="0.12"/>

  <!-- Top Headline -->
  <g transform="translate(640, 80)" text-anchor="middle">
    <text y="0" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ffffff" letter-spacing="-1">
      3 Ready-to-Send Tones For Every Situation
    </text>
    <text y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#a8a29e">
      One click to auto-replace draft in your active compose box &amp; copy to clipboard
    </text>
  </g>

  <!-- 3 Big Tone Cards -->
  <g transform="translate(100, 180)">
    <!-- Column 1: Warm -->
    <g transform="translate(0, 0)" filter="url(#sc2CardShadow)">
      <rect width="336" height="480" rx="16" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>
      <rect x="24" y="28" width="124" height="28" rx="14" fill="#f59e0b" fill-opacity="0.18"/>
      <text x="86" y="47" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#fbbf24" text-anchor="middle">Warm &amp; gentle</text>

      <text x="24" y="96" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#faf7f2">High empathy &amp; tact</text>
      <text x="24" y="122" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#a8a29e">Best for close friends, colleagues &amp; sensitive topics</text>

      <rect x="24" y="150" width="288" height="220" rx="10" fill="#141210" stroke="#2d2824" stroke-width="1"/>
      <text x="40" y="186" font-family="Georgia, serif" font-size="15" fill="#faf7f2">"I want to apologize</text>
      <text x="40" y="214" font-family="Georgia, serif" font-size="15" fill="#faf7f2">sincerely for how I reacted</text>
      <text x="40" y="242" font-family="Georgia, serif" font-size="15" fill="#faf7f2">earlier. I was feeling</text>
      <text x="40" y="270" font-family="Georgia, serif" font-size="15" fill="#faf7f2">overwhelmed and didn't</text>
      <text x="40" y="298" font-family="Georgia, serif" font-size="15" fill="#faf7f2">communicate well. I hope</text>
      <text x="40" y="326" font-family="Georgia, serif" font-size="15" fill="#faf7f2">we can talk soon."</text>

      <rect x="24" y="396" width="288" height="52" rx="12" fill="#c2410c"/>
      <text x="168" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Use This Tone →</text>
    </g>

    <!-- Column 2: Direct -->
    <g transform="translate(372, 0)" filter="url(#sc2CardShadow)">
      <rect width="336" height="480" rx="16" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>
      <rect x="24" y="28" width="148" height="28" rx="14" fill="#0284c7" fill-opacity="0.18"/>
      <text x="98" y="47" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#38bdf8" text-anchor="middle">Direct &amp; professional</text>

      <text x="24" y="96" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#faf7f2">Clear, clean &amp; poised</text>
      <text x="24" y="122" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#a8a29e">Best for work emails, managers, clients &amp; partners</text>

      <rect x="24" y="150" width="288" height="220" rx="10" fill="#141210" stroke="#2d2824" stroke-width="1"/>
      <text x="40" y="186" font-family="Georgia, serif" font-size="15" fill="#faf7f2">"I apologize for my</text>
      <text x="40" y="214" font-family="Georgia, serif" font-size="15" fill="#faf7f2">previous message. It was</text>
      <text x="40" y="242" font-family="Georgia, serif" font-size="15" fill="#faf7f2">uncalled for and did not</text>
      <text x="40" y="270" font-family="Georgia, serif" font-size="15" fill="#faf7f2">reflect my usual standard.</text>
      <text x="40" y="298" font-family="Georgia, serif" font-size="15" fill="#faf7f2">Thank you for your</text>
      <text x="40" y="326" font-family="Georgia, serif" font-size="15" fill="#faf7f2">understanding."</text>

      <rect x="24" y="396" width="288" height="52" rx="12" fill="#c2410c"/>
      <text x="168" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Use This Tone →</text>
    </g>

    <!-- Column 3: Short -->
    <g transform="translate(744, 0)" filter="url(#sc2CardShadow)">
      <rect width="336" height="480" rx="16" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>
      <rect x="24" y="28" width="112" height="28" rx="14" fill="#c2410c" fill-opacity="0.18"/>
      <text x="80" y="47" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#ea580c" text-anchor="middle">Short &amp; firm</text>

      <text x="24" y="96" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#faf7f2">Brief &amp; boundary-setting</text>
      <text x="24" y="122" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#a8a29e">Best for fast messaging, boundaries &amp; declinations</text>

      <rect x="24" y="150" width="288" height="220" rx="10" fill="#141210" stroke="#2d2824" stroke-width="1"/>
      <text x="40" y="186" font-family="Georgia, serif" font-size="15" fill="#faf7f2">"I’m sorry for my earlier</text>
      <text x="40" y="214" font-family="Georgia, serif" font-size="15" fill="#faf7f2">frustration. Please disregard</text>
      <text x="40" y="242" font-family="Georgia, serif" font-size="15" fill="#faf7f2">that message. I appreciate</text>
      <text x="40" y="270" font-family="Georgia, serif" font-size="15" fill="#faf7f2">your patience."</text>

      <rect x="24" y="396" width="288" height="52" rx="12" fill="#c2410c"/>
      <text x="168" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Use This Tone →</text>
    </g>
  </g>
</svg>
`;
}

function makeScreenshot3Svg() {
  return `
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sc3Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#161412"/>
      <stop offset="100%" stop-color="#0e0c0b"/>
    </linearGradient>
    <filter id="sc3Shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="1280" height="800" fill="url(#sc3Bg)"/>

  <!-- Top Title -->
  <g transform="translate(640, 90)" text-anchor="middle">
    <text y="0" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ffffff" letter-spacing="-1">
      Before &amp; After: Instant Clarity
    </text>
    <text y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#a8a29e">
      Say what you really mean without sounding defensive, awkward, or aggressive
    </text>
  </g>

  <!-- Side-by-side comparison cards -->
  <g transform="translate(100, 190)">
    <!-- Before Card -->
    <g transform="translate(0, 0)" filter="url(#sc3Shadow)">
      <rect width="510" height="480" rx="18" fill="#1a1815" stroke="#ef4444" stroke-width="1.5" stroke-opacity="0.4"/>
      <rect x="32" y="32" width="140" height="30" rx="15" fill="#ef4444" fill-opacity="0.15"/>
      <text x="102" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#f87171" text-anchor="middle">❌ BEFORE (DRAFT)</text>

      <text x="32" y="104" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#faf7f2">Unfiltered &amp; Stressful</text>
      <text x="32" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e">What you typed when frustrated or overwhelmed:</text>

      <rect x="32" y="160" width="446" height="250" rx="12" fill="#12100e" stroke="#26221e" stroke-width="1"/>
      <text x="56" y="206" font-family="Georgia, serif" font-size="18" fill="#d6d3d1" line-height="1.7">
        "I can’t come to your wedding
      </text>
      <text x="56" y="240" font-family="Georgia, serif" font-size="18" fill="#d6d3d1">
        because I can’t afford the flight,
      </text>
      <text x="56" y="274" font-family="Georgia, serif" font-size="18" fill="#d6d3d1">
        and I feel awful about it."
      </text>

      <text x="56" y="350" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#f87171">
        ⚠️ Risk: Feels blunt, awkward, and leaves both parties feeling uneasy.
      </text>
    </g>

    <!-- Center Arrow -->
    <g transform="translate(540, 220)">
      <circle cx="0" cy="0" r="28" fill="#c2410c"/>
      <text x="0" y="8" font-size="24" text-anchor="middle" fill="#ffffff">→</text>
    </g>

    <!-- After Card -->
    <g transform="translate(570, 0)" filter="url(#sc3Shadow)">
      <rect width="510" height="480" rx="18" fill="#1e1b18" stroke="#22c55e" stroke-width="1.5" stroke-opacity="0.4"/>
      <rect x="32" y="32" width="168" height="30" rx="15" fill="#22c55e" fill-opacity="0.15"/>
      <text x="116" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#4ade80" text-anchor="middle">✓ AFTER (WELLSAID)</text>

      <text x="32" y="104" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#faf7f2">Warm, Clear &amp; Thoughtful</text>
      <text x="32" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e">Polished and ready to send with full confidence:</text>

      <rect x="32" y="160" width="446" height="250" rx="12" fill="#12100e" stroke="#26221e" stroke-width="1"/>
      <text x="56" y="206" font-family="Georgia, serif" font-size="18" fill="#faf7f2">
        "I'm truly heartbroken that I won't
      </text>
      <text x="56" y="240" font-family="Georgia, serif" font-size="18" fill="#faf7f2">
        be able to celebrate with you in person.
      </text>
      <text x="56" y="274" font-family="Georgia, serif" font-size="18" fill="#faf7f2">
        Flight costs are out of reach for me right
      </text>
      <text x="56" y="308" font-family="Georgia, serif" font-size="18" fill="#faf7f2">
        now, but I’m sending you both so much love!"
      </text>

      <text x="56" y="360" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#4ade80">
        ✨ Result: Preserves relationship, sets boundaries with grace and zero guilt.
      </text>
    </g>
  </g>
</svg>
`;
}

function makeScreenshot4Svg() {
  return `
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sc4Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141210"/>
      <stop offset="100%" stop-color="#1e1b18"/>
    </linearGradient>
    <filter id="sc4Shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="1280" height="800" fill="url(#sc4Bg)"/>
  <circle cx="1000" cy="500" r="300" fill="#c2410c" opacity="0.14"/>

  <!-- Top Title -->
  <g transform="translate(640, 80)" text-anchor="middle">
    <text y="0" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ffffff" letter-spacing="-1">
      Works Seamlessly Across Your Entire Inbox
    </text>
    <text y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#a8a29e">
      One extension integrates with the apps where difficult conversations happen every day
    </text>
  </g>

  <!-- Platform Badges Row -->
  <g transform="translate(640, 160)" text-anchor="middle">
    <g transform="translate(-360, 0)">
      <rect x="-80" y="0" width="160" height="42" rx="21" fill="#25211d" stroke="#38322c" stroke-width="1.5"/>
      <text x="0" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#faf7f2">✉️ Gmail</text>
    </g>
    <g transform="translate(-180, 0)">
      <rect x="-80" y="0" width="160" height="42" rx="21" fill="#25211d" stroke="#38322c" stroke-width="1.5"/>
      <text x="0" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#faf7f2">💬 WhatsApp</text>
    </g>
    <g transform="translate(0, 0)">
      <rect x="-80" y="0" width="160" height="42" rx="21" fill="#25211d" stroke="#38322c" stroke-width="1.5"/>
      <text x="0" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#faf7f2">💼 LinkedIn</text>
    </g>
    <g transform="translate(180, 0)">
      <rect x="-80" y="0" width="160" height="42" rx="21" fill="#25211d" stroke="#38322c" stroke-width="1.5"/>
      <text x="0" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#faf7f2">⚡ Slack</text>
    </g>
    <g transform="translate(360, 0)">
      <rect x="-80" y="0" width="160" height="42" rx="21" fill="#25211d" stroke="#38322c" stroke-width="1.5"/>
      <text x="0" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#faf7f2">🐦 Twitter / X</text>
    </g>
  </g>

  <!-- Big Mockup: In-situ chat composition with docked WellSaid button -->
  <g transform="translate(200, 240)" filter="url(#sc4Shadow)">
    <!-- Browser window container -->
    <rect width="880" height="480" rx="16" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>

    <!-- Window top bar -->
    <rect x="0" y="0" width="880" height="48" rx="16" fill="#26221d"/>
    <circle cx="28" cy="24" r="6" fill="#ef4444"/>
    <circle cx="48" cy="24" r="6" fill="#f59e0b"/>
    <circle cx="68" cy="24" r="6" fill="#22c55e"/>
    <text x="440" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#a8a29e" text-anchor="middle">mail.google.com / compose</text>

    <!-- Email Compose Pane -->
    <g transform="translate(40, 72)">
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e">To: manager@company.com</text>
      <line x1="0" y1="36" x2="800" y2="36" stroke="#2d2824" stroke-width="1"/>

      <text x="0" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e">Subject: Project scope timeline &amp; resources</text>
      <line x1="0" y1="74" x2="800" y2="74" stroke="#2d2824" stroke-width="1"/>

      <!-- Body -->
      <text x="0" y="112" font-family="Georgia, serif" font-size="16" fill="#faf7f2">Hi David,</text>
      <text x="0" y="142" font-family="Georgia, serif" font-size="16" fill="#faf7f2">
        I wanted to discuss the deadline for the Q4 deliverables. Given our current team capacity,
      </text>
      <text x="0" y="170" font-family="Georgia, serif" font-size="16" fill="#faf7f2">
        we risk compromising quality if we rush all three milestones into November.
      </text>

      <!-- Docked WellSaid Assistant Pill in the compose toolbar -->
      <g transform="translate(0, 230)">
        <rect width="240" height="44" rx="22" fill="#c2410c"/>
        <text x="24" y="27" font-size="18">✍️</text>
        <text x="56" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Rewrite with WellSaid</text>
      </g>

      <g transform="translate(260, 230)">
        <text x="0" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#a8a29e">
          ← Docked in your compose box for 1-click tone rewrites
        </text>
      </g>
    </g>
  </g>
</svg>
`;
}

function makeScreenshot5Svg() {
  return `
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sc5Bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#161412"/>
      <stop offset="100%" stop-color="#0f0d0b"/>
    </linearGradient>
    <filter id="sc5Shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="1280" height="800" fill="url(#sc5Bg)"/>
  <circle cx="640" cy="400" r="320" fill="#c2410c" opacity="0.12"/>

  <!-- Top Headline -->
  <g transform="translate(640, 90)" text-anchor="middle">
    <text y="0" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ffffff" letter-spacing="-1">
      Engineered for Speed, Reliability &amp; Privacy
    </text>
    <text y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#a8a29e">
      No buffering, no lost drafts, and complete user security
    </text>
  </g>

  <!-- 3 Pillars Grid -->
  <g transform="translate(100, 200)">
    <!-- Pillar 1 -->
    <g transform="translate(0, 0)" filter="url(#sc5Shadow)">
      <rect width="336" height="450" rx="16" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>
      <circle cx="60" cy="64" r="28" fill="#c2410c" fill-opacity="0.2"/>
      <text x="60" y="72" font-size="28" text-anchor="middle">⚡</text>

      <text x="32" y="132" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#faf7f2">0ms Buffering</text>
      <text x="32" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e" line-height="1.6">
        No waiting spinners or connection hangs. Instant on-device heuristic engine generates all three tones the moment you click.
      </text>

      <rect x="32" y="280" width="272" height="130" rx="10" fill="#141210" stroke="#2d2824" stroke-width="1"/>
      <text x="48" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#22c55e">✓ Zero latency</text>
      <text x="48" y="344" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#22c55e">✓ Instant tone switching</text>
      <text x="48" y="372" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#22c55e">✓ Works offline</text>
    </g>

    <!-- Pillar 2 -->
    <g transform="translate(372, 0)" filter="url(#sc5Shadow)">
      <rect width="336" height="450" rx="16" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>
      <circle cx="60" cy="64" r="28" fill="#f59e0b" fill-opacity="0.2"/>
      <text x="60" y="72" font-size="28" text-anchor="middle">💾</text>

      <text x="32" y="132" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#faf7f2">Never Lose Your Draft</text>
      <text x="32" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e" line-height="1.6">
        Every keystroke and category choice is preserved locally. Switch tabs or close the popup and your draft is right where you left it.
      </text>

      <rect x="32" y="280" width="272" height="130" rx="10" fill="#141210" stroke="#2d2824" stroke-width="1"/>
      <text x="48" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#f59e0b">✓ Real-time auto-save</text>
      <text x="48" y="344" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#f59e0b">✓ Persistent across tab switches</text>
      <text x="48" y="372" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#f59e0b">✓ Easy ✕ close button</text>
    </g>

    <!-- Pillar 3 -->
    <g transform="translate(744, 0)" filter="url(#sc5Shadow)">
      <rect width="336" height="450" rx="16" fill="#1e1b18" stroke="#38322c" stroke-width="1.5"/>
      <circle cx="60" cy="64" r="28" fill="#38bdf8" fill-opacity="0.2"/>
      <text x="60" y="72" font-size="28" text-anchor="middle">🔒</text>

      <text x="32" y="132" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#faf7f2">Privacy First</text>
      <text x="32" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#a8a29e" line-height="1.6">
        Your sensitive personal messages are processed locally without tracking or surveillance. What you write stays between you and your recipient.
      </text>

      <rect x="32" y="280" width="272" height="130" rx="10" fill="#141210" stroke="#2d2824" stroke-width="1"/>
      <text x="48" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#38bdf8">✓ No data logging</text>
      <text x="48" y="344" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#38bdf8">✓ Manifest V3 compliant</text>
      <text x="48" y="372" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#38bdf8">✓ Secure Chrome sandbox</text>
    </g>
  </g>
</svg>
`;
}

async function renderAssets() {
  console.log('Rendering official Chrome Web Store assets (24-bit RGB PNG, NO ALPHA)...');

  // 1. Store Icon (128x128)
  await sharp(Buffer.from(storeIconSvg))
    .resize(128, 128)
    .removeAlpha() // 24-bit PNG, NO ALPHA
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'store_icon_128x128.png'));
  console.log('✓ Rendered store_icon_128x128.png (128x128)');

  // 2. Small Promo Tile (440x280)
  await sharp(Buffer.from(smallPromoSvg))
    .resize(440, 280)
    .removeAlpha() // 24-bit PNG, NO ALPHA
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'small_promo_440x280.png'));
  console.log('✓ Rendered small_promo_440x280.png (440x280)');

  // 3. Marquee Promo Tile (1400x560)
  await sharp(Buffer.from(marqueeSvg))
    .resize(1400, 560)
    .removeAlpha() // 24-bit PNG, NO ALPHA
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'marquee_1400x560.png'));
  console.log('✓ Rendered marquee_1400x560.png (1400x560)');

  // 4. Screenshots (1280x800)
  const screenshots = [
    { fn: makeScreenshot1Svg, name: 'screenshot_1_overview_1280x800.png' },
    { fn: makeScreenshot2Svg, name: 'screenshot_2_three_tones_1280x800.png' },
    { fn: makeScreenshot3Svg, name: 'screenshot_3_before_after_1280x800.png' },
    { fn: makeScreenshot4Svg, name: 'screenshot_4_works_everywhere_1280x800.png' },
    { fn: makeScreenshot5Svg, name: 'screenshot_5_privacy_speed_1280x800.png' },
  ];

  for (const s of screenshots) {
    await sharp(Buffer.from(s.fn()))
      .resize(1280, 800)
      .removeAlpha() // 24-bit PNG, NO ALPHA
      .png({ quality: 100 })
      .toFile(path.join(outDir, s.name));
    console.log(`✓ Rendered ${s.name} (1280x800)`);
  }

  // Also copy to public/webstore for backward compatibility
  const webstoreDir = path.resolve(__dirname, '../public/webstore');
  fs.copyFileSync(path.join(outDir, 'store_icon_128x128.png'), path.join(webstoreDir, 'store_icon_128x128.png'));
  fs.copyFileSync(path.join(outDir, 'small_promo_440x280.png'), path.join(webstoreDir, 'small_promo_440x280.png'));
  fs.copyFileSync(path.join(outDir, 'marquee_1400x560.png'), path.join(webstoreDir, 'marquee_1400x560.png'));

  console.log('All Chrome Web Store assets rendered successfully!');
}

renderAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
