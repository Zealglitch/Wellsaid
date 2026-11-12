const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const framesDir = path.resolve(__dirname, '../frames_temp');
const publicDir = path.resolve(__dirname, '../public');
const outputMp4 = path.join(publicDir, 'wellsaid-promo-video.mp4');

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Clean old frames
const existingFiles = fs.readdirSync(framesDir);
for (const f of existingFiles) {
  fs.unlinkSync(path.join(framesDir, f));
}

const iconB64 = 'data:image/png;base64,' + fs.readFileSync(path.resolve(__dirname, '../public/assets/aistudio/icon-128_a3de522a.png')).toString('base64');

const fullText = "i am really sorry. i was just ranting out of frustration and i dont know what i was saying... please forgive me";

// Generate SVG for a given frame state
function renderFrameSvg({
  time, // in seconds
  cursorX,
  cursorY,
  cursorClicked,
  popupOpen,
  typedChars,
  rewriteClicked,
  showResults,
  selectedTone,
  showCopiedToast,
  isOutro,
}) {
  const width = 1280;
  const height = 720;

  if (isOutro) {
    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#181512"/>
      <stop offset="100%" stop-color="#0a0908"/>
    </linearGradient>
    <linearGradient id="terraGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  <circle cx="640" cy="360" r="320" fill="#c2410c" opacity="0.18"/>

  <g transform="translate(640, 260)" text-anchor="middle">
    <!-- Icon -->
    <image href="${iconB64}" x="-44" y="-90" width="88" height="88"/>

    <!-- Brand -->
    <text y="24" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="#ffffff" letter-spacing="-1">WellSaid</text>
    <text y="70" font-family="Georgia, serif" font-size="24" fill="#fb923c" font-style="italic">Say the hard thing, well.</text>

    <!-- Badges -->
    <g transform="translate(0, 130)">
      <rect x="-210" y="0" width="420" height="48" rx="24" fill="#221e1a" stroke="#3d352e" stroke-width="1.5"/>
      <text y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#faf7f2">
        Available on the Chrome Web Store
      </text>
    </g>
  </g>
</svg>
    `;
  }

  const typedDisplay = fullText.substring(0, typedChars);
  // Break into 2 lines if needed
  const line1 = typedDisplay.length > 55 ? typedDisplay.substring(0, 55) : typedDisplay;
  const line2 = typedDisplay.length > 55 ? typedDisplay.substring(55) : "";

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="deskBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1c1916"/>
      <stop offset="100%" stop-color="#0f0d0b"/>
    </linearGradient>
    <linearGradient id="terraGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <filter id="popupShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
  </defs>

  <!-- Desktop Background -->
  <rect width="${width}" height="${height}" fill="url(#deskBg)"/>
  <circle cx="950" cy="250" r="300" fill="#c2410c" opacity="0.14"/>

  <!-- Chrome Browser Top Bar Mockup -->
  <g transform="translate(80, 40)">
    <!-- Browser Window Frame -->
    <rect width="1120" height="640" rx="12" fill="#141210" stroke="#2d2722" stroke-width="1.5"/>

    <!-- Browser Title / Tab Bar -->
    <rect x="0" y="0" width="1120" height="42" rx="12" fill="#231f1b"/>
    <!-- Window controls -->
    <circle cx="20" cy="21" r="5" fill="#ef4444"/>
    <circle cx="36" cy="21" r="5" fill="#f59e0b"/>
    <circle cx="52" cy="21" r="5" fill="#22c55e"/>

    <!-- Active Tab -->
    <path d="M80 42 L100 12 L260 12 L280 42 Z" fill="#181512"/>
    <text x="140" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#d6d3d1">Gmail – Compose</text>

    <!-- Browser Address & Extensions Bar -->
    <rect x="0" y="42" width="1120" height="46" fill="#181512" stroke="#26211c" stroke-width="1"/>
    
    <!-- Nav arrows -->
    <text x="24" y="70" font-size="14" fill="#78716c">‹</text>
    <text x="44" y="70" font-size="14" fill="#78716c">›</text>
    <text x="66" y="70" font-size="14" fill="#78716c">↻</text>

    <!-- URL Omnibox -->
    <rect x="94" y="50" width="760" height="30" rx="15" fill="#26221e"/>
    <text x="114" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#a8a29e">🔒 https://mail.google.com/mail/u/0/#inbox?compose=new</text>

    <!-- Extensions Toolbar Section (Top Right) -->
    <g transform="translate(930, 48)">
      <!-- Standard extension puzzle -->
      <circle cx="20" cy="17" r="14" fill="#231f1b"/>
      <text x="15" y="22" font-size="13" fill="#a8a29e">🧩</text>

      <!-- WELLSAID TOOLBAR EXTENSION ICON -->
      <image href="${iconB64}" x="48" y="3" width="28" height="28"/>

      <!-- Account circle -->
      <circle cx="106" cy="17" r="14" fill="#3f3f46"/>
      <text x="106" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">Z</text>
    </g>

    <!-- Browser Page Content (Gmail Background Simulation) -->
    <g transform="translate(60, 120)">
      <text x="0" y="30" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#faf7f2">Inbox (1)</text>
      
      <!-- Fake email thread -->
      <rect x="0" y="50" width="600" height="60" rx="8" fill="#1e1b18" stroke="#2d2824" stroke-width="1"/>
      <text x="20" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#faf7f2">Alex Miller</text>
      <text x="140" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#a8a29e">Regarding the project status meeting from yesterday...</text>
      <text x="540" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#78716c">10:42 AM</text>

      <!-- Compose Window Mockup in lower left -->
      <g transform="translate(0, 140)">
        <rect width="520" height="300" rx="10" fill="#1b1816" stroke="#332c25" stroke-width="1.5"/>
        <rect width="520" height="36" rx="10" fill="#24201c"/>
        <text x="16" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#d6d3d1">New Message</text>
        <text x="496" y="23" font-size="12" fill="#a8a29e">✕</text>

        <text x="16" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#78716c">To: alex.miller@company.com</text>
        <line x1="16" y1="68" x2="504" y2="68" stroke="#2a241f" stroke-width="1"/>

        <text x="16" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#78716c">Subject: Sincere Apology</text>
        <line x1="16" y1="100" x2="504" y2="100" stroke="#2a241f" stroke-width="1"/>

        ${showCopiedToast ? `
        <!-- Draft Replaced into Email -->
        <text x="16" y="130" font-family="Georgia, serif" font-size="14" fill="#faf7f2">Hi Alex,</text>
        <text x="16" y="156" font-family="Georgia, serif" font-size="14" fill="#faf7f2">I want to apologize sincerely for how I reacted earlier.</text>
        <text x="16" y="178" font-family="Georgia, serif" font-size="14" fill="#faf7f2">I was feeling overwhelmed and didn't communicate well.</text>
        <text x="16" y="200" font-family="Georgia, serif" font-size="14" fill="#faf7f2">I hope we can talk soon.</text>
        ` : `
        <text x="16" y="130" font-family="Georgia, serif" font-size="14" fill="#52525b" font-style="italic">Draft your message here...</text>
        `}
      </g>
    </g>

    <!-- FLOATING EXTENSION POPUP (EXACT 1:1 REPLICA FROM SCREENSHOT) -->
    ${popupOpen ? `
    <g transform="translate(680, 92)" filter="url(#popupShadow)">
      <!-- Outer Border / Card -->
      <rect width="400" height="${showResults ? '520' : '280'}" rx="16" fill="#1b1815" stroke="#383028" stroke-width="1.5"/>

      <!-- Header -->
      <g transform="translate(20, 24)">
        <image href="${iconB64}" x="0" y="-4" width="22" height="22"/>
        <text x="28" y="14" font-family="Georgia, serif" font-size="19" font-weight="bold" fill="#ea580c">WellSaid</text>
        <text x="0" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#a8a29e">Say the hard thing, well.</text>
        <text x="350" y="16" font-size="16" fill="#a8a29e" text-anchor="end" cursor="pointer">✕</text>
      </g>

      <!-- WHAT IS IT? -->
      <g transform="translate(20, 78)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#a8a29e" letter-spacing="0.5">WHAT IS IT?</text>
        <rect x="0" y="8" width="360" height="34" rx="8" fill="#141210" stroke="#332c25" stroke-width="1"/>
        <text x="14" y="30" font-family="Georgia, serif" font-size="13" fill="#faf7f2">An apology</text>
        <text x="340" y="30" font-size="10" fill="#a8a29e">▼</text>
      </g>

      <!-- YOUR MESSAGE -->
      <g transform="translate(20, 142)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#a8a29e" letter-spacing="0.5">YOUR MESSAGE</text>
        <text x="360" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#ea580c" text-anchor="end">Clear</text>

        <rect x="0" y="8" width="360" height="66" rx="8" fill="#141210" stroke="${typedChars > 0 ? '#ea580c' : '#332c25'}" stroke-width="1"/>

        ${typedChars === 0 ? `
          <text x="14" y="32" font-family="Georgia, serif" font-size="12" fill="#52525b">Type what you dread to send...</text>
        ` : `
          <text x="14" y="30" font-family="Georgia, serif" font-size="12" fill="#faf7f2">${line1}</text>
          <text x="14" y="48" font-family="Georgia, serif" font-size="12" fill="#faf7f2">${line2}</text>
          <!-- Blinking typing cursor -->
          <line x1="${14 + (line2.length > 0 ? line2.length * 6.5 : line1.length * 6.5)}" y1="${line2.length > 0 ? 37 : 19}" x2="${14 + (line2.length > 0 ? line2.length * 6.5 : line1.length * 6.5)}" y2="${line2.length > 0 ? 51 : 33}" stroke="#ea580c" stroke-width="2"/>
        `}
      </g>

      <!-- REWRITE IT BUTTON -->
      <g transform="translate(20, 226)">
        <rect width="360" height="40" rx="10" fill="${rewriteClicked ? '#c2410c' : '#f97316'}" filter="drop-shadow(0 2px 6px rgba(194,65,12,0.3))"/>
        <text x="180" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Rewrite it</text>
      </g>

      ${showResults ? `
      <!-- RESULTS SECTION -->
      <g transform="translate(20, 280)">
        <!-- Tone 1: Warm & gentle -->
        <g transform="translate(0, 0)">
          <rect width="360" height="70" rx="8" fill="${selectedTone === 'warm' ? '#29231e' : '#221e1a'}" stroke="${selectedTone === 'warm' ? '#ea580c' : '#3d352e'}" stroke-width="${selectedTone === 'warm' ? '1.5' : '1'}"/>
          <rect x="10" y="8" width="92" height="18" rx="9" fill="#f59e0b" fill-opacity="0.2"/>
          <text x="56" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#fbbf24" text-anchor="middle">Warm &amp; gentle</text>
          
          <!-- Arrow button -->
          <circle cx="342" cy="18" r="9" fill="#ea580c"/>
          <text x="342" y="21" font-size="10" fill="#ffffff" text-anchor="middle">→</text>

          <text x="10" y="42" font-family="Georgia, serif" font-size="11" fill="#faf7f2">"I want to apologize sincerely for how I reacted earlier.</text>
          <text x="10" y="58" font-family="Georgia, serif" font-size="11" fill="#faf7f2">I was feeling overwhelmed and communicate poorly."</text>
        </g>

        <!-- Tone 2: Direct & professional -->
        <g transform="translate(0, 78)">
          <rect width="360" height="70" rx="8" fill="#221e1a" stroke="#3d352e" stroke-width="1"/>
          <rect x="10" y="8" width="124" height="18" rx="9" fill="#0284c7" fill-opacity="0.2"/>
          <text x="72" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#38bdf8" text-anchor="middle">Direct &amp; professional</text>
          
          <circle cx="342" cy="18" r="9" fill="#ea580c"/>
          <text x="342" y="21" font-size="10" fill="#ffffff" text-anchor="middle">→</text>

          <text x="10" y="42" font-family="Georgia, serif" font-size="11" fill="#faf7f2">"I apologize for my previous message. It was uncalled for</text>
          <text x="10" y="58" font-family="Georgia, serif" font-size="11" fill="#faf7f2">and did not reflect my usual standard."</text>
        </g>

        <!-- Tone 3: Short & firm -->
        <g transform="translate(0, 156)">
          <rect width="360" height="66" rx="8" fill="#221e1a" stroke="#3d352e" stroke-width="1"/>
          <rect x="10" y="8" width="84" height="18" rx="9" fill="#ea580c" fill-opacity="0.2"/>
          <text x="52" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#ea580c" text-anchor="middle">Short &amp; firm</text>
          
          <circle cx="342" cy="18" r="9" fill="#ea580c"/>
          <text x="342" y="21" font-size="10" fill="#ffffff" text-anchor="middle">→</text>

          <text x="10" y="42" font-family="Georgia, serif" font-size="11" fill="#faf7f2">"I'm sorry for my earlier frustration. Please disregard."</text>
        </g>
      </g>
      ` : ''}

      ${showCopiedToast ? `
      <!-- Copied Notification Badge -->
      <g transform="translate(40, 240)">
        <rect width="320" height="36" rx="8" fill="#16a34a" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.4))"/>
        <text x="160" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#ffffff" text-anchor="middle">
          ✓ Copied to clipboard &amp; draft inserted!
        </text>
      </g>
      ` : ''}
    </g>
    ` : ''}
  </g>

  <!-- MOUSE CURSOR OVERLAY -->
  ${!isOutro ? `
  <g transform="translate(${cursorX}, ${cursorY})">
    <polygon points="0,0 0,18 4.5,14 8,22 11,20.5 7.5,13 14,13" fill="#ffffff" stroke="#181512" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"/>
    ${cursorClicked ? `
      <circle cx="0" cy="0" r="14" fill="none" stroke="#ea580c" stroke-width="2" opacity="0.8"/>
    ` : ''}
  </g>
  ` : ''}
</svg>
  `;
}

// Timeline interpolation helpers
function lerp(start, end, t) {
  return start + (end - start) * Math.max(0, Math.min(1, t));
}

async function buildVideo() {
  const fps = 15;
  const totalDuration = 18; // 18 seconds
  const totalFrames = totalDuration * fps;

  console.log(`Generating ${totalFrames} promo video frames at ${fps} FPS...`);

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps; // current time in seconds

    let cursorX = 600;
    let cursorY = 400;
    let cursorClicked = false;
    let popupOpen = false;
    let typedChars = 0;
    let rewriteClicked = false;
    let showResults = false;
    let selectedTone = null;
    let showCopiedToast = false;
    let isOutro = false;

    // Timeline Sequence:
    // 0s - 2.5s: Mouse moves towards top right extension icon
    if (t < 2.5) {
      cursorX = lerp(450, 1030, t / 2.2);
      cursorY = lerp(350, 102, t / 2.2);
    } 
    // 2.5s - 3.2s: Clicks extension icon
    else if (t < 3.2) {
      cursorX = 1030;
      cursorY = 102;
      cursorClicked = t >= 2.5 && t <= 2.8;
      popupOpen = t >= 2.7;
    }
    // 3.2s - 5.0s: Popup is open, mouse moves to textarea
    else if (t < 5.0) {
      popupOpen = true;
      cursorX = lerp(1030, 880, (t - 3.2) / 1.5);
      cursorY = lerp(102, 300, (t - 3.2) / 1.5);
      cursorClicked = t >= 4.8 && t <= 5.0;
    }
    // 5.0s - 10.0s: User types out the raw message
    else if (t < 10.0) {
      popupOpen = true;
      cursorX = 880;
      cursorY = 300;
      const progress = (t - 5.0) / 4.8;
      typedChars = Math.floor(progress * fullText.length);
    }
    // 10.0s - 11.2s: Mouse moves to "Rewrite it" button
    else if (t < 11.2) {
      popupOpen = true;
      typedChars = fullText.length;
      cursorX = lerp(880, 940, (t - 10.0) / 1.0);
      cursorY = lerp(300, 340, (t - 10.0) / 1.0);
    }
    // 11.2s - 11.8s: Clicks "Rewrite it"
    else if (t < 11.8) {
      popupOpen = true;
      typedChars = fullText.length;
      cursorX = 940;
      cursorY = 340;
      cursorClicked = true;
      rewriteClicked = true;
    }
    // 11.8s - 14.5s: 3 Tones appear instantly!
    else if (t < 14.5) {
      popupOpen = true;
      typedChars = fullText.length;
      showResults = true;
      // Cursor hovers over results
      cursorX = lerp(940, 980, (t - 11.8) / 2.0);
      cursorY = lerp(340, 410, (t - 11.8) / 2.0);
    }
    // 14.5s - 16.0s: User clicks Warm & gentle copy arrow
    else if (t < 16.0) {
      popupOpen = true;
      typedChars = fullText.length;
      showResults = true;
      selectedTone = 'warm';
      cursorX = 1020;
      cursorY = 405;
      cursorClicked = t >= 14.5 && t <= 14.8;
      showCopiedToast = t >= 14.7;
    }
    // 16.0s - 18.0s: Outro card
    else {
      isOutro = true;
    }

    const svg = renderFrameSvg({
      time: t,
      cursorX,
      cursorY,
      cursorClicked,
      popupOpen,
      typedChars,
      rewriteClicked,
      showResults,
      selectedTone,
      showCopiedToast,
      isOutro,
    });

    const frameFile = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 4 })
      .toFile(frameFile);

    if (i % 30 === 0 || i === totalFrames - 1) {
      console.log(`Rendered frame ${i + 1}/${totalFrames} (${Math.round((i / totalFrames) * 100)}%)`);
    }
  }

  console.log('All frames generated! Encoding MP4 with ffmpeg...');

  const ffmpegCmd = `ffmpeg -y -r 15 -i "${framesDir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -crf 20 "${outputMp4}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  console.log(`Successfully generated MP4 promo video at: ${outputMp4}`);

  // Clean frames
  const files = fs.readdirSync(framesDir);
  for (const f of files) {
    fs.unlinkSync(path.join(framesDir, f));
  }
  fs.rmdirSync(framesDir);
  console.log('Cleaned temporary frame files.');
}

buildVideo().catch(err => {
  console.error('Video generation error:', err);
  process.exit(1);
});
