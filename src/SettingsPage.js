// src/SettingsPage.js
import { useState, useEffect } from "react";

const STYLES = `
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .settings-page { display:flex; flex-direction:column; gap:8px; max-width:720px; }
  .settings-section { background:#111620; border:1px solid #1c2a3a; border-radius:12px; overflow:hidden; }
  .settings-section-header { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #1c2a3a; cursor:pointer; user-select:none; }
  .settings-section-header:hover { background:rgba(255,255,255,0.02); }
  .settings-section-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
  .settings-section-title { font-family:'Cinzel',serif; font-size:13px; font-weight:700; color:#e8e8e8; letter-spacing:0.5px; }
  .settings-section-sub { font-size:11px; color:#6a7d90; margin-top:2px; }
  .settings-section-chevron { margin-left:auto; font-size:11px; color:#3d5060; transition:transform 0.2s; }
  .settings-section-chevron.open { transform:rotate(180deg); }
  .settings-rows { display:flex; flex-direction:column; }
  .settings-row { display:flex; align-items:center; padding:13px 20px; border-bottom:1px solid #0f1820; gap:16px; }
  .settings-row:last-child { border-bottom:none; }
  .settings-row-info { flex:1; min-width:0; }
  .settings-row-label { font-size:13px; font-weight:500; color:#e8e8e8; }
  .settings-row-desc { font-size:11px; color:#6a7d90; margin-top:2px; line-height:1.5; }
  .settings-row-control { flex-shrink:0; }

  /* Toggle switch */
  .toggle-wrap { position:relative; width:40px; height:22px; flex-shrink:0; }
  .toggle-wrap input { opacity:0; width:0; height:0; position:absolute; }
  .toggle-track { position:absolute; inset:0; border-radius:20px; background:#1c2a3a; border:1px solid #28394d; cursor:pointer; transition:all 0.2s; }
  .toggle-track.on { background:rgba(201,168,76,0.25); border-color:rgba(201,168,76,0.5); }
  .toggle-thumb { position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#3d5060; transition:all 0.2s; pointer-events:none; }
  .toggle-track.on .toggle-thumb { left:21px; background:#c9a84c; }

  /* Select */
  .settings-select { background:#0c1018; border:1px solid #28394d; border-radius:6px; color:#e8e8e8; font-size:12px; padding:6px 10px; font-family:'Inter',sans-serif; cursor:pointer; outline:none; }
  .settings-select:focus { border-color:rgba(201,168,76,0.4); }
  .settings-select option { background:#0c1018; }

  /* Input */
  .settings-input { background:#0c1018; border:1px solid #28394d; border-radius:6px; color:#e8e8e8; font-size:12px; padding:6px 10px; font-family:'Inter',sans-serif; outline:none; width:200px; transition:border-color 0.15s; }
  .settings-input:focus { border-color:rgba(201,168,76,0.4); }
  .settings-input::placeholder { color:#3d5060; }

  /* Button */
  .settings-btn { padding:7px 16px; border-radius:6px; border:1px solid #28394d; background:transparent; color:#99aabb; font-size:12px; font-weight:500; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.15s; white-space:nowrap; }
  .settings-btn:hover { border-color:rgba(201,168,76,0.3); color:#c9a84c; }
  .settings-btn.gold { background:linear-gradient(135deg,#8a6f2e,#c9a84c); color:#000; border:none; font-weight:700; }
  .settings-btn.gold:hover { opacity:0.88; }
  .settings-btn.danger { border-color:rgba(231,76,60,0.3); color:#e74c3c; }
  .settings-btn.danger:hover { background:rgba(231,76,60,0.08); border-color:rgba(231,76,60,0.5); }
  .settings-btn:disabled { opacity:0.4; cursor:not-allowed; }

  /* Code box */
  .settings-code { background:#0c1018; border:1px solid #1c2a3a; border-radius:6px; padding:10px 14px; font-size:12px; color:#c9a84c; font-family:monospace; word-break:break-all; line-height:1.5; }

  /* New key banner */
  .new-key-banner { background:rgba(46,204,113,0.06); border:1px solid rgba(46,204,113,0.2); border-radius:8px; padding:14px 16px; display:flex; flex-direction:column; gap:10px; margin:0 20px 4px; }
  .new-key-banner-title { font-size:12px; color:#2ecc71; font-weight:600; }
  .new-key-banner-row { display:flex; gap:8px; align-items:center; }

  /* Confirm modal */
  .confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:600; display:flex; align-items:center; justify-content:center; padding:24px; }
  .confirm-modal { background:#0c1018; border:1px solid #1c2a3a; border-radius:12px; padding:28px; max-width:400px; width:100%; display:flex; flex-direction:column; gap:16px; }
  .confirm-title { font-family:'Cinzel',serif; font-size:16px; font-weight:700; color:#e8e8e8; }
  .confirm-desc { font-size:13px; color:#99aabb; line-height:1.6; }
  .confirm-actions { display:flex; gap:10px; justify-content:flex-end; }

  /* Skeleton */
  .settings-skeleton { background:linear-gradient(90deg,#0c1018 25%,#111620 50%,#0c1018 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:5px; height:14px; }

  /* Status pill */
  .status-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  .status-pill.green { background:rgba(46,204,113,0.1); color:#2ecc71; border:1px solid rgba(46,204,113,0.2); }
  .status-pill.amber { background:rgba(201,168,76,0.1); color:#c9a84c; border:1px solid rgba(201,168,76,0.2); }
  .status-pill.dim { background:rgba(255,255,255,0.04); color:#6a7d90; border:1px solid #1c2a3a; }

  /* Key table */
  .key-table-head { display:grid; grid-template-columns:2fr 1fr 1fr 60px; padding:8px 20px; font-size:10px; color:#6a7d90; text-transform:uppercase; letter-spacing:1px; font-weight:600; border-bottom:1px solid #0f1820; background:#0c1018; }
  .key-table-row { display:grid; grid-template-columns:2fr 1fr 1fr 60px; padding:12px 20px; border-bottom:1px solid #0f1820; align-items:center; transition:background 0.1s; }
  .key-table-row:last-child { border-bottom:none; }
  .key-table-row:hover { background:rgba(255,255,255,0.02); }
`;

