import React, { useState, useMemo, useEffect } from "react";
import { THEME as T, REGISTRARS } from "../constants";
import { uid, now } from "../utils";
import { Card, Btn, Badge, Inp, Dot } from "./Atoms";
import { leadingCardsApi } from "../services/leadingCards";
import { multiloginApi } from "../services/multilogin";
import { api } from "../services/api";
import { detectRisks, RISK_ICONS, RISK_COLORS } from "../utils/risk-engine";

/* ─── Shared inline styles ───────────────────────────────────────────── */
const S = {
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
    label: { fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, color: T.text },
    select: { width: "100%", padding: 9, borderRadius: 7, background: T.input, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, boxSizing: "border-box" },
    fieldWrap: { marginBottom: 12 },
    row: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.card2, borderRadius: 7, marginBottom: 4, fontSize: 12 },
    btnRow: { display: "flex", gap: 8, justifyContent: "flex-end" },
    miniBtn: { fontSize: 10, padding: "2px 8px" },
    sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text },
    emptyState: { textAlign: "center", padding: 32, color: T.dim },
    filterBtn: (active) => ({
        padding: "4px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? T.primary : T.border}`,
        background: active ? `${T.primary}18` : "transparent", color: active ? T.text : T.muted,
    }),
};

/* ─── Helper: toast-like inline status ───────────────────────────────── */
function StatusMsg({ msg, type }) {
    if (!msg) return null;
    const c = type === "success" ? T.success : type === "error" ? T.danger : T.primary;
    return (
        <div style={{ padding: "8px 14px", borderRadius: 7, marginBottom: 10, background: `${c}12`, border: `1px solid ${c}44`, color: c, fontSize: 12, fontWeight: 600, animation: "fadeIn .2s" }}>
            {msg}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   OpsCenter — Tasks 7, 8, 9, 11, 12
   ═══════════════════════════════════════════════════════════════════════ */
export function OpsCenter({ data, add, del, upd, settings }) {
    /* ─── Core state ─────────────────────────────────────────────────── */
    const [tab, setTab] = useState("overview");
    const [modal, setModal] = useState(null);
    const [lcCards, setLcCards] = useState([]);
    const [lcBins, setLcBins] = useState([]);
    const [lcAddresses, setLcAddresses] = useState([]);
    const [mlProfiles, setMlProfiles] = useState([]);
    const [lcLoading, setLcLoading] = useState(false);
    const [mlLoading, setMlLoading] = useState(false);

    /* ─── New state (Tasks 7-12) ─────────────────────────────────────── */
    const [lcFilter, setLcFilter] = useState("");
    const [lcTransactions, setLcTransactions] = useState([]);
    const [changingLimit, setChangingLimit] = useState(null);   // { uuid, value }
    const [suspending, setSuspending] = useState(null);          // account id string
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardData, setWizardData] = useState({});
    const [statusMsg, setStatusMsg] = useState(null);            // { msg, type }
    const [syncing, setSyncing] = useState(false);

    /* ─── Flash a status message for 3s ──────────────────────────────── */
    const flash = (msg, type = "success") => {
        setStatusMsg({ msg, type });
        setTimeout(() => setStatusMsg(null), 3000);
    };

    /* ─── Data fetching (no settings params — Worker handles auth) ──── */
    useEffect(() => {
        if (tab === "payments" || tab === "overview") {
            setLcLoading(true);
            Promise.all([
                leadingCardsApi.getCards(),
                leadingCardsApi.getBins(),
                leadingCardsApi.getBillingAddresses()
            ]).then(([cardsRes, binsRes, addrRes]) => {
                setLcCards(cardsRes.results || []);
                setLcBins(binsRes || []);
                setLcAddresses(addrRes.results || []);
            }).catch(() => { })
                .finally(() => setLcLoading(false));
        }
        if (tab === "profiles" || tab === "overview") {
            setMlLoading(true);
            multiloginApi.getProfiles()
                .then(res => setMlProfiles(res.data?.profiles || res || []))
                .catch(() => { })
                .finally(() => setMlLoading(false));
        }
    }, [tab]);

    useEffect(() => {
        if (tab !== "profiles") return;
        const poll = setInterval(() => {
            multiloginApi.getActiveProfiles()
                .then(res => {
                    const activeIds = (res || []).map(p => p.mlProfileId);
                    // Update mlProfiles status based on active list
                    setMlProfiles(prev => prev.map(p => {
                        const pid = p.uuid || p.id;
                        const isActive = activeIds.includes(pid);
                        return { ...p, status: isActive ? "running" : (p.status === "running" ? "stopped" : p.status) };
                    }));
                })
                .catch(() => {});
        }, 30000);
        return () => clearInterval(poll);
    }, [tab]);

    /* ─── Refresh helpers ────────────────────────────────────────────── */
    const refreshCards = () => leadingCardsApi.getCards().then(res => setLcCards(res.results || []));
    const refreshProfiles = () => multiloginApi.getProfiles().then(res => setMlProfiles(res.data?.profiles || res || []));

    /* ─── Risk detection via engine ──────────────────────────────────── */
    const risks = useMemo(() => detectRisks({
        accounts: data.accounts,
        payments: data.payments,
        profiles: data.profiles,
        domains: data.domains,
        lcCards,
    }), [data, lcCards]);

    /* ─── Tabs ───────────────────────────────────────────────────────── */
    const tabs = [
        { id: "overview", label: "Overview", icon: "🏠" },
        { id: "domains", label: "Domains", icon: "🌐", count: data.domains.length },
        { id: "accounts", label: "Ads Accounts", icon: "💰", count: data.accounts.length },
        { id: "cf", label: "CF Accounts", icon: "☁️", count: data.cfAccounts?.length || 0 },
        { id: "profiles", label: "Profiles", icon: "👤", count: data.profiles.length },
        { id: "payments", label: "Payment Methods", icon: "💳", count: lcCards.length },
        { id: "risks", label: "Risks", icon: "⚠️" },
        { id: "logs", label: "Audit Logs", icon: "📋" },
    ];

    /* ─── Filtered cards (Task 7) ────────────────────────────────────── */
    const filteredCards = useMemo(() => {
        if (!lcFilter) return lcCards;
        return lcCards.filter(c => c.status === lcFilter);
    }, [lcCards, lcFilter]);

    /* ─────────────────────────────────────────────────────────────────
       SHARED COMPONENTS — AddModal, ListTable
       ───────────────────────────────────────────────────────────────── */
    const AddModal = ({ title, coll, fields, onSubmit }) => {
        const [form, setForm] = useState({});
        return (
            <div style={S.overlay}>
                <Card style={{ width: 440, padding: 24, animation: "fadeIn .2s" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{title}</h3>
                    {fields.map(f => (
                        <div key={f.key} style={S.fieldWrap}>
                            <label style={S.label}>{f.label}</label>
                            {f.options ? (
                                <select value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={S.select}>
                                    <option value="">Select...</option>
                                    {f.options.map(o => <option key={o.id || o.value || o.uuid || o} value={o.id || o.value || o.uuid || o}>{o.displayLabel || o.label || o.name || o}</option>)}
                                </select>
                            ) : f.type === "textarea" ? (
                                <textarea value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} rows={3}
                                    style={{ ...S.select, resize: "vertical", minHeight: 60 }} />
                            ) : (
                                <Inp value={form[f.key] || ""} onChange={v => setForm({ ...form, [f.key]: v })} placeholder={f.ph} type={f.type || "text"} />
                            )}
                        </div>
                    ))}
                    <div style={S.btnRow}>
                        <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
                        <Btn onClick={() => {
                            if (onSubmit) { onSubmit(form); }
                            else { add(coll, { id: uid(), ...form, status: "active", createdAt: now() }); }
                            setModal(null);
                        }}>Add</Btn>
                    </div>
                </Card>
            </div>
        );
    };

    const ListTable = ({ items, coll, cols, noDelete }) => (
        <div style={{ marginTop: 12 }}>
            {!items || items.length === 0
                ? <div style={S.emptyState}>No items yet</div>
                : items.map(item => (
                    <div key={item.id || item.uuid} style={S.row}>
                        {cols.map((col, ci) => (
                            <div key={ci} style={{ flex: col.flex || 1, color: ci === 0 ? T.text : T.muted, fontWeight: ci === 0 ? 600 : 400, fontSize: ci === 0 ? 12 : 11 }}>
                                {col.render ? col.render(item) : item[col.key] || "\u2014"}
                            </div>
                        ))}
                        {!noDelete && <button onClick={() => del(coll, item.id)} style={{ background: `${T.danger}22`, border: "none", borderRadius: 5, padding: "4px 8px", color: T.danger, cursor: "pointer", fontSize: 10 }}>\u2715</button>}
                    </div>
                ))}
        </div>
    );

    /* ─────────────────────────────────────────────────────────────────
       TASK 12 — Account Ban / Suspend Flow
       ───────────────────────────────────────────────────────────────── */
    const handleSuspend = async (account) => {
        if (!confirm(`Suspend account "${account.label}"? This will block the card and stop the profile.`)) return;
        setSuspending(account.id);
        try {
            // 1. Block card if linked
            if (account.cardUuid) {
                await leadingCardsApi.blockCard(account.cardUuid);
            }
            // 2. Stop profile if linked
            if (account.profileId) {
                const prof = data.profiles.find(p => p.id === account.profileId);
                if (prof && prof.mlProfileId) {
                    await multiloginApi.stopProfile(prof.mlProfileId);
                }
            }
            // 3. Update in D1
            await api.put(`/ops/accounts/${account.id}`, { status: "suspended", cardStatus: "BLOCKED" });
            // 4. Update local state
            upd("accounts", account.id, { status: "suspended", cardStatus: "BLOCKED" });
            await refreshCards();
            flash(`Account "${account.label}" suspended successfully`, "success");
        } catch (e) {
            flash(`Suspend failed: ${e.message}`, "error");
        } finally {
            setSuspending(null);
        }
    };

    /* ═════════════════════════════════════════════════════════════════
       RENDER
       ═════════════════════════════════════════════════════════════════ */
    return (
        <div style={{ animation: "fadeIn .3s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>🏢 Ops Center</h1>

            {/* ─── Tab Bar ────────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: "6px 14px", background: tab === t.id ? `${T.primary}18` : "transparent",
                        border: `1px solid ${tab === t.id ? T.primary : T.border}`, borderRadius: 6,
                        color: tab === t.id ? T.text : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                    }}>
                        <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
                        {t.count !== undefined && <span style={{ fontSize: 10, background: T.card2, padding: "1px 5px", borderRadius: 4 }}>{t.count}</span>}
                    </button>
                ))}
            </div>

            <StatusMsg msg={statusMsg?.msg} type={statusMsg?.type} />

            {/* ═══════════════════════════════════════════════════════════
                TAB: OVERVIEW
                ═══════════════════════════════════════════════════════════ */}
            {tab === "overview" && <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
                    {[
                        { l: "Domains", v: data.domains.length, c: "#60a5fa" },
                        { l: "Ads Accounts", v: data.accounts.length, c: T.success },
                        { l: "Profiles", v: data.profiles.length, c: "#a78bfa" },
                        { l: "Payments", v: lcCards.length, c: T.warning },
                        { l: "Risks", v: risks.length, c: risks.length > 0 ? T.danger : T.success },
                    ].map((m, i) => (
                        <Card key={i} style={{ padding: 14 }}>
                            <div style={{ fontSize: 10, color: T.muted }}>{m.l}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: m.c }}>{m.v}</div>
                        </Card>
                    ))}
                </div>

                {/* Risks summary */}
                {risks.length > 0 && <Card style={{ marginBottom: 16, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.danger, marginBottom: 8 }}>⚠ Active Risks</div>
                    {risks.slice(0, 5).map((r, i) => (
                        <div key={i} style={{ padding: "4px 0", fontSize: 12, color: T.muted }}>
                            <span style={{ marginRight: 6 }}>{RISK_ICONS[r.category] || "⚠️"}</span>
                            <Badge color={RISK_COLORS[r.level] || T.warning}>{r.level}</Badge>
                            <span style={{ marginLeft: 8 }}>{r.msg}</span>
                        </div>
                    ))}
                    {risks.length > 5 && <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>+{risks.length - 5} more — see Risks tab</div>}
                </Card>}

                {/* Task 11 — New Account (E2E) wizard launch */}
                <Card style={{ padding: 16, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Quick Actions</div>
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Create a full account stack end-to-end</div>
                        </div>
                        <Btn onClick={() => { setWizardStep(0); setWizardData({}); setModal("wizard"); }}>+ New Account (E2E)</Btn>
                    </div>
                </Card>
            </>}

            {/* ═══════════════════════════════════════════════════════════
                TAB: DOMAINS
                ═══════════════════════════════════════════════════════════ */}
            {tab === "domains" && <>
                <Btn onClick={() => setModal("domain")} style={{ marginBottom: 12 }}>+ Add Domain</Btn>
                <ListTable items={data.domains} coll="domains" cols={[
                    { key: "domain", flex: 2 },
                    { key: "registrar" },
                    { key: "cfAccountId", render: i => data.cfAccounts?.find(c => c.id === i.cfAccountId)?.label || "\u2014" },
                    { key: "status", render: i => <Badge color={i.status === "active" ? T.success : T.warning}>{i.status}</Badge> }
                ]} />
                {modal === "domain" && <AddModal title="Add Domain" coll="domains" fields={[
                    { key: "domain", label: "Domain", ph: "loanbridge.com" },
                    { key: "registrar", label: "Registrar", options: REGISTRARS },
                    { key: "cfAccountId", label: "Cloudflare Account", options: data.cfAccounts || [] },
                    { key: "accountId", label: "Ads Account ID" },
                    { key: "profileId", label: "Profile ID" }
                ]} />}
            </>}

            {/* ═══════════════════════════════════════════════════════════
                TAB: ACCOUNTS (Task 9 + Task 12)
                ═══════════════════════════════════════════════════════════ */}
            {tab === "accounts" && <>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <Btn onClick={() => setModal("account")}>+ Add Account</Btn>
                </div>

                {/* Account rows */}
                <div style={{ marginTop: 12 }}>
                    {data.accounts.length === 0
                        ? <div style={S.emptyState}>No accounts yet</div>
                        : data.accounts.map(acct => {
                            const linkedCard = lcCards.find(c => c.uuid === acct.cardUuid);
                            const linkedProfile = data.profiles.find(p => p.id === acct.profileId);
                            const isSuspending = suspending === acct.id;
                            return (
                                <div key={acct.id} style={{ ...S.row, padding: "10px 14px" }}>
                                    {/* Label */}
                                    <div style={{ flex: 2, fontWeight: 600, fontSize: 12 }}>{acct.label || "\u2014"}</div>
                                    {/* Email */}
                                    <div style={{ flex: 2, fontSize: 11, color: T.muted }}>{acct.email || "\u2014"}</div>
                                    {/* Linked card */}
                                    <div style={{ flex: 1.5, fontSize: 11 }}>
                                        {acct.cardUuid ? (
                                            <span>
                                                💳 ****{acct.cardLast4 || linkedCard?.card_last_4 || "?"}{" "}
                                                <Badge color={
                                                    (acct.cardStatus || linkedCard?.status) === "ACTIVE" ? T.success
                                                        : (acct.cardStatus || linkedCard?.status) === "BLOCKED" ? T.danger : T.warning
                                                }>{acct.cardStatus || linkedCard?.status || "?"}</Badge>
                                            </span>
                                        ) : <span style={{ color: T.dim }}>No card</span>}
                                    </div>
                                    {/* Linked profile */}
                                    <div style={{ flex: 1.5, fontSize: 11, color: T.muted }}>
                                        {linkedProfile ? linkedProfile.name : acct.profileId ? acct.profileId : "\u2014"}
                                    </div>
                                    {/* Monthly spend */}
                                    <div style={{ flex: 1, fontSize: 11, color: T.muted }}>
                                        {acct.monthlySpend ? `$${acct.monthlySpend}` : "\u2014"}
                                    </div>
                                    {/* Status badge + quick change */}
                                    <div style={{ flex: 1 }}>
                                        <select
                                            value={acct.status || "active"}
                                            onChange={e => {
                                                const newStatus = e.target.value;
                                                if (newStatus === "suspended") {
                                                    handleSuspend(acct);
                                                } else {
                                                    api.put(`/ops/accounts/${acct.id}`, { status: newStatus }).catch(() => { });
                                                    upd("accounts", acct.id, { status: newStatus });
                                                }
                                            }}
                                            style={{ ...S.select, padding: 4, fontSize: 10, width: "auto", minWidth: 80 }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 4 }}>
                                        <button onClick={() => setModal({ type: "edit-account", account: { ...acct } })} style={{ ...S.miniBtn, background: `${T.primary}22`, border: "none", borderRadius: 5, color: T.primary, cursor: "pointer" }}>Edit</button>
                                        <button onClick={() => handleSuspend(acct)} disabled={isSuspending || acct.status === "suspended"}
                                            style={{ ...S.miniBtn, background: `${T.danger}22`, border: "none", borderRadius: 5, color: T.danger, cursor: isSuspending ? "wait" : "pointer", opacity: acct.status === "suspended" ? 0.4 : 1 }}>
                                            {isSuspending ? "..." : "Suspend"}
                                        </button>
                                        <button onClick={() => del("accounts", acct.id)} style={{ background: `${T.danger}22`, border: "none", borderRadius: 5, padding: "4px 8px", color: T.danger, cursor: "pointer", fontSize: 10 }}>{"\u2715"}</button>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* ─── Add Account Modal (Task 9) ─────────────────────── */}
                {modal === "account" && (() => {
                    const cardOptions = lcCards.map(c => ({
                        id: c.uuid,
                        value: c.uuid,
                        displayLabel: `**** ${c.card_last_4} (${c.brand || "VCC"})`,
                    }));
                    const profileOptions = data.profiles.map(p => ({
                        id: p.id,
                        value: p.id,
                        displayLabel: p.name || p.id,
                    }));
                    return <AddModal title="Add Ads Account" coll="accounts" fields={[
                        { key: "label", label: "Account Name", ph: "Google Ads #1" },
                        { key: "email", label: "Email", ph: "account@domain.com" },
                        { key: "cardUuid", label: "Linked Card", options: cardOptions },
                        { key: "profileId", label: "Linked Profile", options: profileOptions },
                        { key: "budget", label: "Daily Budget ($)", type: "number", ph: "50" },
                    ]} onSubmit={(form) => {
                        const selectedCard = lcCards.find(c => c.uuid === form.cardUuid);
                        add("accounts", {
                            id: uid(),
                            ...form,
                            cardLast4: selectedCard?.card_last_4 || "",
                            cardStatus: selectedCard?.status || "",
                            status: "active",
                            createdAt: now(),
                        });
                    }} />;
                })()}

                {/* ─── Edit Account Modal (Task 9) ────────────────────── */}
                {modal && modal.type === "edit-account" && (() => {
                    const acct = modal.account;
                    const EditAccountModal = () => {
                        const [form, setForm] = useState({
                            label: acct.label || "",
                            email: acct.email || "",
                            cardUuid: acct.cardUuid || "",
                            profileId: acct.profileId || "",
                            budget: acct.budget || "",
                            status: acct.status || "active",
                        });
                        const cardOptions = lcCards.map(c => ({
                            value: c.uuid,
                            displayLabel: `**** ${c.card_last_4} (${c.brand || "VCC"})`,
                        }));
                        const profileOptions = data.profiles.map(p => ({
                            value: p.id,
                            displayLabel: p.name || p.id,
                        }));
                        return (
                            <div style={S.overlay}>
                                <Card style={{ width: 440, padding: 24, animation: "fadeIn .2s" }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Edit Account: {acct.label}</h3>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Account Name</label>
                                        <Inp value={form.label} onChange={v => setForm({ ...form, label: v })} />
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Email</label>
                                        <Inp value={form.email} onChange={v => setForm({ ...form, email: v })} />
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Linked Card</label>
                                        <select value={form.cardUuid} onChange={e => setForm({ ...form, cardUuid: e.target.value })} style={S.select}>
                                            <option value="">None</option>
                                            {cardOptions.map(o => <option key={o.value} value={o.value}>{o.displayLabel}</option>)}
                                        </select>
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Linked Profile</label>
                                        <select value={form.profileId} onChange={e => setForm({ ...form, profileId: e.target.value })} style={S.select}>
                                            <option value="">None</option>
                                            {profileOptions.map(o => <option key={o.value} value={o.value}>{o.displayLabel}</option>)}
                                        </select>
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Daily Budget ($)</label>
                                        <Inp value={form.budget} onChange={v => setForm({ ...form, budget: v })} type="number" />
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={S.select}>
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                    <div style={S.btnRow}>
                                        <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
                                        <Btn onClick={() => {
                                            const selectedCard = lcCards.find(c => c.uuid === form.cardUuid);
                                            const updates = {
                                                ...form,
                                                cardLast4: selectedCard?.card_last_4 || "",
                                                cardStatus: selectedCard?.status || "",
                                            };
                                            api.put(`/ops/accounts/${acct.id}`, updates).catch(() => { });
                                            upd("accounts", acct.id, updates);
                                            setModal(null);
                                            flash("Account updated");
                                        }}>Save Changes</Btn>
                                    </div>
                                </Card>
                            </div>
                        );
                    };
                    return <EditAccountModal />;
                })()}
            </>}

            {/* ═══════════════════════════════════════════════════════════
                TAB: CF ACCOUNTS
                ═══════════════════════════════════════════════════════════ */}
            {tab === "cf" && <>
                <Btn onClick={() => setModal("cf")} style={{ marginBottom: 12 }}>+ Add Cloudflare Account</Btn>
                <ListTable items={data.cfAccounts} coll="cf-accounts" cols={[{ key: "label", flex: 2 }, { key: "email" }]} />
                {modal === "cf" && <AddModal title="Add Cloudflare Account" coll="cf-accounts" fields={[
                    { key: "label", label: "Label", ph: "CF Account 1" },
                    { key: "email", label: "Login Email", ph: "user@example.com" },
                    { key: "apiKey", label: "Global API Key", type: "password" }
                ]} />}
            </>}

            {/* ═══════════════════════════════════════════════════════════
                TAB: PROFILES (Task 8)
                ═══════════════════════════════════════════════════════════ */}
            {tab === "profiles" && <>
                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    <Btn onClick={() => setModal("mlx-create")}>+ Create Profile</Btn>
                    <Btn variant="ghost" onClick={async () => {
                        setSyncing(true);
                        try {
                            const res = await multiloginApi.syncProfiles();
                            if (res.error) { flash(`Sync failed: ${res.error}`, "error"); }
                            else { flash(`Synced: ${res.created || 0} created, ${res.deleted || 0} removed`); }
                            await refreshProfiles();
                        } catch (e) { flash(`Sync failed: ${e.message}`, "error"); }
                        finally { setSyncing(false); }
                    }}>{syncing ? "Syncing..." : "\uD83D\uDD04 Sync from MLX"}</Btn>
                    <Btn variant="ghost" onClick={() => {
                        setMlLoading(true);
                        refreshProfiles().finally(() => setMlLoading(false));
                    }} style={{ fontSize: 11 }}>↻ Refresh</Btn>
                    <Btn variant="danger" onClick={async () => {
                        if (!confirm("Stop all running profiles?")) return;
                        const running = mlProfiles.filter(p => p.status === "running" || p.status === "started");
                        for (const p of running) {
                            const pid = p.uuid || p.id;
                            await multiloginApi.stopProfile(pid).catch(() => {});
                        }
                        await refreshProfiles();
                        flash(`Stopped ${running.length} profiles`);
                    }} style={{ fontSize: 11, marginLeft: "auto" }}>⏹ Stop All</Btn>
                </div>

                {/* Unified profile list */}
                {mlLoading ? <div style={S.emptyState}>Loading profiles...</div> : (
                    <div>
                        {/* Header row */}
                        <div style={{ display: "flex", padding: "6px 12px", fontSize: 10, fontWeight: 700, color: T.dim, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            <div style={{ flex: 2 }}>Name</div>
                            <div style={{ flex: 1.2 }}>MLX ID</div>
                            <div style={{ flex: 0.8 }}>Browser</div>
                            <div style={{ flex: 0.8 }}>OS</div>
                            <div style={{ flex: 1.5 }}>Proxy</div>
                            <div style={{ flex: 0.8 }}>Status</div>
                            <div style={{ flex: 1.5, textAlign: "right" }}>Actions</div>
                        </div>

                        {mlProfiles.length === 0
                            ? <div style={S.emptyState}>No profiles found. Click "Sync from MLX" or create a new profile.</div>
                            : mlProfiles.map(p => {
                                const pid = p.uuid || p.id;
                                const isRunning = p.status === "running" || p.status === "started";
                                const proxyInfo = p.parameters?.proxy?.host
                                    ? `${p.parameters.proxy.host}:${p.parameters.proxy.port || ""}`
                                    : p.proxy || "\u2014";
                                // Find linked D1 profile
                                const d1Profile = data.profiles.find(dp => dp.mlProfileId === pid);
                                return (
                                    <div key={pid} style={{ ...S.row, padding: "10px 12px" }}>
                                        <div style={{ flex: 2, fontWeight: 600, fontSize: 12 }}>
                                            {p.name || pid.slice(0, 12)}
                                            {d1Profile?.accountId && <span style={{ marginLeft: 6, fontSize: 9, color: T.dim, background: T.card2, padding: "1px 5px", borderRadius: 3 }}>A:{d1Profile.accountId.slice(0, 6)}</span>}
                                        </div>
                                        <div style={{ flex: 1.2, fontSize: 10, color: T.muted, fontFamily: "monospace" }}>
                                            {pid.slice(0, 10)}...
                                        </div>
                                        <div style={{ flex: 0.8, fontSize: 11, color: T.muted }}>
                                            {p.browser_type || d1Profile?.browserType || "\u2014"}
                                        </div>
                                        <div style={{ flex: 0.8, fontSize: 11, color: T.muted }}>
                                            {p.os_type || d1Profile?.os || "\u2014"}
                                        </div>
                                        <div style={{ flex: 1.5, fontSize: 10, color: T.muted, fontFamily: "monospace" }}>
                                            {proxyInfo}
                                        </div>
                                        <div style={{ flex: 0.8 }}>
                                            <Dot c={isRunning ? T.success : "#666"} label={isRunning ? "Running" : "Stopped"} />
                                        </div>
                                        <div style={{ flex: 1.5, display: "flex", gap: 3, justifyContent: "flex-end" }}>
                                            {isRunning ? (
                                                <Btn variant="danger" onClick={() => {
                                                    multiloginApi.stopProfile(pid).then(() => {
                                                        refreshProfiles();
                                                        flash("Profile stopped");
                                                    }).catch(e => flash(`Stop failed: ${e.message}`, "error"));
                                                }} style={S.miniBtn}>Stop</Btn>
                                            ) : (
                                                <Btn variant="success" onClick={() => {
                                                    multiloginApi.startProfile(pid).then(() => {
                                                        refreshProfiles();
                                                        flash("Profile started");
                                                    }).catch(e => flash(`Start failed: ${e.message}`, "error"));
                                                }} style={S.miniBtn}>Start</Btn>
                                            )}
                                            <Btn variant="ghost" onClick={() => {
                                                multiloginApi.cloneProfile(pid).then(() => {
                                                    refreshProfiles();
                                                    flash("Profile cloned");
                                                }).catch(e => flash(`Clone failed: ${e.message}`, "error"));
                                            }} style={S.miniBtn}>Clone</Btn>
                                            <Btn variant="ghost" onClick={() => {
                                                if (!confirm(`Delete profile "${p.name || pid}"?`)) return;
                                                const folderId = p.folder_id || settings.mlFolderId || "";
                                                multiloginApi.deleteProfiles([pid], folderId).then(() => {
                                                    refreshProfiles();
                                                    flash("Profile deleted");
                                                }).catch(e => flash(`Delete failed: ${e.message}`, "error"));
                                            }} style={{ ...S.miniBtn, color: T.danger }}>Del</Btn>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {/* D1 profiles (unlinked) */}
                {data.profiles.filter(p => !mlProfiles.some(mp => (mp.uuid || mp.id) === p.mlProfileId)).length > 0 && <>
                    <div style={{ ...S.sectionTitle, marginTop: 24, fontSize: 11, color: T.dim }}>Local Only (not linked to MLX)</div>
                    <ListTable items={data.profiles.filter(p => !mlProfiles.some(mp => (mp.uuid || mp.id) === p.mlProfileId))} coll="profiles" cols={[
                        { key: "name", flex: 2 },
                        { key: "proxyIp", render: i => i.proxyIp || i.proxyHost || "\u2014" },
                        { key: "browserType" },
                        { key: "mlProfileId", render: i => i.mlProfileId ? <Badge color={T.primary}>ML: {i.mlProfileId.slice(0, 8)}...</Badge> : <span style={{ color: T.dim }}>Not linked</span> },
                    ]} />
                </>}

                {/* Enhanced Create Profile Modal */}
                {modal === "mlx-create" && (() => {
                    const MLXCreateModal = () => {
                        const [form, setForm] = useState({
                            name: "",
                            browser_type: "mimic",
                            os_type: "windows",
                            proxy_host: "",
                            proxy_port: "",
                            proxy_user: "",
                            proxy_pass: "",
                            proxy_type: "http",
                            start_urls: "",
                            accountId: "",
                        });
                        const [creating, setCreating] = useState(false);
                        return (
                            <div style={S.overlay}>
                                <Card style={{ width: 520, padding: 24, animation: "fadeIn .2s", maxHeight: "85vh", overflowY: "auto" }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create MLX Profile</h3>

                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Profile Name</label>
                                        <Inp value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Account-01" />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Browser Type</label>
                                            <select value={form.browser_type} onChange={e => setForm({ ...form, browser_type: e.target.value })} style={S.select}>
                                                <option value="mimic">Mimic</option>
                                                <option value="stealthfox">Stealthfox</option>
                                            </select>
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>OS Type</label>
                                            <select value={form.os_type} onChange={e => setForm({ ...form, os_type: e.target.value })} style={S.select}>
                                                <option value="windows">Windows</option>
                                                <option value="macos">macOS</option>
                                                <option value="linux">Linux</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ ...S.sectionTitle, marginTop: 12, fontSize: 11 }}>Proxy Settings</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Host</label>
                                            <Inp value={form.proxy_host} onChange={v => setForm({ ...form, proxy_host: v })} placeholder="proxy.example.com" />
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Port</label>
                                            <Inp value={form.proxy_port} onChange={v => setForm({ ...form, proxy_port: v })} placeholder="8080" />
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Type</label>
                                            <select value={form.proxy_type} onChange={e => setForm({ ...form, proxy_type: e.target.value })} style={S.select}>
                                                <option value="http">HTTP</option>
                                                <option value="socks5">SOCKS5</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Proxy Username</label>
                                            <Inp value={form.proxy_user} onChange={v => setForm({ ...form, proxy_user: v })} placeholder="user" />
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Proxy Password</label>
                                            <Inp value={form.proxy_pass} onChange={v => setForm({ ...form, proxy_pass: v })} type="password" placeholder="pass" />
                                        </div>
                                    </div>

                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Custom Start URLs (one per line)</label>
                                        <textarea value={form.start_urls} onChange={e => setForm({ ...form, start_urls: e.target.value })} placeholder={"https://ads.google.com\nhttps://business.facebook.com"} rows={3}
                                            style={{ ...S.select, resize: "vertical", minHeight: 60 }} />
                                    </div>

                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Link to Account (optional)</label>
                                        <select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} style={S.select}>
                                            <option value="">None</option>
                                            {data.accounts.map(a => <option key={a.id} value={a.id}>{a.label || a.email || a.id}</option>)}
                                        </select>
                                    </div>

                                    <div style={S.btnRow}>
                                        <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
                                        <Btn disabled={creating} onClick={async () => {
                                            setCreating(true);
                                            try {
                                                const folderId = settings.mlFolderId || "";
                                                const profileData = {
                                                    browser_type: form.browser_type,
                                                    folder_id: folderId,
                                                    name: form.name || `Profile-${uid().slice(0, 6)}`,
                                                    os_type: form.os_type,
                                                    parameters: {
                                                        proxy: form.proxy_host ? {
                                                            host: form.proxy_host,
                                                            type: form.proxy_type,
                                                            port: parseInt(form.proxy_port) || 8080,
                                                            username: form.proxy_user,
                                                            password: form.proxy_pass,
                                                        } : undefined,
                                                        flags: {
                                                            navigator_masking: "mask",
                                                            audio_masking: "mask",
                                                            localization_masking: "mask",
                                                            geolocation_popup: "prompt",
                                                            geolocation_masking: "mask",
                                                            timezone_masking: "mask",
                                                            canvas_noise: "natural",
                                                            graphics_noise: "natural",
                                                            graphics_masking: "mask",
                                                            webrtc_masking: "natural",
                                                            fonts_masking: "mask",
                                                            media_devices_masking: "mask",
                                                            screen_masking: "mask",
                                                            ports_masking: "mask",
                                                        },
                                                        custom_start_urls: form.start_urls ? form.start_urls.split("\n").map(u => u.trim()).filter(Boolean) : undefined,
                                                    },
                                                };
                                                const res = await multiloginApi.createProfile(profileData);
                                                if (res.error) throw new Error(res.error);
                                                await refreshProfiles();
                                                setModal(null);
                                                flash("Profile created in MLX + D1");
                                            } catch (e) {
                                                flash(`Create failed: ${e.message || e.detail || "Unknown error"}`, "error");
                                            } finally {
                                                setCreating(false);
                                            }
                                        }}>{creating ? "Creating..." : "Create Profile"}</Btn>
                                    </div>
                                </Card>
                            </div>
                        );
                    };
                    return <MLXCreateModal />;
                })()}
            </>}

            {/* ═══════════════════════════════════════════════════════════
                TAB: PAYMENTS (Task 7)
                ═══════════════════════════════════════════════════════════ */}
            {tab === "payments" && <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Btn onClick={() => setModal("lc-card")}>+ Create Card</Btn>
                        <Btn variant="ghost" onClick={() => {
                            setLcLoading(true);
                            refreshCards().finally(() => setLcLoading(false));
                        }} style={{ fontSize: 11 }}>🔄 Refresh</Btn>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>LeadingCards Management</div>
                </div>

                {/* Filter bar (Task 7) */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {[
                        { label: "All", value: "" },
                        { label: "Active", value: "ACTIVE" },
                        { label: "Blocked", value: "BLOCKED" },
                    ].map(f => (
                        <button key={f.value} onClick={() => setLcFilter(f.value)} style={S.filterBtn(lcFilter === f.value)}>
                            {f.label} {f.value === "" ? `(${lcCards.length})` : `(${lcCards.filter(c => c.status === f.value).length})`}
                        </button>
                    ))}
                </div>

                {/* Card list */}
                {lcLoading ? <div style={S.emptyState}>Loading cards...</div> : (
                    <div style={{ marginTop: 8 }}>
                        {filteredCards.length === 0
                            ? <div style={S.emptyState}>{lcFilter ? `No ${lcFilter} cards` : "No cards yet"}</div>
                            : filteredCards.map(card => (
                                <div key={card.uuid} style={S.row}>
                                    {/* Card info */}
                                    <div style={{ flex: 2, fontWeight: 600, fontSize: 12 }}>
                                        💳 **** {card.card_last_4} <span style={{ fontWeight: 400, color: T.muted }}>({card.brand || "VCC"})</span>
                                    </div>
                                    {/* Limit */}
                                    <div style={{ flex: 1.2, fontSize: 11 }}>
                                        {changingLimit && changingLimit.uuid === card.uuid ? (
                                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                <Inp value={changingLimit.value} onChange={v => setChangingLimit({ ...changingLimit, value: v })} type="number"
                                                    style={{ width: 70, padding: "3px 6px", fontSize: 11 }} />
                                                <button onClick={async () => {
                                                    try {
                                                        await leadingCardsApi.changeLimit(card.uuid, parseFloat(changingLimit.value));
                                                        await refreshCards();
                                                        flash("Limit updated");
                                                    } catch (e) { flash(`Failed: ${e.message}`, "error"); }
                                                    setChangingLimit(null);
                                                }} style={{ background: T.success, border: "none", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>OK</button>
                                                <button onClick={() => setChangingLimit(null)} style={{ background: "transparent", border: "none", color: T.dim, cursor: "pointer", fontSize: 10 }}>X</button>
                                            </div>
                                        ) : (
                                            <span style={{ cursor: "pointer" }} onClick={() => setChangingLimit({ uuid: card.uuid, value: card.limit || "" })}>
                                                ${card.limit} {card.currency}
                                            </span>
                                        )}
                                    </div>
                                    {/* Status */}
                                    <div style={{ flex: 0.8 }}>
                                        <Badge color={card.status === "ACTIVE" ? T.success : card.status === "BLOCKED" ? T.danger : T.warning}>{card.status}</Badge>
                                    </div>
                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 4 }}>
                                        {card.status === "ACTIVE" ? (
                                            <Btn variant="ghost" onClick={() => {
                                                if (confirm("Block this card?")) {
                                                    leadingCardsApi.blockCard(card.uuid)
                                                        .then(() => { refreshCards(); flash("Card blocked"); })
                                                        .catch(e => flash(`Block failed: ${e.message}`, "error"));
                                                }
                                            }} style={{ ...S.miniBtn, color: T.danger }}>Block</Btn>
                                        ) : (
                                            <Btn variant="ghost" onClick={() => {
                                                leadingCardsApi.activateCard(card.uuid)
                                                    .then(() => { refreshCards(); flash("Card activated"); })
                                                    .catch(e => flash(`Activate failed: ${e.message}`, "error"));
                                            }} style={{ ...S.miniBtn, color: T.success }}>Activate</Btn>
                                        )}
                                        <Btn variant="ghost" onClick={() => setChangingLimit({ uuid: card.uuid, value: card.limit || "" })}
                                            style={{ ...S.miniBtn, color: T.primary }}>Limit</Btn>
                                        <Btn variant="ghost" onClick={() => {
                                            setLcLoading(true);
                                            refreshCards().finally(() => setLcLoading(false));
                                        }} style={{ ...S.miniBtn, color: T.muted }}>↻</Btn>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* Transactions sub-section (Task 7) */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={S.sectionTitle}>Recent Transactions</div>
                        <Btn variant="ghost" onClick={() => {
                            const fromDate = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
                            leadingCardsApi.getTransactions(fromDate)
                                .then(res => {
                                    setLcTransactions(res.results || res || []);
                                    flash(`Loaded ${(res.results || res || []).length} transactions`);
                                })
                                .catch(e => flash(`Failed: ${e.message}`, "error"));
                        }} style={{ fontSize: 11 }}>Load Transactions</Btn>
                    </div>
                    {lcTransactions.length === 0
                        ? <div style={{ ...S.emptyState, fontSize: 11 }}>Click "Load Transactions" to fetch recent activity</div>
                        : (
                            <div>
                                {lcTransactions.slice(0, 50).map((tx, i) => (
                                    <div key={tx.uuid || i} style={{ ...S.row, fontSize: 11 }}>
                                        <div style={{ flex: 1.5, fontWeight: 600 }}>****{tx.card_last_4 || "\u2014"}</div>
                                        <div style={{ flex: 2, color: T.muted }}>{tx.merchant_name || tx.description || "\u2014"}</div>
                                        <div style={{ flex: 1, color: tx.type === "decline" ? T.danger : T.success, fontWeight: 600 }}>
                                            {tx.type === "decline" ? "DECLINED" : `$${tx.amount || 0}`}
                                        </div>
                                        <div style={{ flex: 1, color: T.dim }}>{tx.currency || ""}</div>
                                        <div style={{ flex: 1.5, color: T.dim }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "\u2014"}</div>
                                    </div>
                                ))}
                                {lcTransactions.length > 50 && <div style={{ textAlign: "center", fontSize: 11, color: T.dim, padding: 8 }}>Showing 50 of {lcTransactions.length}</div>}
                            </div>
                        )}
                </div>

                {/* Create Card modal (Task 7 — cleaned up, no settings params) */}
                {modal === "lc-card" && (() => {
                    const CreateCardModal = () => {
                        const [form, setForm] = useState({ bin_uuid: "", limit: "10", billing_address_uuid: "", comment: "" });
                        const [creating, setCreating] = useState(false);
                        return (
                            <div style={S.overlay}>
                                <Card style={{ width: 450, padding: 24, animation: "fadeIn .2s" }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create New Card</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                        <div>
                                            <label style={S.label}>Select BIN</label>
                                            <select value={form.bin_uuid} onChange={e => setForm({ ...form, bin_uuid: e.target.value })} style={S.select}>
                                                <option value="">Select BIN...</option>
                                                {lcBins.map(b => <option key={b.uuid} value={b.uuid}>{b.brand} - {b.card_type} ({b.country})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={S.label}>Limit ($)</label>
                                            <Inp value={form.limit} onChange={v => setForm({ ...form, limit: v })} type="number" placeholder="10" />
                                        </div>
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Billing Address</label>
                                        <select value={form.billing_address_uuid} onChange={e => setForm({ ...form, billing_address_uuid: e.target.value })} style={S.select}>
                                            <option value="">Select Address...</option>
                                            {lcAddresses.map(a => <option key={a.uuid} value={a.uuid}>{a.first_name} {a.last_name} - {a.address}, {a.city}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={S.label}>Comment (Auto-tagging)</label>
                                        <Inp value={form.comment} onChange={v => setForm({ ...form, comment: v })} placeholder="google-ads-account-X" />
                                    </div>
                                    <div style={S.btnRow}>
                                        <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
                                        <Btn disabled={creating} onClick={async () => {
                                            setCreating(true);
                                            try {
                                                await leadingCardsApi.createCard({
                                                    bin_uuid: form.bin_uuid,
                                                    limit: parseFloat(form.limit) || 10,
                                                    comment: form.comment,
                                                    billing_address_uuid: form.billing_address_uuid,
                                                    amount: 1,
                                                });
                                                await refreshCards();
                                                setModal(null);
                                                flash("Card created");
                                            } catch (e) {
                                                flash(`Create failed: ${e.message}`, "error");
                                            } finally {
                                                setCreating(false);
                                            }
                                        }}>{creating ? "Creating..." : "Create Card"}</Btn>
                                    </div>
                                </Card>
                            </div>
                        );
                    };
                    return <CreateCardModal />;
                })()}
            </>}

            {/* ═══════════════════════════════════════════════════════════
                TAB: RISKS
                ═══════════════════════════════════════════════════════════ */}
            {tab === "risks" && (
                risks.length === 0
                    ? <Card style={{ textAlign: "center", padding: 40 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>No risks detected</div>
                    </Card>
                    : risks.map((r, i) => (
                        <Card key={i} style={{ padding: "12px 16px", marginBottom: 6, borderColor: RISK_COLORS[r.level] ? `${RISK_COLORS[r.level]}44` : T.border }}>
                            <span style={{ marginRight: 6 }}>{RISK_ICONS[r.category] || "⚠️"}</span>
                            <Badge color={RISK_COLORS[r.level] || T.warning}>{r.level}</Badge>
                            <span style={{ marginLeft: 10, fontSize: 13 }}>{r.msg}</span>
                            {r.affectedIds && <span style={{ marginLeft: 8, fontSize: 10, color: T.dim }}>({r.affectedIds.length} affected)</span>}
                        </Card>
                    ))
            )}

            {/* ═══════════════════════════════════════════════════════════
                TAB: LOGS
                ═══════════════════════════════════════════════════════════ */}
            {tab === "logs" && (
                data.logs.length === 0
                    ? <Card style={{ textAlign: "center", padding: 40, color: T.dim }}>No activity yet</Card>
                    : <Card style={{ padding: 12 }}>
                        {data.logs.slice(0, 50).map(log => (
                            <div key={log.id} style={{ padding: "5px 8px", borderBottom: `1px solid ${T.border}`, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: T.muted }}>{log.msg}</span>
                                <span style={{ color: T.dim, fontSize: 10 }}>{new Date(log.ts).toLocaleString()}</span>
                            </div>
                        ))}
                    </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MODAL: ACCOUNT CREATION WIZARD (Task 11)
                ═══════════════════════════════════════════════════════════ */}
            {modal === "wizard" && (() => {
                const WizardModal = () => {
                    const [step, setStep] = useState(wizardStep);
                    const [wd, setWd] = useState(wizardData);
                    const [busy, setBusy] = useState(false);
                    const [wizError, setWizError] = useState(null);
                    const [wizSuccess, setWizSuccess] = useState(false);

                    const steps = [
                        { label: "1. Create Card", icon: "💳" },
                        { label: "2. Create Profile", icon: "👤" },
                        { label: "3. Account Details", icon: "💰" },
                        { label: "4. Review & Create", icon: "🚀" },
                    ];

                    const handleFinish = async () => {
                        setBusy(true);
                        setWizError(null);
                        try {
                            // Step 1: Create card
                            let cardRes = null;
                            if (wd.bin_uuid) {
                                cardRes = await leadingCardsApi.createCard({
                                    bin_uuid: wd.bin_uuid,
                                    limit: parseFloat(wd.card_limit) || 10,
                                    comment: wd.card_comment || "",
                                    billing_address_uuid: wd.billing_address_uuid || "",
                                    amount: 1,
                                });
                            }

                            // Step 2: Create profile
                            let profileRes = null;
                            if (wd.profile_browser) {
                                const profileData = {
                                    browser_type: wd.profile_browser,
                                    os_type: wd.profile_os || "windows",
                                    parameters: {
                                        proxy: wd.proxy_host ? {
                                            host: wd.proxy_host,
                                            port: parseInt(wd.proxy_port) || 8080,
                                            username: wd.proxy_user || "",
                                            password: wd.proxy_pass || "",
                                            type: "http",
                                        } : undefined,
                                    },
                                };
                                profileRes = await multiloginApi.createProfile(profileData);
                            }

                            // Step 3: Save account to D1
                            const newCardUuid = cardRes?.uuid || cardRes?.results?.[0]?.uuid || "";
                            const newProfileId = profileRes?.uuid || profileRes?.id || "";
                            const refreshedCards = await leadingCardsApi.getCards();
                            setLcCards(refreshedCards.results || []);
                            const newCard = (refreshedCards.results || []).find(c => c.uuid === newCardUuid);

                            const localProfileId = uid();
                            // Save local profile entry
                            if (newProfileId) {
                                add("profiles", {
                                    id: localProfileId,
                                    name: wd.acct_label ? `Profile - ${wd.acct_label}` : `Profile ${localProfileId}`,
                                    proxyIp: wd.proxy_host || "",
                                    browserType: wd.profile_browser || "mimic",
                                    mlProfileId: newProfileId,
                                    status: "active",
                                    createdAt: now(),
                                });
                            }

                            // Save account entry
                            add("accounts", {
                                id: uid(),
                                label: wd.acct_label || "New Account",
                                email: wd.acct_email || "",
                                budget: wd.acct_budget || "",
                                cardUuid: newCardUuid,
                                cardLast4: newCard?.card_last_4 || "",
                                cardStatus: newCard?.status || "",
                                profileId: newProfileId ? localProfileId : "",
                                status: "active",
                                createdAt: now(),
                            });

                            await refreshProfiles();
                            setWizSuccess(true);
                            flash("Account stack created end-to-end!");
                        } catch (e) {
                            setWizError(e.message || "Unknown error");
                        } finally {
                            setBusy(false);
                        }
                    };

                    if (wizSuccess) {
                        return (
                            <div style={S.overlay}>
                                <Card style={{ width: 460, padding: 32, textAlign: "center", animation: "fadeIn .2s" }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Account Stack Created!</h3>
                                    <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Card, profile, and account have been created and linked.</p>
                                    <Btn onClick={() => { setModal(null); setWizardStep(0); setWizardData({}); }}>Close</Btn>
                                </Card>
                            </div>
                        );
                    }

                    return (
                        <div style={S.overlay}>
                            <Card style={{ width: 560, padding: 24, animation: "fadeIn .2s" }}>
                                {/* Stepper */}
                                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                                    {steps.map((s, i) => (
                                        <div key={i} style={{
                                            flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                            background: i === step ? `${T.primary}22` : "transparent",
                                            color: i === step ? T.text : i < step ? T.success : T.dim,
                                            border: `1px solid ${i === step ? T.primary : "transparent"}`,
                                        }}>
                                            <span style={{ marginRight: 4 }}>{s.icon}</span>{s.label}
                                        </div>
                                    ))}
                                </div>

                                {wizError && <div style={{ padding: 8, marginBottom: 12, borderRadius: 6, background: `${T.danger}12`, border: `1px solid ${T.danger}44`, color: T.danger, fontSize: 12 }}>{wizError}</div>}

                                {/* Step 0: Create Card */}
                                {step === 0 && <>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Step 1: Create Card</h3>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Select BIN</label>
                                        <select value={wd.bin_uuid || ""} onChange={e => setWd({ ...wd, bin_uuid: e.target.value })} style={S.select}>
                                            <option value="">Select BIN...</option>
                                            {lcBins.map(b => <option key={b.uuid} value={b.uuid}>{b.brand} - {b.card_type} ({b.country})</option>)}
                                        </select>
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Billing Address</label>
                                        <select value={wd.billing_address_uuid || ""} onChange={e => setWd({ ...wd, billing_address_uuid: e.target.value })} style={S.select}>
                                            <option value="">Select Address...</option>
                                            {lcAddresses.map(a => <option key={a.uuid} value={a.uuid}>{a.first_name} {a.last_name} - {a.address}, {a.city}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Card Limit ($)</label>
                                            <Inp value={wd.card_limit || ""} onChange={v => setWd({ ...wd, card_limit: v })} type="number" placeholder="10" />
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Comment</label>
                                            <Inp value={wd.card_comment || ""} onChange={v => setWd({ ...wd, card_comment: v })} placeholder="auto-tag" />
                                        </div>
                                    </div>
                                </>}

                                {/* Step 1: Create Profile */}
                                {step === 1 && <>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Step 2: Create Profile</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Browser Type</label>
                                            <select value={wd.profile_browser || "mimic"} onChange={e => setWd({ ...wd, profile_browser: e.target.value })} style={S.select}>
                                                <option value="mimic">Mimic</option>
                                                <option value="stealthfox">Stealthfox</option>
                                            </select>
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>OS Type</label>
                                            <select value={wd.profile_os || "windows"} onChange={e => setWd({ ...wd, profile_os: e.target.value })} style={S.select}>
                                                <option value="windows">Windows</option>
                                                <option value="macos">macOS</option>
                                                <option value="linux">Linux</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ ...S.sectionTitle, marginTop: 8, fontSize: 11 }}>Proxy</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Host</label>
                                            <Inp value={wd.proxy_host || ""} onChange={v => setWd({ ...wd, proxy_host: v })} placeholder="proxy.example.com" />
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Port</label>
                                            <Inp value={wd.proxy_port || ""} onChange={v => setWd({ ...wd, proxy_port: v })} placeholder="8080" />
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Username</label>
                                            <Inp value={wd.proxy_user || ""} onChange={v => setWd({ ...wd, proxy_user: v })} />
                                        </div>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Password</label>
                                            <Inp value={wd.proxy_pass || ""} onChange={v => setWd({ ...wd, proxy_pass: v })} type="password" />
                                        </div>
                                    </div>
                                </>}

                                {/* Step 2: Account Details */}
                                {step === 2 && <>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Step 3: Account Details</h3>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Account Label</label>
                                        <Inp value={wd.acct_label || ""} onChange={v => setWd({ ...wd, acct_label: v })} placeholder="Google Ads - US Market 1" />
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Email</label>
                                        <Inp value={wd.acct_email || ""} onChange={v => setWd({ ...wd, acct_email: v })} placeholder="account@domain.com" />
                                    </div>
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>Daily Budget ($)</label>
                                        <Inp value={wd.acct_budget || ""} onChange={v => setWd({ ...wd, acct_budget: v })} type="number" placeholder="50" />
                                    </div>
                                </>}

                                {/* Step 3: Review & Create */}
                                {step === 3 && <>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Step 4: Review & Create</h3>
                                    <Card style={{ padding: 14, marginBottom: 12, background: T.card2 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Summary</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                                            <div>
                                                <div style={{ color: T.dim, fontSize: 10 }}>Card</div>
                                                <div>{wd.bin_uuid ? `BIN: ${lcBins.find(b => b.uuid === wd.bin_uuid)?.brand || wd.bin_uuid.slice(0, 8)}, Limit: $${wd.card_limit || 10}` : "No card"}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: T.dim, fontSize: 10 }}>Profile</div>
                                                <div>{wd.profile_browser || "mimic"} / {wd.profile_os || "windows"}{wd.proxy_host ? ` via ${wd.proxy_host}` : ""}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: T.dim, fontSize: 10 }}>Account</div>
                                                <div>{wd.acct_label || "Unnamed"}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: T.dim, fontSize: 10 }}>Budget</div>
                                                <div>${wd.acct_budget || "0"}/day</div>
                                            </div>
                                        </div>
                                    </Card>
                                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
                                        This will create a new LeadingCards card, a new Multilogin profile, and save the linked account to the database.
                                    </div>
                                </>}

                                {/* Navigation */}
                                <div style={{ ...S.btnRow, marginTop: 20 }}>
                                    <Btn variant="ghost" onClick={() => { setModal(null); setWizardStep(0); setWizardData({}); }}>Cancel</Btn>
                                    {step > 0 && <Btn variant="ghost" onClick={() => setStep(step - 1)}>Back</Btn>}
                                    {step < 3 ? (
                                        <Btn onClick={() => { setWd({ ...wd }); setStep(step + 1); }}>Next</Btn>
                                    ) : (
                                        <Btn disabled={busy} onClick={handleFinish}>
                                            {busy ? "Creating..." : "Create Everything"}
                                        </Btn>
                                    )}
                                </div>
                            </Card>
                        </div>
                    );
                };
                return <WizardModal />;
            })()}
        </div>
    );
}
