import React, { useMemo } from "react";
import { THEME as T, COLORS } from "../constants";
import { hsl } from "../utils";
import { detectRisks } from "../utils/risk-engine";
import { Card, Btn, Badge, Dot } from "./Atoms";

export function Dashboard({ sites, stats, ops, setPage, startCreate, settings = {}, apiOk }) {
    const recent = sites.slice(0, 5);
    const risks = useMemo(() => detectRisks(ops), [ops]);

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 24 }}>
                {[
                    { l: "Total Sites", v: sites.length, c: T.primary, icon: "🌐" },
                    { l: "Active", v: sites.filter(s => s.status === "completed").length, c: T.success, icon: "✅" },
                    { l: "Builds", v: stats.builds, c: T.accent, icon: "🔨" },
                    { l: "API Spend", v: `$${stats.spend.toFixed(2)}`, c: T.warning, icon: "💰" },
                    { l: "Ops Domains", v: ops.domains.length, c: "#a78bfa", icon: "🏢" },
                    { l: "Active Cards", v: ops.payments?.filter(p => p.status === "active" || p.cardStatus === "active").length || 0, c: T.success, icon: "💳" },
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

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Recent */}
                    <Card style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>🕐 Recent Sites</h3>
                        {recent.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 32, color: T.dim }}>
                                <div style={{ fontSize: 28, marginBottom: 6 }}>🚀</div>
                                <div style={{ fontSize: 13 }}>No sites yet</div>
                            </div>
                        ) : recent.map(s => {
                            const c = COLORS.find(x => x.id === s.colorId);
                            return (
                                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: c ? hsl(...c.p) : T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>{s.brand?.[0]}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.brand}</div>
                                        <div style={{ fontSize: 11, color: T.dim }}>{s.domain || "no domain"}</div>
                                    </div>
                                    <Badge color={T.success}>Active</Badge>
                                </div>
                            );
                        })}
                        <Btn variant="ghost" onClick={() => setPage("sites")} style={{ width: "100%", marginTop: 12, fontSize: 11 }}>View All Sites →</Btn>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>⚡ Quick Actions</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {[
                                { l: "Build New", icon: "➕", fn: startCreate },
                                { l: "AI Assets", icon: "✨", fn: () => setPage("variant") },
                                { l: "Ops Center", icon: "🏢", fn: () => setPage("ops") },
                                { l: "Settings", icon: "⚙", fn: () => setPage("settings") },
                            ].map((a, i) => (
                                <button key={i} onClick={a.fn} style={{
                                    display: "flex", alignItems: "center", gap: 10, padding: "12px", background: T.input,
                                    border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", color: T.text, transition: "all .2s"
                                }} onMouseEnter={e => e.currentTarget.style.borderColor = T.primary} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{a.l}</span>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* AI Insight Card */}
                    <Card style={{ background: T.grad, color: "#fff", border: "none" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>✨ AI Performance Hack</h3>
                        <p style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.9 }}>
                            {sites.length > 0 ?
                                `Your brand "${recent[0]?.brand}" can improve CTR by 15% by using a "Limited Time" badge in the copy step.` :
                                "Ready to scale? Gemini AI can generate high-converting copy in 5+ languages automatically."
                            }
                        </p>
                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Action: Enable Micro-Conversions
                        </div>
                    </Card>

                    {/* Infrastructure Health */}
                    <Card>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 12, textTransform: "uppercase" }}>System Health</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12 }}>D1 Database</span>
                                <Dot c={apiOk ? T.success : T.danger} label={apiOk ? "Connected" : "Offline"} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12 }}>Netlify API</span>
                                <Dot c={settings.netlifyToken ? T.success : T.dim} label={settings.netlifyToken ? "Connected" : "Not Set"} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12 }}>LeadingCards API</span>
                                <Dot c={settings.lcToken ? T.success : T.dim} label={settings.lcToken ? "Connected" : "Not Set"} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12 }}>Multilogin X</span>
                                <Dot c={settings.mlToken ? T.success : T.dim} label={settings.mlToken ? "Connected" : "Not Set"} />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
