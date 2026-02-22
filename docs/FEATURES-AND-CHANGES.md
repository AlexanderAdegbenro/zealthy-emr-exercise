# Features Added & Things Done (Reference / Rollback)

Quick reference for what was added and changed so you can revisit or roll back.

---

## 1. Service-layer tests (7-day filter)

| Item | Location | Purpose |
|------|----------|---------|
| Test file | `src/services/__tests__/integrity.test.ts` | Tests patient-portal data logic: 7-day filter, empty/malformed data, missing date, invalid date. |
| Date helper | `src/utils/dateHelpers.ts` | `getUpcomingItems(items, dateKey)` – returns only items whose date is within the next 7 days; skips missing/invalid dates. |

**Rollback:** Delete `src/services/__tests__/integrity.test.ts` and `src/utils/dateHelpers.ts` if you want to remove this.

---

## 2. Test runner (Vitest)

| Item | Change | Purpose |
|------|--------|---------|
| `package.json` | `"test": "vitest run"` added; `vitest` added to `devDependencies`; `jest`, `ts-jest`, `@types/jest` removed. | Run service-layer tests with Vitest. |
| Config | `jest.config.js` removed; `vitest.config.ts` was removed (disk full). | Jest removed; Vitest config still to be re-added (see TODO). |

**Rollback:** Restore `jest.config.js`, change script back to `"test": "jest"`, and re-add `jest`, `ts-jest`, `@types/jest` if you prefer Jest.

---

## 3. Vitest config (to be added)

**Still to do:** Create `vitest.config.mjs` in project root with:

```js
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
};
```

---

## 4. Existing (unchanged by this work)

| Item | Location | Purpose |
|------|----------|---------|
| Supabase client + integrity check | `src/lib/supabase.ts` | `validateProjectIntegrity()` (kill switch); Supabase client with AsyncStorage auth. |
| DB types | `src/lib/database.types.ts` | Types for `profiles`, `medications`, `appointments`, `prescriptions`. |

No changes were made to these for the service-layer tests.

---

## Directory of files touched

```
zealthy-app/
├── package.json              # test script, vitest dep, jest/ts-jest removed
├── TODO.md                   # What’s left to do (this session)
├── docs/
│   └── FEATURES-AND-CHANGES.md   # This file
├── src/
│   ├── utils/
│   │   └── dateHelpers.ts    # NEW: getUpcomingItems (7-day filter)
│   └── services/
│       └── __tests__/
│           └── integrity.test.ts   # NEW: service-layer tests
```

Removed:

- `jest.config.js`
- `vitest.config.ts` (removed; `vitest.config.mjs` to be added per TODO)

---

## What’s left (summary)

See **TODO.md** for the full list. Short version:

1. Free disk space.
2. Add `vitest.config.mjs` (content above).
3. Run `npm install --legacy-peer-deps` and `npm test`.
4. Optionally add role-based access logic and tests later.
