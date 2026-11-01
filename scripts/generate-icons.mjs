import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const inputImagePath = path.resolve('public/assets/aistudio/20261101_224833_903fb4cb.png');
const publicDir = path.resolve('public');

async function generateIcons() {
  if (!fs.existsSync(inputImagePath)) {
    console.error('Source icon does not exist at:', inputImagePath);
    process.exit(1);
  }

  console.log('Generating icons from:', inputImagePath);

  // 1. favicon.png (64x64)
  await sharp(inputImagePath)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  // 2. apple-touch-icon.png (180x180)
  await sharp(inputImagePath)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 3. pwa-192x192.png
  await sharp(inputImagePath)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 4. pwa-512x512.png
  await sharp(inputImagePath)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 5. pwa-maskable-512x512.png (with slight safe padding for maskable if needed, or 512x512)
  await sharp(inputImagePath)
    .resize(512, 512, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
