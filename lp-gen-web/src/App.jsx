import React, { useState, useEffect } from "react";
import { api } from "./services/api";
import { THEME as T } from "./constants";
import { uid, now } from "./utils";

// Component Imports
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Toast } from "./components/Atoms";
import { Dashboard } from "./components/Dashboard";
import { Sites } from "./components/Sites";
import { Wizard } from "./components/Wizard";
import { VariantStudio } from "./components/VariantStudio";
import { OpsCenter } from "./components/OpsCenter";
import { Settings } from "./components/Settings";
import { DeployHistory } from "./components/DeployHistory";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sites, setSites] = useState([]);
  const [ops, setOps] = useState({ domains: [], accounts: [], cfAccounts: [], profiles: [], payments: [], logs: [] });
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({ builds: 0, spend: 0 });
  const [toast, setToast] = useState(null);
  const [wizData, setWizData] = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [deploys, setDeploys] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(false);

  useEffect(() => {
    api.get("/init").then(data => {
      if (data.error) { setApiOk(false); return; }
      if (data.sites) setSites(data.sites);
      if (data.ops) {
        setOps({
          ...data.ops,
          cfAccounts: data.cfAccounts || []
        });
      }
      if (data.settings) setSettings(data.settings);
      if (data.stats) setStats(data.stats);
      if (data.deploys) setDeploys(data.deploys);
      if (data.variants) setRegistry(data.variants);
      setApiOk(true);
    }).catch(() => {
      setApiOk(false);
    }).finally(() => setLoading(false));
  }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startCreate = () => {
    setWizData({
      brand: "", domain: "", tagline: "", email: "",
      loanType: "personal", amountMin: 100, amountMax: 5000, aprMin: 5.99, aprMax: 35.99,
      colorId: "ocean", fontId: "dm-sans", layout: "hero-left", radius: "rounded",
      h1: "", badge: "", cta: "", sub: "",
      gtmId: "", network: "LeadsGate", redirectUrl: "", conversionId: "", conversionLabel: "",
    });
    setPage("create");
  };

  const addSite = (site) => {
    setSites(p => [site, ...p]);
    setStats(p => ({ builds: p.builds + 1, spend: +(p.spend + (site.cost || 0)).toFixed(3) }));
    if (apiOk) api.post("/sites", site).catch(() => { });
    notify(`${site.brand} created!`);
    setPage("sites");
  };

  const delSite = (id) => {
    setSites(p => p.filter(s => s.id !== id));
    if (apiOk) api.del(`/sites/${id}`).catch(() => { });
    notify("Deleted", "danger");
  };

  const addDeploy = (d) => {
    setDeploys(p => [d, ...p].slice(0, 100));
    if (apiOk) api.post("/deploys", d).catch(() => { });
  };

  const opsAdd = (coll, item) => {
    setOps(p => ({
      ...p, [coll]: [item, ...p[coll]],
      logs: [{ id: uid(), msg: `Added ${coll.slice(0, -1)}: ${item.label || item.domain || item.name || item.id}`, ts: now() }, ...p.logs].slice(0, 200),
    }));
    const endpoint = coll === "cf-accounts" ? "/cf-accounts" : `/ops/${coll}`;
    if (apiOk) api.post(endpoint, item).catch(() => { });
  };

  const opsDel = (coll, id) => {
    const item = ops[coll].find(i => i.id === id);
    setOps(p => ({
      ...p, [coll]: p[coll].filter(i => i.id !== id),
      logs: [{ id: uid(), msg: `Deleted: ${item?.label || item?.domain || id}`, ts: now() }, ...p.logs].slice(0, 200),
    }));
    const endpoint = coll === "cf-accounts" ? `/cf-accounts/${id}` : `/ops/${coll}/${id}`;
    if (apiOk) api.del(endpoint).catch(() => { });
  };

  const opsUpd = (coll, id, u) => {
    setOps(p => ({ ...p, [coll]: p[coll].map(i => i.id === id ? { ...i, ...u } : i) }));
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12, animation: "pulse 1.5s infinite" }}>⚡</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>LP Factory V2</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Loading...</div>
      </div>
    </div>
  );

  const ml = sideCollapsed ? 64 : 220;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Sidebar page={page} setPage={setPage} siteCount={sites.length} startCreate={startCreate}
        collapsed={sideCollapsed} toggle={() => setSideCollapsed(p => !p)} />

      <main style={{ flex: 1, marginLeft: ml, minHeight: "100vh", transition: "margin .2s" }}>
        <TopBar stats={stats} settings={settings} deploys={deploys} apiOk={apiOk} />
        <div style={{ padding: "24px 28px" }}>
          {page === "dashboard" && <Dashboard sites={sites} stats={stats} ops={ops} setPage={setPage} startCreate={startCreate} settings={settings} apiOk={apiOk} />}
          {page === "sites" && <Sites sites={sites} del={delSite} notify={notify} startCreate={startCreate} settings={settings} addDeploy={addDeploy} />}
          {page === "create" && wizData && <Wizard config={wizData} setConfig={setWizData} addSite={addSite} setPage={setPage} settings={settings} notify={notify} />}
          {page === "variant" && <VariantStudio notify={notify} sites={sites} addSite={addSite} registry={registry} setRegistry={setRegistry} apiOk={apiOk} />}
          {page === "ops" && <OpsCenter data={ops} add={opsAdd} del={opsDel} upd={opsUpd} settings={settings} />}
          {page === "deploys" && <DeployHistory deploys={deploys} />}
          {page === "settings" && <Settings settings={settings} setSettings={s => { setSettings(prev => ({ ...prev, ...s })); if (apiOk) api.post("/settings", s).catch(() => { }); notify("Saved!"); }} stats={stats} />}
        </div>
      </main>

      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        input:focus,select:focus,textarea:focus{outline:none;border-color:${T.borderFocus}!important;box-shadow:0 0 0 3px ${T.primaryGlow}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
      `}</style>
    </div>
  );
}
