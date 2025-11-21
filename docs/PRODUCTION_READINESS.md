# Production Readiness Testing Guide

Guide för att testa production readiness efter logging och security uppdateringar.

## 📋 Checklista

### ✅ Completed
- [x] Created production-safe logger utility (`js/utils/logger.js`)
- [x] Updated all main.js console statements to use logger
- [x] Updated all widget console statements (8 widgets)
- [x] Updated all service console statements (9 services)
- [x] Updated integration and utility files (7 files)
- [x] Enhanced service worker logging with environment checks
- [x] Strengthened Content Security Policy (CSP)

### 🔍 Testing Required
- [ ] Test offline functionality with service worker
- [ ] Verify logger behavior in development vs production
- [ ] Test all keyboard shortcuts still work
- [ ] Verify no console spam in production mode

---

## 🧪 Testing Instructions

### 1. Service Worker Offline Testing

**Prerequisites:**
- Modern browser (Chrome, Edge, Firefox)
- Local development server running

**Steps:**

1. **Start Local Server**
   ```powershell
   # Option 1: Python HTTP server
   python -m http.server 8000
   
   # Option 2: Live Server extension in VS Code
   # Right-click index.html → "Open with Live Server"
   ```

2. **Open Application**
   - Navigate to `http://localhost:8000` (or Live Server URL)
   - Open DevTools (F12)

3. **Verify Service Worker Registration**
   - Go to Application tab → Service Workers
   - Should see "Service Worker: Activated and running"
   - Status: green dot with "activated"

4. **Check Cache**
   - Application tab → Cache Storage
   - Should see `bifrost-v4` cache
   - Verify all static assets are cached (~30 items)

5. **Test Offline Mode**
   ```
   ✅ Network tab → Throttling → Offline
   ✅ Reload page (Ctrl+R)
   ✅ App should load from cache
   ✅ All styles and widgets should render
   ✅ Todos should load from localStorage
   ```

6. **Verify Offline Features**
   - ✅ Clock widget works (uses local time)
   - ✅ Todo management works (localStorage)
   - ✅ Theme toggle works
   - ✅ Keyboard shortcuts work
   - ✅ Search widget works (local data)
   - ⚠️ Weather widget shows cached data or error
   - ⚠️ School menu shows cached data or error
   - ⚠️ Google Calendar shows cached data

7. **Check Console Logs**
   - Console tab in DevTools
   - Should see: `[SW] Service Worker activating...`
   - Should see: `[SW] Weather API failed, serving from cache` (if offline)

8. **Test Online Recovery**
   ```
   ✅ Network tab → Online
   ✅ Reload page
   ✅ Weather widget updates with fresh data
   ✅ School menu updates
   ✅ All functionality restored
   ```

---

### 2. Logger Behavior Testing

**Development Mode (localhost):**

1. **Open Console in DevTools**
   
2. **Expected Logs:**
   ```
   [timestamp] [DEBUG] Backup Widget initialized
   [timestamp] [DEBUG] Search Widget initialized
   [timestamp] [INFO] Obsidian integration enabled
   [timestamp] [INFO] Statistics tracking enabled
   [timestamp] [DEBUG] Performance Metrics
   ```

3. **Verify Log Levels:**
   - DEBUG: Widget initialization, performance metrics
   - INFO: Service activations, user actions
   - WARN: Non-critical issues, deprecations
   - ERROR: Failures, exceptions

**Production Mode (deployed):**

1. **Deploy to production server OR:**
   ```powershell
   # Edit js/config/config.js temporarily
   # Change: dev: { debug: false, logLevel: 'error' }
   ```

2. **Expected Behavior:**
   - ✅ No DEBUG logs in console
   - ✅ No INFO logs in console
   - ✅ Only ERROR and CRITICAL logs appear
   - ✅ Significantly less console noise

3. **Test Error Logging:**
   ```javascript
   // In console, trigger an error:
   logger.error('Test error', new Error('Test'));
   
   // Should appear in console even in production
   ```

---

### 3. CSP Testing

**Verify No CSP Violations:**

1. **Open Console → Filter by "Violated Directive"**
   - Should see: **0 CSP violations**

2. **Test Each Directive:**
   ```
   ✅ script-src 'self' - All JS loads from same origin
   ✅ style-src 'self' 'unsafe-inline' - Styles work (Shadow DOM needs unsafe-inline)
   ✅ img-src 'self' data: https: - Icons and weather images load
   ✅ connect-src - API calls work (SMHI, Google Calendar, localhost)
   ✅ frame-src - Google sign-in iframe loads
   ✅ object-src 'none' - No plugins/flash
   ✅ base-uri 'self' - Base tag restricted
   ✅ form-action 'self' - Forms can't POST to external
   ✅ frame-ancestors 'none' - Can't be embedded in iframe
   ```

3. **Test External Resources:**
   - Weather widget fetches from `www.smhi.se` → ✅ Allowed
   - Google Calendar API → ✅ Allowed
   - Random external script → ❌ Blocked by CSP

**Known Required Exceptions:**
- ⚠️ `style-src 'unsafe-inline'` - Required for Shadow DOM in Web Components
- ⚠️ `http://localhost:8081` - Obsidian Bridge (development only)
- ⚠️ `http://localhost:8787` - School menu proxy (development only)

**Production Recommendation:**
- Remove localhost URLs from `connect-src` when deploying
- Consider using nonces for inline styles if eliminating `'unsafe-inline'`

---

### 4. Keyboard Shortcuts Testing

**Verify All Shortcuts Still Work:**

