// LP Factory V2 — Cloudflare Workers API
// Binds to D1 database "lp-factory"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function uid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

async function getLcSettings(db) {
  const rows = await db.prepare("SELECT key, value FROM settings WHERE key IN ('lcToken', 'lcTeamUuid')").all();
  const s = {};
  rows.results.forEach(r => { s[r.key] = r.value; });
  return s;
}

async function getMlSettings(db) {
  const rows = await db.prepare("SELECT key, value FROM settings WHERE key IN ('mlToken', 'mlEmail', 'mlPassword', 'mlFolderId')").all();
  const s = {};
  rows.results.forEach(r => { s[r.key] = r.value; });
  return s;
}

async function md5(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Column whitelists for PUT endpoints (SQL injection protection)
const ALLOWED_COLS = {
  accounts: new Set(['label', 'email', 'paymentId', 'budget', 'status', 'cardUuid', 'cardLast4', 'cardStatus', 'profileId', 'proxyIp', 'monthlySpend']),
  profiles: new Set(['name', 'proxyIp', 'browserType', 'os', 'status', 'mlProfileId', 'mlFolderId', 'proxyHost', 'proxyPort', 'proxyUser', 'fingerprintOs', 'proxyPass', 'proxyType', 'mlxStatus', 'lastStartedAt', 'lastStoppedAt', 'accountId']),
  payments: new Set(['label', 'type', 'last4', 'bankName', 'status', 'lcCardUuid', 'lcBinUuid', 'cardLimit', 'cardExpiry', 'totalSpend']),
};

// Secret keys that should never be returned in API responses
const SECRET_KEYS = new Set(['apiKey', 'geminiKey', 'netlifyToken', 'lcToken', 'mlToken', 'mlPassword']);

function redactSettings(obj) {
  const safe = {};
  for (const [k, v] of Object.entries(obj)) {
    safe[k] = SECRET_KEYS.has(k) ? (v ? '••••' : '') : v;
  }
  return safe;
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Auth check — if API_SECRET is set, require Bearer token
    if (env.API_SECRET) {
      const auth = request.headers.get('Authorization');
      if (!auth || auth !== `Bearer ${env.API_SECRET}`) {
        return json({ error: 'Unauthorized' }, 401);
      }
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const db = env.DB;

    try {
      // ═══ SITES ═══
      if (path === '/api/sites' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
        return json(results);
      }

      if (path === '/api/sites' && method === 'POST') {
        const body = await request.json();
        const id = body.id || uid();
        await db.prepare(`
          INSERT INTO sites (id, brand, domain, tagline, email, loan_type, amount_min, amount_max,
            apr_min, apr_max, color_id, font_id, layout, radius, h1, badge, cta, sub,
            gtm_id, network, redirect_url, conversion_id, conversion_label,
            copy_id, sections, compliance, status, cost, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, body.brand || '', body.domain || '', body.tagline || '', body.email || '',
          body.loanType || 'personal', body.amountMin || 100, body.amountMax || 5000,
          body.aprMin || 5.99, body.aprMax || 35.99,
          body.colorId || 'ocean', body.fontId || 'dm-sans', body.layout || 'hero-left',
          body.radius || 'rounded', body.h1 || '', body.badge || '', body.cta || '', body.sub || '',
          body.gtmId || '', body.network || 'LeadsGate', body.redirectUrl || '',
          body.conversionId || '', body.conversionLabel || '',
          body.copyId || '', body.sections || 'default', body.compliance || 'standard',
          body.status || 'completed', body.cost || 0, body.createdBy || ''
        ).run();
        return json({ id, success: true }, 201);
      }

      if (path.match(/^\/api\/sites\/[\w]+$/) && method === 'DELETE') {
        const id = path.split('/').pop();
        await db.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
        return json({ success: true });
      }

      // ═══ DEPLOYS ═══
      if (path === '/api/deploys' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM deploys ORDER BY created_at DESC LIMIT 100').all();
        return json(results);
      }

      if (path === '/api/deploys' && method === 'POST') {
        const body = await request.json();
        const id = body.id || uid();
        await db.prepare(`
          INSERT INTO deploys (id, site_id, brand, url, type, deployed_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(id, body.siteId || '', body.brand || '', body.url || '', body.type || 'new', body.deployedBy || '').run();
        return json({ id, success: true }, 201);
      }

      if (path.startsWith('/api/deploys/') && method === 'DELETE') {
        const id = path.split('/')[3];
        await db.prepare('DELETE FROM deploys WHERE id = ?').bind(id).run();
        return json({ success: true });
      }

      // ═══ VARIANTS ═══
      if (path === '/api/variants' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM variants ORDER BY created_at DESC').all();
        return json(results);
      }

      if (path === '/api/variants' && method === 'POST') {
        const body = await request.json();
        const id = body.id || uid();
        await db.prepare(`
          INSERT INTO variants (id, color_id, font_id, layout, radius, copy_id, sections, compliance, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, body.colorId || 'ocean', body.fontId || 'dm-sans', body.layout || 'hero-left',
          body.radius || 'rounded', body.copyId || 'smart', body.sections || 'default',
          body.compliance || 'standard', body.createdBy || ''
        ).run();
        return json({ id, success: true }, 201);
      }

      if (path === '/api/variants/batch' && method === 'POST') {
        const body = await request.json();
        const items = body.variants || [];
        const stmt = db.prepare(`
          INSERT INTO variants (id, color_id, font_id, layout, radius, copy_id, sections, compliance, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const batch = items.map(v => stmt.bind(
          v.id || uid(), v.colorId, v.fontId, v.layout, v.radius, v.copyId, v.sections, v.compliance, v.createdBy || ''
        ));
        await db.batch(batch);
        return json({ success: true, count: items.length }, 201);
      }

      if (path.match(/^\/api\/variants\/[\w]+$/) && method === 'DELETE') {
        const id = path.split('/').pop();
        await db.prepare('DELETE FROM variants WHERE id = ?').bind(id).run();
        return json({ success: true });
      }

      // ═══ OPS: DOMAINS ═══
      if (path === '/api/ops/domains' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM ops_domains ORDER BY created_at DESC').all();
        return json(results);
      }
      if (path === '/api/ops/domains' && method === 'POST') {
        const body = await request.json();
        const id = uid();
        await db.prepare('INSERT INTO ops_domains (id, domain, registrar, account_id, profile_id, cf_account_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(id, body.domain || '', body.registrar || '', body.accountId || '', body.profileId || '', body.cfAccountId || '', body.status || 'active').run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Added domain: ${body.domain}`).run();
        return json({ id, success: true }, 201);
      }
      if (path.match(/^\/api\/ops\/domains\/[\w]+$/) && method === 'DELETE') {
        const id = path.split('/').pop();
        const item = await db.prepare('SELECT domain FROM ops_domains WHERE id = ?').bind(id).first();
        await db.prepare('DELETE FROM ops_domains WHERE id = ?').bind(id).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Deleted domain: ${item?.domain || id}`).run();
        return json({ success: true });
      }

      // ═══ OPS: ACCOUNTS ═══
      if (path === '/api/ops/accounts' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM ops_accounts ORDER BY created_at DESC').all();
        return json(results);
      }
      if (path === '/api/ops/accounts' && method === 'POST') {
        const body = await request.json();
        const id = uid();
        await db.prepare('INSERT INTO ops_accounts (id, label, email, payment_id, budget, status, card_uuid, card_last4, card_status, profile_id, proxy_ip, monthly_spend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, body.label || '', body.email || '', body.paymentId || '', body.budget || '', body.status || 'active',
            body.cardUuid || '', body.cardLast4 || '', body.cardStatus || '', body.profileId || '', body.proxyIp || '', body.monthlySpend || 0).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Added account: ${body.label}`).run();
        return json({ id, success: true }, 201);
      }
      if (path.match(/^\/api\/ops\/accounts\/[\w]+$/) && method === 'DELETE') {
        const id = path.split('/').pop();
        const item = await db.prepare('SELECT label FROM ops_accounts WHERE id = ?').bind(id).first();
        await db.prepare('DELETE FROM ops_accounts WHERE id = ?').bind(id).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Deleted account: ${item?.label || id}`).run();
        return json({ success: true });
      }
      if (path.match(/^\/api\/ops\/accounts\/[\w]+$/) && method === 'PUT') {
        const id = path.split('/').pop();
        const body = await request.json();
        const sets = [];
        const vals = [];
        for (const [key, value] of Object.entries(body)) {
          if (key === 'id' || key === 'createdAt') continue;
          if (!ALLOWED_COLS.accounts.has(key)) continue;
          sets.push(`${camelToSnake(key)} = ?`);
          vals.push(value);
        }
        if (sets.length === 0) return json({ error: 'No fields to update' }, 400);
        vals.push(id);
        await db.prepare(`UPDATE ops_accounts SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Updated account: ${id}`).run();
        return json({ success: true });
      }

      // ═══ OPS: PROFILES ═══
      if (path === '/api/ops/profiles' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM ops_profiles ORDER BY created_at DESC').all();
        return json(results);
      }
      if (path === '/api/ops/profiles' && method === 'POST') {
        const body = await request.json();
        const id = uid();
        await db.prepare('INSERT INTO ops_profiles (id, name, proxy_ip, browser_type, os, status, ml_profile_id, ml_folder_id, proxy_host, proxy_port, proxy_user, fingerprint_os, proxy_pass, proxy_type, mlx_status, account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, body.name || '', body.proxyIp || '', body.browserType || '', body.os || '', body.status || 'active',
            body.mlProfileId || '', body.mlFolderId || '', body.proxyHost || '', body.proxyPort || '', body.proxyUser || '', body.fingerprintOs || '',
            body.proxyPass || '', body.proxyType || '', body.mlxStatus || '', body.accountId || '').run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Added profile: ${body.name}`).run();
        return json({ id, success: true }, 201);
      }
      if (path.match(/^\/api\/ops\/profiles\/[\w]+$/) && method === 'DELETE') {
        const id = path.split('/').pop();
        const item = await db.prepare('SELECT name FROM ops_profiles WHERE id = ?').bind(id).first();
        await db.prepare('DELETE FROM ops_profiles WHERE id = ?').bind(id).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Deleted profile: ${item?.name || id}`).run();
        return json({ success: true });
      }
      if (path.match(/^\/api\/ops\/profiles\/[\w]+$/) && method === 'PUT') {
        const id = path.split('/').pop();
        const body = await request.json();
        const sets = [];
        const vals = [];
        for (const [key, value] of Object.entries(body)) {
          if (key === 'id' || key === 'createdAt') continue;
          if (!ALLOWED_COLS.profiles.has(key)) continue;
          sets.push(`${camelToSnake(key)} = ?`);
          vals.push(value);
        }
        if (sets.length === 0) return json({ error: 'No fields to update' }, 400);
        vals.push(id);
        await db.prepare(`UPDATE ops_profiles SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Updated profile: ${id}`).run();
        return json({ success: true });
      }

      // ═══ OPS: PAYMENTS ═══
      if (path === '/api/ops/payments' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM ops_payments ORDER BY created_at DESC').all();
        return json(results);
      }
      if (path === '/api/ops/payments' && method === 'POST') {
        const body = await request.json();
        const id = uid();
        await db.prepare('INSERT INTO ops_payments (id, label, type, last4, bank_name, status, lc_card_uuid, lc_bin_uuid, card_limit, card_expiry, total_spend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, body.label || '', body.type || '', body.last4 || '', body.bankName || '', body.status || 'active',
            body.lcCardUuid || '', body.lcBinUuid || '', body.cardLimit || 0, body.cardExpiry || '', body.totalSpend || 0).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Added payment: ${body.label}`).run();
        return json({ id, success: true }, 201);
      }
      if (path.match(/^\/api\/ops\/payments\/[\w]+$/) && method === 'DELETE') {
        const id = path.split('/').pop();
        const item = await db.prepare('SELECT label FROM ops_payments WHERE id = ?').bind(id).first();
        await db.prepare('DELETE FROM ops_payments WHERE id = ?').bind(id).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Deleted payment: ${item?.label || id}`).run();
        return json({ success: true });
      }
      if (path.match(/^\/api\/ops\/payments\/[\w]+$/) && method === 'PUT') {
        const id = path.split('/').pop();
        const body = await request.json();
        const sets = [];
        const vals = [];
        for (const [key, value] of Object.entries(body)) {
          if (key === 'id' || key === 'createdAt') continue;
          if (!ALLOWED_COLS.payments.has(key)) continue;
          sets.push(`${camelToSnake(key)} = ?`);
          vals.push(value);
        }
        if (sets.length === 0) return json({ error: 'No fields to update' }, 400);
        vals.push(id);
        await db.prepare(`UPDATE ops_payments SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `Updated payment: ${id}`).run();
        return json({ success: true });
      }

      // ═══ OPS: LOGS ═══
      if (path === '/api/ops/logs' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM ops_logs ORDER BY created_at DESC LIMIT 200').all();
        return json(results);
      }

      // ═══ SETTINGS ═══
      if (path === '/api/settings' && method === 'GET') {
        const { results } = await db.prepare('SELECT * FROM settings').all();
        const obj = {};
        results.forEach(r => { obj[r.key] = r.value; });
        return json(obj);
      }

      if (path === '/api/settings' && method === 'POST') {
        const body = await request.json();
        for (const [key, value] of Object.entries(body)) {
          await db.prepare(`
            INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
          `).bind(key, String(value), String(value)).run();
        }
        return json({ success: true });
      }

      // ═══ AI: GENERATION ═══
      if (path === "/api/ai/generate-copy" && method === "POST") {
        const body = await request.json();
        const settings = await db.prepare("SELECT * FROM settings WHERE key = 'geminiKey'").first();
        const key = settings?.value;
        if (!key) return json({ error: "Gemini Key not configured" }, 400);

        const prompt = `Generate high-converting loan landing page copy.
          Brand: "${body.brand}"
          Loan Type: "${body.loanType}"
          Amount Range: $${body.amountMin}-$${body.amountMax}
          Language: ${body.lang || "English"}
          Format: Strict JSON object only. No markdown.
          Structure: {"h1":"","badge":"","cta":"","sub":"","tagline":"","trust_msg":""}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const d = await res.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim();
        try {
          return json(JSON.parse(text));
        } catch {
          return json({ error: "AI Format Error", raw: text }, 500);
        }
      }

      if (path === "/api/ai/generate-assets" && method === "POST") {
        const body = await request.json();
        const settingsRes = await db.prepare("SELECT * FROM settings WHERE key = 'geminiKey'").first();
        const key = settingsRes?.value;
        if (!key) return json({ error: "Gemini Key not configured" }, 400);

        const type = body.type || "logo";
        const promptGen = `Act as an expert AI prompt engineer. Create a highly detailed, professional prompt for an image generator (DALL-E 3 style).
          Brand: "${body.brand}"
          Context: "${type === 'logo' ? 'Fintech logo design' : 'High-converting hero background for loan site'}"
          Style: "${body.style || 'Modern & Clean'}"
          Requirements: ${type === 'logo' ? 'Flat vector, minimalist, white background, no text except brand' : 'Photorealistic, soft lighting, lots of copy space, 16:9'}
          Output: ONLY the refined prompt text. No chatter.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptGen }] }] })
        });
        const d = await res.json();
        const refinedPrompt = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Modern fintech visual";

        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(refinedPrompt)}?width=${type === 'logo' ? 512 : 1280}&height=${type === 'logo' ? 512 : 720}&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

        return json({ url: imageUrl, prompt: refinedPrompt });
      }

      // ═══ CF ACCOUNTS ═══
      if (path === "/api/cf-accounts" && method === "GET") {
        const { results } = await db.prepare("SELECT * FROM cf_accounts ORDER BY label ASC").all();
        return json(results);
      }
      if (path === "/api/cf-accounts" && method === "POST") {
        const body = await request.json();
        const id = uid();
        await db.prepare("INSERT INTO cf_accounts (id, email, api_key, label) VALUES (?, ?, ?, ?)")
          .bind(id, body.email || "", body.apiKey || "", body.label || "").run();
        return json({ id, success: true }, 201);
      }
      if (path.match(/^\/api\/cf-accounts\/[\w]+$/) && method === "DELETE") {
        const id = path.split("/").pop();
        await db.prepare("DELETE FROM cf_accounts WHERE id = ?").bind(id).run();
        return json({ success: true });
      }

      // ═══ STATS (computed) ═══
      if (path === '/api/stats' && method === 'GET') {
        const sites = await db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(cost),0) as spend FROM sites').first();
        const deploys = await db.prepare('SELECT COUNT(*) as count FROM deploys').first();
        const domains = await db.prepare('SELECT COUNT(*) as count FROM ops_domains').first();
        return json({
          builds: sites.count,
          spend: sites.spend,
          deployed: deploys.count,
          domains: domains.count,
        });
      }

      // ═══ ALL DATA (initial load) ═══
      if (path === '/api/init' && method === 'GET') {
        const [sites, deploys, variants, domains, accounts, profiles, payments, logs, settingsRows, stats, cfAccountsResults] = await Promise.all([
          db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all(),
          db.prepare('SELECT * FROM deploys ORDER BY created_at DESC LIMIT 100').all(),
          db.prepare('SELECT * FROM variants ORDER BY created_at DESC').all(),
          db.prepare('SELECT * FROM ops_domains ORDER BY created_at DESC').all(),
          db.prepare('SELECT * FROM ops_accounts ORDER BY created_at DESC').all(),
          db.prepare('SELECT * FROM ops_profiles ORDER BY created_at DESC').all(),
          db.prepare('SELECT * FROM ops_payments ORDER BY created_at DESC').all(),
          db.prepare('SELECT * FROM ops_logs ORDER BY created_at DESC LIMIT 200').all(),
          db.prepare('SELECT * FROM settings').all(),
          db.prepare('SELECT COUNT(*) as builds, COALESCE(SUM(cost),0) as spend FROM sites').first(),
          db.prepare('SELECT * FROM cf_accounts ORDER BY label ASC').all(),
        ]);

        const settingsObj = {};
        settingsRows.results.forEach(r => { settingsObj[r.key] = r.value; });

        return json({
          sites: sites.results.map(snakeToCamel),
          deploys: deploys.results.map(snakeToCamel),
          variants: variants.results.map(snakeToCamel),
          ops: {
            domains: domains.results.map(snakeToCamel),
            accounts: accounts.results.map(snakeToCamel),
            profiles: profiles.results.map(snakeToCamel),
            payments: payments.results.map(snakeToCamel),
            logs: logs.results.map(snakeToCamel),
          },
          cfAccounts: cfAccountsResults.results.map(snakeToCamel),
          settings: redactSettings(settingsObj),
          stats: { builds: stats.builds, spend: stats.spend },
          integrations: {
            lcConfigured: !!settingsObj.lcToken,
            mlConfigured: !!settingsObj.mlToken,
            netlifyConfigured: !!settingsObj.netlifyToken,
          },
        });
      }

      // ═══ LEADINGCARDS PROXY ═══
      if (path === '/api/lc/cards' && method === 'GET') {
        const lc = await getLcSettings(db);
        if (!lc.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
        const params = new URLSearchParams(url.search);
        if (lc.lcTeamUuid) params.set('team_uuid', lc.lcTeamUuid);
        const res = await fetch(`https://app.leadingcards.media/v1/cards/?${params.toString()}`, {
          headers: { 'Authorization': `Token ${lc.lcToken}`, 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        return json(data, res.status);
      }

      if (path === '/api/lc/cards' && method === 'POST') {
        const lc = await getLcSettings(db);
        if (!lc.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
        const body = await request.json();
        if (lc.lcTeamUuid) body.team_uuid = lc.lcTeamUuid;
        const res = await fetch('https://app.leadingcards.media/v1/cards/', {
          method: 'POST',
          headers: { 'Authorization': `Token ${lc.lcToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return json(data, res.status);
      }

      if (path.match(/^\/api\/lc\/cards\/[\w-]+\/(block|activate)$/) && method === 'PUT') {
        const lc = await getLcSettings(db);
        if (!lc.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
        const parts = path.split('/');
        const action = parts.pop();
        const uuid = parts.pop();
        const res = await fetch(`https://app.leadingcards.media/v1/cards/${uuid}/${action}/`, {
          method: 'PUT',
          headers: { 'Authorization': `Token ${lc.lcToken}`, 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        return json(data, res.status);
      }

      if (path.match(/^\/api\/lc\/cards\/[\w-]+\/change_limit$/) && method === 'PUT') {
        const lc = await getLcSettings(db);
        if (!lc.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
        const parts = path.split('/');
        parts.pop(); // change_limit
        const uuid = parts.pop();
        const body = await request.json();
        const res = await fetch(`https://app.leadingcards.media/v1/cards/${uuid}/change_limit/`, {
          method: 'PUT',
          headers: { 'Authorization': `Token ${lc.lcToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return json(data, res.status);
      }

      if (path.match(/^\/api\/lc\/(bins|billing|tags|transactions|teams)$/) && method === 'GET') {
        const lc = await getLcSettings(db);
        if (!lc.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
        const resource = path.split('/').pop();
        const apiMap = { bins: 'cards/bins', billing: 'billing_addresses', tags: 'tags', transactions: 'transactions', teams: 'teams' };
        const endpoint = apiMap[resource];
        const params = new URLSearchParams(url.search);
        const res = await fetch(`https://app.leadingcards.media/v1/${endpoint}/?${params.toString()}`, {
          headers: { 'Authorization': `Token ${lc.lcToken}`, 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        return json(data, res.status);
      }

      if (path === '/api/lc/billing' && method === 'POST') {
        const lc = await getLcSettings(db);
        if (!lc.lcToken) return json({ error: 'LeadingCards token not configured' }, 400);
        const body = await request.json();
        const res = await fetch('https://app.leadingcards.media/v1/billing_addresses/', {
          method: 'POST',
          headers: { 'Authorization': `Token ${lc.lcToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return json(data, res.status);
      }

      // ═══ MULTILOGIN PROXY ═══
      if (path === '/api/ml/signin' && method === 'POST') {
        const ml = await getMlSettings(db);
        if (!ml.mlEmail || !ml.mlPassword) return json({ error: 'Multilogin email/password not configured' }, 400);
        const hashedPassword = await md5(ml.mlPassword);
        const res = await fetch('https://api.multilogin.com/user/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: ml.mlEmail, password: hashedPassword }),
        });
        const data = await res.json();
        if (data.data?.token) {
          await db.prepare(`
            INSERT INTO settings (key, value, updated_at) VALUES ('mlToken', ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
          `).bind(data.data.token, data.data.token).run();
        }
        return json(data, res.status);
      }

      if (path === '/api/ml/refresh-token' && method === 'POST') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const res = await fetch('https://api.multilogin.com/user/refresh_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
        });
        const data = await res.json();
        if (data.data?.token) {
          await db.prepare(`
            INSERT INTO settings (key, value, updated_at) VALUES ('mlToken', ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
          `).bind(data.data.token, data.data.token).run();
        }
        return json(data, res.status);
      }

      if (path === '/api/ml/profiles' && method === 'GET') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const params = new URLSearchParams(url.search);
        const res = await fetch(`https://api.multilogin.com/profile/list?${params.toString()}`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
        });
        const data = await res.json();
        return json(data, res.status);
      }

      if (path === '/api/ml/profiles' && method === 'POST') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const body = await request.json();
        const res = await fetch('https://api.multilogin.com/profile/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        // Also create a D1 ops_profiles record for the newly created MLX profile
        if (res.ok && data.data?.ids?.length) {
          for (const mlxId of data.data.ids) {
            const id = uid();
            const proxyInfo = body.parameters?.proxy || {};
            await db.prepare(
              'INSERT INTO ops_profiles (id, name, ml_profile_id, ml_folder_id, browser_type, os, proxy_host, proxy_port, proxy_user, proxy_pass, proxy_type, fingerprint_os, mlx_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              id, body.name || '', mlxId, body.folder_id || ml.mlFolderId || '',
              body.browser_type || '', body.parameters?.fingerprint?.os || '',
              proxyInfo.host || '', proxyInfo.port || '', proxyInfo.username || '', proxyInfo.password || '',
              proxyInfo.type || '', body.parameters?.fingerprint?.os || '',
              'stopped', 'active'
            ).run();
            await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `MLX profile created: ${body.name || mlxId}`).run();
          }
        }
        return json(data, res.status);
      }

      if (path.match(/^\/api\/ml\/profiles\/[\w-]+\/(start|stop)$/) && method === 'POST') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const parts = path.split('/');
        const action = parts.pop();
        const profileId = parts.pop();
        const res = await fetch(`https://api.multilogin.com/profile/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
          body: JSON.stringify({ profile_id: profileId }),
        });
        const data = await res.json();
        // Update D1 ops_profiles record with status and timestamp
        if (res.ok) {
          const newStatus = action === 'start' ? 'running' : 'stopped';
          const tsCol = action === 'start' ? 'last_started_at' : 'last_stopped_at';
          await db.prepare(`UPDATE ops_profiles SET mlx_status = ?, ${tsCol} = datetime('now') WHERE ml_profile_id = ?`)
            .bind(newStatus, profileId).run();
          await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `MLX profile ${action}: ${profileId}`).run();
        }
        return json(data, res.status);
      }

      if (path.match(/^\/api\/ml\/profiles\/[\w-]+\/clone$/) && method === 'POST') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const parts = path.split('/');
        parts.pop(); // clone
        const profileId = parts.pop();
        const res = await fetch('https://api.multilogin.com/profile/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
          body: JSON.stringify({ profile_id: profileId }),
        });
        const data = await res.json();
        return json(data, res.status);
      }

      // ═══ MLX: AUTOMATION TOKEN ═══
      if (path === '/api/mlx/automation-token' && method === 'POST') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const res = await fetch('https://api.multilogin.com/workspace/automation_token?expiration_period=30d', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
        });
        const data = await res.json();
        if (res.ok && data.data?.token) {
          await db.prepare(`
            INSERT INTO settings (key, value, updated_at) VALUES ('mlAutomationToken', ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
          `).bind(data.data.token, data.data.token).run();
          await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), 'MLX automation token generated').run();
        }
        return json(data, res.status);
      }

      // ═══ MLX: FOLDERS ═══
      if (path === '/api/mlx/folders' && method === 'GET') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const res = await fetch('https://api.multilogin.com/folder', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
        });
        const data = await res.json();
        return json(data, res.status);
      }

      // ═══ MLX: UPDATE PROFILE ═══
      if (path === '/api/mlx/profiles/update' && method === 'PATCH') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const body = await request.json();
        const res = await fetch('https://api.multilogin.com/profile/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        // Also update D1 ops_profiles record if profile_id is provided
        if (res.ok && body.profile_id) {
          const sets = [];
          const vals = [];
          if (body.name) { sets.push('name = ?'); vals.push(body.name); }
          if (body.parameters?.proxy) {
            const p = body.parameters.proxy;
            if (p.host) { sets.push('proxy_host = ?'); vals.push(p.host); }
            if (p.port) { sets.push('proxy_port = ?'); vals.push(p.port); }
            if (p.username) { sets.push('proxy_user = ?'); vals.push(p.username); }
            if (p.password) { sets.push('proxy_pass = ?'); vals.push(p.password); }
            if (p.type) { sets.push('proxy_type = ?'); vals.push(p.type); }
          }
          if (body.parameters?.fingerprint?.os) { sets.push('fingerprint_os = ?'); vals.push(body.parameters.fingerprint.os); }
          if (sets.length > 0) {
            vals.push(body.profile_id);
            await db.prepare(`UPDATE ops_profiles SET ${sets.join(', ')} WHERE ml_profile_id = ?`).bind(...vals).run();
          }
          await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `MLX profile updated: ${body.profile_id}`).run();
        }
        return json(data, res.status);
      }

      // ═══ MLX: DELETE PROFILE ═══
      if (path === '/api/mlx/profiles/delete' && method === 'DELETE') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        const body = await request.json();
        const res = await fetch('https://api.multilogin.com/profile/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        // Also delete matching D1 records where ml_profile_id is in the provided ids
        if (res.ok && body.ids?.length) {
          const placeholders = body.ids.map(() => '?').join(', ');
          await db.prepare(`DELETE FROM ops_profiles WHERE ml_profile_id IN (${placeholders})`).bind(...body.ids).run();
          await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `MLX profiles deleted: ${body.ids.length} profiles`).run();
        }
        return json(data, res.status);
      }

      // ═══ MLX: ACTIVE PROFILES ═══
      if (path === '/api/mlx/profiles/active' && method === 'GET') {
        const { results } = await db.prepare("SELECT * FROM ops_profiles WHERE mlx_status = 'running' ORDER BY last_started_at DESC").all();
        return json(results.map(snakeToCamel));
      }

      // ═══ MLX: SYNC PROFILES ═══
      if (path === '/api/mlx/profiles/sync' && method === 'POST') {
        const ml = await getMlSettings(db);
        if (!ml.mlToken) return json({ error: 'Multilogin token not configured' }, 400);
        if (!ml.mlFolderId) return json({ error: 'Multilogin folder ID not configured' }, 400);

        // 1. Fetch all MLX profiles from API
        let allMlxProfiles = [];
        let offset = 0;
        const limit = 100;
        while (true) {
          const res = await fetch(`https://api.multilogin.com/profile/list?folder_id=${ml.mlFolderId}&limit=${limit}&offset=${offset}`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ml.mlToken}` },
          });
          const page = await res.json();
          if (!res.ok) return json({ error: 'Failed to fetch MLX profiles', details: page }, res.status);
          const profiles = page.data?.profiles || [];
          allMlxProfiles = allMlxProfiles.concat(profiles);
          if (profiles.length < limit) break;
          offset += limit;
        }

        // 2. Fetch all D1 ops_profiles
        const { results: d1Profiles } = await db.prepare('SELECT * FROM ops_profiles').all();
        const d1ByMlxId = {};
        d1Profiles.forEach(p => { if (p.ml_profile_id) d1ByMlxId[p.ml_profile_id] = p; });

        const mlxIdSet = new Set(allMlxProfiles.map(p => p.uuid));
        let created = 0;
        let updated = 0;
        let deleted = 0;

        // 3. For each MLX profile not in D1, INSERT
        for (const mlxP of allMlxProfiles) {
          if (!d1ByMlxId[mlxP.uuid]) {
            const id = uid();
            const proxy = mlxP.parameters?.proxy || {};
            await db.prepare(
              'INSERT INTO ops_profiles (id, name, ml_profile_id, ml_folder_id, browser_type, os, proxy_host, proxy_port, proxy_user, proxy_pass, proxy_type, fingerprint_os, mlx_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              id, mlxP.name || '', mlxP.uuid, mlxP.folder_id || ml.mlFolderId,
              mlxP.browser_type || '', mlxP.parameters?.fingerprint?.os || '',
              proxy.host || '', proxy.port || '', proxy.username || '', proxy.password || '',
              proxy.type || '', mlxP.parameters?.fingerprint?.os || '',
              'stopped', 'active'
            ).run();
            created++;
          }
        }

        // 4. For each D1 profile whose ml_profile_id no longer exists in MLX, mark deleted
        for (const d1P of d1Profiles) {
          if (d1P.ml_profile_id && !mlxIdSet.has(d1P.ml_profile_id)) {
            await db.prepare("UPDATE ops_profiles SET status = 'deleted' WHERE id = ?").bind(d1P.id).run();
            deleted++;
          }
        }

        await db.prepare('INSERT INTO ops_logs (id, msg) VALUES (?, ?)').bind(uid(), `MLX sync: created=${created}, updated=${updated}, deleted=${deleted}`).run();
        return json({ success: true, created, updated, deleted });
      }

      return json({ error: 'Not found' }, 404);

    } catch (err) {
      console.error(err);
      return json({ error: err.message }, 500);
    }
  },
};

// Convert snake_case DB columns to camelCase for frontend
function snakeToCamel(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = value;
  }
  return result;
}