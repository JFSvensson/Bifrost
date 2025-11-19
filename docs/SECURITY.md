# 🔒 Security Implementation Guide

## Overview
This document describes the security measures implemented in Bifrost to protect against common web vulnerabilities.

**Last Updated:** 2025-11-19  
**Security Level:** Production-Ready

---

## ✅ Implemented Security Measures

### 1. Content Security Policy (CSP)

**Location:** `index.html` (meta tag)

**Policy:**
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' http://localhost:8081 https://www.smhi.se https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com;
frame-src https://accounts.google.com;
upgrade-insecure-requests;
```

**Protection Against:**
- ✅ Cross-Site Scripting (XSS)
- ✅ Data injection attacks
- ✅ Unauthorized script execution
- ✅ Mixed content (HTTP/HTTPS)

**Exceptions:**
- `'unsafe-inline'` for styles: Required for Shadow DOM component styles
- `http://localhost:8081`: Development Obsidian Bridge (should be HTTPS in production)

---

### 2. Input Sanitization

**Location:** `js/utils/sanitizer.js`

**Implementation:**
- Native Sanitizer API (Chrome 105+, Safari 16.4+)
- Secure fallback for older browsers
- HTML entity escaping
- URL protocol validation

**Usage:**
```javascript
import { sanitizeHTML, escapeHTML, sanitizeURL } from './utils/sanitizer.js';

// Sanitize HTML while preserving safe tags
const safe = sanitizeHTML(userInput);

// Escape all HTML entities
const escaped = escapeHTML(userInput);

// Validate URLs
const safeURL = sanitizeURL(href);
```

**Protection Against:**
- ✅ XSS via innerHTML injection
- ✅ JavaScript protocol attacks (`javascript:alert()`)
- ✅ Data URI attacks
- ✅ Event handler injection (`onclick=`, etc.)

**Allowed HTML Tags:**
- Formatting: `<strong>`, `<em>`, `<u>`, `<s>`, `<code>`, `<pre>`
- Structure: `<p>`, `<div>`, `<span>`, `<br>`, `<hr>`
- Lists: `<ul>`, `<ol>`, `<li>`
- Headings: `<h1>` through `<h6>`
- Links: `<a>` (with href validation)
- Tables: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`

**Blocked:**
- ❌ `<script>` tags
- ❌ `<iframe>` tags
- ❌ `<object>`, `<embed>` tags
- ❌ Event handler attributes (`onclick`, `onerror`, etc.)
- ❌ `javascript:` protocol in URLs
- ❌ `data:` protocol in URLs (except images)

---

### 3. Event Handler Security

**Removed:**
- ❌ Inline `onclick="..."` handlers

**Replaced with:**
- ✅ Event delegation in JavaScript
- ✅ `addEventListener()` with proper cleanup
- ✅ Event target validation

**Example:**
```javascript
// Before (INSECURE):
<button onclick="addTodo()">Add</button>

// After (SECURE):
<button id="add-todo-btn">Add</button>
// In main.js:
document.getElementById('add-todo-btn').addEventListener('click', addTodo);
```

---

### 4. Storage Security

**Current Implementation:**
- localStorage with JSON serialization
- Schema validation via StateManager
- Backup/restore capabilities

**Sensitive Data Handling:**
```javascript
// Google Calendar OAuth tokens
localStorage.setItem('googleCalendarAuth', JSON.stringify({
    access_token: token,  // ⚠️ Stored in plain text
    expires_at: Date.now() + 3600000
}));
```

**⚠️ TODO: Encryption for OAuth Tokens**
Consider implementing:
- Web Crypto API encryption
- Session-only token storage
- Token rotation
- Secure token transmission

**Recommendations:**
```javascript
// Encrypt sensitive data before storage
async function encryptToken(token) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    
    return { encrypted, iv, key };
}
```

---

### 5. HTTPS Enforcement

**CSP Directive:** `upgrade-insecure-requests`

**Effect:**
- All HTTP requests automatically upgraded to HTTPS
- Mixed content blocked
- Secure cookie transmission

**Development Exception:**
- Obsidian Bridge runs on `http://localhost:8081`
- Should use HTTPS in production

---

### 6. Dependency Security

**Audit Results:** ✅ **0 vulnerabilities found**

**Command:** `npm audit`

