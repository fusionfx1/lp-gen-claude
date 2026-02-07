import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// LP FACTORY V2 — All-in-One Loan Affiliate LP Builder
// Combines: Wizard + Variant Studio + Ops Center + Netlify Deploy
// Engine: Elastic Credits v4 (Astro, PageSpeed 90+)
// ════════════════════════════════════════════════════════════════

// ─── Storage ───
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem("lpf2-" + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem("lpf2-" + k, JSON.stringify(v)); } catch {} },
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function now() { return new Date().toISOString(); }
function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }

// ─── Constants ───
const LOAN_TYPES = [
  { id: "personal", label: "Personal Loans", icon: "💳" },
  { id: "installment", label: "Installment Loans", icon: "📋" },
  { id: "pet", label: "Pet Care Financing", icon: "🐾" },
  { id: "medical", label: "Medical Financing", icon: "🏥" },
  { id: "auto", label: "Auto Loans", icon: "🚗" },
  { id: "custom", label: "Custom / Other", icon: "⚡" },
];

const COLORS = [
  { id: "ocean", name: "Ocean Trust", p: [217, 91, 35], s: [158, 64, 42], a: [15, 92, 62], bg: [210, 40, 98], fg: [222, 47, 11] },
  { id: "forest", name: "Forest Green", p: [152, 68, 28], s: [45, 93, 47], a: [350, 80, 55], bg: [140, 20, 97], fg: [150, 40, 10] },
  { id: "midnight", name: "Midnight Indigo", p: [235, 70, 42], s: [170, 60, 45], a: [25, 95, 58], bg: [230, 25, 97], fg: [235, 50, 12] },
  { id: "ruby", name: "Ruby Finance", p: [350, 75, 38], s: [200, 70, 45], a: [40, 90, 55], bg: [350, 15, 97], fg: [350, 40, 12] },
  { id: "slate", name: "Slate Modern", p: [215, 25, 35], s: [160, 50, 42], a: [15, 85, 55], bg: [210, 15, 97], fg: [215, 30, 12] },
  { id: "coral", name: "Coral Warm", p: [12, 76, 42], s: [185, 60, 40], a: [265, 65, 55], bg: [20, 30, 97], fg: [15, 40, 12] },
  { id: "teal", name: "Teal Pro", p: [180, 65, 30], s: [280, 55, 55], a: [35, 90, 55], bg: [175, 20, 97], fg: [180, 40, 10] },
  { id: "plum", name: "Plum Finance", p: [270, 55, 40], s: [150, 55, 42], a: [20, 88, 58], bg: [270, 15, 97], fg: [270, 40, 12] },
];

const FONTS = [
  { id: "dm-sans", name: "DM Sans", import: "DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700", family: '"DM Sans"' },
  { id: "plus-jakarta", name: "Plus Jakarta Sans", import: "Plus+Jakarta+Sans:wght@400;600;700", family: '"Plus Jakarta Sans"' },
  { id: "outfit", name: "Outfit", import: "Outfit:wght@400;500;600;700", family: '"Outfit"' },
  { id: "manrope", name: "Manrope", import: "Manrope:wght@400;500;600;700;800", family: '"Manrope"' },
  { id: "sora", name: "Sora", import: "Sora:wght@400;500;600;700", family: '"Sora"' },
  { id: "figtree", name: "Figtree", import: "Figtree:wght@400;500;600;700", family: '"Figtree"' },
  { id: "inter", name: "Inter", import: "Inter:wght@400;500;600;700", family: '"Inter"' },
  { id: "space-grotesk", name: "Space Grotesk", import: "Space+Grotesk:wght@400;500;600;700", family: '"Space Grotesk"' },
];

const LAYOUTS = [
  { id: "hero-left", label: "Hero Left + Form Right", desc: "Classic split" },
  { id: "hero-center", label: "Hero Center + Form Below", desc: "Centered modern" },
  { id: "hero-full", label: "Full Width Hero", desc: "Impact first" },
];

const RADIUS = [
  { id: "sharp", label: "Sharp", v: "0rem" },
  { id: "subtle", label: "Subtle", v: "0.375rem" },
  { id: "rounded", label: "Rounded", v: "0.75rem" },
  { id: "pill", label: "Pill", v: "1.5rem" },
];

const NETWORKS_AFF = ["LeadsGate", "ZeroParallel", "LeadStack", "ClickDealer", "Everflow", "Custom"];
const REGISTRARS = ["Namecheap", "GoDaddy", "Cloudflare", "Porkbun", "Other"];
const STATUSES = ["active", "paused", "suspended", "setup", "expired"];

const COPY_SETS=[
  {id:"smart",brand:"ElasticCredits",h1:"A Smarter Way",h1span:"to Borrow",sub:"Get approved in minutes. Funds as fast as next business day.",cta:"Check My Rate",badge:"4,200+ funded this month"},
  {id:"fast",brand:"QuickFund",h1:"Fast Cash",h1span:"When You Need It",sub:"Simple application. Quick decisions. Direct deposit.",cta:"Get Started Now",badge:"3,800+ approved this week"},
  {id:"simple",brand:"ClearPath Loans",h1:"Simple Loans,",h1span:"Clear Terms",sub:"No hidden fees. No surprises. Straightforward loans.",cta:"See Your Rate",badge:"5,000+ happy borrowers"},
  {id:"trust",brand:"LoanBridge",h1:"Trusted by",h1span:"Thousands",sub:"Join thousands who found better rates with our lender network.",cta:"Find My Rate",badge:"12,000+ loans funded"},
  {id:"easy",brand:"EasyLend",h1:"Borrowing",h1span:"Made Easy",sub:"2-minute application. All credit types welcome.",cta:"Apply Now Free",badge:"2,900+ served nationwide"},
  {id:"flex",brand:"FlexCredit",h1:"Flexible Loans",h1span:"on Your Terms",sub:"Choose your amount. Pick your timeline. Get funded fast.",cta:"Check Eligibility",badge:"6,100+ customers served"},
];
const SECTION_ORDERS=[
  {id:"default",name:"Standard",order:["social","steps","calc","features","faq","cta"]},
  {id:"trust-first",name:"Trust First",order:["social","features","steps","calc","faq","cta"]},
  {id:"calc-early",name:"Calc Early",order:["social","calc","steps","features","faq","cta"]},
  {id:"minimal",name:"Minimal",order:["social","steps","faq","cta"]},
  {id:"faq-early",name:"FAQ Early",order:["social","faq","steps","calc","features","cta"]},
];
const COMPLIANCE_VARIANTS=[
  {id:"standard",name:"Standard",example:"$1,000 loan, 12mo at 15% APR = $90.26/mo.",apr:"APR 5.99%–35.99%."},
  {id:"detailed",name:"Detailed",example:"$2,500, 24mo at 19.9% APR = ~$127.12/mo.",apr:"5.99%–35.99% APR depending on credit."},
  {id:"simple",name:"Simple",example:"$1,500 for 12mo at 12% APR. $133.28/mo.",apr:"APR 5.99%–35.99%."},
];
function similarity(a,b){let s=0;if(a.colorId===b.colorId)s++;if(a.fontId===b.fontId)s++;if(a.layout===b.layout)s++;if(a.copyId===b.copyId)s++;if(a.sections===b.sections)s++;if(a.compliance===b.compliance)s++;return Math.round((s/6)*100);}
function maxSim(v,all){if(all.length<=1)return 0;const o=all.filter(x=>x.id!==v.id);return o.length?Math.max(...o.map(x=>similarity(v,x))):0;}
const pick=a=>a[Math.floor(Math.random()*a.length)];

// ─── Theme ───
const T = {
  bg: "#0b0d14", card: "#12141e", card2: "#181b28", hover: "#1c2030",
  input: "#1a1d2e", border: "#232738", borderFocus: "#6366f1",
  text: "#e2e8f0", muted: "#8892a8", dim: "#5b6478",
  primary: "#6366f1", primaryH: "#818cf8", primaryGlow: "rgba(99,102,241,0.15)",
  accent: "#22d3ee", success: "#10b981", danger: "#ef4444", warning: "#f59e0b",
  grad: "linear-gradient(135deg,#6366f1,#a855f7)",
};

// ════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sites, setSites] = useState(LS.get("sites") || []);
  const [ops, setOps] = useState(LS.get("ops") || { domains: [], accounts: [], profiles: [], payments: [], logs: [] });
  const [settings, setSettings] = useState(LS.get("settings") || {});
  const [stats, setStats] = useState(LS.get("stats") || { builds: 0, spend: 0 });
  const [toast, setToast] = useState(null);
  const [wizData, setWizData] = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [deploys, setDeploys] = useState(LS.get("deploys") || []);

  useEffect(() => { LS.set("sites", sites); }, [sites]);
  useEffect(() => { LS.set("ops", ops); }, [ops]);
  useEffect(() => { LS.set("settings", settings); }, [settings]);
  useEffect(() => { LS.set("stats", stats); }, [stats]);
  useEffect(() => { LS.set("deploys", deploys); }, [deploys]);

  const notify = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const startCreate = () => {
    setWizData({
      brand: "", domain: "", tagline: "", email: "",
      loanType: "personal", amountMin: 100, amountMax: 5000, aprMin: 5.99, aprMax: 35.99,
      colorId: "ocean", fontId: "dm-sans", layout: "hero-left", radius: "rounded",
      h1: "", badge: "", cta: "", sub: "",
      gtmId: "", network: "LeadsGate", redirectUrl: "", conversionId: "", conversionLabel: "",
    });
    setPage("create");
  };

  const addSite = (site) => {
    setSites(p => [site, ...p]);
    setStats(p => ({ builds: p.builds + 1, spend: +(p.spend + (site.cost || 0)).toFixed(3) }));
    notify(`${site.brand} created!`);
    setPage("sites");
  };

  const delSite = (id) => { setSites(p => p.filter(s => s.id !== id)); notify("Deleted", "danger"); };

  const addDeploy = (d) => setDeploys(p => [d, ...p].slice(0, 100));

  const opsAdd = (coll, item) => {
    setOps(p => ({
      ...p, [coll]: [item, ...p[coll]],
      logs: [{ id: uid(), msg: `Added ${coll.slice(0, -1)}: ${item.label || item.domain || item.name || item.id}`, ts: now() }, ...p.logs].slice(0, 200),
    }));
  };
  const opsDel = (coll, id) => {
    const item = ops[coll].find(i => i.id === id);
    setOps(p => ({
      ...p, [coll]: p[coll].filter(i => i.id !== id),
      logs: [{ id: uid(), msg: `Deleted: ${item?.label || item?.domain || id}`, ts: now() }, ...p.logs].slice(0, 200),
    }));
  };
  const opsUpd = (coll, id, u) => {
    setOps(p => ({ ...p, [coll]: p[coll].map(i => i.id === id ? { ...i, ...u } : i) }));
  };

  const ml = sideCollapsed ? 64 : 220;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Sidebar page={page} setPage={setPage} siteCount={sites.length} startCreate={startCreate}
        collapsed={sideCollapsed} toggle={() => setSideCollapsed(p => !p)} />

      <main style={{ flex: 1, marginLeft: ml, minHeight: "100vh", transition: "margin .2s" }}>
        <TopBar stats={stats} settings={settings} />
        <div style={{ padding: "24px 28px" }}>
          {page === "dashboard" && <Dashboard sites={sites} stats={stats} ops={ops} setPage={setPage} startCreate={startCreate} />}
          {page === "sites" && <Sites sites={sites} del={delSite} notify={notify} startCreate={startCreate} settings={settings} addDeploy={addDeploy} />}
          {page === "create" && wizData && <Wizard config={wizData} setConfig={setWizData} addSite={addSite} setPage={setPage} settings={settings} notify={notify} />}
          {page === "variant" && <VariantStudio notify={notify} sites={sites} addSite={addSite} />}
          {page === "ops" && <OpsCenter data={ops} add={opsAdd} del={opsDel} upd={opsUpd} sites={sites} />}
          {page === "deploys" && <DeployHistory deploys={deploys} />}
          {page === "settings" && <Settings settings={settings} setSettings={s => { setSettings(prev => ({ ...prev, ...s })); LS.set("settings", { ...settings, ...s }); notify("Saved!"); }} stats={stats} />}
        </div>
      </main>

      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,select:focus,textarea:focus{outline:none;border-color:${T.borderFocus}!important;box-shadow:0 0 0 3px ${T.primaryGlow}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        ::selection{background:${T.primary};color:#fff}
        button{font-family:inherit}
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "10px 18px",
      background: type === "danger" ? T.danger : T.success,
      color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,.4)", animation: "slideIn .3s ease",
    }}>{msg}</div>
  );
}

