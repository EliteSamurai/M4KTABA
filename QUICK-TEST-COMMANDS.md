# Quick Test Commands

## Start Development Server
```bash
pnpm dev
```

## Automated Tests

### 1. Test Image Fixes Script
```bash
./scripts/test-image-fixes.sh
```

### 2. Check for Old Placeholder References
```bash
curl -s http://localhost:3000/all | grep -o 'placeholder\.jpg\|placeholder\.svg' | wc -l
# Should return: 0
```

### 3. Test Traffic Advice Endpoint
```bash
curl http://localhost:3000/.well-known/traffic-advice
# Should return: {}
```

### 4. Test Placeholder Image Exists
```bash
curl -I http://localhost:3000/islamiclibrary.jpg
# Should return: HTTP/1.1 200 OK
```

## Browser Console Tests

1. **Open** `http://localhost:3000/all` in browser
2. **Open DevTools** (F12)
3. **Paste** the contents of `scripts/browser-console-tests.js` into console
4. **Review** the test results

## Manual Visual Checks

### ✅ Checklist:
- [ ] All book images display (no broken icons)
- [ ] No console errors (red text)
- [ ] Network tab shows no 400/404 errors
- [ ] Images load smoothly
- [ ] Placeholder shows for missing images
- [ ] Hover effects work on images

## Common Bugs to Look For

### Bug 1: Broken Image Icons
**Symptom:** Gray broken image icon
**Fix:** Check `urlFor()` returns valid URL

### Bug 2: 400 Errors
**Symptom:** Network tab shows `/_next/image` with 400 status
**Fix:** Validate URL before passing to Image component

### Bug 3: Images Not Loading
**Symptom:** Images never appear, just blank space
**Fix:** Check image source and fallback logic

### Bug 4: Placeholder Not Showing
**Symptom:** Missing images show nothing
**Fix:** Verify `/islamiclibrary.jpg` exists and is accessible

## Network Tab Monitoring

1. Open DevTools → Network tab
2. Filter by "Img"
3. Reload page
4. Check:
   - ✅ All status codes are 200
   - ✅ No red entries
   - ✅ Images load from correct sources
   - ✅ Optimized images use `/_next/image`

## Console Error Monitoring

1. Open DevTools → Console tab
2. Look for:
   - ❌ `Failed to load resource`
   - ❌ `400 Bad Request`
   - ❌ `404 Not Found`
   - ❌ React errors
   - ❌ Image-related errors

## Performance Check

```javascript
// Paste in browser console
performance.getEntriesByType('resource')
  .filter(r => r.initiatorType === 'img')
  .forEach(r => console.log(r.name, r.duration + 'ms'));
```
