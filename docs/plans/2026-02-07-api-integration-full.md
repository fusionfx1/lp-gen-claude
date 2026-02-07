# LP Factory V2 — Full API Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully integrate LeadingCards and Multilogin X APIs into LP Factory's Ops Center, including D1 schema migration, extended Worker endpoints, live API management UI, risk detection engine, and end-to-end account lifecycle flows.

**Architecture:** Monorepo with two packages — `lp-factory-cf` (Cloudflare Worker + D1) and `lp-factory-web` (React + Vite SPA). The Worker serves as a BFF/proxy and D1 stores all state. The frontend calls the Worker API, and the Worker proxies external API calls to LeadingCards/Multilogin (avoiding CORS issues from browser-direct calls). Settings are stored in D1 `settings` table as key-value pairs.

**Tech Stack:** Cloudflare Workers (JS), D1 SQLite, React 19, Vite 6, LeadingCards REST API, Multilogin X REST API

---

## Overview of Tasks

| # | Task | Files | Estimated Steps |
|---|------|-------|-----------------|
| 1 | D1 Schema Migration — Add integration columns | `lp-factory-cf/db/schema.sql`, `lp-factory-cf/db/migration-001-api-integration.sql` | 5 |
| 2 | Worker — Proxy endpoints for LeadingCards | `lp-factory-cf/src/worker.js` | 8 |
| 3 | Worker — Proxy endpoints for Multilogin | `lp-factory-cf/src/worker.js` | 8 |
| 4 | Worker — Extended Ops CRUD (new columns) | `lp-factory-cf/src/worker.js` | 6 |
| 5 | Frontend Service — Refactor to use Worker proxy | `lp-factory-web/src/services/leadingCards.js`, `multilogin.js`, `api.js` | 6 |
| 6 | Settings UI — Add all integration keys | `lp-factory-web/src/components/Settings.jsx` | 5 |
| 7 | OpsCenter — Payments tab with live LeadingCards | `lp-factory-web/src/components/OpsCenter.jsx` | 8 |
| 8 | OpsCenter — Profiles tab with live Multilogin | `lp-factory-web/src/components/OpsCenter.jsx` | 8 |
| 9 | OpsCenter — Accounts tab with card/profile linking | `lp-factory-web/src/components/OpsCenter.jsx` | 6 |
| 10 | Risk Detection Engine | `lp-factory-web/src/utils/risk-engine.js`, `OpsCenter.jsx` | 8 |
| 11 | End-to-End Flow — Create new Ads account | `OpsCenter.jsx` | 6 |
| 12 | End-to-End Flow — Handle account ban | `OpsCenter.jsx` | 6 |
| 13 | Dashboard — Integration status indicators | `Dashboard.jsx`, `TopBar.jsx` | 4 |
| 14 | Worker `/api/init` — Include new data | `lp-factory-cf/src/worker.js` | 3 |

---

## Task 1: D1 Schema Migration — Add Integration Columns

**Files:**
- Modify: `lp-factory-cf/db/schema.sql` (master schema, for reference)
- Create: `lp-factory-cf/db/migration-001-api-integration.sql` (migration file)
- Modify: `lp-factory-cf/schema.sql` (root-level schema copy)

**Step 1: Create the migration SQL file**

```sql
-- migration-001-api-integration.sql
-- LP Factory V2 — API Integration Schema Migration
-- Run: wrangler d1 execute lp-factory-beta --file=db/migration-001-api-integration.sql

-- ═══ OPS_ACCOUNTS: Link to card + profile ═══
ALTER TABLE ops_accounts ADD COLUMN card_uuid TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN card_last4 TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN card_status TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN profile_id TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN proxy_ip TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN monthly_spend REAL DEFAULT 0;

-- ═══ OPS_PROFILES: Multilogin fields ═══
ALTER TABLE ops_profiles ADD COLUMN ml_profile_id TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN ml_folder_id TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_host TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_port TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_user TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN fingerprint_os TEXT DEFAULT 'windows';
ALTER TABLE ops_profiles ADD COLUMN browser_type TEXT DEFAULT 'mimic';

-- ═══ OPS_PAYMENTS: LeadingCards fields ═══
ALTER TABLE ops_payments ADD COLUMN lc_card_uuid TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN lc_bin_uuid TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN card_limit REAL DEFAULT 0;
ALTER TABLE ops_payments ADD COLUMN card_expiry TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN total_spend REAL DEFAULT 0;

-- ═══ OPS_DOMAINS: Add cf_account_id (missing from original) ═══
-- Note: ops_domains already has cf_account_id if using schema.sql, skip if exists
-- ALTER TABLE ops_domains ADD COLUMN cf_account_id TEXT DEFAULT '';

-- ═══ NEW INDEX ═══
CREATE INDEX IF NOT EXISTS idx_accounts_card ON ops_accounts(card_uuid);
CREATE INDEX IF NOT EXISTS idx_accounts_profile ON ops_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ml ON ops_profiles(ml_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_lc ON ops_payments(lc_card_uuid);
```