// ════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════
function Sidebar({ page, setPage, siteCount, startCreate, collapsed, toggle }) {
  const items = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "sites", icon: "🌐", label: "My Sites", badge: siteCount },
    { id: "create", icon: "➕", label: "Create LP", action: startCreate },
    { id: "variant", icon: "🎨", label: "Variant Studio" },
    { id: "ops", icon: "🏢", label: "Ops Center" },
    { id: "deploys", icon: "🚀", label: "Deploys" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div style={{
      width: collapsed ? 64 : 220, position: "fixed", top: 0, left: 0, bottom: 0,
      background: T.card, borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 100, transition: "width .2s",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "16px 12px" : "16px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={toggle} style={{
          width: 32, height: 32, borderRadius: 8, background: T.grad, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", flexShrink: 0,
        }}>⚡</div>
        {!collapsed && <div>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>LP Factory</div>
          <div style={{ fontSize: 10, color: T.dim }}>v2.0 — All-in-One</div>
        </div>}
      </div>

      <nav style={{ padding: "8px 6px", flex: 1 }}>
        {items.map(it => {
          const active = page === it.id;
          return (
            <button key={it.id} onClick={() => it.action ? it.action() : setPage(it.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "10px 0" : "9px 12px", justifyContent: collapsed ? "center" : "flex-start",
              marginBottom: 2, border: "none", borderRadius: 7,
              background: active ? `${T.primary}18` : "transparent",
              color: active ? T.primaryH : T.muted, cursor: "pointer",
              fontSize: 13, fontWeight: active ? 600 : 500,
              borderLeft: active ? `3px solid ${T.primary}` : "3px solid transparent",
              transition: "all .15s",
            }}>
              <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: "center" }}>{it.icon}</span>
              {!collapsed && <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>{it.label}</span>}
              {!collapsed && it.badge > 0 && <span style={{
                background: T.primary, color: "#fff", fontSize: 10, fontWeight: 700,
                padding: "1px 6px", borderRadius: 8, minWidth: 18, textAlign: "center",
              }}>{it.badge}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.dim }}>
        Elastic Credits Engine • PageSpeed 90+
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════
// TOP BAR
// ════════════════════════════════════════════
function TopBar({ stats, settings }) {
  return (
    <div style={{
      height: 48, borderBottom: `1px solid ${T.border}`, display: "flex",
      alignItems: "center", justifyContent: "space-between", padding: "0 28px",
      background: "rgba(11,13,20,.85)", backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ fontSize: 12, color: T.muted }}>
        Builds: <b style={{ color: T.text }}>{stats.builds}</b>
        <span style={{ margin: "0 10px", color: T.border }}>│</span>
        Cost: <b style={{ color: T.accent }}>${stats.spend.toFixed(2)}</b>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {settings.netlifyToken && <span style={{ fontSize: 11, color: T.success, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.success }} />Netlify
        </span>}
        <span style={{ fontSize: 11, color: settings.apiKey ? T.success : T.danger, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: settings.apiKey ? T.success : T.danger }} />
          {settings.apiKey ? "API OK" : "No API"}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════
function Card({ children, style, ...p }) {
  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }} {...p}>{children}</div>;
}
function Inp({ value, onChange, style, ...p }) {
  return <input value={value} onChange={e => onChange(e.target.value)} style={{
    width: "100%", padding: "9px 12px", background: T.input, border: `1px solid ${T.border}`,
    borderRadius: 7, color: T.text, fontSize: 13, boxSizing: "border-box", ...style,
  }} {...p} />;
}
function Sel({ value, onChange, options, style }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{
    width: "100%", padding: "9px 12px", background: T.input, border: `1px solid ${T.border}`,
    borderRadius: 7, color: T.text, fontSize: 13, cursor: "pointer", ...style,
  }}>{options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}</select>;
}
function Btn({ children, variant = "primary", onClick, disabled, style }) {
  const base = { border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, padding: "9px 18px", transition: "all .15s", opacity: disabled ? .5 : 1 };
  const vars = {
    primary: { background: T.grad, color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,.25)" },
    ghost: { background: "transparent", border: `1px solid ${T.border}`, color: T.text },
    danger: { background: `${T.danger}22`, color: T.danger, border: `1px solid ${T.danger}44` },
    success: { background: T.success, color: "#fff" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...vars[variant], ...style }}>{children}</button>;
}
function Field({ label, req, help, children }) {
  return <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: T.text }}>
      {label} {req && <span style={{ color: T.danger }}>*</span>}
    </label>
    {children}
    {help && <div style={{ fontSize: 10, color: T.dim, marginTop: 3 }}>{help}</div>}
  </div>;
}
function Badge({ color, children }) {
  return <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 600, background: `${color}18`, color }}>{children}</span>;
}

