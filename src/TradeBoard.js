// src/TradeBoard.js
import { useState, useEffect, useCallback } from "react";

const WIKI_MAP = "https://prices.runescape.wiki/api/v1/osrs/mapping";
const WIKI_IMG = (name) => `https://oldschool.runescape.wiki/images/${encodeURIComponent(name.replace(/ /g, "_"))}_detail.png`;

const CATEGORIES = ["All", "Weapons", "Armour", "3rd Age", "Raids", "Skilling", "Other"];

const MAX_CASH = 2_147_483_647;

function formatGP(n) {
  if (!n) return "—";
  return Math.round(n).toLocaleString("en-GB") + " gp";
}


function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function timeLeft(ts) {
  const diff = Math.floor((new Date(ts) - Date.now()) / 1000);
  if (diff <= 0) return "Expired";
  if (diff < 3600) return `${Math.floor(diff / 60)}m left`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h left`;
  return `${Math.floor(diff / 86400)}d left`;
}

function ItemImage({ name, size = 44 }) {
  const [src, setSrc] = useState(WIKI_IMG(name));
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div style={{ width: size, height: size, borderRadius: "8px", background: "var(--bg4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
        📦
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => {
        if (src.includes("_detail")) {
          setSrc(`https://oldschool.runescape.wiki/images/${encodeURIComponent(name.replace(/ /g, "_"))}.png`);
        } else {
          setFailed(true);
        }
      }}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, borderRadius: "8px", background: "var(--bg4)", padding: "4px" }}
    />
  );
}

