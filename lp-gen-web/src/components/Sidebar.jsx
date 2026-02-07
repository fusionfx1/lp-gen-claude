import React from "react";
import { THEME as T } from "../constants";

export function Sidebar({ page, setPage, siteCount, startCreate, collapsed, toggle }) {
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
