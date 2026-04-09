// src/SettingsPage.js
import { useState, useEffect } from "react";

const STYLES = `
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .sp { display:flex; gap:0; min-height:500px; font-family:'DM Sans',sans-serif; }

  /* Sidebar */
  .sp-nav { width:210px; flex-shrink:0; border-right:1px solid #1c2a3a; padding:8px 0; }
  .sp-nav-item {
    display:flex; align-items:center; gap:10px;
    padding:11px 18px; cursor:pointer; font-size:15px; font-weight:600;
    color:#6a8099; transition:all 0.15s; border-left:2px solid transparent;
    white-space:nowrap; user-select:none;
  }
  .sp-nav-item:hover { color:#a8bccb; background:rgba(255,255,255,0.03); }
  .sp-nav-item.active { color:#c9a84c; border-left-color:#c9a84c; background:rgba(201,168,76,0.06); }
  .sp-nav-icon { font-size:16px; width:20px; text-align:center; flex-shrink:0; }
  .sp-nav-divider { height:1px; background:#0f1820; margin:6px 16px; }

  /* Content area */
  .sp-content { flex:1; padding:28px 32px; min-width:0; overflow-y:auto; }
  .sp-content-title {
    font-family:'Cinzel',serif; font-size:20px; font-weight:900;
    color:#e8e8e8; margin-bottom:6px; letter-spacing:0.3px;
  }
  .sp-content-sub { font-size:15px; color:#6a8099; margin-bottom:28px; line-height:1.6; }

  /* Setting groups */
  .sp-group { background:#111620; border:1px solid #1c2a3a; border-radius:12px; overflow:hidden; margin-bottom:16px; }
  .sp-group-label { font-size:12px; font-weight:700; color:#3d5060; text-transform:uppercase; letter-spacing:2px; padding:14px 20px 8px; }
  .sp-row { display:flex; align-items:center; gap:20px; padding:14px 20px; border-bottom:1px solid #0f1820; }
  .sp-row:last-child { border-bottom:none; }
  .sp-row-info { flex:1; min-width:0; }
  .sp-row-label { font-size:15px; font-weight:600; color:#dde8f0; }
  .sp-row-desc { font-size:14px; color:#6a8099; margin-top:3px; line-height:1.55; }
  .sp-row-control { flex-shrink:0; display:flex; align-items:center; }

  /* Toggle */
  .tog { display:inline-flex; align-items:center; width:44px; height:24px; border-radius:24px; background:#1c2a3a; border:1.5px solid #28394d; cursor:pointer; transition:all 0.22s; flex-shrink:0; position:relative; box-sizing:border-box; }
  .tog.on { background:rgba(201,168,76,0.15); border-color:#c9a84c; }
  .tog-thumb { position:absolute; left:3px; width:14px; height:14px; border-radius:50%; background:#3d5060; transition:all 0.22s; }
  .tog.on .tog-thumb { left:23px; background:#c9a84c; }

  /* Select */
  .sp-select { background:#0c1018; border:1px solid #28394d; border-radius:7px; color:#dde8f0; font-size:14px; padding:8px 12px; font-family:'DM Sans',sans-serif; cursor:pointer; outline:none; min-width:190px; transition:border-color 0.15s; }
  .sp-select:focus { border-color:rgba(201,168,76,0.45); }
  .sp-select option { background:#0c1018; }

  /* Input */
  .sp-input { background:#0c1018; border:1px solid #28394d; border-radius:7px; color:#dde8f0; font-size:14px; padding:8px 12px; font-family:'DM Sans',sans-serif; outline:none; width:200px; transition:border-color 0.15s; }
  .sp-input:focus { border-color:rgba(201,168,76,0.45); }
  .sp-input::placeholder { color:#2a3a4a; }

  /* Buttons */
  .sp-btn { padding:9px 18px; border-radius:7px; border:1px solid #28394d; background:transparent; color:#8fa0b0; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap; }
  .sp-btn:hover { border-color:rgba(201,168,76,0.35); color:#c9a84c; }
  .sp-btn.gold { background:linear-gradient(135deg,#8a6f2e,#c9a84c); color:#000; border:none; font-weight:700; }
  .sp-btn.gold:hover { opacity:0.88; }
  .sp-btn.danger { border-color:rgba(231,76,60,0.3); color:#c0564a; }
  .sp-btn.danger:hover { background:rgba(231,76,60,0.08); border-color:rgba(231,76,60,0.5); color:#e74c3c; }
  .sp-btn:disabled { opacity:0.38; cursor:not-allowed; }

  /* Status pill */
  .sp-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; font-size:14px; font-weight:600; }
  .sp-pill.green { background:rgba(46,204,113,0.1); color:#2ecc71; border:1px solid rgba(46,204,113,0.2); }
  .sp-pill.dim { background:rgba(255,255,255,0.04); color:#6a8099; border:1px solid #1c2a3a; }

  /* Code / key */
  .sp-code { background:#0a0e14; border:1px solid #1c2a3a; border-radius:7px; padding:10px 14px; font-size:12px; color:#c9a84c; font-family:monospace; word-break:break-all; line-height:1.5; }
  .sp-key-banner { background:rgba(46,204,113,0.05); border:1px solid rgba(46,204,113,0.18); border-radius:10px; padding:16px 18px; display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }
  .sp-key-banner-title { font-size:14px; color:#2ecc71; font-weight:600; }
  .sp-key-banner-row { display:flex; gap:8px; align-items:center; }

  /* Key table */
  .sp-key-table { border:1px solid #1c2a3a; border-radius:10px; overflow:hidden; margin-top:12px; }
  .sp-key-head { display:grid; grid-template-columns:2fr 1fr 1fr 70px; padding:10px 16px; font-size:12px; color:#3d5060; text-transform:uppercase; letter-spacing:1.2px; font-weight:700; background:#0a0e14; border-bottom:1px solid #0f1820; }
  .sp-key-row { display:grid; grid-template-columns:2fr 1fr 1fr 70px; padding:13px 16px; border-bottom:1px solid #0f1820; align-items:center; transition:background 0.1s; }
  .sp-key-row:last-child { border-bottom:none; }
  .sp-key-row:hover { background:rgba(255,255,255,0.02); }

  /* Danger zone */
  .sp-danger-zone { border:1px solid rgba(231,76,60,0.2); border-radius:12px; overflow:hidden; margin-top:8px; }
  .sp-danger-header { padding:14px 20px; background:rgba(231,76,60,0.04); border-bottom:1px solid rgba(231,76,60,0.15); font-size:13px; font-weight:700; color:#c0564a; text-transform:uppercase; letter-spacing:1.5px; }

  /* Support card */
  .sp-support { background:linear-gradient(135deg,#0f1a26,#111e2b); border:1px solid #1c2a3a; border-radius:12px; padding:22px 24px; display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:16px; }

  /* Skeleton */
  .sp-skel { background:linear-gradient(90deg,#0c1018 25%,#111620 50%,#0c1018 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:5px; height:13px; }

  /* Confirm modal */
  .sp-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:600; display:flex; align-items:center; justify-content:center; padding:24px; }
  .sp-modal { background:#0c1018; border:1px solid #1c2a3a; border-radius:14px; padding:28px; max-width:420px; width:100%; display:flex; flex-direction:column; gap:16px; }
  .sp-modal-title { font-family:'Cinzel',serif; font-size:17px; font-weight:700; color:#e8e8e8; }
  .sp-modal-desc { font-size:14px; color:#8fa0b0; line-height:1.7; }
  .sp-modal-actions { display:flex; gap:10px; justify-content:flex-end; }

  @media(max-width:640px) {
    .sp { flex-direction:column; }
    .sp-nav { width:100%; border-right:none; border-bottom:1px solid #1c2a3a; display:flex; overflow-x:auto; padding:6px 8px; gap:2px; }
    .sp-nav-item { border-left:none; border-bottom:2px solid transparent; padding:8px 14px; flex-shrink:0; }
    .sp-nav-item.active { border-left:none; border-bottom-color:#c9a84c; }
    .sp-content { padding:20px 16px; }
  }
`;

