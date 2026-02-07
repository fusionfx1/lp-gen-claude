export const LS = {
    get(k) {
        try { return JSON.parse(localStorage.getItem("lpf2-" + k)); }
        catch { return null; }
    },
    set(k, v) {
        try { localStorage.setItem("lpf2-" + k, JSON.stringify(v)); }
        catch { }
    },
};

export function uid() {
    return Math.random().toString(36).slice(2, 10);
}

export function now() {
    return new Date().toISOString();
}

export function hsl(h, s, l) {
    return `hsl(${h},${s}%,${l}%)`;
}

export function similarity(a, b) {
    let s = 0;
    if (a.colorId === b.colorId) s++;
    if (a.fontId === b.fontId) s++;
    if (a.layout === b.layout) s++;
    if (a.copyId === b.copyId) s++;
    if (a.sections === b.sections) s++;
    if (a.compliance === b.compliance) s++;
    return Math.round((s / 6) * 100);
}

export function maxSim(v, all) {
    if (all.length <= 1) return 0;
    const o = all.filter(x => x.id !== v.id);
    return o.length ? Math.max(...o.map(x => similarity(v, x))) : 0;
}

export const pick = a => a[Math.floor(Math.random() * a.length)];
