import React, { useState, useEffect } from "react";
import { THEME as T, COLORS } from "../constants";
import { LS, uid, now, hsl } from "../utils";
import { generateLP, makeThemeJson, htmlToZip } from "../utils/lp-generator";
import { downloadGtmJson } from "../utils/gtm-exporter";
import { Card, Inp, Btn, Badge } from "./Atoms";

export function Sites({ sites, del, notify, startCreate, settings, addDeploy }) {
    const [search, setSearch] = useState("");
    const [deploying, setDeploying] = useState(null);
    const [deployUrls, setDeployUrls] = useState(() => {
        const stored = LS.get("deployUrls") || {};
        const cleaned = {};
        for (const [key, val] of Object.entries(stored)) {
            if (val && !val.includes("undefined.netlify.app")) cleaned[key] = val;
        }
        return cleaned;
    });
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

    const downloadZip = async (site) => {
        const html = generateLP(site);
        const blob = await htmlToZip(html);
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `${site.brand.toLowerCase().replace(/\s+/g, '-')}-lp.zip`; a.click();
        notify("Downloaded LP ZIP");
    };

    const deployNetlify = async (site) => {
        if (!settings.netlifyToken) return notify("Set Netlify token in Settings first", "danger");
        setDeploying(site.id);
        try {
            const slug = (site.domain || site.brand).toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40) + "-" + site.id.slice(0, 4);
            const authH = { Authorization: `Bearer ${settings.netlifyToken}` };

            // 1. Create or find site
            let siteData;
            const createRes = await fetch("https://api.netlify.com/api/v1/sites", {
                method: "POST", headers: { ...authH, "Content-Type": "application/json" },
                body: JSON.stringify({ name: slug }),
            });
            if (!createRes.ok) {
                const existing = await fetch(`https://api.netlify.com/api/v1/sites?name=${slug}&per_page=1`, { headers: authH });
                const exData = await existing.json();
                if (exData.length > 0) siteData = exData[0]; else throw new Error("Create failed");
            } else { siteData = await createRes.json(); }

            // 2. Generate HTML
            const html = generateLP(site);
            const encoder = new TextEncoder();
            const data = encoder.encode(html);

            // 3. Compute SHA1 hash
            const hashBuf = await crypto.subtle.digest("SHA-1", data);
            const hashArr = Array.from(new Uint8Array(hashBuf));
            const sha1 = hashArr.map(b => b.toString(16).padStart(2, "0")).join("");

            // 4. Create deploy with file digest
            const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteData.id}/deploys`, {
                method: "POST", headers: { ...authH, "Content-Type": "application/json" },
                body: JSON.stringify({ files: { "/index.html": sha1 } }),
            });
            if (!deployRes.ok) throw new Error("Deploy create failed");
            const deploy = await deployRes.json();

            // 5. Upload file if required
            if (deploy.required && deploy.required.includes(sha1)) {
                const uploadRes = await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`, {
                    method: "PUT", headers: { ...authH, "Content-Type": "application/octet-stream" }, body: data,
                });
                if (!uploadRes.ok) throw new Error("File upload failed");
            }

            const url = siteData.ssl_url || siteData.url || `https://${siteData.name || slug}.netlify.app`;
            const wasDeployed = !!deployUrls[site.id];
            setDeployUrls(p => ({ ...p, [site.id]: url }));
            if (addDeploy) addDeploy({ id: uid(), siteId: site.id, brand: site.brand, url, ts: now(), type: wasDeployed ? "redeploy" : "new" });
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
                    { l: "Deployed", v: Object.keys(deployUrls).length }, { l: "Avg Cost", v: sites.length ? `$${(sites.reduce((a, s) => a + (s.cost || 0), 0) / sites.length).toFixed(3)}` : "$0" },
                ].map((m, i) => <Card key={i} style={{ padding: "12px 14px" }}><div style={{ fontSize: 10, color: T.muted }}>{m.l}</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 1 }}>{m.v}</div></Card>)}
            </div>

            <Inp value={search} onChange={setSearch} placeholder="Search sites..." style={{ width: 240, marginBottom: 14 }} />

            {filtered.length === 0 ? (
                <Card style={{ textAlign: "center", padding: 50 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🏗️</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>No sites yet</div>
                    <div style={{ color: T.dim, fontSize: 12, marginTop: 4 }}>Create your first loan LP</div>
                </Card>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {filtered.map(s => {
                        const c = COLORS.find(x => x.id === s.colorId);
                        return (
                            <Card key={s.id} style={{ padding: 16, display: "flex", gap: 16, position: "relative" }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: c ? hsl(...c.p) : T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", fontWeight: 700 }}>{s.brand?.[0]}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>{s.brand}</div>
                                        <Badge color={T.success}>ready</Badge>
                                    </div>
                                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.domain || "no domain"}</div>
                                    {deployUrls[s.id] && (
                                        <a href={deployUrls[s.id]} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 11, color: T.accent, marginTop: 4, textDecoration: "none" }}>🚀 {deployUrls[s.id]}</a>
                                    )}
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                                        <Btn variant="ghost" onClick={() => setPreview(s)} style={{ padding: "6px 10px", fontSize: 10 }}>👁 Preview</Btn>
                                        <Btn variant="ghost" onClick={() => exportJson(s)} style={{ padding: "6px 10px", fontSize: 10 }}>📥 Theme</Btn>
                                        <Btn variant="ghost" onClick={() => downloadZip(s)} style={{ padding: "6px 10px", fontSize: 10 }}>📦 ZIP</Btn>
                                        {s.gtmId && <Btn variant="ghost" onClick={() => downloadGtmJson(s)} style={{ padding: "6px 10px", fontSize: 10, color: "#f59e0b" }}>🏷️ GTM</Btn>}
                                        <Btn onClick={() => deployNetlify(s)} disabled={deploying === s.id} style={{ padding: "6px 12px", fontSize: 10, background: T.primary }}>{deploying === s.id ? "..." : "🚀 Deploy"}</Btn>
                                    </div>
                                </div>
                                <button onClick={() => confirm("Delete?") && del(s.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                            </Card>
                        );
                    })}
                </div>
            )}

            {preview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", flexDirection: "column", padding: 24, animation: "fadeIn .2s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ color: "#fff", fontWeight: 700 }}>Preview: {preview.brand}</div>
                        <Btn variant="danger" onClick={() => setPreview(null)} style={{ padding: "4px 12px" }}>Close</Btn>
                    </div>
                    <iframe title="preview" style={{ flex: 1, background: "#fff", borderRadius: 12, border: "none" }} srcDoc={generateLP(preview)} />
                </div>
            )}
        </div>
    );
}
