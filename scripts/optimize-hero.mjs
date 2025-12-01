#!/usr/bin/env node
/**
 * Optimize hero image for better LCP performance
 * Converts to WebP with responsive sizes
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

// Use Next.js built-in sharp
const sharp = (await import('sharp')).default;

const heroInput = join(publicDir, 'image (1).jpg');
const heroDesktop = join(publicDir, 'hero-books-desktop.webp');
const heroTablet = join(publicDir, 'hero-books-tablet.webp');
const heroMobile = join(publicDir, 'hero-books-mobile.webp');

console.log('🖼️  Optimizing hero image for performance...\n');

try {
  // Desktop version (1920px wide, high quality)
  await sharp(heroInput)
    .resize(1920, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85, effort: 6 })
    .toFile(heroDesktop);
  
  const desktopSize = (await import('fs')).statSync(heroDesktop).size;
  console.log(`✅ Desktop: hero-books-desktop.webp (${Math.round(desktopSize / 1024)}KB)`);

  // Tablet version (1200px wide)
  await sharp(heroInput)
    .resize(1200, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 6 })
    .toFile(heroTablet);
  
  const tabletSize = (await import('fs')).statSync(heroTablet).size;
  console.log(`✅ Tablet:  hero-books-tablet.webp (${Math.round(tabletSize / 1024)}KB)`);

  // Mobile version (768px wide, lower quality is fine for mobile)
  await sharp(heroInput)
    .resize(768, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 6 })
    .toFile(heroMobile);
  
  const mobileSize = (await import('fs')).statSync(heroMobile).size;
  console.log(`✅ Mobile:  hero-books-mobile.webp (${Math.round(mobileSize / 1024)}KB)`);

  const originalSize = (await import('fs')).statSync(heroInput).size;
  const totalSaved = originalSize - (desktopSize + tabletSize + mobileSize) / 3;
  const percentSaved = ((totalSaved / originalSize) * 100).toFixed(1);

  console.log(`\n📊 Original: ${Math.round(originalSize / 1024)}KB`);
  console.log(`📊 Average new size: ~${Math.round((desktopSize + tabletSize + mobileSize) / 3 / 1024)}KB`);
  console.log(`💾 Savings: ~${percentSaved}% smaller!\n`);
  console.log('✨ Optimization complete! Update app/page.tsx to use the new images.\n');
} catch (error) {
  console.error('❌ Error optimizing image:', error.message);
  process.exit(1);
}

