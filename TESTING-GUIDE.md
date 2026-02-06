# Testing Guide for Image Fixes & Bug Detection

## Quick Start

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```

2. **Open browser:**
   - Navigate to `http://localhost:3000`
   - Open DevTools (F12 or Cmd+Option+I)

## Testing Checklist

### 1. Image Loading Tests

#### Test: Product Cards on `/all` page
- [ ] Navigate to `/all`
- [ ] Check browser console for image errors
- [ ] Verify all book images load (or show placeholder)
- [ ] Check Network tab - no 400 errors for `/_next/image`
- [ ] Hover over images - should have smooth transitions

#### Test: Homepage Latest Books
- [ ] Navigate to `/`
- [ ] Scroll to "Latest Books" section
- [ ] Verify all book images display correctly
- [ ] Check console for errors

#### Test: Product Detail Page
- [ ] Click on any book from `/all`
- [ ] Verify main product image loads
- [ ] Check thumbnail gallery (if multiple images)
- [ ] Verify no broken image icons

### 2. Placeholder Image Tests

#### Test: Missing Images
- [ ] Find a book with no image in database
- [ ] Verify it shows `/islamiclibrary.jpg` as fallback
- [ ] Check Network tab - should load successfully

#### Test: Invalid Image URLs
- [ ] Temporarily break an image URL in code
- [ ] Verify fallback to placeholder works
- [ ] Check `onError` handler fires correctly

### 3. API Endpoint Tests

#### Test: `.well-known/traffic-advice`
```bash
curl http://localhost:3000/.well-known/traffic-advice
```
- [ ] Should return `{}` with status 200
- [ ] No 404 errors in console

### 4. Browser Console Checks

#### Check for Errors:
- [ ] Open DevTools Console
- [ ] Look for:
  - ❌ `Failed to load resource` (images)
  - ❌ `400 Bad Request` errors
  - ❌ `404 Not Found` errors
  - ❌ React errors
  - ❌ JavaScript errors

#### Check Network Tab:
- [ ] Filter by "Img" or "Image"
- [ ] Look for:
  - ❌ Red entries (failed requests)
  - ❌ Status 400 or 404
  - ✅ All images should be 200 or cached

### 5. Edge Cases

#### Test: Empty Image Array
- [ ] Book with `photos: []`
- [ ] Should show placeholder

#### Test: Null Image Reference
- [ ] Book with `image: null`
- [ ] Should show placeholder

#### Test: Invalid Sanity Reference
- [ ] Book with malformed image reference
- [ ] Should show placeholder gracefully

### 6. Performance Tests

#### Test: Image Loading Speed
- [ ] Open Network tab
- [ ] Reload page
- [ ] Check image load times
- [ ] Verify images are optimized (WebP/AVIF)

#### Test: Lazy Loading
- [ ] Scroll down on `/all` page
- [ ] Images should load as you scroll
- [ ] Check Network tab - images load on demand

## Automated Testing Script

Run the test script:
```bash
./scripts/test-image-fixes.sh
```

## Manual Browser Testing

### Chrome DevTools Steps:

1. **Open DevTools** (F12)
2. **Console Tab:**
   - Look for red errors
   - Filter by "Error" or "Failed"
   - Check for image-related errors

3. **Network Tab:**
   - Filter by "Img"
   - Check status codes (should all be 200)
   - Look for failed requests (red)

4. **Application Tab:**
   - Check "Images" cache
   - Verify images are cached properly

### Firefox DevTools Steps:

1. **Open DevTools** (F12)
2. **Console Tab:**
   - Check for errors
   - Filter by "Image" or "Failed"

3. **Network Tab:**
   - Filter by "Images"
   - Check status codes

## Common Issues to Look For

### Issue 1: Broken Image Icons
- **Symptom:** Gray broken image icon
- **Cause:** Invalid URL or missing file
- **Fix:** Check `urlFor()` returns valid URL

### Issue 2: 400 Errors on `/_next/image`
- **Symptom:** Network tab shows 400 for image optimization
- **Cause:** Invalid URL passed to Next.js Image
- **Fix:** Validate URL before passing to Image component

### Issue 3: Placeholder Not Loading
- **Symptom:** No image shows at all
- **Cause:** Placeholder path incorrect
- **Fix:** Verify `/islamiclibrary.jpg` exists

### Issue 4: Images Load Slowly
- **Symptom:** Images take long to appear
- **Cause:** Large file sizes or slow network
- **Fix:** Check image optimization settings

## Debugging Tips

### Check Image URLs:
```javascript
// In browser console on /all page
document.querySelectorAll('img').forEach(img => {
  console.log(img.src, img.complete ? '✅' : '❌');
});
```

### Check for Placeholder References:
```javascript
// In browser console
Array.from(document.querySelectorAll('img')).filter(img => 
  img.src.includes('placeholder')
).length
// Should be 0 (or only intentional placeholders)
```

### Monitor Network Requests:
```javascript
// In browser console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('image') || r.name.includes('_next/image'))
  .forEach(r => console.log(r.name, r.responseStatus));
```

## Expected Results

✅ **All images load successfully**
✅ **No 400/404 errors in Network tab**
✅ **No console errors related to images**
✅ **Placeholder shows for missing images**
✅ **Images are optimized (WebP/AVIF)**
✅ **Lazy loading works correctly**

## Reporting Issues

If you find bugs, note:
1. **Page URL** where issue occurs
2. **Browser** and version
3. **Console errors** (copy full error)
4. **Network tab** screenshot
5. **Steps to reproduce**