| Shortcut | Expected Behavior | Status |
|----------|-------------------|--------|
| `Ctrl + F` | Opens global search | [ ] |
| `Ctrl + ?` | Shows keyboard shortcuts help | [ ] |
| `Ctrl + Shift + B` | Opens backup modal | [ ] |
| `Ctrl + K` | Focuses Quick Add | [ ] |
| `Ctrl + /` | Focuses external search | [ ] |
| `Ctrl + 1-9` | Opens links 1-9 | [ ] |
| `Escape` | Closes modals/search | [ ] |
| `↑/↓` | Navigates search results | [ ] |
| `Enter` | Selects search result / Adds todo | [ ] |

---

### 5. Performance Testing

**Check No Performance Regression:**

1. **Open DevTools → Console**
   - Look for "Performance Metrics" group (development only)
   
2. **Expected Timings:**
   ```
   app-total-init: < 500ms (fast)
   critical-services: < 100ms
   essential-services: < 200ms
   ```

3. **Lighthouse Audit:**
   ```
   DevTools → Lighthouse → Generate Report
   
   Expected Scores:
   - Performance: > 90
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80
   ```

---

### 6. Error Handling Testing

**Verify Errors Are Properly Logged:**

1. **Simulate Network Error:**
   ```
   Network tab → Offline
   Try to sync with Obsidian
   ```
   - Expected: Error logged with logger.error()
   - Expected: Toast shown to user
   - Expected: No unhandled promise rejection

2. **Simulate Invalid Data:**
   ```javascript
   // In console:
   localStorage.setItem('bifrost-todos', 'invalid json');
   location.reload();
   ```
   - Expected: Error caught and logged
   - Expected: App falls back to empty todos

3. **Check ErrorHandler Integration:**
   - Errors should appear in errorHandler history
   - Critical errors should show toast to user
   - All errors should have context/metadata

---

## 📊 Expected Results

### ✅ Success Criteria

**Logging:**
- ✅ Zero console.log/warn/error statements remain in production code (except Node.js files)
- ✅ Debug logs silent in production
- ✅ All errors properly caught and logged with context
- ✅ No console spam in development

**Security:**
- ✅ CSP enforced with zero violations
- ✅ No unsafe-eval in any directive
- ✅ External resources properly whitelisted
- ✅ Service Worker security headers applied

**Offline:**
- ✅ App loads and functions offline
- ✅ Static assets cached correctly
- ✅ Service Worker activates without errors
- ✅ Graceful degradation for network-dependent features

**Performance:**
- ✅ No performance regression vs previous version
- ✅ Logger adds < 5ms overhead
- ✅ Service Worker caching improves load time

---

## 🐛 Common Issues & Solutions

### Issue: Service Worker Not Activating

**Solution:**
```javascript
// In DevTools → Application → Service Workers
// Click "Unregister" on old service worker
// Reload page (Ctrl+Shift+R to hard reload)
```

### Issue: Cache Not Updating

**Solution:**
```javascript
// Clear cache
// DevTools → Application → Cache Storage → Delete bifrost-v4
// Or update CACHE_NAME in sw.js to 'bifrost-v5'
```

### Issue: CSP Blocking Resource

**Check Console for:**
```
Refused to load ... because it violates the following CSP directive: "..."
```

**Solution:**
- Add domain to appropriate CSP directive
- Or fix code to not require external resource

### Issue: Debug Logs Still Showing in Production

**Solution:**
```javascript
// Verify config.js:
export const config = {
    dev: {
        debug: false,
        logLevel: 'error' // or 'warn' for production
    }
};
```

### Issue: Logger Import Errors

**Solution:**
```javascript
// Verify path is correct relative to file:
import { logger } from '../utils/logger.js';  // From service/
import { logger } from './logger.js';         // From utils/
```

---

## 📝 Testing Checklist Summary

```
Production Readiness Checklist:

Logging System:
[ ] Logger utility created and tested
[ ] All console.* replaced with logger.*
[ ] Debug logs silent in production mode
[ ] Error logs include proper context
[ ] No console spam in development

Security:
[ ] CSP header enforced
[ ] Zero CSP violations in console
[ ] Service Worker security headers applied
[ ] No unsafe-eval or excessive unsafe-inline

Offline Functionality:
[ ] Service Worker registers successfully
[ ] Static assets cached (verify 30+ items)
[ ] App loads offline from cache
[ ] Graceful degradation for network features
[ ] Cache updates when back online

Performance:
[ ] No performance regression
[ ] Lighthouse scores maintained
[ ] Logger overhead negligible
[ ] Service Worker improves load time

Functionality:
[ ] All keyboard shortcuts work
[ ] All widgets render correctly
[ ] Todos save/load properly
[ ] Search functionality works
[ ] Theme toggle works
[ ] No JavaScript errors in console

Documentation:
[ ] CSP policy documented
[ ] Logger usage documented
[ ] Service Worker behavior documented
[ ] Testing guide available (this file)
```

---

## 🚀 Deployment Notes

**Before Deploying to Production:**

1. **Update config.js:**
   ```javascript
   dev: {
       debug: false,
       logLevel: 'error'
   }
   ```

2. **Remove Development URLs from CSP:**
   ```html
   <!-- Remove: http://localhost:8081 http://localhost:8787 -->
   connect-src 'self' https://www.smhi.se https://accounts.google.com ...
   ```

3. **Update Service Worker Cache:**
   ```javascript
   // Increment version when deploying
   const CACHE_NAME = 'bifrost-v5'; // or use semantic versioning
   ```

4. **Test in Production-Like Environment:**
   - Deploy to staging server
   - Verify all functionality
   - Check Lighthouse scores
   - Monitor console for errors

5. **Monitor After Deployment:**
   - Check browser console for errors
   - Verify Service Worker activates
   - Monitor error rates via analytics
   - Collect user feedback

---

**Last Updated:** 2025-11-21  
**Version:** 1.0.0