// ════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════
function Dashboard({ sites, stats, ops, setPage, startCreate }) {
  const recent = sites.slice(0, 5);
  const risks = useMemo(() => {
    const r = [];
    const payMap = {};
    ops.accounts.forEach(a => { if (a.paymentId) { if (!payMap[a.paymentId]) payMap[a.paymentId] = []; payMap[a.paymentId].push(a); } });
    Object.entries(payMap).forEach(([pid, accs]) => {
      if (accs.length > 1) { const p = ops.payments.find(x => x.id === pid); r.push({ level: "critical", msg: `Payment "${p?.label || pid}" shared by ${accs.length} accounts` }); }
    });
    return r;
  }, [ops]);

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>LP portfolio overview — Elastic Credits Engine</p>
        </div>
        <Btn onClick={startCreate}>➕ Create New LP</Btn>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { l: "Total Sites", v: sites.length, c: T.primary, icon: "🌐" },
          { l: "Active", v: sites.filter(s => s.status === "completed").length, c: T.success, icon: "✅" },
          { l: "Builds", v: stats.builds, c: T.accent, icon: "🔨" },
          { l: "API Spend", v: `$${stats.spend.toFixed(2)}`, c: T.warning, icon: "💰" },
          { l: "Ops Domains", v: ops.domains.length, c: "#a78bfa", icon: "🏢" },
        ].map((m, i) => (
          <Card key={i} style={{ padding: "16px", position: "relative" }}>
            <div style={{ fontSize: 11, color: T.muted }}>{m.l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: m.c, marginTop: 2 }}>{m.v}</div>
            <div style={{ position: "absolute", right: 14, top: 14, fontSize: 18, opacity: .5 }}>{m.icon}</div>
          </Card>
        ))}
      </div>

      {/* Risk Alert */}
      {risks.length > 0 && (
        <Card style={{ padding: "14px 18px", marginBottom: 16, borderColor: `${T.danger}44` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.danger, marginBottom: 6 }}>⚠ Correlation Risks Detected</div>
          {risks.slice(0, 3).map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: T.muted, padding: "3px 0" }}>
              <Badge color={T.danger}>{r.level}</Badge> <span style={{ marginLeft: 6 }}>{r.msg}</span>
            </div>
          ))}
          <button onClick={() => setPage("ops")} style={{ fontSize: 11, color: T.primary, background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>View Ops Center →</button>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Quick Actions */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>⚡ Quick Actions</h3>
          {[
            { l: "Create New LP", d: "Build with 6-step wizard", fn: startCreate },
            { l: "Variant Studio", d: "Preview & randomize themes", fn: () => setPage("variant") },
            { l: "Ops Center", d: "Manage domains & accounts", fn: () => setPage("ops") },
            { l: "Settings", d: "API keys & Netlify token", fn: () => setPage("settings") },
          ].map((a, i) => (
            <button key={i} onClick={a.fn} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", marginBottom: 4, background: "transparent",
              border: `1px solid ${T.border}`, borderRadius: 7, cursor: "pointer", color: T.text, textAlign: "left",
            }} onMouseEnter={e => e.currentTarget.style.background = T.hover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>{a.l}</div><div style={{ fontSize: 11, color: T.dim }}>{a.d}</div></div>
              <span style={{ color: T.dim }}>→</span>
            </button>
          ))}
        </Card>

        {/* Recent */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🕐 Recent Sites</h3>
          {recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: T.dim }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🚀</div>
              <div style={{ fontSize: 13 }}>No sites yet</div>
            </div>
          ) : recent.map(s => {
            const c = COLORS.find(x => x.id === s.colorId);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: c ? hsl(...c.p) : T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{s.brand?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.brand}</div>
                  <div style={{ fontSize: 10, color: T.dim }}>{s.domain || "no domain"}</div>
                </div>
                <Badge color={T.success}>completed</Badge>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// SITES PAGE
// ════════════════════════════════════════════
function Sites({ sites, del, notify, startCreate, settings, addDeploy }) {
  const [search, setSearch] = useState("");
  const [deploying, setDeploying] = useState(null);
  const [deployUrls, setDeployUrls] = useState(LS.get("deployUrls") || {});
  const [preview, setPreview] = useState(null);
  const filtered = sites.filter(s => (s.brand + s.domain).toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { LS.set("deployUrls", deployUrls); }, [deployUrls]);

  const exportJson = (site) => {
    const json = makeThemeJson(site);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `theme-${site.id}.json`; a.click(); URL.revokeObjectURL(a.href);
    notify(`Downloaded theme-${site.id}.json`);
  };

  const deployNetlify = async (site) => {
    if (!settings.netlifyToken) return notify("Set Netlify token in Settings first", "danger");
    setDeploying(site.id);
    try {
      const slug = (site.domain || site.brand).toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40) + "-" + site.id.slice(0, 4);
      const createRes = await fetch("https://api.netlify.com/api/v1/sites", {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.netlifyToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: slug }),
      });
      let siteData;
      if (!createRes.ok) {
        const existing = await fetch(`https://api.netlify.com/api/v1/sites?name=${slug}&per_page=1`, { headers: { Authorization: `Bearer ${settings.netlifyToken}` } });
        const exData = await existing.json();
        if (exData.length > 0) siteData = exData[0]; else throw new Error("Create failed");
      } else { siteData = await createRes.json(); }
      const html = generateLP(site);
      const blob = await htmlToZip(html);
      const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteData.id}/deploys`, {
        method: "POST", headers: { Authorization: `Bearer ${settings.netlifyToken}`, "Content-Type": "application/zip" }, body: blob,
      });
      if (!deployRes.ok) throw new Error("Deploy failed");
      const url = siteData.ssl_url || siteData.url || `https://${siteData.name || slug}.netlify.app`;
      setDeployUrls(p => ({ ...p, [site.id]: url }));
      if (addDeploy) addDeploy({ id: uid(), siteId: site.id, brand: site.brand, url, ts: now(), type: deployUrls[site.id] ? "redeploy" : "new" });
      notify(`Deployed! ${url}`);
    } catch (e) { notify(`Error: ${e.message}`, "danger"); }
    setDeploying(null);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Sites</h1>
          <p style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>Manage & deploy your loan landing pages</p>
        </div>
        <Btn onClick={startCreate}>➕ Create LP</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { l: "Sites", v: sites.length }, { l: "Builds", v: sites.length },
          { l: "Deployed", v: Object.keys(deployUrl).length }, { l: "Avg Cost", v: sites.length ? `$${(sites.reduce((a, s) => a + (s.cost || 0), 0) / sites.length).toFixed(3)}` : "$0" },
        ].map((m, i) => <Card key={i} style={{ padding: "12px 14px" }}><div style={{ fontSize: 10, color: T.muted }}>{m.l}</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 1 }}>{m.v}</div></Card>)}
      </div>

      <Inp value={search} onChange={setSearch} placeholder="Search sites..." style={{ width: 240, marginBottom: 14 }} />

      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 50 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏗️</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No sites yet</div>
          <div style={{ color: T.dim, fontSize: 12, marginTop: 4 }}>Create your first loan LP</div>
        </Card>
      ) : filtered.map(site => {
        const c = COLORS.find(x => x.id === site.colorId);
        return (
          <Card key={site.id} style={{ padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: c ? hsl(...c.p) : T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", fontWeight: 800, flexShrink: 0 }}>{site.brand?.[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{site.brand}</span>
                <Badge color={T.success}>completed</Badge>
                {deployUrls[site.id] && <Badge color={T.accent}>deployed</Badge>}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {site.domain || "no domain"} • {LOAN_TYPES.find(l => l.id === site.loanType)?.label} • GTM: {site.gtmId || "—"}
              </div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                {new Date(site.createdAt).toLocaleDateString()} • ${(site.cost || 0).toFixed(3)}
                {deployUrls[site.id] && <> • <a href={deployUrls[site.id]} target="_blank" rel="noreferrer" style={{ color: T.accent }}>{deployUrls[site.id]}</a></>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <Btn variant="ghost" onClick={() => setPreview(site)} style={{ padding: "6px 10px", fontSize: 11 }}>👁️</Btn>
              <Btn variant="ghost" onClick={() => exportJson(site)} style={{ padding: "6px 10px", fontSize: 11 }}>📦 JSON</Btn>
              <Btn variant="ghost" onClick={() => deployNetlify(site)} disabled={deploying === site.id}
                style={{ padding: "6px 10px", fontSize: 11, borderColor: T.accent + "44", color: T.accent }}>
                {deploying === site.id ? "⏳" : "🚀"} Deploy
              </Btn>
              <Btn variant="danger" onClick={() => del(site.id)} style={{ padding: "6px 10px", fontSize: 11 }}>🗑️</Btn>
            </div>
          </Card>
        );
      })}

      {preview && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setPreview(null)}>
          <div style={{width:"90%",maxWidth:1100,height:"85vh",background:T.card,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:600}}>Preview: {preview.brand}</span>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="ghost" onClick={()=>deployNetlify(preview)} disabled={deploying===preview.id} style={{padding:"5px 12px",fontSize:11}}>🚀 Deploy</Btn>
                <button onClick={()=>setPreview(null)} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:5,color:T.muted,cursor:"pointer",padding:"3px 8px"}}>✕</button>
              </div>
            </div>
            <iframe srcDoc={generateLP(preview)} style={{flex:1,border:"none",width:"100%",background:"#fff"}} title="Preview"/>
          </div>
        </div>
      )}
    </div>
  );
}
function generateLP(site) {
  const c = COLORS.find(x => x.id === site.colorId) || COLORS[0];
  const f = FONTS.find(x => x.id === site.fontId) || FONTS[0];
  const r = RADIUS.find(x => x.id === site.radius) || RADIUS[2];
  const brand = site.brand || "LoanBridge";
  const h1 = site.h1 || `Fast ${LOAN_TYPES.find(l => l.id === site.loanType)?.label || "Loans"} Up To $${(site.amountMax || 5000).toLocaleString()}`;
  const badge = site.badge || "Trusted by 15,000+ borrowers";
  const cta = site.cta || "Check Your Rate →";
  const sub = site.sub || "Get approved in minutes. Funds as fast as next business day.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${brand} – ${LOAN_TYPES.find(l=>l.id===site.loanType)?.label||"Personal Loans"} | Fast Approval</title>
<meta name="description" content="${sub}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${f.import}&display=swap" rel="stylesheet">
${site.gtmId ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${site.gtmId}');</script>` : ""}
<style>
:root{--p:${c.p.join(",")};--s:${c.s.join(",")};--a:${c.a.join(",")};--bg:${c.bg.join(",")};--fg:${c.fg.join(",")};--radius:${r.v}}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${f.family},system-ui,sans-serif;background:hsl(var(--bg));color:hsl(var(--fg));-webkit-font-smoothing:antialiased}
.container{max-width:1120px;margin:0 auto;padding:0 20px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 32px;border-radius:var(--radius);font-weight:700;font-size:16px;border:none;cursor:pointer;transition:all .2s;text-decoration:none}
.btn-cta{background:linear-gradient(135deg,hsl(var(--a)),hsl(var(--a)/.85));color:#fff;box-shadow:0 4px 16px hsl(var(--a)/.3)}
.btn-cta:hover{transform:translateY(-1px);box-shadow:0 6px 24px hsl(var(--a)/.4)}
.card{background:#fff;border:1px solid hsl(var(--fg)/.08);border-radius:var(--radius);padding:24px;transition:all .3s}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.06)}
header{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-bottom:1px solid hsl(var(--fg)/.06)}
header .inner{display:flex;align-items:center;justify-content:space-between;height:64px}
.hero{padding:100px 0 60px;background:linear-gradient(135deg,hsl(var(--p)),hsl(var(--p)/.7));color:#fff;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;width:500px;height:500px;border-radius:50%;filter:blur(64px);background:rgba(255,255,255,.05);top:0;right:0;transform:translate(25%,-50%)}
.hero .grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
@media(max-width:768px){.hero .grid{grid-template-columns:1fr;text-align:center}}
.badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);font-size:14px;color:rgba(255,255,255,.9);margin-bottom:20px}
.badge .dot{width:8px;height:8px;border-radius:50%;background:hsl(var(--s));animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
h1{font-size:clamp(32px,5vw,56px);font-weight:800;line-height:1.1;margin-bottom:20px}
h1 .accent{color:hsl(var(--a))}
.hero p{font-size:18px;color:rgba(255,255,255,.7);max-width:480px;margin-bottom:28px}
.form-card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius);padding:28px;backdrop-filter:blur(8px)}
.form-card h3{font-size:18px;font-weight:700;margin-bottom:4px}
.form-card .sub{font-size:13px;color:rgba(255,255,255,.6);margin-bottom:20px}
.slider-wrap{margin-bottom:20px}
.slider-label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px}
.slider-amount{font-size:28px;font-weight:800;color:hsl(var(--a))}
input[type=range]{width:100%;height:6px;-webkit-appearance:none;background:rgba(255,255,255,.15);border-radius:3px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:hsl(var(--a));cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.checks{display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap}
.checks span{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,.7)}
.check-icon{width:18px;height:18px;border-radius:50%;background:hsl(var(--s));display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px}
section{padding:64px 0}
.section-title{text-align:center;margin-bottom:40px}
.section-title .tag{display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:hsl(var(--p)/.08);color:hsl(var(--p));margin-bottom:12px}
.section-title h2{font-size:clamp(24px,3.5vw,36px);font-weight:800}
.section-title p{color:hsl(var(--fg)/.6);max-width:520px;margin:8px auto 0;font-size:15px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto}
@media(max-width:768px){.steps{grid-template-columns:1fr}}
.step{text-align:center}
.step .icon{width:56px;height:56px;margin:0 auto 12px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;background:hsl(var(--p)/.08)}
.step .num{width:28px;height:28px;margin:-14px auto 8px;border-radius:50%;background:hsl(var(--p));color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px hsl(var(--p)/.3)}
.step h3{font-size:16px;font-weight:700;margin-bottom:6px}
.step p{font-size:13px;color:hsl(var(--fg)/.55)}
.benefits{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:900px;margin:0 auto}
@media(max-width:768px){.benefits{grid-template-columns:1fr}}
.benefit .emoji{font-size:28px;margin-bottom:8px}
.benefit h3{font-size:15px;font-weight:700;margin-bottom:4px}
.benefit p{font-size:13px;color:hsl(var(--fg)/.55)}
.cta-section{background:linear-gradient(135deg,hsl(var(--p)),hsl(var(--p)/.8));color:#fff;text-align:center;padding:60px 20px;border-radius:var(--radius);margin:0 20px}
.cta-section h2{font-size:clamp(24px,4vw,40px);font-weight:800;margin-bottom:12px}
.cta-section p{color:rgba(255,255,255,.7);margin-bottom:24px;font-size:16px}
footer{background:hsl(var(--fg)/.03);border-top:1px solid hsl(var(--fg)/.06);padding:48px 0 24px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;margin-bottom:32px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr;gap:20px}}
footer h4{font-size:13px;font-weight:700;margin-bottom:12px}
footer a{color:hsl(var(--fg)/.55);text-decoration:none;font-size:13px;display:block;padding:3px 0}
footer a:hover{color:hsl(var(--p))}
.compliance{border-top:1px solid hsl(var(--fg)/.06);padding-top:24px;font-size:11px;color:hsl(var(--fg)/.4);line-height:1.7}
.compliance strong{color:hsl(var(--fg)/.55)}
</style>
</head>
<body>
${site.gtmId ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${site.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : ""}

<header><div class="container"><div class="inner">
  <div style="display:flex;align-items:center;gap:8px">
    <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,hsl(var(--p)),hsl(var(--a)));display:flex;align-items:center;justify-content:center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    </div>
    <span style="font-size:16px;font-weight:700">${brand}</span>
  </div>
  <a href="#apply" class="btn btn-cta" style="padding:10px 20px;font-size:14px">${cta}</a>
