import React, { useState } from "react";
import { THEME as T } from "../constants";
import { Card, Inp, Btn, Sel } from "./Atoms";
import { api } from "../services/api";
import { multiloginApi } from "../services/multilogin";

export function Settings({ settings, setSettings, stats }) {
    const [apiKey, setApiKey] = useState(settings.apiKey || "");
    const [geminiKey, setGeminiKey] = useState(settings.geminiKey || "");
    const [netlifyToken, setNetlifyToken] = useState(settings.netlifyToken || "");
    const [lcToken, setLcToken] = useState(settings.lcToken || "");
    const [lcTeamUuid, setLcTeamUuid] = useState(settings.lcTeamUuid || "");
    const [defaultBinUuid, setDefaultBinUuid] = useState(settings.defaultBinUuid || "");
    const [defaultBillingUuid, setDefaultBillingUuid] = useState(settings.defaultBillingUuid || "");
    const [mlToken, setMlToken] = useState(settings.mlToken || "");
    const [mlEmail, setMlEmail] = useState(settings.mlEmail || "");
    const [mlPassword, setMlPassword] = useState(settings.mlPassword || "");
    const [mlFolderId, setMlFolderId] = useState(settings.mlFolderId || "");
    const [defaultProxyProvider, setDefaultProxyProvider] = useState(settings.defaultProxyProvider || "multilogin");
    const [generatingToken, setGeneratingToken] = useState(false);
    const [testing, setTesting] = useState(null);
    const [testResult, setTestResult] = useState({});

    const testApi = async () => {
        setTesting("api");
        try {
            const r = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 10, messages: [{ role: "user", content: "OK" }] })
            });
            setTestResult(p => ({ ...p, api: r.ok ? "ok" : "fail" }));
        } catch { setTestResult(p => ({ ...p, api: "fail" })); }
        setTesting(null);
    };

    const testNetlify = async () => {
        setTesting("netlify");
        try {
            const r = await fetch("https://api.netlify.com/api/v1/sites?per_page=1", { headers: { Authorization: `Bearer ${netlifyToken}` } });
            setTestResult(p => ({ ...p, netlify: r.ok ? "ok" : "fail" }));
        } catch { setTestResult(p => ({ ...p, netlify: "fail" })); }
        setTesting(null);
    };

    const testLc = async () => {
        setTesting("lc");
        try {
            const r = await api.get("/lc/teams");
            if (r && !r.error) {
                setTestResult(p => ({ ...p, lc: "ok" }));
            } else {
                setTestResult(p => ({ ...p, lc: "fail" }));
            }
        } catch { setTestResult(p => ({ ...p, lc: "fail" })); }
        setTesting(null);
    };

    const testMl = async () => {
        setTesting("ml");
        try {
            if (mlToken) {
                setTestResult(p => ({ ...p, ml: "active" }));
                setTesting(null);
                return;
            }
            const r = await api.post("/ml/signin", {});
            if (r && r.data && r.data.token) {
                setMlToken(r.data.token);
                setTestResult(p => ({ ...p, ml: "ok" }));
            } else {
                setTestResult(p => ({ ...p, ml: "fail" }));
            }
        } catch { setTestResult(p => ({ ...p, ml: "fail" })); }
        setTesting(null);
    };

    const save = (s) => {
        setSettings(s);
    };

    const labelStyle = { fontSize: 10, color: T.muted, display: "block", marginBottom: 2 };

    return (
        <div style={{ maxWidth: 600, animation: "fadeIn .3s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Settings</h1>
            <p style={{ color: T.muted, fontSize: 12, marginBottom: 24 }}>API keys and deployment configuration</p>

            {/* AI Provider - Anthropic */}
            <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Anthropic API Key</h3>
                <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px" }}>For AI copy generation</p>
                <Inp type="password" value={apiKey} onChange={setApiKey} placeholder="sk-ant-..." style={{ marginBottom: 8 }} />
                {settings.apiKey && <div style={{ fontSize: 11, color: T.success, marginBottom: 8 }}>✓ Configured</div>}
                <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" onClick={testApi} disabled={!apiKey || testing === "api"} style={{ fontSize: 12 }}>{testing === "api" ? "..." : "🔑 Test"}</Btn>
                    <Btn onClick={() => save({ apiKey })} style={{ fontSize: 12 }}>💾 Save</Btn>
                </div>
            </Card>

            {/* AI Provider - Gemini */}
            <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Gemini API Key</h3>
                <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px" }}>For advanced text and image prompting</p>
                <Inp type="password" value={geminiKey} onChange={setGeminiKey} placeholder="AIza..." style={{ marginBottom: 8 }} />
                <Btn onClick={() => save({ geminiKey })} style={{ fontSize: 12 }}>💾 Save</Btn>
            </Card>

            {/* Netlify Deploy Token */}
            <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Netlify Deploy Token</h3>
                <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px" }}>For one-click deploy from My Sites</p>
                <Inp type="password" value={netlifyToken} onChange={setNetlifyToken} placeholder="nfp_..." style={{ marginBottom: 8 }} />
                {settings.netlifyToken && <div style={{ fontSize: 11, color: T.success, marginBottom: 8 }}>✓ Configured</div>}
                <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" onClick={testNetlify} disabled={!netlifyToken || testing === "netlify"} style={{ fontSize: 12 }}>{testing === "netlify" ? "..." : "🔑 Test"}</Btn>
                    <Btn onClick={() => save({ netlifyToken })} style={{ fontSize: 12 }}>💾 Save</Btn>
                </div>
            </Card>

            {/* LeadingCards API - Enhanced */}
            <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>LeadingCards API</h3>
                <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px" }}>For automated card management</p>
                <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>Token</label>
                    <Inp type="password" value={lcToken} onChange={setLcToken} placeholder="b2f..." />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>Team UUID</label>
                    <Inp value={lcTeamUuid} onChange={setLcTeamUuid} placeholder="Optional for Team Members" />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>Default BIN UUID</label>
                    <Inp value={defaultBinUuid} onChange={setDefaultBinUuid} placeholder="BIN UUID for card issuance" />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Default Billing Address UUID</label>
                    <Inp value={defaultBillingUuid} onChange={setDefaultBillingUuid} placeholder="Billing address UUID" />
                </div>
                {testResult.lc && (
                    <div style={{ fontSize: 11, marginBottom: 8, color: testResult.lc === "ok" ? T.success : T.danger }}>
                        {testResult.lc === "ok" ? "✓ Connected" : "✗ Failed"}
                    </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" onClick={testLc} disabled={!lcToken || testing === "lc"} style={{ fontSize: 12 }}>{testing === "lc" ? "..." : "🔑 Test"}</Btn>
                    <Btn onClick={() => save({ lcToken, lcTeamUuid, defaultBinUuid, defaultBillingUuid })} style={{ fontSize: 12 }}>💾 Save LeadingCards Config</Btn>
                </div>
            </Card>

            {/* Multilogin X - Enhanced */}
            <Card style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Multilogin X</h3>
                <p style={{ fontSize: 11, color: T.dim, margin: "0 0 12px" }}>For browser profile management</p>
                <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>Automation Token (Recommended)</label>
                    <Inp type="password" value={mlToken} onChange={setMlToken} placeholder="Bearer token..." />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                        <label style={labelStyle}>Login Email</label>
                        <Inp value={mlEmail} onChange={setMlEmail} placeholder="user@multilogin.com" />
                    </div>
                    <div>
                        <label style={labelStyle}>Password</label>
                        <Inp type="password" value={mlPassword} onChange={setMlPassword} placeholder="••••••••" />
                    </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>Default Folder ID</label>
                    <Inp value={mlFolderId} onChange={setMlFolderId} placeholder="Folder ID for browser profiles" />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Default Proxy Provider</label>
                    <Sel value={defaultProxyProvider} onChange={setDefaultProxyProvider} options={[
                        { value: "multilogin", label: "Multilogin" },
                        { value: "custom", label: "Custom" },
                    ]} />
                </div>
                {testResult.ml && (
                    <div style={{ fontSize: 11, marginBottom: 8, color: testResult.ml === "fail" ? T.danger : T.success }}>
                        {testResult.ml === "ok" ? "✓ Signed In" : testResult.ml === "active" ? "✓ Token Active" : "✗ Failed"}
                    </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" onClick={testMl} disabled={testing === "ml"} style={{ fontSize: 12 }}>{testing === "ml" ? "..." : "🔑 Test / Sign In"}</Btn>
                    <Btn variant="ghost" onClick={async () => {
                        setGeneratingToken(true);
                        try {
                            const res = await multiloginApi.getAutomationToken();
                            if (res.data?.token) {
                                setMlToken(res.data.token);
                                setTestResult(p => ({ ...p, ml: "ok" }));
                            } else if (res.error) {
                                setTestResult(p => ({ ...p, ml: "fail" }));
                            }
                        } catch { setTestResult(p => ({ ...p, ml: "fail" })); }
                        setGeneratingToken(false);
                    }} disabled={!mlToken && !mlEmail || generatingToken} style={{ fontSize: 12 }}>
                        {generatingToken ? "..." : "🔑 Generate Token"}
                    </Btn>
                    <Btn onClick={() => save({ mlToken, mlEmail, mlPassword, mlFolderId, defaultProxyProvider })} style={{ fontSize: 12 }}>💾 Save Multilogin Config</Btn>
                </div>
            </Card>

            {/* Build Stats */}
            <Card>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Build Stats</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                    <div><div style={{ fontSize: 22, fontWeight: 700 }}>{stats.builds}</div><div style={{ fontSize: 10, color: T.muted }}>Builds</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>${stats.spend.toFixed(3)}</div><div style={{ fontSize: 10, color: T.muted }}>Spend</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 700, color: T.success }}>90+</div><div style={{ fontSize: 10, color: T.muted }}>PageSpeed</div></div>
                </div>
            </Card>
        </div>
    );
}
