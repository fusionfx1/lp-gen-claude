import React, { useState } from "react";
import { THEME as T, COLORS, FONTS, RADIUS, LOAN_TYPES, LAYOUTS, NETWORKS_AFF } from "../constants";
import { uid, now, hsl } from "../utils";
import { generateLP } from "../utils/lp-generator";
import { api } from "../services/api";
import { Card, Inp, Btn, Field, MockPhone } from "./Atoms";

export function Wizard({ config, setConfig, addSite, setPage, settings, notify }) {
    const [step, setStep] = useState(1);
    const [building, setBuilding] = useState(false);
    const upd = (k, v) => setConfig(p => ({ ...p, [k]: v }));
    const steps = ["Brand Info", "Loan Product", "Design", "Copy & CTA", "Tracking", "Review & Build"];

    const handleBuild = async () => {
        setBuilding(true);
        if (!config.h1 || !config.badge || !config.cta) {
            try {
                const p = await api.post("/ai/generate-copy", {
                    brand: config.brand,
                    loanType: config.loanType,
                    amountMin: config.amountMin,
                    amountMax: config.amountMax,
                    lang: config.lang || "English"
                });

                if (p && !p.error) {
                    if (!config.h1 && p.h1) upd("h1", p.h1);
                    if (!config.badge && p.badge) upd("badge", p.badge);
                    if (!config.cta && p.cta) upd("cta", p.cta);
                    if (!config.sub && p.sub) upd("sub", p.sub);
                    if (!config.tagline && p.tagline) upd("tagline", p.tagline);
                }
            } catch { /* AI generation skipped */ }
        }
        await new Promise(r => setTimeout(r, 1000));
        addSite({ ...config, id: uid(), status: "completed", createdAt: now(), cost: 0.001 }); // Reduced cost for Gemini Flash
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
            💡 Leave empty = AI generates on build (needs API key)
        </div>
        <Field label="H1 Headline"><Inp value={c.h1} onChange={v => u("h1", v)} placeholder="Fast Personal Loans Up To $5,000" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Badge Text"><Inp value={c.badge} onChange={v => u("badge", v)} placeholder="No Credit Check Required" /></Field>
            <Field label="CTA Button"><Inp value={c.cta} onChange={v => u("cta", v)} placeholder="Check Your Rate →" /></Field>
        </div>
        <Field label="Sub-headline"><Inp value={c.sub} onChange={v => u("sub", v)} placeholder="Get approved in minutes. Funds fast." /></Field>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <Field label="Auto-Translate (Gemini)" help="Generate copy in a specific language">
                <div style={{ display: "flex", gap: 10 }}>
                    {["English", "Spanish", "German", "French", "Italian"].map(l => (
                        <button key={l} onClick={() => u("lang", l)} style={{
                            flex: 1, padding: "8px", background: (c.lang || "English") === l ? T.primaryGlow : T.input,
                            border: `2px solid ${(c.lang || "English") === l ? T.primary : T.border}`,
                            borderRadius: 6, cursor: "pointer", color: T.text, fontSize: 11, fontWeight: 600,
                        }}>{l}</button>
                    ))}
                </div>
            </Field>
        </div>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Voluum Pixel ID"><Inp value={c.voluumId} onChange={v => u("voluumId", v)} placeholder="v-id-xxxx" /></Field>
            <Field label="Voluum Domain"><Inp value={c.voluumDomain} onChange={v => u("voluumDomain", v)} placeholder="trk.domain.com" /></Field>
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
    </>;
}

function StepReview({ c, building }) {
    const co = COLORS.find(x => x.id === c.colorId) || COLORS[0];
    const rows = [
        ["Brand", c.brand], ["Domain", c.domain || "—"], ["Type", LOAN_TYPES.find(l => l.id === c.loanType)?.label],
        ["Range", `$${c.amountMin}–$${c.amountMax}`], ["APR", `${c.aprMin}%–${c.aprMax}%`],
        ["Colors", co.name], ["GTM", c.gtmId || "—"],
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
            <div>
                <div style={{ marginBottom: 20 }}><div style={{ fontSize: 24 }}>🔍</div><h2 style={{ fontSize: 17, fontWeight: 700 }}>Review & Build</h2></div>
                <div style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13, borderBottom: `1px solid ${T.border}` }}>Configuration</div>
                    {rows.map(([l, v], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none", fontSize: 12 }}>
                            <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                    {["p", "s", "a"].map(k => <div key={k} style={{ flex: 1, padding: "8px", borderRadius: 8, background: hsl(...co[k]), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{k.toUpperCase()}</div>)}
                </div>
                {building && <div style={{ textAlign: "center", padding: 12, background: T.primaryGlow, borderRadius: 8, color: T.primary, fontSize: 13, fontWeight: 600, animation: "pulse 1s infinite" }}>⚡ AI is crafting your site...</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
                <MockPhone style={{ transform: "scale(0.85)", originY: "top" }}>
                    <iframe title="mobile-preview" style={{ width: "100%", height: "100%", border: "none" }} srcDoc={generateLP(c)} />
                </MockPhone>
            </div>
        </div>
    );
}
