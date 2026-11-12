const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Target directories
const DIRS = [
  path.resolve(__dirname, '../extension/icons'),
  path.resolve(__dirname, '../extension/icons/transparent'),
  path.resolve(__dirname, '../extension/webstore'),
  path.resolve(__dirname, '../public/icons'),
  path.resolve(__dirname, '../public/icons/transparent'),
  path.resolve(__dirname, '../public/webstore'),
];

DIRS.forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Master SVG with Terracotta App Squircle Background
const masterSquircleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d9531e"/>
      <stop offset="100%" stop-color="#b33908"/>
    </linearGradient>
    <linearGradient id="penBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f3ede6"/>
    </linearGradient>
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>

  <!-- Squircle Base with smooth rounded edges -->
  <rect x="24" y="24" width="464" height="464" rx="108" ry="108" fill="url(#bgGrad)"/>
  <rect x="24" y="24" width="464" height="464" rx="108" ry="108" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="4"/>

  <!-- Writing Hand with Pen Emblem (✍️) -->
  <g transform="translate(256, 256) rotate(-10) translate(-256, -256)">
    <!-- Pen Barrel -->
    <path d="M194 320 L336 178 L368 210 L226 352 Z" fill="url(#penBody)"/>
    <!-- Pen Ring / Clip -->
    <path d="M308 206 L338 176 L350 188 L320 218 Z" fill="url(#goldAccent)"/>
    <!-- Pen Nib Base & Point -->
    <path d="M194 320 L156 358 L146 368 L156 378 L166 368 L204 330 Z" fill="url(#goldAccent)"/>
    <path d="M156 358 L138 382 L146 368 Z" fill="#1e1b18"/>
    <!-- Ink line flourish -->
    <path d="M120 398 Q146 388 174 390 Q210 394 246 386" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="10" stroke-linecap="round"/>

    <!-- Hand Palm -->
    <path d="M228 350 C244 366 284 390 324 390 C364 390 400 354 400 310 C400 278 368 250 336 250 L264 322 Z" fill="#ffffff" opacity="0.96"/>
    <!-- Thumb holding pen grip -->
    <path d="M214 322 C204 308 210 284 230 274 C250 264 276 274 288 294 L252 334 Z" fill="#ffffff"/>
    <!-- Index Finger guiding pen -->
    <path d="M260 242 C276 226 304 228 320 244 C334 258 334 282 318 298 L264 322 Z" fill="#f8fafc"/>
    <!-- Finger detail line -->
    <path d="M284 266 C290 272 298 280 302 288" stroke="#d97706" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
  </g>
</svg>
`;

// Master SVG with Transparent Background (just the emblem)
const masterTransparentSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="tPenBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c2410c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </linearGradient>
    <linearGradient id="tGoldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>

  <!-- Writing Hand with Pen Emblem (✍️) for transparent backgrounds -->
  <g transform="translate(256, 256) rotate(-10) translate(-256, -256)">
    <!-- Pen Barrel -->
    <path d="M194 320 L336 178 L368 210 L226 352 Z" fill="url(#tPenBody)"/>
    <!-- Pen Ring -->
    <path d="M308 206 L338 176 L350 188 L320 218 Z" fill="url(#tGoldAccent)"/>
    <!-- Pen Nib Base & Point -->
    <path d="M194 320 L156 358 L146 368 L156 378 L166 368 L204 330 Z" fill="url(#tGoldAccent)"/>
    <path d="M156 358 L138 382 L146 368 Z" fill="#1e1b18"/>
    <!-- Ink line flourish -->
    <path d="M120 398 Q146 388 174 390 Q210 394 246 386" fill="none" stroke="#c2410c" stroke-width="12" stroke-linecap="round"/>

    <!-- Hand Palm -->
    <path d="M228 350 C244 366 284 390 324 390 C364 390 400 354 400 310 C400 278 368 250 336 250 L264 322 Z" fill="#1e1b18" opacity="0.95"/>
    <!-- Thumb holding pen grip -->
    <path d="M214 322 C204 308 210 284 230 274 C250 264 276 274 288 294 L252 334 Z" fill="#1e1b18"/>
    <!-- Index Finger guiding pen -->
    <path d="M260 242 C276 226 304 228 320 244 C334 258 334 282 318 298 L264 322 Z" fill="#2d2824"/>
    <!-- Detail -->
    <path d="M284 266 C290 272 298 280 302 288" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
</svg>
`;

