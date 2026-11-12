const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcIcon = path.resolve(__dirname, '../public/assets/aistudio/icon-128_a3de522a.png');

async function processAllIcons() {
  console.log('Replacing all icon resolutions with the new icon asset...');

  const targets = [
    // Extension Icons
    { dir: '../extension/icons', name: 'icon16.png', size: 16 },
    { dir: '../extension/icons', name: 'icon19.png', size: 19 },
    { dir: '../extension/icons', name: 'icon32.png', size: 32 },
    { dir: '../extension/icons', name: 'icon38.png', size: 38 },
    { dir: '../extension/icons', name: 'icon48.png', size: 48 },
    { dir: '../extension/icons', name: 'icon128.png', size: 128 },
    { dir: '../extension/icons', name: 'icon256.png', size: 256 },
    { dir: '../extension/icons', name: 'icon512.png', size: 512 },

    // Web / PWA / Public Icons
    { dir: '../public', name: 'favicon.png', size: 32 },
    { dir: '../public', name: 'apple-touch-icon.png', size: 180 },
    { dir: '../public', name: 'pwa-192x192.png', size: 192 },
    { dir: '../public', name: 'pwa-512x512.png', size: 512 },
    { dir: '../public/icons', name: 'favicon-16x16.png', size: 16 },
    { dir: '../public/icons', name: 'favicon-32x32.png', size: 32 },
    { dir: '../public/icons', name: 'icon-48x48.png', size: 48 },
    { dir: '../public/icons', name: 'icon-128x128.png', size: 128 },
    { dir: '../public/icons', name: 'icon-192x192.png', size: 192 },
    { dir: '../public/icons', name: 'icon-512x512.png', size: 512 },

    // Webstore Folders
    { dir: '../extension/webstore', name: 'store_icon_128x128.png', size: 128 },
    { dir: '../public/webstore', name: 'store_icon_128x128.png', size: 128 },
  ];

  for (const t of targets) {
    const fullDir = path.resolve(__dirname, t.dir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    const dest = path.join(fullDir, t.name);
    await sharp(srcIcon)
      .resize(t.size, t.size, { kernel: 'lanczos3' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);
    console.log(`Rendered: ${t.dir}/${t.name} (${t.size}x${t.size})`);
  }

  // Chrome Web Store store_icon_128x128 (strictly 24-bit RGB PNG, NO ALPHA)
  const storeDest = path.resolve(__dirname, '../public/chrome-webstore-assets/store_icon_128x128.png');
  await sharp(srcIcon)
    .resize(128, 128)
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .png({ quality: 100 })
    .toFile(storeDest);
  console.log(`Rendered 24-bit no-alpha: public/chrome-webstore-assets/store_icon_128x128.png`);

  console.log('All icons replaced successfully!');
}

processAllIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
