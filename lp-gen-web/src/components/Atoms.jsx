import React from "react";
import { THEME as T } from "../constants";

export function Card({ children, style, ...p }) {
    return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, transition: "transform .2s, box-shadow .2s", ...style }} {...p}>{children}</div>;
}

export function Inp({ value, onChange, style, ...p }) {
    return <input value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "9px 12px", background: T.input, border: `1px solid ${T.border}`,
        borderRadius: 7, color: T.text, fontSize: 13, boxSizing: "border-box", transition: "all .2s",
        outline: "none", ...style,
    }} onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px ${T.primary}22`; }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} {...p} />;
}

export function Sel({ value, onChange, options, style }) {
    return <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "9px 12px", background: T.input, border: `1px solid ${T.border}`,
        borderRadius: 7, color: T.text, fontSize: 13, cursor: "pointer", transition: "all .2s", outline: "none", ...style,
    }} onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>;
}

export function Btn({ children, variant = "primary", onClick, disabled, style }) {
    const base = { border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, padding: "9px 18px", transition: "all .2s", opacity: disabled ? .5 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
    const vars = {
        primary: { background: T.grad, color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,.25)" },
        ghost: { background: "transparent", border: `1px solid ${T.border}`, color: T.text },
        danger: { background: `${T.danger}22`, color: T.danger, border: `1px solid ${T.danger}44` },
        success: { background: T.success, color: "#fff" },
    };
    return <button onClick={onClick} disabled={disabled} style={{ ...base, ...vars[variant], ...style }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { if (!disabled) e.currentTarget.style.transform = "none"; }}>{children}</button>;
}

export function MockPhone({ children, style }) {
    return (
        <div style={{
            width: 280, height: 560, background: "#111", borderRadius: 36, padding: 10,
            border: "6px solid #222", boxShadow: "0 24px 48px rgba(0,0,0,.4)", position: "relative",
            overflow: "hidden", ...style
        }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 100, height: 20, background: "#222", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", background: "#fff", borderRadius: 28, overflow: "hidden" }}>
                {children}
            </div>
        </div>
    );
}

export function Field({ label, req, help, children }) {
    return <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: T.text }}>
            {label} {req && <span style={{ color: T.danger }}>*</span>}
        </label>
        {children}
        {help && <div style={{ fontSize: 10, color: T.dim, marginTop: 3 }}>{help}</div>}
    </div>;
}

export function Dot({ c, label }) {
    return <span style={{ fontSize: 11, color: c, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />{label}</span>;
}

export function Badge({ color, children }) {
    return <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 600, background: `${color}18`, color }}>{children}</span>;
}

export function Toast({ msg, type }) {
    const c = type === "success" ? T.success : type === "danger" ? T.danger : T.primary;
    return (
        <div style={{
            position: "fixed", top: 24, right: 24, padding: "12px 20px", background: T.card,
            border: `1px solid ${c}44`, borderLeft: `4px solid ${c}`, borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,.4)", zIndex: 1000, color: "#fff", fontSize: 13,
            fontWeight: 600, animation: "slideIn .3s cubic-bezier(.17,.67,.83,.67)",
        }}>{msg}</div>
    );
}