// Save SVGs
fs.writeFileSync(path.resolve(__dirname, '../public/icons/icon.svg'), masterSquircleSvg);
fs.writeFileSync(path.resolve(__dirname, '../public/icons/transparent/icon-transparent.svg'), masterTransparentSvg);
fs.writeFileSync(path.resolve(__dirname, '../extension/icons/icon.svg'), masterSquircleSvg);

async function generateAll() {
  const masterBuffer = Buffer.from(masterSquircleSvg);
  const transparentBuffer = Buffer.from(masterTransparentSvg);

  console.log('Rendering all icon variations with sharp...');

  // Standard Extension & App Icon Sizes
  const standardSizes = [
    { size: 16, name: 'icon16.png', dir: '../extension/icons' },
    { size: 19, name: 'icon19.png', dir: '../extension/icons' },
    { size: 32, name: 'icon32.png', dir: '../extension/icons' },
    { size: 38, name: 'icon38.png', dir: '../extension/icons' },
    { size: 48, name: 'icon48.png', dir: '../extension/icons' },
    { size: 128, name: 'icon128.png', dir: '../extension/icons' },
    { size: 256, name: 'icon256.png', dir: '../extension/icons' },
    { size: 512, name: 'icon512.png', dir: '../extension/icons' },

    // WebStore Dedicated Icon
    { size: 128, name: 'store_icon_128x128.png', dir: '../extension/webstore' },
    { size: 128, name: 'store_icon_128x128.png', dir: '../public/webstore' },

    // Public / Website / PWA Icons
    { size: 16, name: 'favicon-16x16.png', dir: '../public/icons' },
    { size: 32, name: 'favicon-32x32.png', dir: '../public/icons' },
    { size: 48, name: 'icon-48x48.png', dir: '../public/icons' },
    { size: 128, name: 'icon-128x128.png', dir: '../public/icons' },
    { size: 180, name: 'apple-touch-icon.png', dir: '../public' },
    { size: 192, name: 'pwa-192x192.png', dir: '../public' },
    { size: 512, name: 'pwa-512x512.png', dir: '../public' },
    { size: 192, name: 'icon-192x192.png', dir: '../public/icons' },
    { size: 512, name: 'icon-512x512.png', dir: '../public/icons' },
  ];

  for (const item of standardSizes) {
    const dest = path.resolve(__dirname, item.dir, item.name);
    await sharp(masterBuffer)
      .resize(item.size, item.size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);
    console.log(`Rendered: ${item.name} (${item.size}x${item.size})`);
  }

  // Transparent versions
  const transparentSizes = [
    { size: 16, name: 'icon16_transparent.png' },
    { size: 32, name: 'icon32_transparent.png' },
    { size: 48, name: 'icon48_transparent.png' },
    { size: 128, name: 'icon128_transparent.png' },
    { size: 512, name: 'icon512_transparent.png' },
  ];

  for (const item of transparentSizes) {
    const extDest = path.resolve(__dirname, '../extension/icons/transparent', item.name);
    const pubDest = path.resolve(__dirname, '../public/icons/transparent', item.name);
    await sharp(transparentBuffer)
      .resize(item.size, item.size)
      .png({ quality: 100 })
      .toFile(extDest);
    await sharp(transparentBuffer)
      .resize(item.size, item.size)
      .png({ quality: 100 })
      .toFile(pubDest);
    console.log(`Rendered transparent: ${item.name}`);
  }

  // Chrome Web Store Promo Graphics
  // 1. Small Promo Tile (440x280)
  const smallPromoBuffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 280" width="440" height="280">
      <defs>
        <linearGradient id="bgS" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#faf7f2"/>
          <stop offset="100%" stop-color="#f2ebe1"/>
        </linearGradient>
      </defs>
      <rect width="440" height="280" fill="url(#bgS)"/>
      <rect x="2" y="2" width="436" height="276" fill="none" stroke="#e6dfd5" stroke-width="2"/>

      <g transform="translate(48, 48)">
        <rect width="72" height="72" rx="18" fill="#c2410c"/>
        <text x="36" y="50" font-size="40" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif">✍️</text>
      </g>
      <text x="136" y="84" font-family="system-ui, sans-serif" font-weight="700" font-size="28" fill="#1e1b18">WellSaid</text>
      <text x="136" y="112" font-family="Georgia, serif" font-size="16" fill="#c2410c" font-style="italic">Say the hard thing, well.</text>

      <g transform="translate(48, 150)">
        <rect x="0" y="0" width="102" height="28" rx="14" fill="#ffffff" stroke="#e6dfd5"/>
        <text x="51" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c2410c" text-anchor="middle">1. Warm</text>

        <rect x="116" y="0" width="102" height="28" rx="14" fill="#ffffff" stroke="#e6dfd5"/>
        <text x="167" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c2410c" text-anchor="middle">2. Direct</text>

        <rect x="232" y="0" width="102" height="28" rx="14" fill="#ffffff" stroke="#e6dfd5"/>
        <text x="283" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c2410c" text-anchor="middle">3. Short</text>
      </g>
      <text x="48" y="224" font-family="Georgia, serif" font-size="13" fill="#6f675f">Instant rewrite companion for WhatsApp, LinkedIn, Gmail &amp; X</text>
    </svg>
  `);
  await sharp(smallPromoBuffer).toFile(path.resolve(__dirname, '../extension/webstore/small_promo_440x280.png'));
  await sharp(smallPromoBuffer).toFile(path.resolve(__dirname, '../public/webstore/small_promo_440x280.png'));
  console.log('Rendered: small_promo_440x280.png');

  // 2. Large Promo Tile (920x680)
  const largePromoBuffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 680" width="920" height="680">
      <defs>
        <linearGradient id="bgL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#faf7f2"/>
          <stop offset="100%" stop-color="#eee5d8"/>
        </linearGradient>
      </defs>
      <rect width="920" height="680" fill="url(#bgL)"/>

      <g transform="translate(100, 80)">
        <rect width="96" height="96" rx="24" fill="#c2410c"/>
        <text x="48" y="65" font-size="54" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif">✍️</text>
        <text x="120" y="52" font-family="system-ui, sans-serif" font-weight="700" font-size="42" fill="#1e1b18">WellSaid</text>
        <text x="120" y="86" font-family="Georgia, serif" font-size="24" fill="#c2410c" font-style="italic">Say the hard thing, well.</text>
      </g>

      <g transform="translate(100, 230)">
        <rect width="720" height="350" rx="20" fill="#ffffff" stroke="#e6dfd5" stroke-width="2"/>
        <rect x="28" y="28" width="140" height="28" rx="14" fill="#fef2ee"/>
        <text x="98" y="47" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#c2410c" text-anchor="middle">1. WARM &amp; GENTLE</text>
        <text x="28" y="94" font-family="Georgia, serif" font-size="18" fill="#1e1b18">"I really appreciate you thinking of me, but I'm not in a position to take this on</text>
        <text x="28" y="122" font-family="Georgia, serif" font-size="18" fill="#1e1b18">right now. I wanted to be honest rather than keep you waiting."</text>

        <line x1="28" y1="156" x2="692" y2="156" stroke="#f0e9df" stroke-width="1.5"/>

        <rect x="28" y="180" width="160" height="28" rx="14" fill="#fef2ee"/>
        <text x="108" y="199" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#c2410c" text-anchor="middle">2. DIRECT &amp; CLEAR</text>
        <text x="28" y="242" font-family="Georgia, serif" font-size="17" fill="#1e1b18">"Thank you for checking in. Due to current commitments, I won't be able</text>
        <text x="28" y="268" font-family="Georgia, serif" font-size="17" fill="#1e1b18">to move forward with this. Best of luck with everything."</text>

        <text x="28" y="318" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#16a34a">✓ 1-Tap Auto-Replace right inside WhatsApp Web, LinkedIn, Twitter &amp; Gmail</text>
      </g>
    </svg>
  `);
  await sharp(largePromoBuffer).toFile(path.resolve(__dirname, '../extension/webstore/large_promo_920x680.png'));
  await sharp(largePromoBuffer).toFile(path.resolve(__dirname, '../public/webstore/large_promo_920x680.png'));
  console.log('Rendered: large_promo_920x680.png');

  // 3. Marquee Banner (1400x560)
  const marqueeBuffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 560" width="1400" height="560">
      <defs>
        <linearGradient id="bgM" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b18"/>
          <stop offset="100%" stop-color="#12100e"/>
        </linearGradient>
      </defs>
      <rect width="1400" height="560" fill="url(#bgM)"/>

      <g transform="translate(100, 140)">
        <rect width="90" height="90" rx="22" fill="#c2410c"/>
        <text x="45" y="62" font-size="50" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif">✍️</text>
        
        <text x="114" y="55" font-family="system-ui, sans-serif" font-weight="700" font-size="44" fill="#ffffff">WellSaid</text>
        <text x="114" y="92" font-family="Georgia, serif" font-size="26" fill="#fb923c" font-style="italic">Say the hard thing, well.</text>

        <text x="0" y="170" font-family="Georgia, serif" font-size="22" fill="#f3ede6">The Grammarly for difficult conversations.</text>
        <text x="0" y="206" font-family="system-ui, sans-serif" font-size="16" fill="#a39a90">Apologies • Salary Discussions • Declining Invites • Boundaries • Tough Feedback</text>

        <rect x="0" y="240" width="220" height="44" rx="22" fill="#c2410c"/>
        <text x="110" y="268" font-family="system-ui, sans-serif" font-weight="600" font-size="15" fill="#ffffff" text-anchor="middle">Add to Chrome — Free</text>
      </g>

      <g transform="translate(760, 90)">
        <rect width="540" height="110" rx="14" fill="#2a2522" stroke="#38322d" stroke-width="1.5"/>
        <text x="24" y="38" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#fb923c">1. WARM &amp; GENTLE</text>
        <text x="24" y="68" font-family="Georgia, serif" font-size="15" fill="#f3ede6">"I truly value our relationship, but need to step back..."</text>

        <rect y="130" width="540" height="110" rx="14" fill="#2a2522" stroke="#38322d" stroke-width="1.5"/>
        <text x="24" y="168" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#fb923c">2. DIRECT &amp; PROFESSIONAL</text>
        <text x="24" y="198" font-family="Georgia, serif" font-size="15" fill="#f3ede6">"I'd like to schedule time this week to review my compensation."</text>

        <rect y="260" width="540" height="110" rx="14" fill="#2a2522" stroke="#38322d" stroke-width="1.5"/>
        <text x="24" y="298" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#fb923c">3. SHORT &amp; FIRM</text>
        <text x="24" y="328" font-family="Georgia, serif" font-size="15" fill="#f3ede6">"Thanks for checking in, but I won't be able to attend."</text>
      </g>
    </svg>
  `);
  await sharp(marqueeBuffer).toFile(path.resolve(__dirname, '../extension/webstore/marquee_1400x560.png'));
  await sharp(marqueeBuffer).toFile(path.resolve(__dirname, '../public/webstore/marquee_1400x560.png'));
  console.log('Rendered: marquee_1400x560.png');

  // Create a README in public/icons
  const readme = `WellSaid Icon & Web Store Asset Suite
