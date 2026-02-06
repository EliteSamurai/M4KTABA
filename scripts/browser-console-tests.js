/**
 * Browser Console Testing Script
 * 
 * Copy and paste this into your browser console (F12) on http://localhost:3000/all
 * 
 * This will test:
 * - Image loading
 * - Placeholder fallbacks
 * - URL validation
 * - Error handling
 */

console.log('🧪 Starting Image Fix Tests...\n');

// Test 1: Check all images load successfully
console.log('📋 Test 1: Image Loading Status');
const images = Array.from(document.querySelectorAll('img'));
const imageStatus = images.map(img => ({
  src: img.src,
  complete: img.complete,
  naturalWidth: img.naturalWidth,
  naturalHeight: img.naturalHeight,
  hasError: img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)
}));

const failedImages = imageStatus.filter(img => img.hasError);
const loadedImages = imageStatus.filter(img => img.complete && !img.hasError);

console.log(`   Total images: ${images.length}`);
console.log(`   ✅ Loaded: ${loadedImages.length}`);
console.log(`   ❌ Failed: ${failedImages.length}`);

if (failedImages.length > 0) {
  console.log('   Failed images:');
  failedImages.forEach(img => console.log(`      - ${img.src}`));
}

// Test 2: Check for placeholder references
console.log('\n📋 Test 2: Placeholder References');
const placeholderRefs = imageStatus.filter(img => 
  img.src.includes('placeholder.jpg') || 
  img.src.includes('placeholder.svg')
);

if (placeholderRefs.length === 0) {
  console.log('   ✅ PASS: No old placeholder references found');
} else {
  console.log(`   ⚠️  Found ${placeholderRefs.length} placeholder references:`);
  placeholderRefs.forEach(img => console.log(`      - ${img.src}`));
}

// Test 3: Check for islamiclibrary.jpg usage
console.log('\n📋 Test 3: Placeholder Image Usage');
const islamicLibraryRefs = imageStatus.filter(img => 
  img.src.includes('islamiclibrary.jpg')
);
console.log(`   Found ${islamicLibraryRefs.length} uses of islamiclibrary.jpg (expected for fallbacks)`);

// Test 4: Check for Next.js Image optimization
console.log('\n📋 Test 4: Next.js Image Optimization');
const nextImageRefs = imageStatus.filter(img => 
  img.src.includes('/_next/image')
);
console.log(`   Optimized images: ${nextImageRefs.length}`);
console.log(`   Direct images: ${images.length - nextImageRefs.length}`);

// Test 5: Check for broken image URLs
console.log('\n📋 Test 5: URL Validation');
const invalidUrls = imageStatus.filter(img => {
  const url = img.src;
  return !url || 
         (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) ||
         url === 'undefined' ||
         url === 'null';
});

if (invalidUrls.length === 0) {
  console.log('   ✅ PASS: All image URLs are valid');
} else {
  console.log(`   ❌ FAIL: Found ${invalidUrls.length} invalid URLs:`);
  invalidUrls.forEach(img => console.log(`      - ${img.src}`));
}

// Test 6: Check for Sanity CDN images
console.log('\n📋 Test 6: Sanity CDN Images');
const sanityImages = imageStatus.filter(img => 
  img.src.includes('cdn.sanity.io')
);
console.log(`   Sanity CDN images: ${sanityImages.length}`);

// Test 7: Performance check
console.log('\n📋 Test 7: Image Loading Performance');
const imageLoadTimes = performance.getEntriesByType('resource')
  .filter(r => r.initiatorType === 'img')
  .map(r => ({
    name: r.name,
    duration: Math.round(r.duration),
    size: r.transferSize || 0
  }))
  .sort((a, b) => b.duration - a.duration);

console.log(`   Total image requests: ${imageLoadTimes.length}`);
if (imageLoadTimes.length > 0) {
  const avgLoadTime = Math.round(
    imageLoadTimes.reduce((sum, img) => sum + img.duration, 0) / imageLoadTimes.length
  );
  console.log(`   Average load time: ${avgLoadTime}ms`);
  console.log(`   Slowest images:`);
  imageLoadTimes.slice(0, 3).forEach(img => {
    console.log(`      - ${img.name.split('/').pop()}: ${img.duration}ms`);
  });
}

// Test 8: Check for error events
console.log('\n📋 Test 8: Image Error Events');
let errorCount = 0;
images.forEach(img => {
  img.addEventListener('error', () => {
    errorCount++;
    console.log(`   ❌ Image failed to load: ${img.src}`);
  });
});

// Summary
console.log('\n📊 Test Summary');
console.log('================');
console.log(`Total Images: ${images.length}`);
console.log(`✅ Loaded: ${loadedImages.length}`);
console.log(`❌ Failed: ${failedImages.length}`);
console.log(`🖼️  Optimized: ${nextImageRefs.length}`);
console.log(`📦 Sanity CDN: ${sanityImages.length}`);

if (failedImages.length === 0 && invalidUrls.length === 0) {
  console.log('\n✅ All tests passed!');
} else {
  console.log('\n⚠️  Some issues found - check details above');
}

// Export results for further inspection
window.imageTestResults = {
  images: imageStatus,
  failed: failedImages,
  invalid: invalidUrls,
  performance: imageLoadTimes
};

console.log('\n💡 Results saved to window.imageTestResults');