export default function TradeBoard({ user, supabase, showToast }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showPostForm, setShowPostForm] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [myListings, setMyListings] = useState(false);

  // Form state
  const [form, setForm] = useState({
    item_name: "", item_image: "", type: "WTS",
    price: "", quantity: "1", notes: "",
    discord: "", rsn: "", category: "Other"
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadListings();
    loadItemNames();
  }, []); // eslint-disable-line

  async function loadItemNames() {
    try {
      const res = await fetch(WIKI_MAP, { headers: { "User-Agent": "RuneTrader.gg" } });
      const data = await res.json();
      setAllItems(data.map(i => i.name));
    } catch (e) { console.error(e); }
  }

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trade_listings")
        .select("*")
        .eq("active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (!error) setListings(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [supabase]);

  function handleItemSearch(val) {
    setItemSearch(val);
    setForm(f => ({ ...f, item_name: val, item_image: WIKI_IMG(val) }));
    if (val.length < 2) { setItemSuggestions([]); return; }
    const matches = allItems.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
    setItemSuggestions(matches);
  }

  function selectItem(name) {
    setItemSearch(name);
    setForm(f => ({ ...f, item_name: name, item_image: WIKI_IMG(name) }));
    setItemSuggestions([]);
  }

  async function submitListing() {
    if (!form.item_name) return showToast("Please enter an item name", "error");
    if (allItems.length > 0 && !allItems.includes(form.item_name)) return showToast("Please select a valid in-game item from the suggestions", "error");
    if (!form.price) return showToast("Please enter a price", "error");
    if (!form.discord && !form.rsn) return showToast("Please add at least one contact method", "error");
    if (!user) return showToast("Please sign in to post", "error");

    const price = parseInt(form.price.replace(/[^0-9]/g, ""));
    if (isNaN(price) || price <= 0) return showToast("Invalid price", "error");

    setPosting(true);
    try {
      const { error } = await supabase.from("trade_listings").insert({
        user_id: user.id,
        item_name: form.item_name,
        item_image: form.item_image,
        type: form.type,
        price,
        quantity: parseInt(form.quantity) || 1,
        notes: form.notes || null,
        discord: form.discord || null,
        rsn: form.rsn || null,
        category: form.category,
      });

      if (error) throw error;
      showToast("Listing posted! It will expire in 7 days.", "success");
      setShowPostForm(false);
      setForm({ item_name: "", item_image: "", type: "WTS", price: "", quantity: "1", notes: "", discord: "", rsn: "", category: "Other" });
      setItemSearch("");
      loadListings();
    } catch (e) {
      console.error("Post listing error:", e);
      showToast("Failed to post listing. Please try again.", "error");
      setPosting(false);
    }
  }

  async function closeListing(id) {
    const { error } = await supabase
      .from("trade_listings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      showToast("Failed to remove listing: " + error.message, "error");
    } else {
      setListings(prev => prev.filter(l => l.id !== id));
      showToast("Listing removed", "success");
    }
  }

  const filtered = listings.filter(l => {
    if (typeFilter !== "All" && l.type !== typeFilter) return false;
    if (filter !== "All" && l.category !== filter) return false;
    if (myListings && l.user_id !== user?.id) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6 }}>
Player-to-player trades. All transactions occur in-game — RuneTrader does not facilitate, verify, or take responsibility for any trade.
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          {user && (
            <button onClick={() => setMyListings(m => !m)}
              style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${myListings ? "var(--gold-dim)" : "var(--border)"}`, background: myListings ? "rgba(201,168,76,0.1)" : "transparent", color: myListings ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              My Listings
            </button>
          )}
          <button onClick={loadListings}
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            ↻
          </button>
          {user ? (
            <button onClick={() => setShowPostForm(true)}
              style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Cinzel, serif", letterSpacing: "0.5px" }}>
              + Post Listing
            </button>
          ) : (
            <div style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic" }}>Sign in to post</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["All", "WTS", "WTB"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "5px 12px", borderRadius: "6px", border: `1px solid ${typeFilter === t ? (t === "WTS" ? "rgba(231,76,60,0.5)" : t === "WTB" ? "rgba(46,204,113,0.5)" : "var(--gold-dim)") : "var(--border)"}`, background: typeFilter === t ? (t === "WTS" ? "rgba(231,76,60,0.1)" : t === "WTB" ? "rgba(46,204,113,0.1)" : "rgba(201,168,76,0.1)") : "transparent", color: typeFilter === t ? (t === "WTS" ? "var(--red)" : t === "WTB" ? "var(--green)" : "var(--gold)") : "var(--text-dim)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              style={{ padding: "5px 12px", borderRadius: "6px", border: `1px solid ${filter === c ? "var(--border)" : "transparent"}`, background: filter === c ? "var(--bg3)" : "transparent", color: filter === c ? "var(--text)" : "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ height: "80px", background: "var(--bg3)", borderRadius: "12px", opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)", background: "var(--bg3)", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
          <div style={{ fontSize: "15px", marginBottom: "6px" }}>No listings yet</div>
          <div style={{ fontSize: "13px" }}>{user ? "Be the first to post a listing." : "Sign in to post a listing."}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(l => (
            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: "14px", alignItems: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px", transition: "border-color 0.15s" }}
              onMouseOver={e => e.currentTarget.style.borderColor = "var(--border-hover, rgba(255,255,255,0.15))"}
              onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>

              <ItemImage name={l.item_name} size={56} />

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{l.item_name}</span>
                  <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: l.type === "WTS" ? "rgba(231,76,60,0.12)" : "rgba(46,204,113,0.12)", color: l.type === "WTS" ? "var(--red)" : "var(--green)", border: `1px solid ${l.type === "WTS" ? "rgba(231,76,60,0.3)" : "rgba(46,204,113,0.3)"}` }}>
                    {l.type}
                  </span>
                  {l.quantity > 1 && <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>×{l.quantity.toLocaleString()}</span>}
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-dim)", flexWrap: "wrap" }}>
                  {l.discord && <span>Discord: <span style={{ color: "var(--text)" }}>{l.discord}</span></span>}
                  {l.rsn && <span>RSN: <span style={{ color: "var(--text)" }}>{l.rsn}</span></span>}
                  {l.notes && <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>{l.notes}</span>}
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "11px", color: "var(--text-dim)" }}>
                  <span>{timeAgo(l.created_at)}</span>
                  <span style={{ color: "var(--gold-dim)" }}>{timeLeft(l.expires_at)}</span>
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: "16px", fontWeight: 700, color: "var(--gold)" }}>
                  {l.quantity > 1 ? formatGP(l.price * l.quantity) : formatGP(l.price)}
                </div>
                {l.quantity > 1 && (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>
                    {formatGP(l.price)} each · {l.quantity.toLocaleString()} qty
                  </div>
                )}
                {(l.quantity > 1 ? l.price * l.quantity : l.price) > MAX_CASH && (
                  <div style={{ fontSize: "11px", color: "var(--gold-dim)", marginTop: "2px" }}>Above max cash</div>
                )}
                {user?.id === l.user_id && (
                  <button onClick={() => closeListing(l.id)}
                    style={{ marginTop: "6px", padding: "3px 10px", borderRadius: "4px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                    onMouseOver={e => { e.target.style.color = "var(--red)"; e.target.style.borderColor = "var(--red)"; }}
                    onMouseOut={e => { e.target.style.color = "var(--text-dim)"; e.target.style.borderColor = "var(--border)"; }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post form modal */}
      {showPostForm && user && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowPostForm(false); }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ fontFamily: "Cinzel, serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)" }}>Post a Listing</div>

            {/* Item search */}
            <div style={{ position: "relative" }}>
              <label style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Item Name *</label>
              <input value={itemSearch} onChange={e => handleItemSearch(e.target.value)} placeholder="e.g. Twisted bow"
                onBlur={() => setTimeout(() => setItemSuggestions([]), 200)}
                style={{ width: "100%", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "14px", fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
              {itemSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 10, maxHeight: "200px", overflowY: "auto", marginTop: "4px" }}>
                  {itemSuggestions.map(s => (
                    <div key={s} onClick={() => selectItem(s)}
                      style={{ padding: "8px 12px", fontSize: "13px", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                      onMouseOver={e => e.currentTarget.style.background = "var(--bg3)"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                      <ItemImage name={s} size={24} />
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Type + Category */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Type *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["WTS", "WTB"].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{ flex: 1, padding: "9px", borderRadius: "8px", border: `1px solid ${form.type === t ? (t === "WTS" ? "rgba(231,76,60,0.5)" : "rgba(46,204,113,0.5)") : "var(--border)"}`, background: form.type === t ? (t === "WTS" ? "rgba(231,76,60,0.1)" : "rgba(46,204,113,0.1)") : "transparent", color: form.type === t ? (t === "WTS" ? "var(--red)" : "var(--green)") : "var(--text-dim)", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      {t === "WTS" ? "Selling" : "Buying"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 12px", color: "var(--text)", fontSize: "13px", fontFamily: "Inter, sans-serif", outline: "none" }}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Price + Qty */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              {[
                { key: "price", label: "Price per item (gp) *", placeholder: "e.g. 2500000000" },
                { key: "quantity", label: "Quantity", placeholder: "1" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ width: "100%", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "14px", fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            {/* Price preview */}
            {form.price && (() => {
              const perItem = parseInt(form.price.replace(/[^0-9]/g, "")) || 0;
              const qty = parseInt(form.quantity) || 1;
              const total = perItem * qty;
              return (
                <div style={{ fontSize: "13px", color: "var(--gold)", background: "rgba(201,168,76,0.08)", border: "1px solid var(--gold-dim)", borderRadius: "8px", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {qty > 1 ? (
                    <>
                      <div><span style={{ color: "var(--text-dim)" }}>Per item:</span> {formatGP(perItem)}</div>
                      <div><span style={{ color: "var(--text-dim)" }}>Total ({qty.toLocaleString()}x):</span> <strong>{formatGP(total)}</strong></div>
                    </>
                  ) : (
                    <div>{formatGP(perItem)}</div>
                  )}
                  {total > MAX_CASH && <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>Above max cash — player-to-player trade required</div>}
                </div>
              );
            })()}

            {/* Contact */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { key: "discord", label: "Discord Username", placeholder: "Username#0000" },
                { key: "rsn", label: "RSN", placeholder: "In-game name" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ width: "100%", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "13px", fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Notes (optional)</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Will split payment, bundle only, swap offers welcome..."
                style={{ width: "100%", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "13px", fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic" }}>
              Listing expires automatically after 7 days. All trades occur in-game. The sale of account names, services, or anything violating RuneScape rules is prohibited.
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowPostForm(false)}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                Cancel
              </button>
              <button onClick={submitListing} disabled={posting}
                style={{ flex: 2, padding: "12px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000", fontSize: "14px", fontWeight: 700, cursor: posting ? "wait" : "pointer", fontFamily: "Cinzel, serif", letterSpacing: "0.5px", opacity: posting ? 0.7 : 1 }}>
                {posting ? "Posting..." : "Post Listing →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