======================================
This package contains all pixel dimensions and variations for the WellSaid extension and brand:

1. Chrome Extension Required Icons (Manifest V3):
   - icon16.png (16x16) — Extension favicon, context menus, and small trays.
   - icon19.png (19x19) — Standard extension action bar button.
   - icon32.png (32x32) — Windows & high-DPI Retina screens.
   - icon38.png (38x38) — High-DPI action bar button.
   - icon48.png (48x48) — Chrome extension management page (chrome://extensions).
   - icon128.png (128x128) — Chrome Web Store icon and install dialog.
   - icon256.png (256x256) — High-res icon.
   - icon512.png (512x512) — Master high-definition emblem.

2. Chrome Web Store Developer Dashboard Assets:
   - store_icon_128x128.png (128x128) — Main listing square icon.
   - small_promo_440x280.png (440x280) — Small promo tile for search & category discovery.
   - large_promo_920x680.png (920x680) — Large promo tile for featured recommendations.
   - marquee_1400x560.png (1400x560) — Marquee header banner.

3. Mobile PWA & Web:
   - favicon-16x16.png, favicon-32x32.png, icon-48x48.png
   - apple-touch-icon.png (180x180) — iOS Safari Home Screen
   - pwa-192x192.png (192x192) — Android launcher icon
   - pwa-512x512.png (512x512) — PWA splash screen
   - icon.svg — Vector master

4. Transparent Background Icons (in /transparent folder):
   - icon16_transparent.png, icon32_transparent.png, icon48_transparent.png, icon128_transparent.png, icon512_transparent.png
`;
  fs.writeFileSync(path.resolve(__dirname, '../public/icons/README.txt'), readme);
  fs.writeFileSync(path.resolve(__dirname, '../extension/icons/README.txt'), readme);

  console.log('All icons and banners rendered successfully!');
}

generateAll().catch((err) => {
  console.error('Generation error:', err);
  process.exit(1);
});
