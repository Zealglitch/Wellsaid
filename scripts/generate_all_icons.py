#!/usr/bin/env python3
import os
import subprocess

# Output directories
ICONS_DIR = "/extension/icons"
WEBSTORE_DIR = "/extension/webstore"
PUBLIC_ICONS_DIR = "/public/icons"

for d in [ICONS_DIR, WEBSTORE_DIR, PUBLIC_ICONS_DIR]:
    os.makedirs(d, exist_ok=True)

# 1. Master Icon SVG (512x512) - Sleek terracotta squircle with writing hand + pen
icon_svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
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
    <filter id="softShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
    <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Squircle Base with smooth rounded edges -->
  <rect x="24" y="24" width="464" height="464" rx="108" ry="108" fill="url(#bgGrad)" filter="url(#softShadow)"/>
  <rect x="24" y="24" width="464" height="464" rx="108" ry="108" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>

  <!-- Writing Hand with Pen Emblem -->
  <g transform="translate(256, 256) rotate(-12) translate(-256, -256)" filter="url(#innerGlow)">
    <!-- Pen Barrel -->
    <path d="M190 322 L334 178 L366 210 L222 354 Z" fill="url(#penBody)"/>
    <!-- Pen Clip / Ring Accent -->
    <path d="M304 208 L336 176 L348 188 L316 220 Z" fill="url(#goldAccent)"/>
    <!-- Pen Nib Base & Point -->
    <path d="M190 322 L152 360 L144 368 L152 376 L160 368 L198 330 Z" fill="url(#goldAccent)"/>
    <path d="M152 360 L136 384 L144 368 Z" fill="#1e1b18"/>
    <!-- Ink line stroke accent -->
    <path d="M128 392 Q144 386 168 388 Q200 392 232 384" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="8" stroke-linecap="round"/>

    <!-- The Hand Holding The Pen -->
    <!-- Palm / Back of Hand -->
    <path d="M224 352 C240 368 280 392 320 392 C360 392 396 356 396 312 C396 280 364 252 332 252 L260 324 Z" fill="#ffffff" opacity="0.95"/>
    <!-- Thumb holding pen grip -->
    <path d="M210 324 C200 310 206 286 226 276 C246 266 272 276 284 296 L248 336 Z" fill="#ffffff"/>
    <!-- Index Finger guiding top of pen -->
    <path d="M256 244 C272 228 300 230 316 246 C330 260 330 284 314 300 L260 324 Z" fill="#f8fafc"/>
    <!-- Knuckle crease accents -->
    <path d="M280 268 C286 274 294 282 298 290" stroke="#d97706" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/>
  </g>
</svg>
"""

# 2. Transparent Icon SVG (No background rectangle, just the emblem)
transparent_svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="penBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c2410c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </linearGradient>
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Writing Hand with Pen Emblem - Colored for Light/Transparent backgrounds -->
  <g transform="translate(256, 256) rotate(-12) translate(-256, -256)" filter="url(#softShadow)">
    <!-- Pen Barrel -->
    <path d="M190 322 L334 178 L366 210 L222 354 Z" fill="url(#penBody)"/>
    <!-- Pen Clip / Ring Accent -->
    <path d="M304 208 L336 176 L348 188 L316 220 Z" fill="url(#goldAccent)"/>
    <!-- Pen Nib Base & Point -->
    <path d="M190 322 L152 360 L144 368 L152 376 L160 368 L198 330 Z" fill="url(#goldAccent)"/>
    <path d="M152 360 L136 384 L144 368 Z" fill="#1e1b18"/>
    <!-- Ink stroke -->
    <path d="M128 392 Q144 386 168 388 Q200 392 232 384" fill="none" stroke="#c2410c" stroke-width="10" stroke-linecap="round"/>

    <!-- Hand -->
    <path d="M224 352 C240 368 280 392 320 392 C360 392 396 356 396 312 C396 280 364 252 332 252 L260 324 Z" fill="#1e1b18" opacity="0.95"/>
    <path d="M210 324 C200 310 206 286 226 276 C246 266 272 276 284 296 L248 336 Z" fill="#1e1b18"/>
    <path d="M256 244 C272 228 300 230 316 246 C330 260 330 284 314 300 L260 324 Z" fill="#2d2824"/>
    <path d="M280 268 C286 274 294 282 298 290" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
</svg>
"""

master_svg_path = "/tmp/wellsaid_master.svg"
with open(master_svg_path, "w") as f:
    f.write(icon_svg_content)

