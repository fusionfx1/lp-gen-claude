const API_BASE = window.__LP_API__ || "https://lp-factory-api.songsawat-w.workers.dev/api";

async function request(path, opts = {}) {
    const r = await fetch(`${API_BASE}${path}`, opts);
    if (!r.ok) {
        const text = await r.text().catch(() => '');
        return { error: `HTTP ${r.status}`, detail: text };
    }
    return r.json();
}

export const api = {
    get: (path) => request(path),
    post: (path, data) => request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    put: (path, data) => request(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    del: (path) => request(path, { method: "DELETE" }),
};