</div></div></header>

<section class="hero" id="apply"><div class="container"><div class="grid">
  <div>
    <div class="badge"><span class="dot"></span> ${badge}</div>
    <h1>${h1.replace(/(\$[\d,]+)/g, '<span class="accent">$1</span>')}</h1>
    <p>${sub}</p>
    <div class="checks">
      <span><span class="check-icon">✓</span> All Credit Welcome</span>
      <span><span class="check-icon">✓</span> 2-Min Application</span>
      <span><span class="check-icon">✓</span> No Hidden Fees</span>
    </div>
  </div>
  <div class="form-card">
    <h3>How much do you need?</h3>
    <div class="sub">Check your rate in 2 minutes — won't affect credit score</div>
    <div class="slider-wrap">
      <div class="slider-label"><span>Amount</span></div>
      <div class="slider-amount">$${Math.round((site.amountMin + site.amountMax) / 2).toLocaleString()}</div>
      <input type="range" min="${site.amountMin}" max="${site.amountMax}" value="${Math.round((site.amountMin + site.amountMax) / 2)}"
        oninput="this.previousElementSibling.textContent='$'+Number(this.value).toLocaleString();if(window.dataLayer)dataLayer.push({event:'slider_interact'})">
    </div>
    <a href="${site.redirectUrl || '#'}" class="btn btn-cta" style="width:100%;font-size:17px"
      onclick="if(window.dataLayer){dataLayer.push({event:'cta_click'});dataLayer.push({event:'generate_lead_start'})}">${cta}</a>
    <div style="text-align:center;margin-top:12px;font-size:11px;color:rgba(255,255,255,.4)">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style="vertical-align:middle;margin-right:3px"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
      256-bit SSL Encryption • Won't affect credit score
    </div>
  </div>
</div></div></section>

<section style="background:#fff;border-bottom:1px solid hsl(var(--fg)/.06)"><div class="container" style="padding:16px 20px">
  <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;align-items:center">
    <span style="font-size:13px;color:hsl(var(--fg)/.5)"><b style="color:hsl(var(--fg))">15,000+</b> loans funded</span>
    <span style="font-size:13px;color:hsl(var(--fg)/.5)">⭐⭐⭐⭐⭐ <b style="color:hsl(var(--fg))">4.8/5</b></span>
    <span style="font-size:13px;color:hsl(var(--fg)/.5)">🔒 <b style="color:hsl(var(--fg))">256-bit</b> encryption</span>
  </div>
</div></section>

<section id="how-it-works" style="background:hsl(var(--bg))"><div class="container">
  <div class="section-title">
    <div class="tag">How It Works</div>
    <h2>Get Funded in 3 Simple Steps</h2>
    <p>No paperwork. No waiting. Everything happens online.</p>
  </div>
  <div class="steps">
    <div class="step card"><div class="icon">📋</div><div class="num">1</div><h3>Apply Online</h3><p>Fill out our simple 2-minute form. No impact on your credit score.</p></div>
    <div class="step card"><div class="icon">⚡</div><div class="num">2</div><h3>Get Matched</h3><p>Our network of lenders competes to offer you the best rate.</p></div>
    <div class="step card"><div class="icon">💰</div><div class="num">3</div><h3>Get Funded</h3><p>Accept your offer and receive funds as fast as next business day.</p></div>
  </div>
</div></section>

<section style="background:#fff"><div class="container">
  <div class="section-title">
    <div class="tag">Why ${brand}</div>
    <h2>Built for Real People</h2>
    <p>We make borrowing simple, transparent, and stress-free.</p>
  </div>
  <div class="benefits">
    ${[
      ["⚡", "Fast Approval", "Get a decision in minutes, not days. Our streamlined process respects your time."],
      ["🔒", "Bank-Level Security", "Your data is protected with 256-bit encryption. We never sell your information."],
      ["💎", "Transparent Terms", "No hidden fees, no surprises. See your exact rate before you commit."],
      ["🎯", "All Credit Welcome", `Whether your credit is excellent or needs work, ${brand} has options for you.`],
    ].map(([e, t, d]) => `<div class="card benefit"><div class="emoji">${e}</div><h3>${t}</h3><p>${d}</p></div>`).join("")}
  </div>
</div></section>

<section><div class="container">
  <div class="cta-section">
    <h2>Ready to Get Started?</h2>
    <p>Join thousands who've found a smarter way to borrow.</p>
    <a href="#apply" class="btn btn-cta" style="font-size:18px;padding:16px 40px">${cta}</a>
  </div>
</div></section>

<footer><div class="container">
  <div class="footer-grid">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <div style="width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,hsl(var(--p)),hsl(var(--a)));display:flex;align-items:center;justify-content:center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <span style="font-weight:700">${brand}</span>
      </div>
      <p style="font-size:13px;color:hsl(var(--fg)/.5);line-height:1.6">Connecting you with trusted lenders for ${LOAN_TYPES.find(l=>l.id===site.loanType)?.label?.toLowerCase()||"personal loans"} up to $${(site.amountMax||5000).toLocaleString()}.</p>
    </div>
    <div><h4>Company</h4><a href="#how-it-works">How It Works</a><a href="#apply">Apply Now</a></div>
    <div><h4>Legal</h4><a href="/privacy">Privacy Policy</a><a href="/terms">Terms</a><a href="/disclosures">Disclosures</a></div>
    <div><h4>Support</h4><a href="mailto:${site.email || "support@" + (site.domain || "example.com")}">${site.email || "Contact Us"}</a></div>
  </div>
  <div class="compliance">
    <p><strong>Representative Example:</strong> A $1,000 loan repaid over 12 monthly installments at ${site.aprMin||5.99}% APR would result in 12 payments of $90.26. Total payable: $1,083.12.</p>
    <p><strong>APR Disclosure:</strong> Annual Percentage Rate (APR) ranges from ${site.aprMin||5.99}% to ${site.aprMax||35.99}%. APR depends on credit score, loan amount, and term.</p>
    <p>${brand} is NOT a lender and does not make loan or credit decisions. ${brand} connects interested persons with a lender from its network of approved lenders.</p>
    <p style="margin-top:16px">© ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
  </div>
</div></footer>

<script>
document.addEventListener('DOMContentLoaded',function(){
  if(window.dataLayer){
    dataLayer.push({event:'page_view'});
    var st=0;window.addEventListener('scroll',function(){
      var p=Math.round(window.scrollY/(document.body.scrollHeight-window.innerHeight)*100);
      if(p>=25&&st<25){dataLayer.push({event:'scroll_25'});st=25}
      if(p>=50&&st<50){dataLayer.push({event:'scroll_50'});st=50}
      if(p>=75&&st<75){dataLayer.push({event:'scroll_75'});st=75}
    });
    setTimeout(function(){dataLayer.push({event:'time_on_page_30s'})},30000);
    setTimeout(function(){dataLayer.push({event:'time_on_page_60s'})},60000);
  }
});
</script>
</body></html>`;
}

// Minimal ZIP creator (single HTML file)
async function htmlToZip(html) {
  // Use JSZip-like manual approach for a single file
  // For simplicity, we create a minimal valid ZIP with one entry
  const encoder = new TextEncoder();
  const data = encoder.encode(html);
  const name = encoder.encode("index.html");

  const crc32 = (buf) => {
    let c = 0xFFFFFFFF;
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let x = n; for (let k = 0; k < 8; k++) x = x & 1 ? 0xEDB88320 ^ (x >>> 1) : x >>> 1; t[n] = x; }
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  const crc = crc32(data);
  const now = new Date();
  const time = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

  const localHeader = new Uint8Array(30 + name.length);
  const dv = new DataView(localHeader.buffer);
  dv.setUint32(0, 0x04034b50, true); // sig
  dv.setUint16(4, 20, true); // version
  dv.setUint16(8, 0, true); // compression (store)
  dv.setUint16(10, time, true);
  dv.setUint16(12, date, true);
  dv.setUint32(14, crc, true);
  dv.setUint32(18, data.length, true); // compressed
  dv.setUint32(22, data.length, true); // uncompressed
  dv.setUint16(26, name.length, true);
  localHeader.set(name, 30);

  const centralOffset = localHeader.length + data.length;
  const centralDir = new Uint8Array(46 + name.length);
  const cdv = new DataView(centralDir.buffer);
  cdv.setUint32(0, 0x02014b50, true); // sig
  cdv.setUint16(4, 20, true); // made by
  cdv.setUint16(6, 20, true); // version needed
  cdv.setUint16(12, time, true);
  cdv.setUint16(14, date, true);
  cdv.setUint32(16, crc, true);
  cdv.setUint32(20, data.length, true);
  cdv.setUint32(24, data.length, true);
  cdv.setUint16(28, name.length, true);
  cdv.setUint32(42, 0, true); // local header offset
  centralDir.set(name, 46);

  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, 1, true); // entries this disk
  ev.setUint16(10, 1, true); // total entries
  ev.setUint32(12, centralDir.length, true);
  ev.setUint32(16, centralOffset, true);

  const zip = new Uint8Array(localHeader.length + data.length + centralDir.length + endRecord.length);
  let off = 0;
  zip.set(localHeader, off); off += localHeader.length;
  zip.set(data, off); off += data.length;
  zip.set(centralDir, off); off += centralDir.length;
  zip.set(endRecord, off);

  return new Blob([zip], { type: "application/zip" });
}

// ════════════════════════════════════════════
// BUILD THEME JSON (for build-variant.mjs)
// ════════════════════════════════════════════
function makeThemeJson(site) {
  const c = COLORS.find(x => x.id === site.colorId) || COLORS[0];
  const f = FONTS.find(x => x.id === site.fontId) || FONTS[0];
  const r = RADIUS.find(x => x.id === site.radius) || RADIUS[2];
  return {
    variantId: site.id, domain: site.domain, gtmId: site.gtmId || "",
    colors: {
      primary: `${c.p[0]} ${c.p[1]}% ${c.p[2]}%`, secondary: `${c.s[0]} ${c.s[1]}% ${c.s[2]}%`,
      accent: `${c.a[0]} ${c.a[1]}% ${c.a[2]}%`, background: `${c.bg[0]} ${c.bg[1]}% ${c.bg[2]}%`,
      foreground: `${c.fg[0]} ${c.fg[1]}% ${c.fg[2]}%`,
      card: "0 0% 100%", "card-foreground": `${c.fg[0]} ${c.fg[1]}% ${c.fg[2]}%`,
      muted: `${c.bg[0]} ${c.bg[1]}% ${Math.max(c.bg[2] - 2, 90)}%`,
      "muted-foreground": "215 16% 47%", border: "214 32% 91%",
      input: "214 32% 91%", ring: `${c.p[0]} ${c.p[1]}% ${c.p[2]}%`,
      "primary-foreground": "0 0% 100%", "secondary-foreground": "0 0% 100%",
      "accent-foreground": "0 0% 100%",
    },
    radius: r.v,
    font: { id: f.id, family: f.family, googleImport: f.import },
    layout: { hero: site.layout === "hero-left" ? "form-right" : site.layout === "hero-center" ? "form-below" : "form-overlap" },
    copy: {
      brand: site.brand, tagline: site.tagline || "", h1: site.h1 || "",
      h1span: "", badge: site.badge || "", cta: site.cta || "",
      sub: site.sub || "", complianceEmail: site.email || "",
    },
    loanProduct: { type: site.loanType, amountMin: site.amountMin, amountMax: site.amountMax, aprMin: site.aprMin, aprMax: site.aprMax },
    tracking: { gtmId: site.gtmId, network: site.network, redirectUrl: site.redirectUrl, conversionId: site.conversionId, conversionLabel: site.conversionLabel },
  };
}

// ════════════════════════════════════════════
// WIZARD (6 Steps)
// ════════════════════════════════════════════
function Wizard({ config, setConfig, addSite, setPage, settings, notify }) {
  const [step, setStep] = useState(1);
  const [building, setBuilding] = useState(false);
  const upd = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const steps = ["Brand Info", "Loan Product", "Design", "Copy & CTA", "Tracking", "Review & Build"];

  const handleBuild = async () => {
    setBuilding(true);
    if (settings.apiKey && (!config.h1 || !config.badge || !config.cta)) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 500,
            messages: [{ role: "user", content: `Generate loan LP copy. Brand:"${config.brand}" Type:"${config.loanType}" Range:$${config.amountMin}-$${config.amountMax}. JSON only:{"h1":"","badge":"","cta":"","sub":"","tagline":""}` }]
          })
        });
        const d = await res.json();
        const t = d.content?.[0]?.text?.replace(/```json|```/g, "").trim();
        if (t) {
          const p = JSON.parse(t);
          if (!config.h1 && p.h1) upd("h1", p.h1);
          if (!config.badge && p.badge) upd("badge", p.badge);
          if (!config.cta && p.cta) upd("cta", p.cta);
          if (!config.sub && p.sub) upd("sub", p.sub);
        }
      } catch (e) { console.log("AI skip:", e); }
    }
    await new Promise(r => setTimeout(r, 1000));
    addSite({ ...config, id: uid(), status: "completed", createdAt: now(), cost: settings.apiKey ? 0.003 : 0 });
    setBuilding(false);
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", animation: "fadeIn .3s ease" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Create New LP</h1>
      <p style={{ color: T.muted, fontSize: 12, marginBottom: 20 }}>Build a PPC-optimized loan landing page</p>

      <Card style={{ padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
          <b>Step {step}/6</b><span style={{ color: T.muted }}>{steps[step - 1]}</span>
        </div>
        <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${step / 6 * 100}%`, background: T.grad, borderRadius: 2, transition: "width .3s" }} />
        </div>
      </Card>

      <Card style={{ padding: 28, marginBottom: 16 }}>
        {step === 1 && <StepBrand c={config} u={upd} />}
        {step === 2 && <StepProduct c={config} u={upd} />}
        {step === 3 && <StepDesign c={config} u={upd} />}
        {step === 4 && <StepCopy c={config} u={upd} />}
        {step === 5 && <StepTracking c={config} u={upd} />}
        {step === 6 && <StepReview c={config} building={building} />}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="ghost" onClick={() => step === 1 ? setPage("dashboard") : setStep(s => s - 1)}>
          ← {step === 1 ? "Cancel" : "Back"}
        </Btn>
        {step < 6 ? (
          <Btn onClick={() => setStep(s => s + 1)} disabled={step === 1 && !config.brand.trim()}>Next →</Btn>
        ) : (
          <Btn onClick={handleBuild} disabled={building} style={{ padding: "10px 24px" }}>
            {building ? "⏳ Building..." : "🚀 Build & Save"}
          </Btn>
        )}
      </div>
    </div>
  );
}

