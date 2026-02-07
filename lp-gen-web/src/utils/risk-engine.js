/**
 * LP Factory V2 — Risk Detection Engine
 * Pure functions that analyze ops data for correlation risks.
 */

export function detectRisks({ accounts = [], payments = [], profiles = [], domains = [], lcCards = [] }) {
    const risks = [];

    // 1. Shared payment ID across accounts
    const payMap = {};
    accounts.forEach(a => {
        if (a.paymentId) {
            if (!payMap[a.paymentId]) payMap[a.paymentId] = [];
            payMap[a.paymentId].push(a);
        }
    });
    Object.entries(payMap).forEach(([pid, accs]) => {
        if (accs.length > 1) {
            const p = payments.find(x => x.id === pid);
            risks.push({
                level: "critical",
                category: "payment",
                msg: `Payment "${p?.label || pid}" shared by ${accs.length} accounts: ${accs.map(a => a.label).join(", ")}`,
                affectedIds: accs.map(a => a.id),
            });
        }
    });

    // 2. Duplicate card UUID across accounts
    const cardMap = {};
    accounts.forEach(a => {
        if (a.cardUuid) {
            if (!cardMap[a.cardUuid]) cardMap[a.cardUuid] = [];
            cardMap[a.cardUuid].push(a);
        }
    });
    Object.entries(cardMap).forEach(([cid, accs]) => {
        if (accs.length > 1) {
            risks.push({
                level: "critical",
                category: "card",
                msg: `Card "${cid.slice(0, 8)}..." used by ${accs.length} accounts: ${accs.map(a => a.label).join(", ")}`,
                affectedIds: accs.map(a => a.id),
            });
        }
    });

    // 3. Duplicate proxy IP across profiles
    const proxyMap = {};
    profiles.forEach(p => {
        const ip = p.proxyIp || p.proxyHost;
        if (ip) {
            if (!proxyMap[ip]) proxyMap[ip] = [];
            proxyMap[ip].push(p);
        }
    });
    Object.entries(proxyMap).forEach(([ip, profs]) => {
        if (profs.length > 1) {
            risks.push({
                level: "high",
                category: "proxy",
                msg: `Proxy IP "${ip}" shared by ${profs.length} profiles: ${profs.map(p => p.name).join(", ")}`,
                affectedIds: profs.map(p => p.id),
            });
        }
    });

    // 4. Too many domains per account (>5 = risk)
    accounts.forEach(a => {
        const doms = domains.filter(d => d.accountId === a.id);
        if (doms.length > 5) {
            risks.push({
                level: "high",
                category: "domain",
                msg: `Account "${a.label}" has ${doms.length} domains (recommended: <=5)`,
                affectedIds: [a.id],
            });
        }
    });

    // 5. Registrar concentration (>10 domains at same registrar)
    const regMap = {};
    domains.forEach(d => {
        if (d.registrar) {
            if (!regMap[d.registrar]) regMap[d.registrar] = [];
            regMap[d.registrar].push(d);
        }
    });
    Object.entries(regMap).forEach(([reg, doms]) => {
        if (doms.length > 10) {
            risks.push({
                level: "medium",
                category: "registrar",
                msg: `${doms.length} domains using registrar "${reg}" — consider diversifying`,
                affectedIds: doms.map(d => d.id),
            });
        }
    });

    // 6. LeadingCards: duplicate payment_id on live cards
    if (lcCards.length > 0) {
        const lcPayMap = {};
        lcCards.forEach(c => {
            if (c.payment_id) {
                if (!lcPayMap[c.payment_id]) lcPayMap[c.payment_id] = [];
                lcPayMap[c.payment_id].push(c);
            }
        });
        Object.entries(lcPayMap).forEach(([pid, cards]) => {
            if (cards.length > 1) {
                risks.push({
                    level: "critical",
                    category: "lc-card",
                    msg: `LeadingCards payment_id "${pid}" used by ${cards.length} cards (last4: ${cards.map(c => c.card_last_4).join(", ")})`,
                    affectedIds: cards.map(c => c.uuid),
                });
            }
        });
    }

    // Sort: critical > high > medium > low
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return risks.sort((a, b) => (order[a.level] ?? 9) - (order[b.level] ?? 9));
}

export const RISK_ICONS = {
    payment: "💳",
    card: "💳",
    proxy: "🌐",
    domain: "🌍",
    registrar: "📋",
    "lc-card": "💳",
};

export const RISK_COLORS = {
    critical: "#ef4444",
    high: "#f59e0b",
    medium: "#60a5fa",
    low: "#8892a8",
};