function Toggle({ on, onChange }) {
  return (
    <label className="toggle-wrap" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} />
      <div className={`toggle-track${on ? " on" : ""}`}>
        <div className="toggle-thumb" />
      </div>
    </label>
  );
}

function Section({ icon, iconBg, title, sub, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="settings-section">
      <div className="settings-section-header" onClick={() => setOpen(v => !v)}>
        <div className="settings-section-icon" style={{ background: iconBg }}>{icon}</div>
        <div>
          <div className="settings-section-title">{title}</div>
          <div className="settings-section-sub">{sub}</div>
        </div>
        <span className={`settings-section-chevron${open ? " open" : ""}`}>▼</span>
      </div>
      {open && <div className="settings-rows">{children}</div>}
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

export default function SettingsPage({
  user, supabase, showToast,
  soundMuted, onToggleSound,
  showStreakBanner, onToggleStreakBanner,
  notifPermission, notifLoading, onRequestNotif,
  smartAlertSettings, onSaveSmartAlert,
  sortCol, sortDir, onSetDefaultSort,
  flipsLog = [], autoFlipsLog = [],
}) {
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

  // ── Alert frequency (stored locally, checked client-side) ──
  const [alertFreq, setAlertFreq] = useState(() => {
    try { return localStorage.getItem("runetrader_alert_freq") || "5"; } catch { return "5"; }
  });

  // ── What's New toggle ──
  const [whatsNewEnabled, setWhatsNewEnabled] = useState(() => {
    try { return localStorage.getItem("runetrader_disable_whats_new") !== "1"; } catch { return true; }
  });

  // ── Confirm modal ──
  const [confirm, setConfirm] = useState(null); // { title, desc, action }

  // ── Sync pause timeout ──
  const [pauseTimeout, setPauseTimeout] = useState(() => {
    try { return localStorage.getItem("runetrader_pause_timeout") || "60"; } catch { return "60"; }
  });

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
      const { data } = await supabase.from("user_profiles").select("discord_id").eq("user_id", session.user.id).single();
      if (data?.discord_id) setDiscordLinked(true);
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
      if (json.ok) { setDiscordLinked(true); showToast("Discord account linked!", "success"); }
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
        showToast("API key generated! Copy it now — it won't be shown again.", "info", 8000);
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
      if (json.ok) { setKeys(prev => prev.filter(k => k.id !== id)); showToast("API key revoked.", "success"); }
      else showToast(json.error || "Failed to revoke key.", "error");
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
      if (user) {
        await supabase.from("ge_flips_live").delete().eq("user_id", user.id);
        await supabase.from("flips").delete().eq("user_id", user.id);
      }
      localStorage.removeItem("runetrader_flips");
      showToast("Flip history cleared.", "success");
      window.location.reload();
    } catch (e) { showToast("Failed to clear history: " + e.message, "error"); }
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
      showToast("Account deleted. Sorry to see you go.", "info");
      window.location.reload();
    } catch (e) { showToast("Failed to delete account: " + e.message, "error"); }
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const SORT_OPTIONS = [
    { col: "volume", dir: "desc", label: "Vol/Day (high → low)" },
    { col: "margin", dir: "desc", label: "Margin (high → low)" },
    { col: "gpPerFill", dir: "desc", label: "GP/Fill (high → low)" },
    { col: "roi", dir: "desc", label: "ROI % (high → low)" },
    { col: "name", dir: "asc", label: "Name (A → Z)" },
    { col: "lastTradeTime", dir: "desc", label: "Last Traded (recent first)" },
  ];
  const currentSortLabel = SORT_OPTIONS.find(o => o.col === sortCol && o.dir === sortDir)?.label || "Vol/Day (high → low)";

  if (!user) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", padding:"80px 20px", textAlign:"center", color:"#6a7d90" }}>
      <div style={{ fontSize:"40px", opacity:0.4 }}>⚙️</div>
      <p style={{ fontSize:"15px" }}>Sign in to access settings</p>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="settings-page">

        {/* ── GENERAL ── */}
        <Section icon="⚙️" iconBg="rgba(52,152,219,0.15)" title="General" sub="Display and behaviour preferences">
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
          <Row label="Default market sort" desc="Which column the market table opens sorted by">
            <select className="settings-select" value={`${sortCol}:${sortDir}`} onChange={e => {
              const [col, dir] = e.target.value.split(":");
              onSetDefaultSort(col, dir);
              showToast("Default sort saved.", "success");
            }}>
              {SORT_OPTIONS.map(o => (
                <option key={o.col} value={`${o.col}:${o.dir}`}>{o.label}</option>
              ))}
            </select>
          </Row>
          <Row label="Sync pause auto-resume" desc="How long before sync auto-resumes after being paused (minutes)">
            <select className="settings-select" value={pauseTimeout} onChange={e => {
              setPauseTimeout(e.target.value);
              try { localStorage.setItem("runetrader_pause_timeout", e.target.value); } catch {}
              showToast("Pause timeout saved.", "success");
            }}>
              {["15","30","60","120","240"].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </Row>
        </Section>

        {/* ── ALERTS & NOTIFICATIONS ── */}
        <Section icon="🔔" iconBg="rgba(201,168,76,0.12)" title="Alerts & Notifications" sub="How and when you get notified">
          <Row label="Push notifications" desc="Get alerted on your phone or desktop even when the app is closed">
            {notifPermission === "granted" ? (
              <span className="status-pill green">✓ Enabled</span>
            ) : notifPermission === "denied" ? (
              <span className="status-pill dim">Blocked by browser</span>
            ) : (
              <button className="settings-btn gold" disabled={notifLoading} onClick={onRequestNotif}>
                {notifLoading ? "Enabling..." : "Enable"}
              </button>
            )}
          </Row>
          <Row label="Alert check frequency" desc="How often price alerts are evaluated against live prices">
            <select className="settings-select" value={alertFreq} onChange={e => {
              setAlertFreq(e.target.value);
              try { localStorage.setItem("runetrader_alert_freq", e.target.value); } catch {}
              showToast("Alert frequency saved.", "success");
            }}>
              <option value="5">Every 5 min</option>
              <option value="10">Every 10 min</option>
              <option value="15">Every 15 min</option>
              <option value="30">Every 30 min</option>
            </select>
          </Row>
          {[
            { key: "marginSpike",  icon: "📈", label: "Margin Spike",  desc: "Margin jumps significantly above recent levels" },
            { key: "volumeSurge",  icon: "🔥", label: "Volume Surge",  desc: "Daily volume multiplies suddenly" },
            { key: "dumpDetected", icon: "⚠️", label: "Dump Detected", desc: "Sell price drops sharply — someone selling in bulk" },
            { key: "priceCrash",   icon: "💥", label: "Price Crash",   desc: "Both buy and sell prices collapse" },
          ].map(({ key, icon, label, desc }) => (
            <Row key={key} label={`${icon} ${label}`} desc={desc}>
              <Toggle on={smartAlertSettings?.[key] ?? true} onChange={val => onSaveSmartAlert(key, val)} />
            </Row>
          ))}
        </Section>

        {/* ── RUNELITE PLUGIN ── */}
        <Section icon="🔌" iconBg="rgba(52,152,219,0.12)" title="RuneLite Plugin" sub="Plugin connection and API key management">
          <Row label="Plugin Hub" desc="Install the RuneTrader plugin from the RuneLite Plugin Hub, then paste your API key below">
            <a href="https://runelite.net/plugin-hub" target="_blank" rel="noreferrer" className="settings-btn" style={{ textDecoration: "none", display: "inline-block" }}>
              Open Plugin Hub ↗
            </a>
          </Row>
          <Row label="Sync pause timeout" desc="Matches the General setting — how long before sync auto-resumes">
            <span style={{ fontSize: "13px", color: "#c9a84c", fontWeight: 600 }}>{pauseTimeout} min</span>
          </Row>
          <div style={{ padding: "0 20px 4px" }}>
            {/* New key reveal */}
            {newKey && (
              <div className="new-key-banner">
                <div className="new-key-banner-title">✅ New key generated — copy it now. It won't be shown again.</div>
                <div className="new-key-banner-row">
                  <code className="settings-code" style={{ flex: 1 }}>{newKey}</code>
                  <button className="settings-btn" onClick={() => { navigator.clipboard.writeText(newKey); showToast("Copied!", "success"); }}>Copy</button>
                </div>
                <button onClick={() => setNewKey(null)} style={{ background: "none", border: "none", color: "#6a7d90", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0, alignSelf: "flex-start" }}>
                  I've copied it — dismiss
                </button>
              </div>
            )}
            {/* Generate form */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 0 4px" }}>
              <input
                className="settings-input" style={{ flex: 1 }}
                placeholder='Label, e.g. "My RuneLite client"'
                value={newLabel} onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") generateKey(); }}
                maxLength={64}
              />
              <button className="settings-btn gold" onClick={generateKey} disabled={generating || !newLabel.trim() || keys.length >= 5}>
                {generating ? "Generating..." : "Generate Key"}
              </button>
            </div>
            {keys.length >= 5 && <div style={{ fontSize: "12px", color: "#6a7d90", paddingBottom: "8px" }}>Maximum of 5 keys reached. Revoke one to create a new key.</div>}
          </div>
          {/* Key table */}
          {(keysLoading || keys.length > 0) && (
            <div style={{ borderTop: "1px solid #0f1820" }}>
              <div className="key-table-head">
                <span>Label</span><span>Created</span><span>Last Used</span><span></span>
              </div>
              {keysLoading ? [1,2].map(i => (
                <div key={i} className="key-table-row">
                  <div className="settings-skeleton" style={{ width: "60%" }} />
                  <div className="settings-skeleton" style={{ width: "70px" }} />
                  <div className="settings-skeleton" style={{ width: "70px" }} />
                  <div className="settings-skeleton" style={{ width: "40px" }} />
                </div>
              )) : keys.map((key, i) => (
                <div key={key.id} className="key-table-row">
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#e8e8e8" }}>{key.label || "Unlabelled"}</div>
                    <div style={{ fontSize: "11px", color: "#3d5060", fontFamily: "monospace", marginTop: "2px" }}>rt_••••••••</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#6a7d90" }}>{fmtDate(key.created_at)}</span>
                  <span style={{ fontSize: "12px", color: key.last_used ? "#6a7d90" : "#2a3a4a" }}>{key.last_used ? fmtDate(key.last_used) : "Never"}</span>
                  <button className="settings-btn danger" style={{ padding: "4px 10px", fontSize: "11px" }}
                    onClick={() => setConfirm({ title: "Revoke API Key", desc: `Revoke "${key.label || "Unlabelled"}"? The RuneLite plugin using this key will stop syncing immediately.`, action: () => revokeKey(key.id) })}
                    disabled={revoking === key.id}>
                    {revoking === key.id ? "..." : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── CONNECTIONS ── */}
        <Section icon="🔗" iconBg="rgba(114,137,218,0.15)" title="Connections" sub="Linked accounts and integrations">
          <Row label="Discord account" desc={discordLinked ? "Your Discord is linked — bot commands and flip sync are active" : "Run !verify in Discord to get your code, then enter it below"}>
            {discordChecking ? (
              <span className="settings-skeleton" style={{ width: "80px", display: "inline-block" }} />
            ) : discordLinked ? (
              <span className="status-pill green">✓ Linked</span>
            ) : (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  className="settings-input" style={{ width: "140px" }}
                  placeholder="RT-XXXXXX"
                  value={discordCode}
                  onChange={e => setDiscordCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter") linkDiscord(); }}
                  maxLength={9}
                />
                <button className="settings-btn gold" onClick={linkDiscord} disabled={discordLoading || discordCode.length < 9}>
                  {discordLoading ? "Linking..." : "Link"}
                </button>
              </div>
            )}
          </Row>
        </Section>

        {/* ── ACCOUNT ── */}
        <Section icon="🗑️" iconBg="rgba(231,76,60,0.1)" title="Account" sub="Data export and danger zone" defaultOpen={false}>
          <Row label="Export flip history" desc={`Download all ${flipsLog.filter(f => f.status !== "open").length + autoFlipsLog.length} closed flips as a CSV file`}>
            <button className="settings-btn" onClick={exportData}>
              ↓ Export CSV
            </button>
          </Row>
          <Row label="Clear flip history" desc="Permanently delete all logged flips from your account and this device. This cannot be undone.">
            <button className="settings-btn danger" onClick={() => setConfirm({
              title: "Clear Flip History",
              desc: "This will permanently delete all your logged flips from the database and this device. Your watchlist, alerts and settings will be kept. This cannot be undone.",
              action: clearFlipHistory,
            })}>
              Clear History
            </button>
          </Row>
          <Row label="Delete account" desc="Permanently remove your account, all data, and cancel any active subscription.">
            <button className="settings-btn danger" onClick={() => setConfirm({
              title: "Delete Account",
              desc: "This will permanently delete your account and all associated data including flip history, GE slot data, and your profile. Your Stripe subscription will need to be cancelled separately. This cannot be undone.",
              action: deleteAccount,
            })}>
              Delete Account
            </button>
          </Row>
        </Section>

      </div>

      {/* ── CONFIRM MODAL ── */}
      {confirm && (
        <div className="confirm-overlay" onClick={() => setConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">{confirm.title}</div>
            <div className="confirm-desc">{confirm.desc}</div>
            <div className="confirm-actions">
              <button className="settings-btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="settings-btn danger" onClick={() => { confirm.action(); setConfirm(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