function StepBrand({ c, u }) {
  return <>
    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 24 }}>🏢</div><h2 style={{ fontSize: 17, fontWeight: 700 }}>Brand Information</h2></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Brand Name" req help="e.g. LoanBridge"><Inp value={c.brand} onChange={v => u("brand", v)} placeholder="LoanBridge" /></Field>
      <Field label="Domain" help="e.g. loanbridge.com"><Inp value={c.domain} onChange={v => u("domain", v)} placeholder="loanbridge.com" /></Field>
    </div>
    <Field label="Tagline"><Inp value={c.tagline} onChange={v => u("tagline", v)} placeholder="Fast. Simple. Trusted." /></Field>
    <Field label="Compliance Email"><Inp value={c.email} onChange={v => u("email", v)} placeholder="support@loanbridge.com" /></Field>
  </>;
}

function StepProduct({ c, u }) {
  return <>
    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 24 }}>💳</div><h2 style={{ fontSize: 17, fontWeight: 700 }}>Loan Product</h2></div>
    <Field label="Loan Type" req>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {LOAN_TYPES.map(lt => (
          <button key={lt.id} onClick={() => u("loanType", lt.id)} style={{
            padding: "12px 8px", background: c.loanType === lt.id ? T.primaryGlow : T.input,
            border: `2px solid ${c.loanType === lt.id ? T.primary : T.border}`,
            borderRadius: 8, cursor: "pointer", color: T.text, textAlign: "center",
          }}><div style={{ fontSize: 18 }}>{lt.icon}</div><div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{lt.label}</div></button>
        ))}
      </div>
    </Field>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Min ($)"><Inp type="number" value={c.amountMin} onChange={v => u("amountMin", +v)} /></Field>
      <Field label="Max ($)"><Inp type="number" value={c.amountMax} onChange={v => u("amountMax", +v)} /></Field>
      <Field label="APR Min (%)"><Inp type="number" step=".01" value={c.aprMin} onChange={v => u("aprMin", +v)} /></Field>
      <Field label="APR Max (%)"><Inp type="number" step=".01" value={c.aprMax} onChange={v => u("aprMax", +v)} /></Field>
    </div>
  </>;
}

function StepDesign({ c, u }) {
  return <>
    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 24 }}>🎨</div><h2 style={{ fontSize: 17, fontWeight: 700 }}>Design</h2></div>
    <Field label="Color Scheme" req>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {COLORS.map(cp => (
          <button key={cp.id} onClick={() => u("colorId", cp.id)} style={{
            padding: "10px", background: c.colorId === cp.id ? T.primaryGlow : T.input,
            border: `2px solid ${c.colorId === cp.id ? T.primary : T.border}`, borderRadius: 8, cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 4 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: hsl(...cp.p) }} />
              <div style={{ width: 16, height: 16, borderRadius: 4, background: hsl(...cp.s) }} />
              <div style={{ width: 16, height: 16, borderRadius: 4, background: hsl(...cp.a) }} />
            </div>
            <div style={{ fontSize: 10, color: T.text, fontWeight: 600 }}>{cp.name}</div>
          </button>
        ))}
      </div>
    </Field>
    <Field label="Font">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {FONTS.map(f => (
          <button key={f.id} onClick={() => u("fontId", f.id)} style={{
            padding: "8px", background: c.fontId === f.id ? T.primaryGlow : T.input,
            border: `2px solid ${c.fontId === f.id ? T.primary : T.border}`,
            borderRadius: 6, cursor: "pointer", color: T.text, fontSize: 11, fontWeight: 600,
          }}>{f.name}</button>
        ))}
      </div>
    </Field>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Layout">
        {LAYOUTS.map(l => (
          <button key={l.id} onClick={() => u("layout", l.id)} style={{
            width: "100%", padding: "8px 10px", marginBottom: 4, background: c.layout === l.id ? T.primaryGlow : T.input,
            border: `2px solid ${c.layout === l.id ? T.primary : T.border}`, borderRadius: 6, cursor: "pointer", textAlign: "left",
          }}><div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{l.label}</div><div style={{ fontSize: 10, color: T.dim }}>{l.desc}</div></button>
        ))}
      </Field>
      <Field label="Radius">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RADIUS.map(r => (
            <button key={r.id} onClick={() => u("radius", r.id)} style={{
              flex: 1, padding: "8px", background: c.radius === r.id ? T.primaryGlow : T.input,
              border: `2px solid ${c.radius === r.id ? T.primary : T.border}`,
              borderRadius: 6, cursor: "pointer", color: T.text, fontSize: 11, fontWeight: 600, minWidth: 60,
            }}>{r.label}</button>
          ))}
        </div>
      </Field>
    </div>
  </>;
}

