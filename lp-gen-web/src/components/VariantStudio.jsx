import React, { useState, useMemo } from "react";
import { THEME as T, COLORS, FONTS, RADIUS, LOAN_TYPES } from "../constants";
import { uid, now, hsl } from "../utils";
import { generateLP, makeThemeJson } from "../utils/lp-generator";
import { Card, Inp, Btn, Badge, Dot } from "./Atoms";
import { api } from "../services/api";

export function VariantStudio({ notify, sites, addSite, registry, setRegistry, apiOk }) {
    const [v, setV] = useState({
        brand: "QuickLoan", amountMin: 500, amountMax: 5000,
        colorId: COLORS[0].id, fontId: FONTS[0].id, radius: RADIUS[2].id,
        loanType: "personal", layout: "hero-left",
    });
    const [batch, setBatch] = useState(5);
    const [previews, setPreviews] = useState([]);
    const [assets, setAssets] = useState({ logo: null, hero: null });
    const [loadingAsset, setLoadingAsset] = useState(null);

    const set = (k, val) => setV(p => ({ ...p, [k]: val }));

    const randomize = () => {
        const c = COLORS[Math.floor(Math.random() * COLORS.length)];
        const f = FONTS[Math.floor(Math.random() * FONTS.length)];
        const r = RADIUS[Math.floor(Math.random() * RADIUS.length)];
        setV(p => ({ ...p, colorId: c.id, fontId: f.id, radius: r.id }));
    };

    const saveToReg = (val) => {
        const item = { ...val, id: uid(), createdAt: now() };
        setRegistry(p => [item, ...p]);
        notify("Saved to Variant Registry");
    };

    const batchGenerate = () => {
        const items = Array.from({ length: batch }).map(() => ({
            ...v, id: uid(), brand: v.brand + " " + Math.floor(Math.random() * 99),
            colorId: COLORS[Math.floor(Math.random() * COLORS.length)].id,
            fontId: FONTS[Math.floor(Math.random() * FONTS.length)].id,
            createdAt: now(),
        }));
        setPreviews(items);
    };

    const createFromVar = (val) => {
        addSite({ ...val, status: "completed" });
        notify("Created site from variant");
    };

    const exportVar = (val) => {
        const json = makeThemeJson(val);
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `variant-${val.id || "new"}.json`; a.click();
    };

    const genAsset = async (type) => {
        setLoadingAsset(type);
        try {
            const res = await api.post("/ai/generate-assets", { brand: v.brand, type });
            if (res.url) setAssets(p => ({ ...p, [type]: res.url }));
        } catch (e) { notify("Asset creation failed", "danger"); }
        setLoadingAsset(false);
    };

    const VarCard = ({ v, showActions = true }) => {
        const c = COLORS.find(x => x.id === v.colorId) || COLORS[0];
        const f = FONTS.find(x => x.id === v.fontId) || FONTS[0];
        return (
            <Card style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: hsl(...c.p), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", fontWeight: 700 }}>{v.brand?.[0]}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{v.brand}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <Dot c={hsl(...c.p)} label={c.name} />
                        <Dot c={T.primary} label={f.name} />
                    </div>
                </div>
                {showActions && <div style={{ display: "flex", gap: 4 }}>
                    <Btn variant="ghost" onClick={() => createFromVar(v)} style={{ padding: "4px 8px", fontSize: 10 }}>Build</Btn>
                    <Btn variant="ghost" onClick={() => exportVar(v)} style={{ padding: "4px 8px", fontSize: 10 }}>JSON</Btn>
                </div>}
            </Card>
        );
    };

    return (
        <div style={{ animation: "fadeIn .3s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>🎨 Variant Studio</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <Card style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Configuration</h3>
                    <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>Brand Name</label><Inp value={v.brand} onChange={val => set("brand", val)} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        <div><label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>Color</label>
                            <select value={v.colorId} onChange={e => set("colorId", e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, background: T.input, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }}>
                                {COLORS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div><label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>Font</label>
                            <select value={v.fontId} onChange={e => set("fontId", e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, background: T.input, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }}>
                                {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        <Btn onClick={randomize} variant="ghost" style={{ flex: 1 }}>🎲 Randomize</Btn>
                        <Btn onClick={() => saveToReg(v)} style={{ flex: 1 }}>💾 Save Variant</Btn>
                    </div>
                    <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "20px 0" }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚡ Batch Generation</h3>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Inp type="number" value={batch} onChange={val => setBatch(+val)} style={{ width: 60 }} />
                        <Btn onClick={batchGenerate} style={{ flex: 1 }}>Generate Multi-Variants</Btn>
                    </div>
                </Card>

                <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Registry ({registry.length})</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflow: "auto", paddingRight: 4 }}>
                        {registry.length === 0 ? <div style={{ textAlign: "center", padding: 40, border: `1px dashed ${T.border}`, borderRadius: 10, color: T.dim, fontSize: 12 }}>No saved variants</div> : registry.map(rv => <VarCard key={rv.id} v={rv} />)}
                    </div>

                    <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 12, marginTop: 24, textTransform: "uppercase", letterSpacing: 1 }}>✨ AI Asset Studio</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Card style={{ padding: 12, textAlign: "center" }}>
                            <div style={{ height: 100, background: T.input, borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {assets.logo ? <img src={assets.logo} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="Logo" /> : <div style={{ fontSize: 24 }}>🏢</div>}
                            </div>
                            <Btn variant="ghost" onClick={() => genAsset("logo")} disabled={loadingAsset === "logo"} style={{ width: "100%", fontSize: 11 }}>
                                {loadingAsset === "logo" ? "Generating..." : "Generate Logo"}
                            </Btn>
                        </Card>
                        <Card style={{ padding: 12, textAlign: "center" }}>
                            <div style={{ height: 100, background: T.input, borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {assets.hero ? <img src={assets.hero} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Hero" /> : <div style={{ fontSize: 24 }}>🖼️</div>}
                            </div>
                            <Btn variant="ghost" onClick={() => genAsset("hero")} disabled={loadingAsset === "hero"} style={{ width: "100%", fontSize: 11 }}>
                                {loadingAsset === "hero" ? "Generating..." : "Generate Hero"}
                            </Btn>
                        </Card>
                    </div>

                    <h3 style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 12, marginTop: 24, textTransform: "uppercase", letterSpacing: 1 }}>Generated Batch</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {previews.length === 0 ? <div style={{ textAlign: "center", padding: 40, border: `1px dashed ${T.border}`, borderRadius: 10, color: T.dim, fontSize: 12 }}>Click generate to see themes</div> : previews.map(pv => <VarCard key={pv.id} v={pv} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