function Toggle({ on, onChange }) {
  return (
    <div className={`tog${on ? " on" : ""}`} onClick={e => { e.stopPropagation(); onChange(!on); }}>
      <div className="tog-thumb" />
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="sp-row">
      <div className="sp-row-info">
        <div className="sp-row-label">{label}</div>
        {desc && <div className="sp-row-desc">{desc}</div>}
      </div>
      <div className="sp-row-control">{children}</div>
    </div>
  );
}

const NAV = [
  { id: "general",       icon: "⚙️",  label: "General" },
  { id: "alerts",        icon: "🔔",  label: "Alerts" },
  { id: "plugin",        icon: "🔌",  label: "RuneLite Plugin" },
  { id: "connections",   icon: "🔗",  label: "Connections" },
  { id: "support",       icon: "☕",  label: "Support Us" },
  { id: "account",       icon: "🗑️",  label: "Account" },
];

export default function SettingsPage({
  user, supabase, showToast,
  soundMuted, onToggleSound,
  showStreakBanner, onToggleStreakBanner,
  notifPermission, notifLoading, onRequestNotif,
  smartAlertSettings, onSaveSmartAlert,
  sortCol, sortDir, onSetDefaultSort,
  flipsLog = [], autoFlipsLog = [],
  initialSection = null, onSectionMounted,
  onDiscordLinked,
}) {
  const [active, setActive] = useState(initialSection || "general");

  // Jump to initialSection on mount if provided
  useEffect(() => {
    if (initialSection) {
      setActive(initialSection);
      if (onSectionMounted) onSectionMounted();
    }
  }, []); // eslint-disable-line

  // ── API keys ──
  const [keys, setKeys] = useState([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState(null);

  // ── Discord ──
  const [discordCode, setDiscordCode] = useState("");
  const [discordLinked, setDiscordLinked] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordChecking, setDiscordChecking] = useState(true);

  // ── Prefs ──
  const [alertFreq, setAlertFreq] = useState(() => {
    try { return localStorage.getItem("runetrader_alert_freq") || "5"; } catch { return "5"; }
  });
  const [whatsNewEnabled, setWhatsNewEnabled] = useState(() => {
    try { return localStorage.getItem("runetrader_disable_whats_new") !== "1"; } catch { return true; }
  });
  const [pauseTimeout, setPauseTimeout] = useState(() => {
    try { return localStorage.getItem("runetrader_pause_timeout") || "60"; } catch { return "60"; }
  });

  const [confirm, setConfirm] = useState(null);

  useEffect(() => { if (user) { fetchKeys(); checkDiscordLinked(); } }, [user]); // eslint-disable-line

  async function fetchKeys() {
    setKeysLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/api-keys", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (json.ok) setKeys(json.keys);
    } catch { showToast("Failed to load API keys.", "error"); }
    setKeysLoading(false);
  }

  async function checkDiscordLinked() {
    setDiscordChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data } = await supabase.from("user_profiles").select("discord_id, discord_username").eq("user_id", session.user.id).single();
      if (data?.discord_id) { setDiscordLinked(true); if (data?.discord_username && onDiscordLinked) onDiscordLinked(data.discord_username); }
    } catch {}
    setDiscordChecking(false);
  }

  async function linkDiscord() {
    if (!discordCode.trim()) return;
    setDiscordLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/discord-verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: discordCode.trim() }),
      });
      const json = await res.json();
      if (json.ok) {
        setDiscordLinked(true);
        showToast("Discord linked!", "success");
        // Re-fetch discord_id so App.js can update discordUsername without a page refresh
        try {
          const { data: { session: s } } = await supabase.auth.getSession();
          if (s?.user?.id) {
            const { data: profile } = await supabase.from("user_profiles").select("discord_id, discord_username").eq("user_id", s.user.id).single();
            if (onDiscordLinked) onDiscordLinked(profile?.discord_username || profile?.discord_id || null);
          }
        } catch {}
      }
      else showToast(json.error || "Invalid or expired code.", "error");
    } catch { showToast("Failed to link Discord.", "error"); }
    setDiscordLoading(false);
  }

  async function generateKey() {
    if (!newLabel.trim()) { showToast("Enter a label first.", "error"); return; }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/generate-api-key", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const json = await res.json();
      if (json.ok) {
        setNewKey(json.api_key); setNewLabel(""); fetchKeys();
        showToast("Key generated — copy it now, it won't be shown again.", "info", 8000);
      } else showToast(json.error || "Failed to generate key.", "error");
    } catch { showToast("Failed to generate key.", "error"); }
    setGenerating(false);
  }

  async function revokeKey(id) {
    setRevoking(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (json.ok) { setKeys(prev => prev.filter(k => k.id !== id)); showToast("Key revoked.", "success"); }
      else showToast(json.error || "Failed to revoke.", "error");
    } catch { showToast("Failed to revoke key.", "error"); }
    setRevoking(null);
  }

  function exportData() {
    const manual = flipsLog.filter(f => f.status !== "open").map(f => ({
      source: "manual", item: f.item, buyPrice: f.buyPrice || "", sellPrice: f.sellPrice || "",
      qty: f.qty || "", profit: f.totalProfit || "", roi: f.roi || "", date: f.date || "",
    }));
    const auto = autoFlipsLog.map(f => ({
      source: "plugin", item: f.item_name, buyPrice: f.buy_price || "", sellPrice: f.sell_price || "",
      qty: f.quantity || "", profit: f.profit || "", roi: f.roi || "", date: f.sell_completed_at || "",
    }));
    const all = [...manual, ...auto].sort((a, b) => new Date(b.date) - new Date(a.date));
    const headers = ["Source", "Item", "Buy Price", "Sell Price", "Qty", "Profit", "ROI %", "Date"];
    const rows = all.map(r => [r.source, `"${r.item}"`, r.buyPrice, r.sellPrice, r.qty, r.profit, r.roi, r.date].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `runetrader-flips-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${all.length} flips.`, "success");
  }

  async function clearFlipHistory() {
    try {
      if (user) await supabase.from("ge_flips_live").delete().eq("user_id", user.id);
      localStorage.removeItem("runetrader_flips");
      showToast("Flip history cleared.", "success");
    } catch (e) { showToast("Failed: " + e.message, "error"); }
  }

  async function deleteAccount() {
    try {
      if (user) {
        await supabase.from("ge_flips_live").delete().eq("user_id", user.id);
        await supabase.from("ge_offers").delete().eq("user_id", user.id);
        await supabase.from("user_profiles").delete().eq("user_id", user.id);
        await supabase.auth.signOut();
      }
      ["runetrader_flips","runetrader_watchlist","runetrader_alerts","runetrader_thresholds","runetrader_smart_alerts"].forEach(k => localStorage.removeItem(k));
      showToast("Account deleted.", "info");
      window.location.reload();
    } catch (e) { showToast("Failed: " + e.message, "error"); }
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const SORT_OPTIONS = [
    { col: "volume",       dir: "desc", label: "Vol/Day (high → low)" },
    { col: "margin",       dir: "desc", label: "Margin (high → low)" },
    { col: "gpPerFill",    dir: "desc", label: "GP/Fill (high → low)" },
    { col: "roi",          dir: "desc", label: "ROI % (high → low)" },
    { col: "name",         dir: "asc",  label: "Name (A → Z)" },
    { col: "lastTradeTime",dir: "desc", label: "Last Traded (recent first)" },
  ];

  if (!user) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", padding:"80px 20px", textAlign:"center", color:"#6a7d90" }}>
      <div style={{ fontSize:"40px", opacity:0.4 }}>⚙️</div>
      <p style={{ fontSize:"15px" }}>Sign in to access settings</p>
    </div>
  );

  // ── Section renderers ──
  const sections = {
    general: (
      <>
        <div className="sp-content-title">General</div>
        <div className="sp-content-sub">Display and behaviour preferences</div>
        <div className="sp-group">
          <Row label="Sound effects" desc="Coin clinks, level-up chimes, and profit fanfares">
            <Toggle on={!soundMuted} onChange={() => onToggleSound()} />
          </Row>
          <Row label="Login streak banner" desc="Show your daily streak on login">
            <Toggle on={showStreakBanner} onChange={val => onToggleStreakBanner(val)} />
          </Row>
          <Row label="What's New on update" desc="Show the changelog modal after each deployment">
            <Toggle on={whatsNewEnabled} onChange={val => {
              setWhatsNewEnabled(val);
              try { val ? localStorage.removeItem("runetrader_disable_whats_new") : localStorage.setItem("runetrader_disable_whats_new", "1"); } catch {}
            }} />
          </Row>
        </div>
        <div className="sp-group">
          <Row label="Default market sort" desc="Which column the market table opens sorted by">
            <select className="sp-select" value={`${sortCol}:${sortDir}`} onChange={e => {
              const [col, dir] = e.target.value.split(":");
              onSetDefaultSort(col, dir);
              showToast("Default sort saved.", "success");
            }}>
              {SORT_OPTIONS.map(o => <option key={o.col} value={`${o.col}:${o.dir}`}>{o.label}</option>)}
            </select>
          </Row>
          <Row label="Sync pause auto-resume" desc="How long before sync auto-resumes after being paused">
            <select className="sp-select" value={pauseTimeout} onChange={e => {
              setPauseTimeout(e.target.value);
              try { localStorage.setItem("runetrader_pause_timeout", e.target.value); } catch {}
              showToast("Saved.", "success");
            }}>
              {["15","30","60","120","240"].map(v => <option key={v} value={v}>{v} minutes</option>)}
            </select>
          </Row>
        </div>
      </>
    ),

    alerts: (
      <>
        <div className="sp-content-title">Alerts & Notifications</div>
        <div className="sp-content-sub">Control how and when you get notified about market events</div>
        <div className="sp-group">
          <Row label="Push notifications" desc="Get alerted on your device even when the app is closed">
            {notifPermission === "granted" ? (
              <span className="sp-pill green">✓ Enabled</span>
            ) : notifPermission === "denied" ? (
              <span className="sp-pill dim">Blocked by browser</span>
            ) : (
              <button className="sp-btn gold" disabled={notifLoading} onClick={onRequestNotif}>
                {notifLoading ? "Enabling..." : "Enable"}
              </button>
            )}
          </Row>
          <Row label="Alert check frequency" desc="How often price alerts are evaluated against live data">
            <select className="sp-select" value={alertFreq} onChange={e => {
              setAlertFreq(e.target.value);
              try { localStorage.setItem("runetrader_alert_freq", e.target.value); } catch {}
              showToast("Saved.", "success");
            }}>
              <option value="5">Every 5 minutes</option>
              <option value="10">Every 10 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
            </select>
          </Row>
        </div>
        <div className="sp-group">
          <div className="sp-group-label">Smart Alert Types</div>
          {[
            { key: "marginSpike",  label: "Margin Spike",  desc: "Margin jumps significantly above recent levels" },
            { key: "volumeSurge",  label: "Volume Surge",  desc: "Daily volume multiplies suddenly" },
            { key: "dumpDetected", label: "Dump Detected", desc: "Sell price drops sharply — someone selling in bulk" },
            { key: "priceCrash",   label: "Price Crash",   desc: "Both buy and sell prices collapse" },
          ].map(({ key, label, desc }) => (
            <Row key={key} label={label} desc={desc}>
              <Toggle on={smartAlertSettings?.[key] ?? true} onChange={val => onSaveSmartAlert(key, val)} />
            </Row>
          ))}
        </div>
      </>
    ),

    plugin: (
      <>
        <div className="sp-content-title">RuneLite Plugin</div>
        <div className="sp-content-sub">Connect your RuneLite client to sync GE slots in real time</div>

        <div className="sp-group">
          <Row label="Plugin Hub" desc="Search 'RuneTrader' in the RuneLite Plugin Hub and click install">
            <a href="https://runelite.net/plugin-hub" target="_blank" rel="noreferrer" className="sp-btn" style={{ textDecoration:"none", display:"inline-block" }}>
              Open Plugin Hub ↗
            </a>
          </Row>
          <Row label="Sync pause timeout" desc="How long before sync auto-resumes after a manual pause">
            <span style={{ fontSize:"14px", color:"#c9a84c", fontWeight:700 }}>{pauseTimeout} min</span>
          </Row>
        </div>

        <div className="sp-group">
          <div className="sp-group-label">API Keys</div>
          {newKey && (
            <div className="sp-key-banner" style={{ margin:"4px 20px 8px" }}>
              <div className="sp-key-banner-title">✅ New key generated — copy it now. It won't be shown again.</div>
              <div className="sp-key-banner-row">
                <code className="sp-code" style={{ flex:1 }}>{newKey}</code>
                <button className="sp-btn" onClick={() => { navigator.clipboard.writeText(newKey); showToast("Copied!", "success"); }}>Copy</button>
              </div>
              <button onClick={() => setNewKey(null)} style={{ background:"none", border:"none", color:"#3d5060", fontSize:"12px", cursor:"pointer", fontFamily:"DM Sans, sans-serif", padding:0, alignSelf:"flex-start" }}>
                Dismiss
              </button>
            </div>
          )}
          <div style={{ padding:"12px 20px", display:"flex", gap:"10px", alignItems:"center" }}>
            <input
              className="sp-input" style={{ flex:1 }}
              placeholder='Label, e.g. "My RuneLite client"'
              value={newLabel} onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") generateKey(); }}
              maxLength={64}
            />
            <button className="sp-btn gold" onClick={generateKey} disabled={generating || !newLabel.trim() || keys.length >= 5}>
              {generating ? "Generating..." : "Generate Key"}
            </button>
          </div>
          {keys.length >= 5 && <div style={{ fontSize:"12px", color:"#3d5060", padding:"0 20px 12px" }}>Max 5 keys reached. Revoke one to add a new key.</div>}
          {(keysLoading || keys.length > 0) && (
            <div className="sp-key-table" style={{ margin:"0 20px 16px" }}>
              <div className="sp-key-head">
                <span>Label</span><span>Created</span><span>Last Used</span><span></span>
              </div>
              {keysLoading ? [1,2].map(i => (
                <div key={i} className="sp-key-row">
                  <div className="sp-skel" style={{ width:"60%" }} />
                  <div className="sp-skel" style={{ width:"70px" }} />
                  <div className="sp-skel" style={{ width:"70px" }} />
                  <div className="sp-skel" style={{ width:"40px" }} />
                </div>
              )) : keys.map(key => (
                <div key={key.id} className="sp-key-row">
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:600, color:"#dde8f0" }}>{key.label || "Unlabelled"}</div>
                    <div style={{ fontSize:"11px", color:"#2a3a4a", fontFamily:"monospace", marginTop:"2px" }}>rt_••••••••</div>
                  </div>
                  <span style={{ fontSize:"13px", color:"#6a8099" }}>{fmtDate(key.created_at)}</span>
                  <span style={{ fontSize:"13px", color:key.last_used ? "#6a8099" : "#2a3a4a" }}>{key.last_used ? fmtDate(key.last_used) : "Never"}</span>
                  <button className="sp-btn danger" style={{ padding:"4px 10px", fontSize:"11px" }}
                    onClick={() => setConfirm({ title:"Revoke API Key", desc:`Revoke "${key.label || "Unlabelled"}"? The RuneLite plugin using this key will stop syncing immediately.`, action:() => revokeKey(key.id) })}
                    disabled={revoking === key.id}>
                    {revoking === key.id ? "..." : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    ),

    connections: (
      <>
        <div className="sp-content-title">Connections</div>
        <div className="sp-content-sub">Link external accounts and integrations</div>
        <div className="sp-group">
          <Row
            label="Discord account"
            desc={discordLinked ? "Your Discord is linked — bot commands and flip sync are active" : "Run !verify in the RuneTrader Discord server, then enter your code below"}
          >
            {discordChecking ? (
              <span className="sp-skel" style={{ width:"80px", display:"inline-block", height:"28px", borderRadius:"14px" }} />
            ) : discordLinked ? (
              <span className="sp-pill green">✓ Linked</span>
            ) : (
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <input
                  className="sp-input" style={{ width:"130px" }}
                  placeholder="RT-XXXXXX"
                  value={discordCode}
                  onChange={e => setDiscordCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter") linkDiscord(); }}
                  maxLength={9}
                />
                <button className="sp-btn gold" onClick={linkDiscord} disabled={discordLoading || discordCode.length < 9}>
                  {discordLoading ? "Linking..." : "Link"}
                </button>
              </div>
            )}
          </Row>
        </div>
      </>
    ),

    support: (
      <>
        <div className="sp-content-title">Support Us</div>
        <div className="sp-content-sub">RuneTrader is free and always will be</div>
        <div className="sp-support">
          <div style={{ display:"flex", alignItems:"center", gap:"16px", flex:1, minWidth:"200px" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>☕</div>
            <div>
              <div style={{ fontSize:"15px", fontWeight:700, color:"#e8e8e8", marginBottom:"6px" }}>Buy Me a Coffee</div>
              <div style={{ fontSize:"13px", color:"#6a8099", lineHeight:"1.6", maxWidth:"380px" }}>
                If RuneTrader has saved you GP, a coffee goes a long way toward keeping the lights on and new features shipping. Every supporter gets a 💎 badge.
              </div>
            </div>
          </div>
          <a
            href="https://buymeacoffee.com/runetrader"
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"11px 22px", borderRadius:"9px", flexShrink:0, background:"linear-gradient(135deg,#8a6f2e,#c9a84c)", color:"#0a0e14", fontSize:"14px", fontWeight:700, textDecoration:"none", transition:"opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            ☕ Support Development
          </a>
        </div>
        <div style={{ background:"#111620", border:"1px solid #1c2a3a", borderRadius:"12px", padding:"20px 24px" }}>
          <div style={{ fontSize:"13px", color:"#3d5060", textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:700, marginBottom:"12px" }}>What your support funds</div>
          {[
            ["Server & hosting costs", "Vercel, Supabase, and Railway keep the site running 24/7"],
            ["New features", "Leaderboard, GE Oracle, group flipping, and more on the roadmap"],
            ["Plugin development", "Ongoing RuneLite plugin improvements and new overlay features"],
          ].map(([title, desc]) => (
            <div key={title} style={{ display:"flex", alignItems:"flex-start", gap:"12px", padding:"10px 0", borderBottom:"1px solid #0f1820" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#c9a84c", flexShrink:0, marginTop:"6px" }} />
              <div>
                <div style={{ fontSize:"14px", fontWeight:600, color:"#dde8f0" }}>{title}</div>
                <div style={{ fontSize:"13px", color:"#6a8099", marginTop:"3px" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    ),

    account: (
      <>
        <div className="sp-content-title">Account</div>
        <div className="sp-content-sub">Data export and account management</div>
        <div className="sp-group">
          <Row label="Export flip history" desc={`Download all ${flipsLog.filter(f => f.status !== "open").length + autoFlipsLog.length} closed flips as a CSV file`}>
            <button className="sp-btn" onClick={exportData}>↓ Export CSV</button>
          </Row>
        </div>
        <div className="sp-danger-zone">
          <div className="sp-danger-header">Danger Zone</div>
          <div className="sp-row">
            <div className="sp-row-info">
              <div className="sp-row-label" style={{ color:"#c0564a" }}>Clear flip history</div>
              <div className="sp-row-desc">Permanently delete all logged flips. Watchlist, alerts and settings are not affected.</div>
            </div>
            <div className="sp-row-control">
              <button className="sp-btn danger" onClick={() => setConfirm({
                title:"Clear Flip History",
                desc:"This will permanently delete all your closed flip history. This cannot be undone.",
                action: clearFlipHistory,
              })}>Clear History</button>
            </div>
          </div>
          <div className="sp-row">
            <div className="sp-row-info">
              <div className="sp-row-label" style={{ color:"#c0564a" }}>Delete account</div>
              <div className="sp-row-desc">Permanently remove your account, all data, and cancel any active subscription.</div>
            </div>
            <div className="sp-row-control">
              <button className="sp-btn danger" onClick={() => setConfirm({
                title:"Delete Account",
                desc:"This will permanently delete your account and all associated data. Your Stripe subscription will need to be cancelled separately. This cannot be undone.",
                action: deleteAccount,
              })}>Delete Account</button>
            </div>
          </div>
        </div>
      </>
    ),
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sp">

        {/* Sidebar nav */}
        <div className="sp-nav">
          {NAV.map((n, i) => (
            <div key={n.id}>
              {i === NAV.length - 2 && <div className="sp-nav-divider" />}
              <div className={`sp-nav-item${active === n.id ? " active" : ""}`} onClick={() => setActive(n.id)}>
                <span className="sp-nav-icon">{n.icon}</span>
                {n.label}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="sp-content">
          {sections[active]}
        </div>

      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="sp-overlay" onClick={() => setConfirm(null)}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <div className="sp-modal-title">{confirm.title}</div>
            <div className="sp-modal-desc">{confirm.desc}</div>
            <div className="sp-modal-actions">
              <button className="sp-btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="sp-btn danger" onClick={() => { confirm.action(); setConfirm(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
