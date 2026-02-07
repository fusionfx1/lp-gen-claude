import { COLORS, FONTS, RADIUS, LOAN_TYPES } from "../constants";

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function validGtmId(id) {
  return /^GTM-[A-Z0-9]+$/i.test(id);
}

export function generateLP(site) {
  const c = COLORS.find(x => x.id === site.colorId) || COLORS[0];
  const f = FONTS.find(x => x.id === site.fontId) || FONTS[0];
  const r = RADIUS.find(x => x.id === site.radius) || RADIUS[2];
  const brand = esc(site.brand || "LoanBridge");
  const h1 = esc(site.h1 || `Fast ${LOAN_TYPES.find(l => l.id === site.loanType)?.label || "Loans"} Up To $${(site.amountMax || 5000).toLocaleString()}`);
  const badge = esc(site.badge || "Trusted by 15,000+ borrowers");
  const cta = esc(site.cta || "Check Your Rate →");
  const sub = esc(site.sub || "Get approved in minutes. Funds as fast as next business day.");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${brand} – ${LOAN_TYPES.find(l => l.id === site.loanType)?.label || "Personal Loans"} | Fast Approval</title>
<meta name="description" content="${sub}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${f.import}&display=swap" rel="stylesheet">
${site.gtmId && validGtmId(site.gtmId) ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${site.gtmId}');</script>` : ""}
${site.voluumId ? `<script>!function(e,a,t,n,c,o,s){e.V_ID=n,e[n]=e[n]||function(){(e[n].q=e[n].q||[]).push(arguments)},o=a.createElement(t),s=a.getElementsByTagName(t)[0],o.async=1,o.src="https://"+c+"/track.js?id="+n,s.parentNode.insertBefore(o,s)}(window,document,"script","voluum","${site.voluumDomain || 'trk.scratchpethelp.com'}");</script>` : ""}
<style>
:root{--p:${c.p[0]} ${c.p[1]}% ${c.p[2]}%;--s:${c.s[0]} ${c.s[1]}% ${c.s[2]}%;--a:${c.a[0]} ${c.a[1]}% ${c.a[2]}%;--bg:${c.bg[0]} ${c.bg[1]}% ${c.bg[2]}%;--fg:${c.fg[0]} ${c.fg[1]}% ${c.fg[2]}%;--radius:${r.v}}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${f.family},system-ui,sans-serif;background:hsl(var(--bg));color:hsl(var(--fg));-webkit-font-smoothing:antialiased;font-size:16px;line-height:1.5}
.container{width:100%;max-width:1120px;margin:0 auto;padding:0 20px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:var(--radius);font-weight:700;font-size:16px;border:none;cursor:pointer;transition:all .2s;text-decoration:none;min-height:48px}
.btn-cta{background:linear-gradient(135deg,hsl(var(--a)),hsl(var(--a)/.85));color:#fff;box-shadow:0 4px 16px hsl(var(--a)/.3)}
.btn-cta:hover{transform:translateY(-1px);box-shadow:0 6px 24px hsl(var(--a)/.4)}
.card{background:#fff;border:1px solid hsl(var(--fg)/.08);border-radius:var(--radius);padding:20px;transition:all .3s}
header{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-bottom:1px solid hsl(var(--fg)/.06)}
header .inner{display:flex;align-items:center;justify-content:space-between;height:60px}
.hero{padding:80px 0 40px;background:linear-gradient(135deg,hsl(var(--p)),hsl(var(--p)/.7));color:#fff;position:relative;overflow:hidden;text-align:center}
.hero .grid{display:grid;grid-template-columns:1fr;gap:32px;align-items:center}
.badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);font-size:13px;color:rgba(255,255,255,.9);margin-bottom:16px}
.badge .dot{width:8px;height:8px;border-radius:50%;background:hsl(var(--s));animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
h1{font-size:clamp(28px,8vw,52px);font-weight:800;line-height:1.1;margin-bottom:16px}
h1 .accent{color:hsl(var(--a))}
.hero p{font-size:16px;color:rgba(255,255,255,.7);margin:0 auto 24px;max-width:480px}
.form-card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius);padding:24px;backdrop-filter:blur(8px);text-align:left}
.form-card h3{font-size:18px;font-weight:700;margin-bottom:4px}
.form-card .sub-text{font-size:13px;color:rgba(255,255,255,.6);margin-bottom:20px}
.slider-wrap{margin-bottom:20px}
.slider-label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px}
.slider-amount{font-size:26px;font-weight:800;color:hsl(var(--a))}
input[type=range]{width:100%;height:6px;-webkit-appearance:none;background:rgba(255,255,255,.15);border-radius:3px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:hsl(var(--a));cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.checks{display:flex;flex-direction:column;gap:12px;margin-bottom:20px;align-items:center}
.checks span{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,.7)}
.check-icon{width:18px;height:18px;border-radius:50%;background:hsl(var(--s));display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px}
section{padding:48px 0}
.section-title{text-align:center;margin-bottom:32px;padding:0 20px}
.section-title .tag{display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:hsl(var(--p)/.08);color:hsl(var(--p));margin-bottom:12px}
.section-title h2{font-size:26px;font-weight:800}
.section-title p{color:hsl(var(--fg)/.6);margin:8px auto 0;font-size:14px}
.steps, .benefits{display:grid;grid-template-columns:1fr;gap:20px}
.step, .benefit{text-align:center}
.step .icon{width:56px;height:56px;margin:0 auto 12px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;background:hsl(var(--p)/.08)}
.step .num{width:28px;height:28px;margin:-14px auto 8px;border-radius:50%;background:hsl(var(--p));color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}
.benefit .emoji{font-size:32px;margin-bottom:12px}
.cta-section{background:linear-gradient(135deg,hsl(var(--p)),hsl(var(--p)/.8));color:#fff;text-align:center;padding:40px 20px;border-radius:var(--radius);margin:0 20px}
footer{background:hsl(var(--fg)/.03);border-top:1px solid hsl(var(--fg)/.06);padding:40px 0 24px}
.footer-grid{display:grid;grid-template-columns:1fr;gap:32px;margin-bottom:32px}
.compliance{border-top:1px solid hsl(var(--fg)/.06);padding-top:24px;font-size:11px;color:hsl(var(--fg)/.4);line-height:1.7}

/* Desktop Overrides */
@media(min-width:768px){
  .btn{padding:14px 32px}
  header .inner{height:64px}
  .hero{padding:120px 0 80px;text-align:left}
  .hero .grid{grid-template-columns:1fr 1fr;gap:48px}
  .hero p{margin:0 0 28px}
  .checks{flex-direction:row;align-items:center;gap:16px}
  .section-title h2{font-size:36px}
  .steps{grid-template-columns:repeat(3,1fr);max-width:960px;margin:0 auto}
  .benefits{grid-template-columns:repeat(2,1fr);max-width:960px;margin:0 auto}
  .footer-grid{grid-template-columns:2fr 1fr 1fr 1fr}
  .cta-section{padding:60px;margin:0 auto;max-width:1120px}
}
</style>
</head>
<body>
${site.gtmId && validGtmId(site.gtmId) ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${site.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : ""}

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
    <div class="sub-text">Check your rate in 2 minutes — won't affect credit score</div>
    <div class="slider-wrap">
      <div class="slider-label"><span>Amount</span></div>
      <div class="slider-amount">$${Math.round((site.amountMin + site.amountMax) / 2).toLocaleString()}</div>
      <input type="range" min="${site.amountMin}" max="${site.amountMax}" value="${Math.round((site.amountMin + site.amountMax) / 2)}"
        oninput="this.previousElementSibling.textContent='$'+Number(this.value).toLocaleString();if(window.dataLayer)dataLayer.push({event:'slider_interact'})">
    </div>
    <a href="${esc(site.redirectUrl || '#')}" class="btn btn-cta" style="width:100%;font-size:17px"
      onclick="if(window.dataLayer){dataLayer.push({event:'cta_click'});dataLayer.push({event:'generate_lead_start'})};if(window.voluum)voluum('track','click')">${cta}</a>
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
      <p style="font-size:13px;color:hsl(var(--fg)/.5);line-height:1.6">Connecting you with trusted lenders for ${LOAN_TYPES.find(l => l.id === site.loanType)?.label?.toLowerCase() || "personal loans"} up to $${(site.amountMax || 5000).toLocaleString()}.</p>
    </div>
    <div><h4>Company</h4><a href="#how-it-works">How It Works</a><a href="#apply">Apply Now</a></div>
    <div><h4>Legal</h4><a href="/privacy">Privacy Policy</a><a href="/terms">Terms</a><a href="/disclosures">Disclosures</a></div>
    <div><h4>Support</h4><a href="mailto:${esc(site.email || "support@" + (site.domain || "example.com"))}">${esc(site.email || "Contact Us")}</a></div>
  </div>
  <div class="compliance">
    <p><strong>Representative Example:</strong> A $1,000 loan repaid over 12 monthly installments at ${site.aprMin || 5.99}% APR would result in 12 payments of $90.26. Total payable: $1,083.12.</p>
    <p><strong>APR Disclosure:</strong> Annual Percentage Rate (APR) ranges from ${site.aprMin || 5.99}% to ${site.aprMax || 35.99}%. APR depends on credit score, loan amount, and term.</p>
    <p>${brand} is NOT a lender and does not make loan or credit decisions. ${brand} connects interested persons with a lender from its network of approved lenders.</p>
    <p style="margin-top:16px">© ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
  </div>
</div></footer>

<script>
document.addEventListener('DOMContentLoaded',function(){
  if(window.dataLayer){
    // Built-in Variables for GTM
    dataLayer.push({
      'brand_name': '${brand}',
      'loan_type': '${LOAN_TYPES.find(l => l.id === site.loanType)?.label || "Personal"}',
      'amount_min': ${site.amountMin},
      'amount_max': ${site.amountMax}
    });

    dataLayer.push({event:'page_view'});
    
    // Advanced Scroll Tracking (Micro-conversions)
    var st=[25,50,75,90], tracked=[];
    window.addEventListener('scroll',function(){
      var p=Math.round(window.scrollY/(document.body.scrollHeight-window.innerHeight)*100);
      st.forEach(function(s){
        if(p>=s && tracked.indexOf(s)===-1){
          dataLayer.push({event:'scroll_'+s});
          tracked.push(s);
        }
      });
    });

    // Time on Page (Engagement Micro-conversions)
    [15,30,60,120].forEach(function(s){
      setTimeout(function(){ 
        dataLayer.push({event:'time_on_page_'+s+'s'}); 
      }, s * 1000);
    });

    // Interaction Tracking
    document.querySelector('input[type=range]').addEventListener('focus', function(){
      dataLayer.push({event:'form_start'});
    }, {once: true});
  }
});
</script>
</body></html>`;
}

// Minimal ZIP creator (single HTML file)
export async function htmlToZip(html) {
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
  dv.setUint32(0, 0x04034b50, true);
  dv.setUint16(4, 20, true);
  dv.setUint16(8, 0, true);
  dv.setUint16(10, time, true);
  dv.setUint16(12, date, true);
  dv.setUint32(14, crc, true);
  dv.setUint32(18, data.length, true);
  dv.setUint32(22, data.length, true);
  dv.setUint16(26, name.length, true);
  localHeader.set(name, 30);

  const centralOffset = localHeader.length + data.length;
  const centralDir = new Uint8Array(46 + name.length);
  const cdv = new DataView(centralDir.buffer);
  cdv.setUint32(0, 0x02014b50, true);
  cdv.setUint16(4, 20, true);
  cdv.setUint16(6, 20, true);
  cdv.setUint16(12, time, true);
  cdv.setUint16(14, date, true);
  cdv.setUint32(16, crc, true);
  cdv.setUint32(20, data.length, true);
  cdv.setUint32(24, data.length, true);
  cdv.setUint16(28, name.length, true);
  cdv.setUint32(42, 0, true);
  centralDir.set(name, 46);

  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, 1, true);
  ev.setUint16(10, 1, true);
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

export function makeThemeJson(site) {
  const c = COLORS.find(x => x.id === site.colorId) || COLORS[0];
  const f = FONTS.find(x => x.id === site.fontId) || FONTS[0];
  const r = RADIUS.find(x => x.id === site.radius) || RADIUS[2];
  return {
    variantId: site.id, domain: site.domain, gtmId: site.gtmId || "",
    colors: {
      primary: `${c.p[0]} ${c.p[1]}% ${c.p[2]}% `, secondary: `${c.s[0]} ${c.s[1]}% ${c.s[2]}% `,
      accent: `${c.a[0]} ${c.a[1]}% ${c.a[2]}% `, background: `${c.bg[0]} ${c.bg[1]}% ${c.bg[2]}% `,
      foreground: `${c.fg[0]} ${c.fg[1]}% ${c.fg[2]}% `,
      card: "0 0% 100%", "card-foreground": `${c.fg[0]} ${c.fg[1]}% ${c.fg[2]}% `,
      muted: `${c.bg[0]} ${c.bg[1]}% ${Math.max(c.bg[2] - 2, 90)}% `,
      "muted-foreground": "215 16% 47%", border: "214 32% 91%",
      input: "214 32% 91%", ring: `${c.p[0]} ${c.p[1]}% ${c.p[2]}% `,
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
