import React from "react";
import { THEME as T } from "../constants";
import { Dot } from "./Atoms";

export function TopBar({ stats, settings, deploys, apiOk }) {
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
                <span style={{ margin: "0 10px", color: T.border }}>│</span>
                Deployed: <b style={{ color: T.success }}>{deploys?.length || 0}</b>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Dot c={apiOk ? T.success : T.warning} label={apiOk ? "D1 ✓" : "Local"} />
                {settings.netlifyToken && <Dot c={T.success} label="Netlify" />}
                <Dot c={settings.apiKey ? T.success : T.danger} label={settings.apiKey ? "AI OK" : "No AI"} />
                <Dot c={settings.lcToken ? T.success : T.dim} label={settings.lcToken ? "LC ✓" : "LC"} />
                <Dot c={settings.mlToken ? T.success : T.dim} label={settings.mlToken ? "ML ✓" : "ML"} />
            </div>
        </div>
    );
}
