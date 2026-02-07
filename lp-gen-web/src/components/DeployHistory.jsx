import React from "react";
import { THEME as T } from "../constants";
import { Card, Badge } from "./Atoms";

export function DeployHistory({ deploys }) {
    return (
        <div style={{ animation: "fadeIn .3s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>🚀 Deploy History</h1>
            <p style={{ color: T.muted, fontSize: 12, marginBottom: 20 }}>All Netlify deployments</p>
            {deploys.length === 0 ? (
                <Card style={{ textAlign: "center", padding: 50 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>No deployments yet</div>
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
