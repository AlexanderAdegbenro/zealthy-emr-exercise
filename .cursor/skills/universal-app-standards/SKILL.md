---
name: universal-app-standards
description: Enforces dual-environment (iOS/Android + Web) assumptions when writing mobile app code. Requires guarding any use of window or web-only APIs with Platform.OS === 'web'. Use when creating mobile skills, writing React Native/Expo code, or implementing features that run on native and web.
---

# Universal App Standards

## Core rule

When creating mobile skills or writing code for apps that target **iOS, Android, and Web**:

1. **Assume a dual-environment** (native + web). Do not assume a web-only or native-only context unless explicitly scoped.
2. **Never rely on `window` (or other web globals) without a platform check.** Any use of `window`, `document`, or browser-only APIs must be guarded with `Platform.OS === 'web'` (or equivalent) so the code is safe on iOS and Android.

## Guarding web-only code

Use React Native's `Platform` before any web-only API:

```javascript
import { Platform } from 'react-native';

// ✅ Correct: guarded
if (Platform.OS === 'web') {
  window.addEventListener('resize', handleResize);
}

// ❌ Wrong: unguarded
window.addEventListener('resize', handleResize);
```

Same for `document`, `localStorage`, or any API that exists only in the browser:

```javascript
// ✅ Correct
if (Platform.OS === 'web') {
  const width = document.documentElement.clientWidth;
}

// ❌ Wrong
const width = document.documentElement.clientWidth;
```

## Checklist

When adding or reviewing code in a universal app:

- [ ] No direct use of `window`, `document`, or browser-only APIs without a `Platform.OS === 'web'` (or equivalent) check
- [ ] Logic is written so it works on iOS, Android, and Web, or explicitly branches by platform
- [ ] New features consider native behavior (e.g. no reliance on web-only events or DOM)

## Optional: shared pattern

For code that must run only on web, use a single guard and keep web logic in one block:

```javascript
if (Platform.OS === 'web') {
  // All web-only logic here
}
```

For Expo, use `Platform.OS` from `react-native`; the same rule applies.