**Step 2: Update master schema.sql to include new columns inline**

Update `lp-factory-cf/db/schema.sql` so that all `CREATE TABLE` statements include the new columns (for fresh installs). This means updating `ops_accounts`, `ops_profiles`, and `ops_payments` table definitions.

**Step 3: Copy updated schema to root `schema.sql`**

Keep root `lp-factory-cf/schema.sql` in sync with `db/schema.sql`.

**Step 4: Run migration against local D1**

Run: `cd lp-factory-cf && npx wrangler d1 execute lp-factory-beta --local --file=db/migration-001-api-integration.sql`
Expected: Success, tables altered.

**Step 5: Commit**

```bash
git add lp-factory-cf/db/migration-001-api-integration.sql lp-factory-cf/db/schema.sql lp-factory-cf/schema.sql
git commit -m "feat(db): add API integration columns for LeadingCards + Multilogin"
```

---

## Task 2: Worker — Proxy Endpoints for LeadingCards

**Why proxy?** LeadingCards API uses `Token` auth and may block browser-origin requests (CORS). Proxying through the Worker keeps API tokens server-side (more secure) and avoids CORS entirely.

**Files:**
- Modify: `lp-factory-cf/src/worker.js` (add ~80 lines)

**Step 1: Add helper function `getLcSettings` to read LeadingCards creds from D1**

```js
async function getLcSettings(db) {
  const rows = await db.prepare("SELECT key, value FROM settings WHERE key IN ('lcToken', 'lcTeamUuid')").all();
  const s = {};
  rows.results.forEach(r => { s[r.key] = r.value; });
  return s;
}
```

**Step 2: Add `GET /api/lc/cards` endpoint**

```js
if (path === '/api/lc/cards' && method === 'GET') {
  const s = await getLcSettings(db);
  if (!s.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
  const lcUrl = new URL('https://app.leadingcards.media/v1/cards/');
  if (s.lcTeamUuid) lcUrl.searchParams.append('team_uuid', s.lcTeamUuid);
  // Forward query params: tags, bin_uuid, count, ordering, status, q
  for (const [k, v] of url.searchParams.entries()) lcUrl.searchParams.append(k, v);
  const r = await fetch(lcUrl.toString(), { headers: { 'Authorization': `Token ${s.lcToken}` } });
  const d = await r.json();
  return json(d);
}
```

**Step 3: Add `POST /api/lc/cards` endpoint (create card)**