# Save master SVG to public and extension as well
with open(os.path.join(PUBLIC_ICONS_DIR, "icon.svg"), "w") as f:
    f.write(icon_svg_content)
with open(os.path.join(ICONS_DIR, "icon.svg"), "w") as f:
    f.write(icon_svg_content)

# Icon sizes needed for Chrome Extension, Manifest V3, Web Store, PWA, iOS, Favicons
sizes = [
    (16, "icon16.png", ICONS_DIR),
    (32, "icon32.png", ICONS_DIR),
    (48, "icon48.png", ICONS_DIR),
    (128, "icon128.png", ICONS_DIR),
    (192, "icon192.png", ICONS_DIR),
    (512, "icon512.png", ICONS_DIR),
    
    # Web Store dedicated folder
    (128, "webstore_icon_128x128.png", WEBSTORE_DIR),
    
    # Public directory for website & PWA
    (16, "favicon-16x16.png", PUBLIC_ICONS_DIR),
    (32, "favicon-32x32.png", PUBLIC_ICONS_DIR),
    (48, "icon-48x48.png", PUBLIC_ICONS_DIR),
    (128, "icon-128x128.png", PUBLIC_ICONS_DIR),
    (180, "apple-touch-icon.png", "/public"),
    (192, "pwa-192x192.png", "/public"),
    (512, "pwa-512x512.png", "/public"),
]

print("Rendering icons with ImageMagick...")
for size, filename, dest_dir in sizes:
    target_path = os.path.join(dest_dir, filename)
    cmd = [
        "convert",
        "-background", "none",
        "-resize", f"{size}x{size}",
        master_svg_path,
        target_path
    ]
    subprocess.run(cmd, check=True)
    print(f"Generated: {target_path} ({size}x{size})")

# 3. Chrome Web Store Promo Tiles:
# Small Promo Tile: 440x280
small_promo_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 280" width="440" height="280">
  <defs>
    <linearGradient id="tileBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faf7f2"/>
      <stop offset="100%" stop-color="#f0e9df"/>
    </linearGradient>
  </defs>
  <rect width="440" height="280" fill="url(#tileBg)"/>
  <rect x="1" y="1" width="438" height="278" rx="0" fill="none" stroke="#e6dfd5" stroke-width="2"/>
  
  <!-- Icon Emblem -->
  <g transform="translate(60, 50)">
    <rect width="80" height="80" rx="20" fill="#c2410c"/>
    <text x="40" y="54" font-size="44" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif">✍️</text>
  </g>

  <!-- Typography -->
  <text x="160" y="90" font-family="system-ui, sans-serif" font-weight="700" font-size="28" fill="#1e1b18">WellSaid</text>
  <text x="160" y="118" font-family="Georgia, serif" font-size="16" fill="#c2410c" font-style="italic">Say the hard thing, well.</text>

  <!-- Feature pill tags -->
  <g transform="translate(60, 160)">
    <rect x="0" y="0" width="95" height="28" rx="14" fill="#ffffff" stroke="#e6dfd5"/>
    <text x="47" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c2410c" text-anchor="middle">1. Warm</text>

    <rect x="105" y="0" width="95" height="28" rx="14" fill="#ffffff" stroke="#e6dfd5"/>
    <text x="152" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c2410c" text-anchor="middle">2. Direct</text>

    <rect x="210" y="0" width="95" height="28" rx="14" fill="#ffffff" stroke="#e6dfd5"/>
    <text x="257" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c2410c" text-anchor="middle">3. Short</text>
  </g>

  <text x="60" y="228" font-family="Georgia, serif" font-size="13" fill="#6f675f">Instant rewrite companion for WhatsApp, LinkedIn, Gmail &amp; X</text>