**Dependencies:**
```json
{
  "devDependencies": {
    "@eslint/js": "^9.15.0",
    "@vitest/ui": "^4.0.9",
    "eslint": "^9.15.0",
    "happy-dom": "^20.0.10",
    "prettier": "^3.3.3",
    "vitest": "^4.0.9"
  }
}
```

**Regular Maintenance:**
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

---

## 🔐 Security Best Practices

### For Developers

1. **Always sanitize user input:**
   ```javascript
   import { escapeHTML } from './utils/sanitizer.js';
   element.textContent = userInput; // Safe - uses textContent
   element.innerHTML = escapeHTML(userInput); // Also safe
   ```

2. **Never use inline event handlers:**
   ```javascript
   // ❌ BAD
   <button onclick="doSomething()">Click</button>
   
   // ✅ GOOD
   <button id="my-btn">Click</button>
   document.getElementById('my-btn').addEventListener('click', doSomething);
   ```

3. **Validate URLs before opening:**
   ```javascript
   import { sanitizeURL } from './utils/sanitizer.js';
   const safe = sanitizeURL(userProvidedURL);
   if (safe) window.open(safe, '_blank');
   ```

4. **Use textContent over innerHTML when possible:**
   ```javascript
   // ✅ Preferred - no HTML parsing
   element.textContent = userInput;
   
   // ⚠️ Only when HTML is needed and sanitized
   element.innerHTML = sanitizeHTML(userInput);
   ```

5. **Validate all external API responses:**
   ```javascript
   const response = await fetch(apiURL);
   const data = await response.json();
   
   // Validate structure
   if (!data || typeof data.todos !== 'array') {
       throw new Error('Invalid API response');
   }
   ```

### For Deployment

1. **Use HTTPS everywhere:**
   - Obtain SSL certificate (Let's Encrypt is free)
   - Redirect HTTP to HTTPS
   - Enable HSTS header

2. **Configure server headers:**
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   X-Content-Type-Options: nosniff
   X-Frame-Options: SAMEORIGIN
   X-XSS-Protection: 1; mode=block
   Referrer-Policy: strict-origin-when-cross-origin
   ```

3. **Service Worker cache validation:**
   - Verify cache integrity
   - Implement cache versioning
   - Clear old caches on update

4. **Monitor for security updates:**
   - Subscribe to npm security advisories
   - Run `npm audit` before deployment
   - Keep dependencies up to date

---

## 🚨 Known Limitations

### 1. OAuth Token Storage
**Risk:** Access tokens stored in plain text in localStorage  
**Mitigation:** Consider Web Crypto API encryption  
**Priority:** Medium

### 2. Development Obsidian Bridge
**Risk:** HTTP connection to localhost:8081  
**Mitigation:** Use HTTPS in production, firewall rules  
**Priority:** Low (development only)

### 3. Style Injection via Shadow DOM
**Risk:** `'unsafe-inline'` in CSP for styles  
**Mitigation:** Shadow DOM provides isolation  
**Priority:** Low (limited impact)

---

## 📋 Security Checklist

### Pre-Deployment
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review all user input handling
- [ ] Test CSP in production environment
- [ ] Verify HTTPS certificate
- [ ] Remove console.log statements
- [ ] Test with browser security extensions (uBlock, NoScript)
- [ ] Perform manual XSS testing
- [ ] Review localStorage contents

### Post-Deployment
- [ ] Monitor error logs for CSP violations
- [ ] Set up security headers
- [ ] Enable HSTS
- [ ] Configure rate limiting
- [ ] Set up security monitoring
- [ ] Regular dependency updates

---

## 🔍 Vulnerability Testing

### Manual XSS Testing

Test these payloads to verify protection:

```javascript
// In todo input
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<a href="javascript:alert('XSS')">Click</a>
<div onclick="alert('XSS')">Click</div>

// In URLs
javascript:alert(document.cookie)
data:text/html,<script>alert('XSS')</script>
vbscript:alert('XSS')
```

**Expected Result:** All payloads should be sanitized or blocked.

### Automated Testing

```bash
# Install security testing tools
npm install -D @lavamoat/allow-scripts

# Run tests with security checks
npm test

# Check for outdated packages
npm outdated
```

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [CSP Reference](https://content-security-policy.com/)
- [Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

## 📞 Security Contact

To report security vulnerabilities, please:
1. Do NOT create public GitHub issues
2. Email: [Your security contact]
3. Use responsible disclosure
4. Allow 90 days for patching

---

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Last Security Audit:** 2025-11-19