function StepCopy({ c, u }) {
  return <>
    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 24 }}>✍️</div><h2 style={{ fontSize: 17, fontWeight: 700 }}>Copy & CTA</h2></div>
    <div style={{ background: `${T.primary}11`, border: `1px solid ${T.primary}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: T.primaryH }}>
      💡 Leave empty = Claude AI generates on build (needs API key)
    </div>
    <Field label="H1 Headline"><Inp value={c.h1} onChange={v => u("h1", v)} placeholder="Fast Personal Loans Up To $5,000" /></Field>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Badge Text"><Inp value={c.badge} onChange={v => u("badge", v)} placeholder="No Credit Check Required" /></Field>
      <Field label="CTA Button"><Inp value={c.cta} onChange={v => u("cta", v)} placeholder="Check Your Rate →" /></Field>
    </div>
    <Field label="Sub-headline"><Inp value={c.sub} onChange={v => u("sub", v)} placeholder="Get approved in minutes. Funds fast." /></Field>
  </>;
}

function StepTracking({ c, u }) {
  return <>
    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 24 }}>📊</div><h2 style={{ fontSize: 17, fontWeight: 700 }}>Tracking & Ads</h2></div>
    <Field label="GTM Container ID"><Inp value={c.gtmId} onChange={v => u("gtmId", v)} placeholder="GTM-XXXXXXX" /></Field>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Conversion ID"><Inp value={c.conversionId} onChange={v => u("conversionId", v)} placeholder="AW-123456789" /></Field>
      <Field label="Conversion Label"><Inp value={c.conversionLabel} onChange={v => u("conversionLabel", v)} placeholder="AbCdEfGhIjK" /></Field>
    </div>
    <Field label="Affiliate Network">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {NETWORKS_AFF.map(n => (
          <button key={n} onClick={() => u("network", n)} style={{
            padding: "7px 14px", background: c.network === n ? T.primaryGlow : T.input,
            border: `2px solid ${c.network === n ? T.primary : T.border}`,
            borderRadius: 6, cursor: "pointer", color: T.text, fontSize: 11, fontWeight: 600,
          }}>{n}</button>
        ))}
      </div>
    </Field>
    <Field label="Redirect URL"><Inp value={c.redirectUrl} onChange={v => u("redirectUrl", v)} placeholder="https://offers.leadsgate.com/..." /></Field>
    <div style={{ background: `${T.warning}11`, border: `1px solid ${T.warning}33`, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: T.warning }}>
      ⚠️ Micro-conversions (scroll_25/50/75, time_30s/60s, slider_interact, cta_click) pre-built in template
    </div>
  </>;
}

function StepReview({ c, building }) {
  const co = COLORS.find(x => x.id === c.colorId) || COLORS[0];
  const rows = [
    ["Brand", c.brand], ["Domain", c.domain || "—"], ["Type", LOAN_TYPES.find(l => l.id === c.loanType)?.label],
    ["Range", `$${c.amountMin}–$${c.amountMax}`], ["APR", `${c.aprMin}%–${c.aprMax}%`],
    ["Colors", co.name], ["Font", FONTS.find(f => f.id === c.fontId)?.name], ["GTM", c.gtmId || "—"],
    ["Network", c.network], ["Conversion", c.conversionId || "—"],
  ];
  return <>
    <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 24 }}>🔍</div><h2 style={{ fontSize: 17, fontWeight: 700 }}>Review & Build</h2></div>
    <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13, borderBottom: `1px solid ${T.border}` }}>Configuration</div>
      {rows.map(([l, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none", fontSize: 12 }}>
          <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
      {["p", "s", "a"].map(k => <div key={k} style={{ width: 40, height: 40, borderRadius: 8, background: hsl(...co[k]), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>{k.toUpperCase()}</div>)}
    </div>
    {building && <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: T.primaryH, animation: "pulse 1s infinite" }}>⚡ Generating...</div>}
  </>;
}

// ════════════════════════════════════════════
// VARIANT STUDIO
// ════════════════════════════════════════════
function VariantStudio({ notify, sites, addSite }) {
  const [tab, setTab] = useState("editor");
  const [cfg, setCfg] = useState({ colorId: "ocean", fontId: "dm-sans", layout: "hero-left", radius: "rounded", copyId: "smart", sections: "default", compliance: "standard" });
  const [registry, setRegistry] = useState(LS.get("variantReg") || []);
  const [batchCount, setBatchCount] = useState(5);
  const [batchResults, setBatchResults] = useState([]);

  useEffect(() => { LS.set("variantReg", registry); }, [registry]);
  const set = (k, v) => setCfg(p => ({ ...p, [k]: v }));
  const c = COLORS.find(x => x.id === cfg.colorId) || COLORS[0];
  const f = FONTS.find(x => x.id === cfg.fontId) || FONTS[0];
  const cp = COPY_SETS.find(x => x.id === cfg.copyId) || COPY_SETS[0];
  const so = SECTION_ORDERS.find(x => x.id === cfg.sections) || SECTION_ORDERS[0];
  const comp = COMPLIANCE_VARIANTS.find(x => x.id === cfg.compliance) || COMPLIANCE_VARIANTS[0];

  const randomize = () => setCfg({ colorId: pick(COLORS).id, fontId: pick(FONTS).id, layout: pick(LAYOUTS).id, radius: pick(RADIUS_OPTS).id, copyId: pick(COPY_SETS).id, sections: pick(SECTION_ORDERS).id, compliance: pick(COMPLIANCE_VARIANTS).id });

  const saveToReg = (v) => {
    const item = { ...v, id: v.id || uid(), createdAt: now() };
    if (!registry.find(r => r.id === item.id)) { setRegistry(p => [item, ...p]); notify(`Saved: ${COPY_SETS.find(x => x.id === v.copyId)?.brand || "variant"}`); }
  };

  const batchGenerate = () => {
    const results = []; const used = new Set(); let att = 0;
    while (results.length < batchCount && att < 300) { att++;
      const v = { id: uid(), colorId: pick(COLORS).id, fontId: pick(FONTS).id, layout: pick(LAYOUTS).id, radius: pick(RADIUS_OPTS).id, copyId: pick(COPY_SETS).id, sections: pick(SECTION_ORDERS).id, compliance: pick(COMPLIANCE_VARIANTS).id };
      const key = `${v.colorId}-${v.fontId}-${v.copyId}-${v.layout}`;
      if (!used.has(key)) { used.add(key); const all = [...registry, ...results]; const mx = all.length > 0 ? Math.max(...all.map(r => similarity(v, r))) : 0; if (mx < 70) results.push(v); }
    }
    setBatchResults(results); notify(`Generated ${results.length} unique variants`);
  };

  const createFromVar = (v) => {
    const cps = COPY_SETS.find(x => x.id === v.copyId) || COPY_SETS[0];
    addSite({ id: uid(), brand: cps.brand, domain: "", h1: `${cps.h1} ${cps.h1span}`, badge: cps.badge, cta: cps.cta, sub: cps.sub, colorId: v.colorId, fontId: v.fontId, layout: v.layout, radius: v.radius, loanType: "personal", amountMin: 100, amountMax: 5000, aprMin: 5.99, aprMax: 35.99, gtmId: "", network: "LeadsGate", redirectUrl: "", conversionId: "", conversionLabel: "", copyId: v.copyId, sections: v.sections, compliance: v.compliance, status: "completed", createdAt: now(), cost: 0 });
  };

  const exportVar = (v) => {
    const cps = COPY_SETS.find(x => x.id === v.copyId) || COPY_SETS[0];
    const json = makeThemeJson({ brand: cps.brand, domain: "", h1: `${cps.h1} ${cps.h1span}`, badge: cps.badge, cta: cps.cta, sub: cps.sub, ...v, id: v.id, loanType: "personal", amountMin: 100, amountMax: 5000, aprMin: 5.99, aprMax: 35.99, gtmId: "", network: "LeadsGate", redirectUrl: "", conversionId: "", conversionLabel: "" });
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `theme-${v.id}.json`; a.click();
  };

  const VarCard = ({ v, showActions = true }) => {
    const vc = COLORS.find(x => x.id === v.colorId); const vcp = COPY_SETS.find(x => x.id === v.copyId); const sim = maxSim(v, [...registry, ...batchResults]);
    return (
      <Card style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>{[vc?.p, vc?.s, vc?.a].map((col, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: col ? hsl(...col) : T.primary }} />)}</div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{vcp?.brand}</div>
        <div style={{ fontSize: 9, color: T.dim }}>"{vcp?.h1} {vcp?.h1span}"</div>
        <div style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>{FONTS.find(x => x.id === v.fontId)?.name} • {v.layout} • {v.sections}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2 }}><div style={{ height: "100%", width: `${sim}%`, background: sim > 60 ? T.danger : sim > 40 ? T.warning : T.success, borderRadius: 2 }} /></div>
          <span style={{ fontSize: 9, fontWeight: 700, color: sim > 60 ? T.danger : sim > 40 ? T.warning : T.success }}>{sim}%</span>
        </div>
        {showActions && <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => saveToReg(v)} style={{ flex: 1, padding: "4px 8px", fontSize: 10 }}>💾</Btn>
          <Btn variant="ghost" onClick={() => exportVar(v)} style={{ flex: 1, padding: "4px 8px", fontSize: 10 }}>📦</Btn>
          <Btn variant="ghost" onClick={() => createFromVar(v)} style={{ flex: 1, padding: "4px 8px", fontSize: 10, color: T.accent, borderColor: T.accent + "44" }}>➕</Btn>
        </div>}
      </Card>
    );
  };

  const tabs = [{ id: "editor", label: "🎨 Editor" }, { id: "batch", label: "🔄 Batch" }, { id: "registry", label: `📋 Registry (${registry.length})` }];

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🎨 Variant Studio</h1><p style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>Anti-fingerprinting theme management</p></div>
        <div style={{ display: "flex", gap: 6 }}><Btn variant="ghost" onClick={randomize}>🎲 Randomize</Btn><Btn onClick={() => saveToReg(cfg)}>💾 Save</Btn></div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 16px", background: tab === t.id ? `${T.primary}18` : "transparent", border: `1px solid ${tab === t.id ? T.primary : T.border}`, borderRadius: 7, color: tab === t.id ? T.text : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>)}</div>

      {/* EDITOR */}
      {tab === "editor" && <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Color</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 5 }}>{COLORS.map(cp => <button key={cp.id} onClick={() => set("colorId", cp.id)} style={{ padding: "7px", background: cfg.colorId === cp.id ? T.primaryGlow : T.input, border: `2px solid ${cfg.colorId === cp.id ? T.primary : T.border}`, borderRadius: 6, cursor: "pointer" }}><div style={{ display: "flex", gap: 2, marginBottom: 2 }}>{[cp.p, cp.s, cp.a].map((col, i) => <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: hsl(...col) }} />)}</div><div style={{ fontSize: 9, color: T.text, fontWeight: 600 }}>{cp.name}</div></button>)}</div></Card>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Copy Set</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 4 }}>{COPY_SETS.map(cs => <button key={cs.id} onClick={() => set("copyId", cs.id)} style={{ padding: "6px 8px", background: cfg.copyId === cs.id ? T.primaryGlow : T.input, border: `1px solid ${cfg.copyId === cs.id ? T.primary : T.border}`, borderRadius: 5, cursor: "pointer", textAlign: "left" }}><div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{cs.brand}</div><div style={{ fontSize: 8, color: T.dim }}>"{cs.h1} {cs.h1span}"</div></button>)}</div></Card>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Font</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 4 }}>{FONTS.map(fo => <button key={fo.id} onClick={() => set("fontId", fo.id)} style={{ padding: "5px 8px", background: cfg.fontId === fo.id ? T.primaryGlow : "transparent", border: `1px solid ${cfg.fontId === fo.id ? T.primary : "transparent"}`, borderRadius: 5, cursor: "pointer", color: T.text, fontSize: 11, textAlign: "left" }}>{fo.name}</button>)}</div></Card>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Sections</div>{SECTION_ORDERS.map(s => <button key={s.id} onClick={() => set("sections", s.id)} style={{ display: "block", width: "100%", padding: "5px 8px", marginBottom: 3, background: cfg.sections === s.id ? T.primaryGlow : "transparent", border: `1px solid ${cfg.sections === s.id ? T.primary : "transparent"}`, borderRadius: 5, cursor: "pointer", textAlign: "left" }}><div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{s.name}</div><div style={{ fontSize: 8, color: T.dim, fontFamily: "monospace" }}>{s.order.join(" → ")}</div></button>)}</Card>
          <Card style={{ padding: 14 }}><div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Compliance</div>{COMPLIANCE_VARIANTS.map(cv => <button key={cv.id} onClick={() => set("compliance", cv.id)} style={{ display: "block", width: "100%", padding: "5px 8px", marginBottom: 3, background: cfg.compliance === cv.id ? T.primaryGlow : "transparent", border: `1px solid ${cfg.compliance === cv.id ? T.primary : "transparent"}`, borderRadius: 5, cursor: "pointer", textAlign: "left" }}><div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{cv.name}</div><div style={{ fontSize: 8, color: T.dim }}>{cv.example.slice(0, 50)}...</div></button>)}</Card>
          <div style={{ display: "flex", gap: 4 }}>{RADIUS_OPTS.map(r => <button key={r.id} onClick={() => set("radius", r.id)} style={{ flex: 1, padding: "6px", fontSize: 10, fontWeight: 600, cursor: "pointer", color: T.text, background: cfg.radius === r.id ? T.primaryGlow : T.input, border: `1px solid ${cfg.radius === r.id ? T.primary : T.border}`, borderRadius: 5 }}>{r.label}</button>)}</div>
          {LAYOUTS.map(l => <button key={l.id} onClick={() => set("layout", l.id)} style={{ display: "block", width: "100%", padding: "5px 8px", marginTop: 3, background: cfg.layout === l.id ? T.primaryGlow : "transparent", border: `1px solid ${cfg.layout === l.id ? T.primary : "transparent"}`, borderRadius: 5, cursor: "pointer", textAlign: "left", color: T.text, fontSize: 11 }}><b>{l.label}</b> <span style={{ color: T.dim }}>— {l.desc}</span></button>)}
        </div>
        {/* Preview */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${f.import}&display=swap`} />
          <div style={{ fontFamily: `${f.family},system-ui,sans-serif` }}>
            <div style={{ padding: "8px 14px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg,${hsl(...c.p)},${hsl(...c.a)})` }} /><span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{cp.brand}</span></div>
              <div style={{ padding: "5px 12px", borderRadius: RADIUS_OPTS.find(x => x.id === cfg.radius)?.v, background: `linear-gradient(135deg,${hsl(...c.a)},${hsl(c.a[0], c.a[1], c.a[2] - 10)})`, color: "#fff", fontSize: 10, fontWeight: 700 }}>{cp.cta}</div>
            </div>
            <div style={{ padding: "28px 18px", background: `linear-gradient(135deg,${hsl(...c.p)},${hsl(c.p[0], c.p[1], c.p[2] - 8)})`, color: "#fff" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", fontSize: 9, marginBottom: 8 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: hsl(...c.s) }} />{cp.badge}</div>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15, marginBottom: 6 }}>{cp.h1}<br /><span style={{ color: hsl(...c.a) }}>{cp.h1span}</span></div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginBottom: 14 }}>{cp.sub}</div>
              <div style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: RADIUS_OPTS.find(x => x.id === cfg.radius)?.v, padding: "12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>How much do you need?</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: hsl(...c.a), marginBottom: 4 }}>$2,500</div>
                <div style={{ height: 4, background: "rgba(255,255,255,.15)", borderRadius: 3, marginBottom: 10 }}><div style={{ width: "50%", height: "100%", background: hsl(...c.a), borderRadius: 3 }} /></div>
                <div style={{ padding: "8px", borderRadius: RADIUS_OPTS.find(x => x.id === cfg.radius)?.v, background: `linear-gradient(135deg,${hsl(...c.a)},${hsl(c.a[0], c.a[1], c.a[2] - 10)})`, textAlign: "center", fontWeight: 700, fontSize: 12 }}>{cp.cta}</div>
              </div>
            </div>
            <div style={{ padding: "12px 14px", background: hsl(...c.bg) }}>
              <div style={{ textAlign: "center", marginBottom: 8 }}><span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: hsl(...c.p), background: `${hsl(...c.p)}11`, padding: "2px 8px", borderRadius: 99 }}>Sections</span></div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>{so.order.map((s, i) => <span key={i} style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: "#fff", border: "1px solid #eee", color: hsl(...c.fg) }}>{s}</span>)}</div>
            </div>
            <div style={{ padding: "6px 14px", background: "#f9f9f9", fontSize: 8, color: "#999", borderTop: "1px solid #eee" }}><b>Compliance ({comp.name}):</b> {comp.example.slice(0, 55)}...</div>
            <div style={{ padding: "6px 14px", background: "#fafafa", borderTop: "1px solid #eee", fontSize: 8, color: "#bbb", textAlign: "center" }}>© 2026 {cp.brand} • Privacy • Terms</div>
          </div>
        </Card>
      </div>}

      {/* BATCH */}
      {tab === "batch" && <div>
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Generate</span>
            <input type="number" min={1} max={20} value={batchCount} onChange={e => setBatchCount(Math.min(20, Math.max(1, +e.target.value || 1)))} style={{ width: 55, padding: "6px 10px", background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 13, textAlign: "center" }} />
            <span style={{ fontSize: 12, color: T.muted }}>unique variants</span>
            <Btn onClick={batchGenerate}>⚡ Generate</Btn>
            {batchResults.length > 0 && <Btn variant="success" onClick={() => { batchResults.forEach(v => saveToReg(v)); setBatchResults([]); }}>💾 Save All ({batchResults.length})</Btn>}
          </div>
          <div style={{ fontSize: 10, color: T.dim, marginTop: 6 }}>Auto-ensures &lt;70% similarity. Uses 6 copy sets × 8 colors × 8 fonts × 5 sections × 3 compliance = 5,760 combinations</div>
        </Card>
        {batchResults.length > 0 ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>{batchResults.map(v => <VarCard key={v.id} v={v} />)}</div>
        : <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 32, marginBottom: 8 }}>🎲</div><div style={{ fontSize: 14, fontWeight: 600 }}>Click Generate for unique variants</div><div style={{ color: T.dim, fontSize: 12, marginTop: 4 }}>Each auto-checks similarity against registry</div></Card>}
      </div>}

      {/* REGISTRY */}
      {tab === "registry" && <div>
        {registry.length === 0 ? <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📋</div><div style={{ fontSize: 14, fontWeight: 600 }}>Registry empty</div><div style={{ color: T.dim, fontSize: 12, marginTop: 4 }}>Save from Editor or Batch</div></Card>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
          {registry.map(v => {
            const vc = COLORS.find(x => x.id === v.colorId); const vcp = COPY_SETS.find(x => x.id === v.copyId); const sim = maxSim(v, registry);
            return (
              <Card key={v.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 3 }}>{[vc?.p, vc?.s, vc?.a].map((col, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: col ? hsl(...col) : T.primary }} />)}</div>
                  <Badge color={sim > 60 ? T.danger : sim > 40 ? T.warning : T.success}>{sim}% sim</Badge>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{vcp?.brand || "?"}</div>
                <div style={{ fontSize: 10, color: T.dim }}>"{vcp?.h1} {vcp?.h1span}"</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>{FONTS.find(x => x.id === v.fontId)?.name} • {v.layout} • {v.sections}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  <Btn variant="ghost" onClick={() => exportVar(v)} style={{ flex: 1, padding: "4px 8px", fontSize: 10 }}>📦 JSON</Btn>
                  <Btn variant="ghost" onClick={() => createFromVar(v)} style={{ flex: 1, padding: "4px 8px", fontSize: 10, color: T.accent, borderColor: T.accent + "44" }}>➕ Site</Btn>
                  <Btn variant="danger" onClick={() => { setRegistry(p => p.filter(r => r.id !== v.id)); notify("Removed", "danger"); }} style={{ padding: "4px 8px", fontSize: 10 }}>✕</Btn>
                </div>
              </Card>
            );
          })}
        </div>}
      </div>}
    </div>
  );
}
function OpsCenter({ data, add, del, upd, sites }) {
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);

  const risks = useMemo(() => {
    const r = [];
    const payMap = {};
    data.accounts.forEach(a => { if (a.paymentId) { (payMap[a.paymentId] = payMap[a.paymentId] || []).push(a); } });
    Object.entries(payMap).forEach(([pid, accs]) => {
      if (accs.length > 1) { const p = data.payments.find(x => x.id === pid); r.push({ level: "critical", msg: `Payment "${p?.label || pid}" shared by ${accs.length} accounts` }); }
    });
    const proxyMap = {};
    data.profiles.forEach(p => { if (p.proxyIp) { const rng = p.proxyIp.split(".").slice(0, 3).join("."); (proxyMap[rng] = proxyMap[rng] || []).push(p); } });
    Object.entries(proxyMap).forEach(([rng, profs]) => { if (profs.length > 1) r.push({ level: "high", msg: `Proxy ${rng}.* shared by ${profs.length} profiles` }); });
    const regMap = {};
    data.domains.forEach(d => { if (d.registrar) { (regMap[d.registrar] = regMap[d.registrar] || []).push(d); } });
    Object.entries(regMap).forEach(([reg, doms]) => { if (doms.length > 2) r.push({ level: "medium", msg: `${doms.length} domains on ${reg}` }); });
    return r;
  }, [data]);

  const tabs = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "domains", icon: "🌐", label: "Domains", count: data.domains.length },
    { id: "accounts", icon: "💰", label: "Ads Accounts", count: data.accounts.length },
    { id: "profiles", icon: "👤", label: "Profiles", count: data.profiles.length },
    { id: "payments", icon: "💳", label: "Payments", count: data.payments.length },
    { id: "risks", icon: "⚠️", label: "Risks", count: risks.length },
    { id: "logs", icon: "📝", label: "Log" },
  ];

  const AddModal = ({ title, fields, coll }) => {
    const [form, setForm] = useState({});
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
        onClick={() => setModal(null)}>
        <Card style={{ maxWidth: 420, width: "90%" }} onClick={e => e.stopPropagation()}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{title}</h3>
          {fields.map(f => (
            <Field key={f.key} label={f.label}>
              {f.options ? <Sel value={form[f.key] || ""} onChange={v => setForm(p => ({ ...p, [f.key]: v }))} options={["", ...f.options]} />
                : <Inp value={form[f.key] || ""} onChange={v => setForm(p => ({ ...p, [f.key]: v }))} placeholder={f.ph || ""} />}
            </Field>
          ))}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={() => { add(coll, { id: uid(), ...form, status: "active", createdAt: now() }); setModal(null); }}>Add</Btn>
          </div>
        </Card>
      </div>
    );
  };

  const ListTable = ({ items, coll, cols }) => (
    <div style={{ marginTop: 12 }}>
      {items.length === 0 ? <div style={{ textAlign: "center", padding: 32, color: T.dim }}>No items yet</div>
        : items.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.card2, borderRadius: 7, marginBottom: 4, fontSize: 12 }}>
            {cols.map((col, ci) => (
              <div key={ci} style={{ flex: col.flex || 1, color: ci === 0 ? T.text : T.muted, fontWeight: ci === 0 ? 600 : 400, fontSize: ci === 0 ? 12 : 11 }}>
                {col.render ? col.render(item) : item[col.key] || "—"}
              </div>
            ))}
            <button onClick={() => del(coll, item.id)} style={{ background: `${T.danger}22`, border: "none", borderRadius: 5, padding: "4px 8px", color: T.danger, cursor: "pointer", fontSize: 10 }}>✕</button>
          </div>
        ))}
    </div>
  );

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>🏢 Ops Center</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "6px 14px", background: tab === t.id ? `${T.primary}18` : "transparent",
            border: `1px solid ${tab === t.id ? T.primary : T.border}`, borderRadius: 6,
            color: tab === t.id ? T.text : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
            {t.count !== undefined && <span style={{ fontSize: 10, background: T.card2, padding: "1px 5px", borderRadius: 4 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { l: "Domains", v: data.domains.length, c: "#60a5fa" },
            { l: "Ads Accounts", v: data.accounts.length, c: T.success },
            { l: "Profiles", v: data.profiles.length, c: "#a78bfa" },
            { l: "Payments", v: data.payments.length, c: T.warning },
            { l: "Risks", v: risks.length, c: risks.length > 0 ? T.danger : T.success },
          ].map((m, i) => <Card key={i} style={{ padding: 14 }}><div style={{ fontSize: 10, color: T.muted }}>{m.l}</div><div style={{ fontSize: 22, fontWeight: 800, color: m.c }}>{m.v}</div></Card>)}
        </div>
        {risks.length > 0 && <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.danger, marginBottom: 8 }}>⚠ Active Risks</div>
          {risks.map((r, i) => <div key={i} style={{ padding: "4px 0", fontSize: 12, color: T.muted }}>
            <Badge color={r.level === "critical" ? T.danger : r.level === "high" ? T.warning : "#60a5fa"}>{r.level}</Badge>
            <span style={{ marginLeft: 8 }}>{r.msg}</span>
          </div>)}
        </Card>}
        {data.domains.length > 0 && <Card>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: T.muted }}>DOMAIN → ACCOUNT → PROFILE MAP</div>
          {data.domains.map(d => {
            const acc = data.accounts.find(a => a.id === d.accountId);
            const prof = data.profiles.find(p => p.id === d.profileId);
            return <div key={d.id} style={{ display: "flex", gap: 12, padding: "5px 10px", background: T.card2, borderRadius: 5, marginBottom: 3, fontSize: 11, alignItems: "center" }}>
              <b style={{ flex: 1 }}>{d.domain}</b>
              <span style={{ color: T.success }}>{acc?.label || "—"}</span>
              <span style={{ color: "#a78bfa" }}>{prof?.name || "—"}</span>
              <Badge color={d.status === "active" ? T.success : T.warning}>{d.status}</Badge>
            </div>;
          })}
        </Card>}
      </>}

      {/* Domains */}
      {tab === "domains" && <>
        <Btn onClick={() => setModal("domain")} style={{ marginBottom: 12 }}>+ Add Domain</Btn>
        <ListTable items={data.domains} coll="domains" cols={[
          { key: "domain", flex: 2 }, { key: "registrar" }, { key: "status", render: i => <Badge color={i.status === "active" ? T.success : T.warning}>{i.status}</Badge> },
        ]} />
        {modal === "domain" && <AddModal title="Add Domain" coll="domains" fields={[
          { key: "domain", label: "Domain", ph: "loanbridge.com" },
          { key: "registrar", label: "Registrar", options: REGISTRARS },
          { key: "accountId", label: "Ads Account ID", ph: "Link to account" },
          { key: "profileId", label: "Profile ID", ph: "Link to profile" },
        ]} />}
      </>}

      {/* Accounts */}
      {tab === "accounts" && <>
        <Btn onClick={() => setModal("account")} style={{ marginBottom: 12 }}>+ Add Account</Btn>
        <ListTable items={data.accounts} coll="accounts" cols={[
          { key: "label", flex: 2 }, { key: "email" }, { key: "status", render: i => <Badge color={i.status === "active" ? T.success : T.warning}>{i.status}</Badge> },
        ]} />
        {modal === "account" && <AddModal title="Add Ads Account" coll="accounts" fields={[
          { key: "label", label: "Account Name", ph: "Main Account" },
          { key: "email", label: "Email", ph: "ads@gmail.com" },
          { key: "paymentId", label: "Payment Method ID", ph: "Link to payment" },
          { key: "budget", label: "Daily Budget ($)", ph: "50" },
        ]} />}
      </>}

      {/* Profiles */}
      {tab === "profiles" && <>
        <Btn onClick={() => setModal("profile")} style={{ marginBottom: 12 }}>+ Add Profile</Btn>
        <ListTable items={data.profiles} coll="profiles" cols={[
          { key: "name", flex: 2 }, { key: "proxyIp" }, { key: "browserType" },
        ]} />
        {modal === "profile" && <AddModal title="Add Profile" coll="profiles" fields={[
          { key: "name", label: "Profile Name", ph: "US Profile 1" },
          { key: "proxyIp", label: "Proxy IP", ph: "1.2.3.4" },
          { key: "browserType", label: "Browser", options: ["Mimic", "Stealthfox", "Custom"] },
          { key: "os", label: "OS", options: ["Windows 10", "Windows 11", "macOS"] },
        ]} />}
      </>}

      {/* Payments */}
      {tab === "payments" && <>
        <Btn onClick={() => setModal("payment")} style={{ marginBottom: 12 }}>+ Add Payment</Btn>
        <ListTable items={data.payments} coll="payments" cols={[
          { key: "label", flex: 2 }, { key: "type" }, { key: "last4" },
        ]} />
        {modal === "payment" && <AddModal title="Add Payment Method" coll="payments" fields={[
          { key: "label", label: "Label", ph: "Visa ending 1234" },
          { key: "type", label: "Type", options: ["Visa", "Mastercard", "Amex", "VCC", "Other"] },
          { key: "last4", label: "Last 4 Digits", ph: "1234" },
          { key: "bankName", label: "Bank", ph: "Chase" },
        ]} />}
      </>}

      {/* Risks */}
      {tab === "risks" && (
        risks.length === 0 ? <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 32, marginBottom: 8 }}>✅</div><div style={{ fontSize: 14, fontWeight: 600 }}>No risks detected</div><div style={{ color: T.dim, fontSize: 12, marginTop: 4 }}>All accounts properly isolated</div></Card>
          : risks.map((r, i) => <Card key={i} style={{ padding: "12px 16px", marginBottom: 6, borderColor: r.level === "critical" ? `${T.danger}44` : T.border }}>
            <Badge color={r.level === "critical" ? T.danger : r.level === "high" ? T.warning : "#60a5fa"}>{r.level}</Badge>
            <span style={{ marginLeft: 10, fontSize: 13 }}>{r.msg}</span>
          </Card>)
      )}

      {/* Logs */}
      {tab === "logs" && (
        data.logs.length === 0 ? <Card style={{ textAlign: "center", padding: 40, color: T.dim }}>No activity yet</Card>
          : <Card style={{ padding: 12 }}>
            {data.logs.slice(0, 50).map(log => (
              <div key={log.id} style={{ padding: "5px 8px", borderBottom: `1px solid ${T.border}`, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.muted }}>{log.msg}</span>
                <span style={{ color: T.dim, fontSize: 10 }}>{new Date(log.ts).toLocaleString()}</span>
              </div>
            ))}
          </Card>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════
function Settings({ settings, setSettings, stats }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || "");
  const [netlifyToken, setNetlifyToken] = useState(settings.netlifyToken || "");
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState({});

  const testApi = async () => {
    setTesting("api");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 10, messages: [{ role: "user", content: "OK" }] })
      });
      setTestResult(p => ({ ...p, api: r.ok ? "ok" : "fail" }));
    } catch { setTestResult(p => ({ ...p, api: "fail" })); }
    setTesting(null);
  };

  const testNetlify = async () => {
    setTesting("netlify");
    try {
      const r = await fetch("https://api.netlify.com/api/v1/sites?per_page=1", {
        headers: { Authorization: `Bearer ${netlifyToken}` }
      });
      setTestResult(p => ({ ...p, netlify: r.ok ? "ok" : "fail" }));
    } catch { setTestResult(p => ({ ...p, netlify: "fail" })); }
    setTesting(null);
  };

  return (
    <div style={{ maxWidth: 600, animation: "fadeIn .3s ease" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Settings</h1>
      <p style={{ color: T.muted, fontSize: 12, marginBottom: 24 }}>API keys and deployment configuration</p>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Anthropic API Key</h3>
        <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px" }}>For AI copy generation when building LPs</p>
        <Inp type="password" value={apiKey} onChange={setApiKey} placeholder="sk-ant-api03-..." style={{ marginBottom: 8 }} />
        {settings.apiKey && <div style={{ fontSize: 11, color: T.success, marginBottom: 8 }}>✓ Configured</div>}
        {testResult.api && <div style={{ fontSize: 11, color: testResult.api === "ok" ? T.success : T.danger, marginBottom: 8 }}>{testResult.api === "ok" ? "✓ Valid!" : "✗ Invalid"}</div>}
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="ghost" onClick={testApi} disabled={!apiKey || testing === "api"} style={{ fontSize: 12 }}>{testing === "api" ? "..." : "🔑 Test"}</Btn>
          <Btn onClick={() => setSettings({ apiKey })} style={{ fontSize: 12 }}>💾 Save</Btn>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Netlify Deploy Token</h3>
        <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px" }}>For one-click deploy from My Sites page</p>
        <Inp type="password" value={netlifyToken} onChange={setNetlifyToken} placeholder="nfp_..." style={{ marginBottom: 8 }} />
        {settings.netlifyToken && <div style={{ fontSize: 11, color: T.success, marginBottom: 8 }}>✓ Configured</div>}
        {testResult.netlify && <div style={{ fontSize: 11, color: testResult.netlify === "ok" ? T.success : T.danger, marginBottom: 8 }}>{testResult.netlify === "ok" ? "✓ Valid!" : "✗ Invalid"}</div>}
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="ghost" onClick={testNetlify} disabled={!netlifyToken || testing === "netlify"} style={{ fontSize: 12 }}>{testing === "netlify" ? "..." : "🔑 Test"}</Btn>
          <Btn onClick={() => setSettings({ netlifyToken })} style={{ fontSize: 12 }}>💾 Save</Btn>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Build Stats</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
          <div><div style={{ fontSize: 22, fontWeight: 700 }}>{stats.builds}</div><div style={{ fontSize: 10, color: T.muted }}>Builds</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>${stats.spend.toFixed(3)}</div><div style={{ fontSize: 10, color: T.muted }}>Spend</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 700, color: T.success }}>90+</div><div style={{ fontSize: 10, color: T.muted }}>PageSpeed</div></div>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>📋 Deploy Workflow</h3>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 2, fontFamily: "'JetBrains Mono',monospace" }}>
          <div><b style={{ color: T.accent }}>Option A:</b> One-click Netlify (from My Sites → 🚀 Deploy)</div>
          <div><b style={{ color: T.warning }}>Option B:</b> Astro build (PageSpeed 90+)</div>
          <div style={{ paddingLeft: 16 }}>1. Download JSON from My Sites</div>
          <div style={{ paddingLeft: 16 }}>2. <span style={{ color: T.accent }}>cd ec-fix/</span></div>
          <div style={{ paddingLeft: 16 }}>3. <span style={{ color: T.accent }}>node build-variant.mjs --config theme.json</span></div>
          <div style={{ paddingLeft: 16 }}>4. Upload <span style={{ color: T.accent }}>dist/</span> to hosting</div>
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════
// DEPLOY HISTORY
// ════════════════════════════════════════════
function DeployHistory({ deploys }) {
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>🚀 Deploy History</h1>
      <p style={{ color: T.muted, fontSize: 12, marginBottom: 20 }}>All Netlify deployments</p>
      {deploys.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 50 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No deployments yet</div>
          <div style={{ color: T.dim, fontSize: 12, marginTop: 4 }}>Deploy from My Sites → 🚀 button</div>
        </Card>
      ) : deploys.map(d => (
        <Card key={d.id} style={{ padding: "12px 18px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: d.type === "new" ? `${T.success}22` : `${T.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{d.type === "new" ? "🆕" : "🔄"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.brand}</div>
            <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: T.accent }}>{d.url}</a>
          </div>
          <div style={{ textAlign: "right" }}>
            <Badge color={d.type === "new" ? T.success : T.accent}>{d.type}</Badge>
            <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{new Date(d.ts).toLocaleString()}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
