import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(size, bgHex = [194, 65, 12, 255]) {
  // Create RGBA buffer
  const width = size;
  const height = size;
  const rowBytes = width * 4 + 1; // 1 byte for filter 0
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw rounded rectangle with terracotta background
      const r = size * 0.18;
      const dx = Math.max(0, Math.abs(x - width / 2) - (width / 2 - r));
      const dy = Math.max(0, Math.abs(y - height / 2) - (height / 2 - r));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= r) {
        // Inside rounded rect
        // Draw a simple feather/pen quill stroke in white
        const relX = x / width;
        const relY = y / height;
        // White quill silhouette
        const isQuill =
          relX > 0.35 &&
          relX < 0.65 &&
          relY > 0.25 &&
          relY < 0.75 &&
          Math.abs(relX - relY * 0.4 - 0.3) < 0.12;

        if (isQuill) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = bgHex[0];
          rawData[pxOffset + 1] = bgHex[1];
          rawData[pxOffset + 2] = bgHex[2];
          rawData[pxOffset + 3] = bgHex[3];
        }
      } else {
        // Transparent outside
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // Deflate pixel data
  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // No interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

// Generate icons
const outDir = path.resolve('extension/icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon16.png'), createPNG(16));
fs.writeFileSync(path.join(outDir, 'icon48.png'), createPNG(48));
fs.writeFileSync(path.join(outDir, 'icon128.png'), createPNG(128));

console.log('Icons generated successfully in extension/icons/');