</svg>
"""

small_promo_svg_path = "/tmp/small_promo.svg"
with open(small_promo_svg_path, "w") as f:
    f.write(small_promo_svg)

cmd = ["convert", "-background", "none", small_promo_svg_path, os.path.join(WEBSTORE_DIR, "small_promo_440x280.png")]
subprocess.run(cmd, check=True)
print("Generated: small_promo_440x280.png")

# Large Promo Tile: 920x680
large_promo_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 680" width="920" height="680">
  <defs>
    <linearGradient id="tileBgLarge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faf7f2"/>
      <stop offset="100%" stop-color="#eee5d8"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="920" height="680" fill="url(#tileBgLarge)"/>
  
  <!-- Header Branding -->
  <g transform="translate(100, 90)">
    <rect width="96" height="96" rx="24" fill="#c2410c"/>
    <text x="48" y="65" font-size="54" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif">✍️</text>
    <text x="120" y="52" font-family="system-ui, sans-serif" font-weight="700" font-size="42" fill="#1e1b18">WellSaid</text>
    <text x="120" y="86" font-family="Georgia, serif" font-size="24" fill="#c2410c" font-style="italic">Say the hard thing, well.</text>
  </g>

  <!-- Simulated Tone Preview Card -->
  <g transform="translate(100, 240)" filter="url(#cardShadow)">
    <rect width="720" height="340" rx="20" fill="#ffffff" stroke="#e6dfd5" stroke-width="2"/>
    
    <!-- Header of card -->
    <rect x="24" y="24" width="140" height="28" rx="14" fill="#fef2ee"/>
    <text x="94" y="43" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#c2410c" text-anchor="middle">1. WARM &amp; GENTLE</text>
    
    <text x="24" y="90" font-family="Georgia, serif" font-size="18" fill="#1e1b18" width="670">"I really appreciate you thinking of me, but I'm not in a position to take this on</text>
    <text x="24" y="118" font-family="Georgia, serif" font-size="18" fill="#1e1b18">right now. I wanted to be honest with you rather than keep you waiting."</text>

    <!-- Divider -->
    <line x1="24" y1="150" x2="696" y2="150" stroke="#f0e9df" stroke-width="1.5"/>

    <!-- Direct Tone preview -->
    <rect x="24" y="174" width="160" height="28" rx="14" fill="#fef2ee"/>
    <text x="104" y="193" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#c2410c" text-anchor="middle">2. DIRECT &amp; CLEAR</text>
    <text x="24" y="236" font-family="Georgia, serif" font-size="17" fill="#1e1b18">"Thank you for reaching out. Due to current commitments, I won't be able</text>
    <text x="24" y="262" font-family="Georgia, serif" font-size="17" fill="#1e1b18">to move forward with this. Best of luck with everything."</text>

    <!-- Auto-replace banner -->
    <text x="24" y="310" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#16a34a">✓ 1-Tap Auto-Replace right inside WhatsApp Web, LinkedIn, Twitter &amp; Gmail</text>
  </g>
</svg>
"""

large_promo_svg_path = "/tmp/large_promo.svg"
with open(large_promo_svg_path, "w") as f:
    f.write(large_promo_svg)

cmd = ["convert", "-background", "none", large_promo_svg_path, os.path.join(WEBSTORE_DIR, "large_promo_920x680.png")]
subprocess.run(cmd, check=True)
print("Generated: large_promo_920x680.png")

# Marquee Banner: 1400x560
marquee_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 560" width="1400" height="560">
  <defs>
    <linearGradient id="marqueeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b18"/>
      <stop offset="100%" stop-color="#12100e"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="560" fill="url(#marqueeBg)"/>

  <!-- Left Side: Brand and Tagline -->
  <g transform="translate(100, 150)">
    <rect width="90" height="90" rx="22" fill="#c2410c"/>
    <text x="45" y="62" font-size="50" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif">✍️</text>
    
    <text x="114" y="55" font-family="system-ui, sans-serif" font-weight="700" font-size="44" fill="#ffffff">WellSaid</text>
    <text x="114" y="92" font-family="Georgia, serif" font-size="26" fill="#fb923c" font-style="italic">Say the hard thing, well.</text>

    <text x="0" y="170" font-family="Georgia, serif" font-size="22" fill="#f3ede6" width="600">The Grammarly for difficult conversations.</text>
    <text x="0" y="206" font-family="system-ui, sans-serif" font-size="16" fill="#a39a90">Apologies • Salary Discussions • Declining Invites • Boundaries • Tough Feedback</text>

    <rect x="0" y="240" width="220" height="44" rx="22" fill="#c2410c"/>
    <text x="110" y="268" font-family="system-ui, sans-serif" font-weight="600" font-size="15" fill="#ffffff" text-anchor="middle">Add to Chrome — Free</text>
  </g>

  <!-- Right Side: 3 Tones Showcase Cards -->
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
"""

marquee_svg_path = "/tmp/marquee_promo.svg"
with open(marquee_svg_path, "w") as f:
    f.write(marquee_svg)

cmd = ["convert", "-background", "none", marquee_svg_path, os.path.join(WEBSTORE_DIR, "marquee_1400x560.png")]
subprocess.run(cmd, check=True)
print("Generated: marquee_1400x560.png")

print("All icons and promotional graphics generated successfully!")