```js
if (path === '/api/lc/cards' && method === 'POST') {
  const s = await getLcSettings(db);
  if (!s.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
  const body = await request.json();
  if (s.lcTeamUuid) body.team_uuid = s.lcTeamUuid;
  const r = await fetch('https://app.leadingcards.media/v1/cards/', {
    method: 'POST',
    headers: { 'Authorization': `Token ${s.lcToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 4: Add `PUT /api/lc/cards/:uuid/block` and `PUT /api/lc/cards/:uuid/activate`**

```js
if (path.match(/^\/api\/lc\/cards\/[\w-]+\/(block|activate)$/) && method === 'PUT') {
  const s = await getLcSettings(db);
  if (!s.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
  const parts = path.split('/');
  const uuid = parts[4];
  const action = parts[5]; // 'block' or 'activate'
  const lcUrl = `https://app.leadingcards.media/v1/cards/${uuid}/${action}/`;
  if (s.lcTeamUuid) lcUrl += `?team_uuid=${s.lcTeamUuid}`;
  const r = await fetch(lcUrl, {
    method: 'PUT',
    headers: { 'Authorization': `Token ${s.lcToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 5: Add `PUT /api/lc/cards/:uuid/change_limit`**

```js
if (path.match(/^\/api\/lc\/cards\/[\w-]+\/change_limit$/) && method === 'PUT') {
  const s = await getLcSettings(db);
  if (!s.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
  const uuid = path.split('/')[4];
  const body = await request.json();
  let lcUrl = `https://app.leadingcards.media/v1/cards/${uuid}/change_limit/`;
  if (s.lcTeamUuid) lcUrl += `?team_uuid=${s.lcTeamUuid}`;
  const r = await fetch(lcUrl, {
    method: 'PUT',
    headers: { 'Authorization': `Token ${s.lcToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 6: Add `GET /api/lc/bins`, `GET /api/lc/billing`, `GET /api/lc/tags`, `GET /api/lc/transactions`**

```js
// Generic LC GET proxy for: bins, billing_addresses, tags, transactions, teams
if (path.match(/^\/api\/lc\/(bins|billing|tags|transactions|teams)$/) && method === 'GET') {
  const s = await getLcSettings(db);
  if (!s.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
  const map = { bins: 'cards/bins', billing: 'billing_addresses', tags: 'tags', transactions: 'transactions', teams: 'teams' };
  const segment = path.split('/').pop();
  const lcUrl = new URL(`https://app.leadingcards.media/v1/${map[segment]}/`);
  if (s.lcTeamUuid) lcUrl.searchParams.append('team_uuid', s.lcTeamUuid);
  for (const [k, v] of url.searchParams.entries()) lcUrl.searchParams.append(k, v);
  const r = await fetch(lcUrl.toString(), { headers: { 'Authorization': `Token ${s.lcToken}` } });
  const d = await r.json();
  return json(d);
}
```

**Step 7: Add `POST /api/lc/billing` (create billing address)**

```js
if (path === '/api/lc/billing' && method === 'POST') {
  const s = await getLcSettings(db);
  if (!s.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
  const body = await request.json();
  if (s.lcTeamUuid) body.team_uuid = s.lcTeamUuid;
  const r = await fetch('https://app.leadingcards.media/v1/billing_addresses/', {
    method: 'POST',
    headers: { 'Authorization': `Token ${s.lcToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 8: Commit**

```bash
git add lp-factory-cf/src/worker.js
git commit -m "feat(worker): add LeadingCards proxy endpoints"
```

---

## Task 3: Worker — Proxy Endpoints for Multilogin

**Files:**
- Modify: `lp-factory-cf/src/worker.js` (add ~70 lines)

**Step 1: Add helper function `getMlSettings` to read Multilogin creds from D1**

```js
async function getMlSettings(db) {
  const rows = await db.prepare("SELECT key, value FROM settings WHERE key IN ('mlToken', 'mlEmail', 'mlPassword', 'mlFolderId')").all();
  const s = {};
  rows.results.forEach(r => { s[r.key] = r.value; });
  return s;
}
```

**Step 2: Add `POST /api/ml/signin` endpoint (get bearer token)**

```js
if (path === '/api/ml/signin' && method === 'POST') {
  const s = await getMlSettings(db);
  if (!s.mlEmail || !s.mlPassword) return json({ error: 'Multilogin credentials not configured' }, 400);
  const r = await fetch('https://api.multilogin.com/user/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: s.mlEmail, password: s.mlPassword }),
  });
  const d = await r.json();
  // Store the token in settings for reuse
  if (d.data?.token) {
    await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('mlToken', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')")
      .bind(d.data.token, d.data.token).run();
  }
  return json(d, r.status);
}
```

**Step 3: Add `GET /api/ml/profiles` endpoint (list profiles)**

```js
if (path === '/api/ml/profiles' && method === 'GET') {
  const s = await getMlSettings(db);
  if (!s.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
  const mlUrl = new URL('https://api.multilogin.com/profile/list');
  for (const [k, v] of url.searchParams.entries()) mlUrl.searchParams.append(k, v);
  const r = await fetch(mlUrl.toString(), {
    headers: { 'Authorization': `Bearer ${s.mlToken}` },
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 4: Add `POST /api/ml/profiles` endpoint (create profile)**

```js
if (path === '/api/ml/profiles' && method === 'POST') {
  const s = await getMlSettings(db);
  if (!s.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
  const body = await request.json();
  const r = await fetch('https://api.multilogin.com/profile/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${s.mlToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 5: Add `POST /api/ml/profiles/:id/start` and `POST /api/ml/profiles/:id/stop`**

```js
if (path.match(/^\/api\/ml\/profiles\/[\w-]+\/(start|stop)$/) && method === 'POST') {
  const s = await getMlSettings(db);
  if (!s.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
  const parts = path.split('/');
  const profileId = parts[4];
  const action = parts[5];
  const r = await fetch(`https://api.multilogin.com/profile/${action}/${profileId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${s.mlToken}` },
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 6: Add `POST /api/ml/profiles/:id/clone` endpoint**

```js
if (path.match(/^\/api\/ml\/profiles\/[\w-]+\/clone$/) && method === 'POST') {
  const s = await getMlSettings(db);
  if (!s.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
  const profileId = path.split('/')[4];
  const r = await fetch(`https://api.multilogin.com/profile/clone/${profileId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${s.mlToken}` },
  });
  const d = await r.json();
  return json(d, r.status);
}
```

**Step 7: Add `POST /api/ml/refresh-token` endpoint**

```js
if (path === '/api/ml/refresh-token' && method === 'POST') {
  const s = await getMlSettings(db);
  if (!s.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
  const r = await fetch('https://api.multilogin.com/user/refresh_token', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${s.mlToken}` },
  });
  const d = await r.json();
  if (d.data?.token) {
    await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('mlToken', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')")
      .bind(d.data.token, d.data.token).run();
  }
  return json(d, r.status);
}
```

**Step 8: Commit**

```bash
git add lp-factory-cf/src/worker.js
git commit -m "feat(worker): add Multilogin X proxy endpoints"
```

---

## Task 4: Worker — Extended Ops CRUD (New Columns)

**Files:**
- Modify: `lp-factory-cf/src/worker.js`

**Step 1: Update `POST /api/ops/accounts` to accept new fields**

Add bindings for: `card_uuid`, `card_last4`, `card_status`, `profile_id`, `proxy_ip`, `monthly_spend`

```js
// Replace existing INSERT statement for ops_accounts
await db.prepare(`INSERT INTO ops_accounts (id, label, email, payment_id, budget, status, card_uuid, card_last4, card_status, profile_id, proxy_ip, monthly_spend)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .bind(id, body.label || '', body.email || '', body.paymentId || '', body.budget || '', body.status || 'active',
    body.cardUuid || '', body.cardLast4 || '', body.cardStatus || '', body.profileId || '', body.proxyIp || '', body.monthlySpend || 0)
  .run();
```

**Step 2: Update `POST /api/ops/profiles` to accept new fields**

Add bindings for: `ml_profile_id`, `ml_folder_id`, `proxy_host`, `proxy_port`, `proxy_user`, `fingerprint_os`, `browser_type`

**Step 3: Update `POST /api/ops/payments` to accept new fields**

Add bindings for: `lc_card_uuid`, `lc_bin_uuid`, `card_limit`, `card_expiry`, `total_spend`

**Step 4: Add `PUT /api/ops/accounts/:id` endpoint for updating accounts**

```js
if (path.match(/^\/api\/ops\/accounts\/[\w]+$/) && method === 'PUT') {
  const id = path.split('/').pop();
  const body = await request.json();
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(body)) {
    const col = k.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    sets.push(`${col} = ?`);
    vals.push(v);
  }
  vals.push(id);
  await db.prepare(`UPDATE ops_accounts SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ success: true });
}
```

**Step 5: Add `PUT /api/ops/profiles/:id` and `PUT /api/ops/payments/:id` similarly**

Same pattern as Step 4 but for profiles and payments tables.

**Step 6: Commit**

```bash
git add lp-factory-cf/src/worker.js
git commit -m "feat(worker): extend ops CRUD with integration columns + PUT endpoints"
```

---

## Task 5: Frontend Service — Refactor to Use Worker Proxy

**Files:**
- Modify: `lp-factory-web/src/services/leadingCards.js`
- Modify: `lp-factory-web/src/services/multilogin.js`
- Modify: `lp-factory-web/src/services/api.js` (add `put` method)

**Step 1: Add `put` method to `api.js`**

```js
async put(path, data) {
    const r = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return r.json();
},
```

**Step 2: Rewrite `leadingCards.js` to call Worker proxy instead of external API directly**

```js
import { api } from "./api";

export const leadingCardsApi = {
    async getCards(params = {}) {
        const query = new URLSearchParams(params).toString();
        return api.get(`/lc/cards${query ? '?' + query : ''}`);
    },
    async createCard(cardData) {
        return api.post('/lc/cards', cardData);
    },
    async blockCard(uuid) {
        return api.put(`/lc/cards/${uuid}/block`, {});
    },
    async activateCard(uuid) {
        return api.put(`/lc/cards/${uuid}/activate`, {});
    },
    async changeLimit(uuid, limit) {
        return api.put(`/lc/cards/${uuid}/change_limit`, { limit });
    },
    async getBins() {
        return api.get('/lc/bins');
    },
    async getBillingAddresses() {
        return api.get('/lc/billing');
    },
    async createBillingAddress(data) {
        return api.post('/lc/billing', data);
    },
    async getTags() {
        return api.get('/lc/tags');
    },
    async getTransactions(fromDate) {
        return api.get(`/lc/transactions${fromDate ? '?from_date=' + fromDate : ''}`);
    },
    async getTeams() {
        return api.get('/lc/teams');
    },
};
```

**Step 3: Rewrite `multilogin.js` to call Worker proxy**

```js
import { api } from "./api";

export const multiloginApi = {
    async signin() {
        return api.post('/ml/signin', {});
    },
    async refreshToken() {
        return api.post('/ml/refresh-token', {});
    },
    async getProfiles() {
        return api.get('/ml/profiles');
    },
    async createProfile(profileData) {
        return api.post('/ml/profiles', profileData);
    },
    async startProfile(profileId) {
        return api.post(`/ml/profiles/${profileId}/start`, {});
    },
    async stopProfile(profileId) {
        return api.post(`/ml/profiles/${profileId}/stop`, {});
    },
    async cloneProfile(profileId) {
        return api.post(`/ml/profiles/${profileId}/clone`, {});
    },
};
```

**Step 4: Verify no component still passes `settings` to LC/ML API calls**

Search `OpsCenter.jsx` for any `{ token: settings.lcToken, teamuuid: ... }` patterns and remove them — the Worker handles auth now.

**Step 5: Test that the api service imports work**

Run: `cd lp-factory-web && npx vite build --mode development 2>&1 | head -20`
Expected: No import errors.

**Step 6: Commit**

```bash
git add lp-factory-web/src/services/
git commit -m "refactor(services): route API calls through Worker proxy"
```

---

## Task 6: Settings UI — Add All Integration Keys

**Files:**
- Modify: `lp-factory-web/src/components/Settings.jsx`

**Step 1: Add state for new settings fields**

Add state variables for: `defaultBinUuid`, `defaultBillingUuid`, `mlFolderId`, `defaultProxyProvider`

**Step 2: Add "LeadingCards" section with Test button**

Test calls `api.get('/lc/teams')` — if it succeeds, the token works. Show result.

**Step 3: Add "Multilogin" section with Test/Sign-in button**

Test calls `api.post('/ml/signin', {})` — if it succeeds, store the token. Show bearer token status.

**Step 4: Add "Defaults" card**

Fields for: Default BIN UUID, Default Billing Address UUID, Default Multilogin Folder ID, Default Proxy Provider dropdown.

**Step 5: Commit**

```bash
git add lp-factory-web/src/components/Settings.jsx
git commit -m "feat(settings): add integration API key management + test buttons"
```

---

## Task 7: OpsCenter — Payments Tab with Live LeadingCards

**Files:**
- Modify: `lp-factory-web/src/components/OpsCenter.jsx`

**Step 1: Refactor `useEffect` to use new proxy service (no settings params needed)**

```js
useEffect(() => {
    if (tab === "payments" || tab === "overview") {
        setLcLoading(true);
        Promise.all([
            leadingCardsApi.getCards(),
            leadingCardsApi.getBins(),
            leadingCardsApi.getBillingAddresses()
        ]).then(([cardsRes, binsRes, addrRes]) => {
            setLcCards(cardsRes.results || []);
            setLcBins(binsRes || []);
            setLcAddresses(addrRes.results || []);
        }).catch(e => console.error("LC fetch error", e))
            .finally(() => setLcLoading(false));
    }
}, [tab]);
```

**Step 2: Add card filtering (by status, by tag)**

Add state for `lcFilter` and filter controls above the card list.

**Step 3: Add "Change Limit" inline action**

When clicking "Limit" on a card row, show inline input to change the limit. Calls `leadingCardsApi.changeLimit(uuid, newLimit)`.

**Step 4: Add "Create Card" modal using bins + billing addresses from API**

The modal already exists but needs to use proxy. Update all `leadingCardsApi.createCard(...)` calls to not pass settings.

**Step 5: Add transactions sub-tab**

New sub-tab under Payments that calls `leadingCardsApi.getTransactions()` and shows recent transactions in a table.

**Step 6: Add "Create Billing Address" modal**

A button in the Create Card modal area to add a new billing address if none exist.

**Step 7: Show card spend summary**

Aggregate card data to show total active cards, total limit, total spend (from transactions).

**Step 8: Commit**

```bash
git add lp-factory-web/src/components/OpsCenter.jsx
git commit -m "feat(ops): enhanced payments tab with live LeadingCards integration"
```

---

## Task 8: OpsCenter — Profiles Tab with Live Multilogin

**Files:**
- Modify: `lp-factory-web/src/components/OpsCenter.jsx`

**Step 1: Refactor profile fetch to use proxy**

```js
if ((tab === "profiles" || tab === "overview")) {
    setMlLoading(true);
    multiloginApi.getProfiles()
        .then(res => setMlProfiles(res.data?.profiles || res || []))
        .catch(e => console.error("ML fetch error", e))
        .finally(() => setMlLoading(false));
}
```

**Step 2: Add "Start/Stop Profile" actions**

Each profile row gets Start/Stop buttons that call `multiloginApi.startProfile(id)` / `stopProfile(id)`.

**Step 3: Add "Create Quick Profile" modal**

Uses the Multilogin quick profile creation format from the Integration Guide. Fields: browser_type, os_type, proxy (host, port, user, pass), start URLs.

**Step 4: Add "Clone Profile" action**

Button on each profile row that calls `multiloginApi.cloneProfile(id)`.

**Step 5: Show profile status indicators**

Color-coded badges: running (green), stopped (gray), error (red).

**Step 6: Add Multilogin sign-in flow**

If ML API returns 401, show "Sign In" button that calls `multiloginApi.signin()` then retries.

**Step 7: Merge local D1 profiles with Multilogin cloud profiles**

Show both sources side by side. D1 profiles are the "managed" list, ML profiles are the "cloud" list. Link them via `ml_profile_id`.

**Step 8: Commit**

```bash
git add lp-factory-web/src/components/OpsCenter.jsx
git commit -m "feat(ops): enhanced profiles tab with live Multilogin integration"
```

---

## Task 9: OpsCenter — Accounts Tab with Card/Profile Linking

**Files:**
- Modify: `lp-factory-web/src/components/OpsCenter.jsx`

**Step 1: Update AddModal for accounts to include card + profile selectors**

Add dropdown fields for:
- Card (from `lcCards`) — shows last4 + status
- Profile (from local `data.profiles`) — shows name + proxy

**Step 2: Show linked card/profile info in account rows**

Each account row shows: label, email, linked card (last4 + status badge), linked profile (name + proxy), monthly spend.

**Step 3: Add "Edit Account" modal for relinking**

Allows changing the linked card/profile for an existing account. Calls `api.put('/ops/accounts/:id', { cardUuid, profileId })`.

**Step 4: Add monthly spend column**

Pull spend data from LeadingCards transactions for each account's linked card.

**Step 5: Add status management**

Dropdown to change account status: active, paused, suspended, setup. Calls `api.put`.

**Step 6: Commit**

```bash
git add lp-factory-web/src/components/OpsCenter.jsx
git commit -m "feat(ops): accounts tab with card/profile linking"
```

---

## Task 10: Risk Detection Engine

**Files:**
- Create: `lp-factory-web/src/utils/risk-engine.js`
- Modify: `lp-factory-web/src/components/OpsCenter.jsx`

**Step 1: Create `risk-engine.js` with pure functions**

```js
export function detectRisks({ accounts, payments, profiles, domains, lcCards, lcTransactions }) {
    const risks = [];

    // 1. Shared payment ID across accounts
    const payMap = {};
    accounts.forEach(a => {
        if (a.paymentId) {
            if (!payMap[a.paymentId]) payMap[a.paymentId] = [];
            payMap[a.paymentId].push(a);
        }
    });
    Object.entries(payMap).forEach(([pid, accs]) => {
        if (accs.length > 1) {
            const p = payments.find(x => x.id === pid);
            risks.push({
                level: 'critical',
                category: 'payment',
                msg: `Payment "${p?.label || pid}" shared by ${accs.length} accounts: ${accs.map(a => a.label).join(', ')}`,
                affectedIds: accs.map(a => a.id),
            });
        }
    });

    // 2. Duplicate card UUID across accounts
    const cardMap = {};
    accounts.forEach(a => {
        if (a.cardUuid) {
            if (!cardMap[a.cardUuid]) cardMap[a.cardUuid] = [];
            cardMap[a.cardUuid].push(a);
        }
    });
    Object.entries(cardMap).forEach(([cid, accs]) => {
        if (accs.length > 1) {
            risks.push({
                level: 'critical',
                category: 'card',
                msg: `Card UUID "${cid.slice(0, 8)}..." used by ${accs.length} accounts`,
                affectedIds: accs.map(a => a.id),
            });
        }
    });

    // 3. Duplicate proxy IP across profiles
    const proxyMap = {};
    profiles.forEach(p => {
        if (p.proxyIp) {
            if (!proxyMap[p.proxyIp]) proxyMap[p.proxyIp] = [];
            proxyMap[p.proxyIp].push(p);
        }
    });
    Object.entries(proxyMap).forEach(([ip, profs]) => {
        if (profs.length > 1) {
            risks.push({
                level: 'high',
                category: 'proxy',
                msg: `Proxy IP "${ip}" shared by ${profs.length} profiles: ${profs.map(p => p.name).join(', ')}`,
                affectedIds: profs.map(p => p.id),
            });
        }
    });

    // 4. Too many domains per account
    accounts.forEach(a => {
        const doms = domains.filter(d => d.accountId === a.id);
        if (doms.length > 5) {
            risks.push({
                level: 'high',
                category: 'domain',
                msg: `Account "${a.label}" has ${doms.length} domains (recommended: <=5)`,
                affectedIds: [a.id],
            });
        }
    });

    // 5. Registrar concentration
    const regMap = {};
    domains.forEach(d => {
        if (d.registrar) {
            if (!regMap[d.registrar]) regMap[d.registrar] = [];
            regMap[d.registrar].push(d);
        }
    });
    Object.entries(regMap).forEach(([reg, doms]) => {
        if (doms.length > 10) {
            risks.push({
                level: 'medium',
                category: 'registrar',
                msg: `${doms.length} domains using registrar "${reg}" — consider diversifying`,
                affectedIds: doms.map(d => d.id),
            });
        }
    });

    // 6. Abnormal spend (if transactions available)
    // Future: check if any card spent >80% of limit in past 24h

    return risks.sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.level] || 9) - (order[b.level] || 9);
    });
}
```

**Step 2: Import risk engine in OpsCenter**

Replace inline `useMemo` risk calculation with `detectRisks()`.

**Step 3: Update Risks tab to show categorized risks**

Group by category with icons: payment (card icon), proxy (globe icon), domain (earth icon), card (credit-card icon).

**Step 4: Add risk count to Overview metrics**

Color the Risks count red if >0.

**Step 5: Add risk count to Dashboard**

Import `detectRisks` in Dashboard and pass ops + lcCards data.

**Step 6: Add risk alert to TopBar**

If critical risks >0, show a red dot next to Ops Center indicator.

**Step 7: Connect risk detection to real LC card data**

When `lcCards` are loaded, pass them to `detectRisks` to check for duplicate `payment_id` values from the actual card API response.

**Step 8: Commit**

```bash
git add lp-factory-web/src/utils/risk-engine.js lp-factory-web/src/components/OpsCenter.jsx lp-factory-web/src/components/Dashboard.jsx lp-factory-web/src/components/TopBar.jsx
git commit -m "feat: risk detection engine with 5+ correlation checks"
```

---

## Task 11: End-to-End Flow — Create New Ads Account

**Files:**
- Modify: `lp-factory-web/src/components/OpsCenter.jsx`

**Step 1: Add "New Account Wizard" button on Overview tab**

Big CTA: "Create New Ads Account (End-to-End)"

**Step 2: Build multi-step modal: Step 1 — Create card**

Auto-selects default BIN + billing from settings. Shows card preview before creation.

**Step 3: Step 2 — Create Multilogin profile**

Auto-fills with default proxy provider, browser type. Generates unique proxy.

**Step 4: Step 3 — Register account details**

Label, email, budget. Auto-links the card UUID and profile ID from steps 1-2.

**Step 5: Step 4 — Save to D1 + open browser**

Calls `api.post('/ops/accounts', ...)` with all linked IDs. Optionally calls `multiloginApi.startProfile(id)` to open browser.

**Step 6: Commit**

```bash
git add lp-factory-web/src/components/OpsCenter.jsx
git commit -m "feat(ops): end-to-end account creation wizard"
```

---

## Task 12: End-to-End Flow — Handle Account Ban

**Files:**
- Modify: `lp-factory-web/src/components/OpsCenter.jsx`

**Step 1: Add "Suspend Account" action on account rows**

Changes status to "suspended" and triggers the ban flow.

**Step 2: Ban flow Step 1 — Block card**

Calls `leadingCardsApi.blockCard(account.cardUuid)`.

**Step 3: Ban flow Step 2 — Stop profile**

Calls `multiloginApi.stopProfile(account.profileId)`.

**Step 4: Ban flow Step 3 — Update account status in D1**

Calls `api.put('/ops/accounts/:id', { status: 'suspended', cardStatus: 'BLOCKED' })`.

**Step 5: Ban flow Step 4 — Offer replacement**

Modal: "Create replacement account?" which launches the Task 11 wizard pre-filled with a different BIN.

**Step 6: Commit**

```bash
git add lp-factory-web/src/components/OpsCenter.jsx
git commit -m "feat(ops): account ban handling with auto-block and replacement flow"
```

---

## Task 13: Dashboard — Integration Status Indicators

**Files:**
- Modify: `lp-factory-web/src/components/Dashboard.jsx`
- Modify: `lp-factory-web/src/components/TopBar.jsx`

**Step 1: Update TopBar to show integration status**

Replace generic "API OK" with specific indicators:
- "LC OK" (green) if `settings.lcToken` exists
- "ML OK" (green) if `settings.mlToken` exists
- Keep existing "D1" and "Netlify" indicators

**Step 2: Update Dashboard System Health card**

Replace static "Gemini 1.5 Flash" with:
- "LeadingCards API" — green if token configured
- "Multilogin X" — green if token configured
- "D1 Database" — green if apiOk

**Step 3: Update Dashboard metrics**

Add "Active Cards" metric (from lcCards count passed via props or fetched).

**Step 4: Commit**

```bash
git add lp-factory-web/src/components/Dashboard.jsx lp-factory-web/src/components/TopBar.jsx
git commit -m "feat(ui): integration status indicators in dashboard + topbar"
```

---

## Task 14: Worker `/api/init` — Include New Data

**Files:**
- Modify: `lp-factory-cf/src/worker.js`

**Step 1: Update `/api/init` to include CF accounts**

Add `cfAccounts` query:
```js
const cfAccounts = await db.prepare("SELECT * FROM cf_accounts ORDER BY label ASC").all();
```
Include in response: `cfAccounts: cfAccounts.results.map(snakeToCamel)`

**Step 2: Return settings for integration key presence (not values)**

Add to response:
```js
integrations: {
  lcConfigured: !!settingsObj.lcToken,
  mlConfigured: !!settingsObj.mlToken,
  netlifyConfigured: !!settingsObj.netlifyToken,
}
```

**Step 3: Commit**

```bash
git add lp-factory-cf/src/worker.js
git commit -m "feat(worker): include cfAccounts + integration status in /api/init"
```

---

## Execution Order

Tasks can be partially parallelized:

```
Phase 1 (Backend):   Task 1 → Task 2 → Task 3 → Task 4 → Task 14
Phase 2 (Services):  Task 5 (depends on Phase 1)
Phase 3 (Frontend):  Task 6 → Task 7 → Task 8 → Task 9 (depends on Task 5)
Phase 4 (Features):  Task 10 → Task 11 → Task 12 → Task 13 (depends on Phase 3)
```

Total estimated tasks: **14 tasks, ~87 steps**
