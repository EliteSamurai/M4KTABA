# 🧪 M4KTABA Production Testing Guide

## 🚀 **Quick Access**

- **Production URL**: https://m4ktaba-oljjxcu5p-elitesamurais-projects.vercel.app
- **Test this on both desktop and mobile devices**

---

## 📋 **Core Functionality Tests**

### 1. **Homepage & Navigation** ✅

- [ ] Visit homepage - should load with M4KTABA branding
- [ ] Check navigation menu (All Books, Honey, Blog, Sell)
- [ ] Verify footer links work
- [ ] Test mobile menu toggle
- [ ] Check language switcher (Arabic/English)

### 2. **Book Catalog** 📚

- [ ] Go to `/all` - should show book listings
- [ ] Test search functionality
- [ ] Check pagination (Load More button)
- [ ] Verify book cards display properly
- [ ] Test filtering options if available

### 3. **Individual Book Pages** 📖

- [ ] Click on any book to view details
- [ ] Check book images load correctly
- [ ] Verify price display
- [ ] Test "Add to Cart" functionality
- [ ] Check seller information

### 4. **Shopping Cart** 🛒

- [ ] Add items to cart
- [ ] Update quantities
- [ ] Remove items
- [ ] Check cart total calculations
- [ ] Test cart persistence (refresh page)

### 5. **User Authentication** 🔐

- [ ] Test sign up flow
- [ ] Test login with Google
- [ ] Test logout
- [ ] Check user profile access
- [ ] Verify protected routes

### 6. **Checkout Process** 💳

- [ ] Add items to cart
- [ ] Go through checkout flow
- [ ] Test Stripe payment integration
- [ ] Verify order confirmation
- [ ] Check email notifications

### 7. **Seller Features** 🏪

- [ ] Access `/sell` page
- [ ] Test book upload form
- [ ] Check seller dashboard
- [ ] Verify Stripe Connect integration
- [ ] Test seller onboarding

### 8. **Blog & Content** 📝

- [ ] Visit `/blog` page
- [ ] Check blog posts load
- [ ] Test individual blog post pages
- [ ] Verify image loading

---

## 🔧 **Technical Tests**

### 9. **API Endpoints** 🔌

Test these URLs directly in your browser:

- [ ] `/api/health` → Should return `{"ok":true}`
- [ ] `/api/get-all-books` → Should return JSON with books
- [ ] `/api/related-books` → Should return related books data

### 10. **Error Handling** ⚠️

- [ ] Visit non-existent page (e.g., `/nonexistent`) → Should show 404
- [ ] Test with slow internet connection
- [ ] Check error boundaries work

### 11. **Performance** ⚡

- [ ] Page load times are reasonable
- [ ] Images load properly
- [ ] No console errors in browser dev tools
- [ ] Mobile performance is good

---

## 🌐 **Cross-Platform Testing**

### 12. **Desktop Browsers** 💻

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### 13. **Mobile Devices** 📱

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Test touch interactions
- [ ] Check responsive design

---

## 🔍 **Advanced Testing Scenarios**

### 14. **Edge Cases** 🎯

- [ ] Empty cart behavior
- [ ] Search with no results
- [ ] Very long book titles
- [ ] Special characters in search
- [ ] Large file uploads

### 15. **Security** 🔒

- [ ] Test CSRF protection
- [ ] Verify HTTPS is enforced
- [ ] Check for XSS vulnerabilities
- [ ] Test input validation

---

## 📊 **Monitoring & Analytics**

### 16. **Error Tracking** 📈

- [ ] Check browser console for errors
- [ ] Test error reporting (if Sentry is set up)
- [ ] Verify analytics tracking

### 17. **Performance Monitoring** 📊

- [ ] Check Core Web Vitals
- [ ] Test page speed
- [ ] Verify image optimization

---

## 🚨 **Critical Issues to Watch For**

### Red Flags 🚩

- [ ] **404 errors** on main pages
- [ ] **Payment failures** during checkout
- [ ] **Authentication loops** or login issues
- [ ] **Broken images** or missing assets
- [ ] **Console errors** in browser dev tools
- [ ] **Slow loading** or timeouts
- [ ] **Mobile layout** issues

---

## 🛠️ **Testing Tools**

### Browser Dev Tools

1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Test responsive design with device toolbar

### Mobile Testing

1. Use browser's mobile emulation
2. Test on actual mobile devices
3. Check touch interactions

### API Testing

1. Use browser to visit API endpoints directly
2. Check response format and status codes
3. Test with different parameters

---

## 📝 **Test Results Log**

### Date: \***\*\_\_\_\*\***

### Tester: \***\*\_\_\_\*\***

**Overall Status**: [ ] ✅ PASS [ ] ⚠️ ISSUES FOUND [ ] ❌ MAJOR PROBLEMS

**Issues Found**:

1. ***
2. ***
3. ***

**Notes**:

---

---

---

## 🆘 **If You Find Issues**

### For Technical Issues:

1. Check browser console for error messages
2. Note the exact steps to reproduce
3. Check if issue happens on all devices/browsers
4. Take screenshots if helpful

### For Content Issues:

1. Check if data is loading from Sanity
2. Verify environment variables are set
3. Check if API endpoints are responding

### For Performance Issues:

1. Test with different internet speeds
2. Check if images are optimized
3. Look for slow-loading resources

---

## ✅ **Success Criteria**

Your app is ready for production if:

- [ ] All core features work without errors
- [ ] Payment processing works end-to-end
- [ ] User authentication flows work
- [ ] Mobile experience is smooth
- [ ] No critical console errors
- [ ] Pages load within 3 seconds
- [ ] All API endpoints respond correctly

**Happy Testing! 🎉**
