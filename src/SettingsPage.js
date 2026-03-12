import { useState, useEffect } from "react";

export default function SettingsPage({ user, supabase, showToast }) {
  const [keys, setKeys]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking]   = useState(null); // id being revoked
  const [newLabel, setNewLabel]   = useState("");
  const [newKey, setNewKey]       = useState(null); // shown once after generation

  // ── Load existing keys ──────────────────────────────────────
  useEffect(() => { fetchKeys(); }, []); // eslint-disable-line

  async function fetchKeys() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/api-keys", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.ok) setKeys(json.keys);
    } catch (e) {
      showToast("Failed to load API keys.", "error");
    }
    setLoading(false);
  }

  // ── Generate new key ────────────────────────────────────────
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
        setNewKey(json.api_key);
        setNewLabel("");
        fetchKeys();
        showToast("API key generated! Copy it now — it won't be shown again.", "info", 8000);
      } else {
        showToast(json.error || "Failed to generate key.", "error");
      }
    } catch (e) {
      showToast("Failed to generate key.", "error");
    }
    setGenerating(false);
  }

  // ── Revoke key ──────────────────────────────────────────────
  async function revokeKey(id) {
    setRevoking(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/api-keys?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setKeys(prev => prev.filter(k => k.id !== id));
        showToast("API key revoked.", "success");
      } else {
        showToast(json.error || "Failed to revoke key.", "error");
      }
    } catch (e) {
      showToast("Failed to revoke key.", "error");
    }
    setRevoking(null);
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey);
    showToast("API key copied to clipboard!", "success");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>

      {/* ── Section: RuneLite Plugin ── */}
      <div>
        <div className="section-title">🔌 RuneLite Plugin</div>
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7" }}>
            The RuneTrader RuneLite plugin syncs your Grand Exchange slots to this dashboard in real time.
            Install it from the RuneLite Plugin Hub, then paste your API key into the plugin settings.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="https://runelite.net/plugin-hub"
              target="_blank"
              rel="noreferrer"
              style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--gold-dim)", background: "rgba(201,168,76,0.08)", color: "var(--gold)", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              🔌 Open Plugin Hub
            </a>
          </div>
          <div style={{ background: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.2)", borderRadius: "8px", padding: "12px 16px", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <span>ℹ️</span>
            <span>The plugin only sends <strong style={{ color: "var(--text)" }}>your own</strong> GE data to RuneTrader.gg. Nothing is shared with other players. You can revoke access at any time by deleting your API key below.</span>
          </div>
        </div>
      </div>

      {/* ── Section: Generate Key ── */}
      <div>
        <div className="section-title">🗝️ API Keys</div>
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>
            Generate an API key and paste it into the RuneLite plugin settings. Max 5 active keys.
          </p>

          {/* New key reveal banner */}
          {newKey && (
            <div style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.35)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "12px", color: "var(--green)", fontWeight: 600 }}>✅ New key generated — copy it now. It will not be shown again.</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <code style={{ flex: 1, background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "var(--gold)", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {newKey}
                </code>
                <button onClick={copyKey} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--gold-dim)", background: "rgba(201,168,76,0.12)", color: "var(--gold)", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                  Copy
                </button>
              </div>
              <button onClick={() => setNewKey(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", alignSelf: "flex-start", padding: 0 }}>
                I've copied it — dismiss
              </button>
            </div>
          )}

          {/* Generate form */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              className="filter-input"
              style={{ flex: 1 }}
              placeholder='Label, e.g. "My RuneLite client"'
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") generateKey(); }}
              maxLength={64}
            />
            <button
              onClick={generateKey}
              disabled={generating || !newLabel.trim() || keys.length >= 5}
              style={{ padding: "9px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000", fontSize: "13px", fontWeight: "600", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap", opacity: (generating || !newLabel.trim() || keys.length >= 5) ? 0.4 : 1 }}
            >
              {generating ? "Generating..." : "Generate Key"}
            </button>
          </div>
          {keys.length >= 5 && (
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>Maximum of 5 keys reached. Revoke one to create a new key.</div>
          )}
        </div>
      </div>

      {/* ── Section: Active Keys ── */}
      {(loading || keys.length > 0) && (
        <div>
          <div className="section-title">🔑 Active Keys</div>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", padding: "10px 16px", background: "var(--bg4)", fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border)" }}>
              <span>Label</span>
              <span>Created</span>
              <span>Last Used</span>
              <span></span>
            </div>

            {loading ? (
              [1,2].map(i => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", padding: "14px 16px", borderBottom: "1px solid var(--border)", gap: "12px" }}>
                  <div className="skeleton" style={{ width: "60%" }} />
                  <div className="skeleton" style={{ width: "80px" }} />
                  <div className="skeleton" style={{ width: "80px" }} />
                  <div className="skeleton" style={{ width: "60px" }} />
                </div>
              ))
            ) : keys.map((key, i) => (
              <div key={key.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", padding: "14px 16px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.15s" }}
                onMouseOver={e => e.currentTarget.style.background = "var(--bg4)"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{key.label || "Unlabelled"}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px", fontFamily: "monospace" }}>rt_••••••••</div>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{formatDate(key.created_at)}</span>
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{key.last_used ? formatDate(key.last_used) : <span style={{ color: "var(--border)" }}>Never</span>}</span>
                <button
                  onClick={() => revokeKey(key.id)}
                  disabled={revoking === key.id}
                  className="delete-btn"
                  title="Revoke this key"
                  style={{ opacity: revoking === key.id ? 0.4 : 1 }}
                >
                  {revoking === key.id ? "..." : "✕"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && keys.length === 0 && !newKey && (
        <div className="empty-state">
          <div className="icon">🗝️</div>
          <p>No API keys yet</p>
          <small>Generate a key above and paste it into the RuneLite plugin settings.</small>
        </div>
      )}

    </div>
  );
}
