// src/TradeBoard.js
import { useState, useEffect, useCallback, useRef } from "react";

const WIKI_MAP = "https://prices.runescape.wiki/api/v1/osrs/mapping";
const WIKI_IMG = (name) => `https://oldschool.runescape.wiki/images/${encodeURIComponent(name.replace(/ /g, "_"))}_detail.png`;
const CATEGORIES = ["All", "Weapons", "Armour", "3rd Age", "Runes", "Ammunition", "Potions", "Food", "Skilling Resources", "Other"];
const MAX_CASH = 2_147_483_647;
const DISCORD_SERVER_ID  = "1459412578999599216";
const DISCORD_CHANNEL_ID = "1491584732025065544";
// const DISCORD_INVITE  = "https://discord.gg/runetrader"; // reserved for future join prompt
const DISCORD_TRADE_URL  = `https://discord.com/channels/${DISCORD_SERVER_ID}/${DISCORD_CHANNEL_ID}`;

// ── Parse k/m/b shorthand: "100k" → 100000, "2.5m" → 2500000 ──
function parseGPInput(raw) {
  if (!raw && raw !== 0) return 0;
  const s = String(raw).trim().toLowerCase().replace(/,/g, "");
  const match = s.match(/^(\d+\.?\d*)\s*([kmb]?)$/);
  if (!match) return parseInt(s.replace(/[^0-9]/g, "")) || 0;
  const num = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === "k") return Math.round(num * 1_000);
  if (suffix === "m") return Math.round(num * 1_000_000);
  if (suffix === "b") return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

// ── Compact display: 2500000 → "2.5M" ──
function compactGP(n) {
  if (!n && n !== 0) return "—";
  if (n === 0) return "0";
  if (n >= 1_000_000_000) return (n / 1_000_000_000 % 1 === 0 ? n / 1_000_000_000 : (n / 1_000_000_000).toFixed(1)) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000 % 1 === 0 ? n / 1_000_000 : (n / 1_000_000).toFixed(1)) + "M";
  if (n >= 1_000)         return (n / 1_000 % 1 === 0 ? n / 1_000 : (n / 1_000).toFixed(1)) + "K";
  return n.toLocaleString("en-GB");
}

function formatGP(n) {
  if (!n && n !== 0) return "—";
  return Math.round(n).toLocaleString("en-GB") + " gp";
}

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (isNaN(diff) || diff < 0) return "—";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function timeLeft(ts) {
  if (!ts) return "—";
  const diff = Math.floor((new Date(ts) - Date.now()) / 1000);
  if (isNaN(diff) || diff <= 0) return "Expired";
  if (diff < 3600) return `${Math.floor(diff / 60)}m left`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h left`;
  return `${Math.floor(diff / 86400)}d left`;
}

function timeLeftPct(ts) {
  if (!ts) return 0;
  const total = 7 * 24 * 3600;
  const remaining = Math.max(0, (new Date(ts) - Date.now()) / 1000);
  return isNaN(remaining) ? 0 : Math.min(100, (remaining / total) * 100);
}

function ItemImage({ name, size = 44 }) {
  const safeName = name || "Unknown_item";
  const [src, setSrc] = useState(WIKI_IMG(safeName));
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div style={{ width: size, height: size, borderRadius: "8px", background: "var(--bg4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.45) + "px", flexShrink: 0 }}>📦</div>
  );
  return (
    <img src={src} alt={safeName} width={size} height={size}
      onError={() => {
        if (src.includes("_detail")) setSrc(`https://oldschool.runescape.wiki/images/${encodeURIComponent(safeName.replace(/ /g, "_"))}.png`);
        else setFailed(true);
      }}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, borderRadius: "8px", background: "var(--bg4)", padding: "4px" }}
    />
  );
}

const BUMP_COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes
const MAX_LISTINGS_PER_USER = 8;

// Normalise legacy DB category names to current ones
function normaliseCategory(cat, itemName) {
  if (!cat) return "Other";
  const c = cat.toLowerCase();
  // Legacy mappings
  if (c === "runes & ammo") return inferAmmoOrRune(itemName) === "ammo" ? "Ammunition" : "Runes";
  if (c === "ammo" || c === "ammunition") return "Ammunition";
  if (c === "runes") return "Runes";
  if (c === "food & supplies" || c === "food") return "Food";
  if (c === "skilling" || c === "skilling resources") return "Skilling Resources";
  if (c === "boss drops" || c === "cosmetics" || c === "raids") return "Other";
  const match = CATEGORIES.find(cat2 => cat2.toLowerCase() === c);
  if (match) return match;
  // Infer from item name for legacy "Other" listings
  if (c === "other" && itemName) {
    const n = itemName.toLowerCase();
    if (/arrow|bolt|dart|cannonball|javelin|chinchompa|thrownaxe/.test(n)) return "Ammunition";
    if (/(air|water|earth|fire|mind|chaos|death|blood|soul|nature|law|cosmic|astral|wrath|dust|lava|steam|smoke|mist|mud) rune/.test(n) || / rune$| runes$/.test(n)) return "Runes";
    if (/potion|brew|restore|overload|divine|bastion|battlemage/.test(n)) return "Potions";
    if (/shark|anglerfish|karambwan|manta|dark crab|tuna|lobster|monkfish/.test(n)) return "Food";
    if (/ore|bar|log|plank|hide|leather|gem|herb|seed|essence|coal|iron|steel|mithril|adamant/.test(n)) return "Skilling Resources";
  }
  return "Other";
}

function inferAmmoOrRune(itemName) {
  if (!itemName) return "rune";
  const n = itemName.toLowerCase();
  if (/arrow|bolt|dart|cannonball|javelin|chinchompa|thrownaxe|knife/.test(n)) return "ammo";
  return "rune";
}

export default function TradeBoard({ user, supabase, showToast, onNewListings, onWatchAlert, discordUsername, onGoToSettings }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showPostForm, setShowPostForm] = useState(false);
  const [search, setSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [myListings, setMyListings] = useState(false);
  const [bumping, setBumping] = useState(null);
  const [bumpCooldowns, setBumpCooldowns] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rt_bump_cooldowns") || "{}"); } catch { return {}; }
  });
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "price_asc" | "price_desc" | "expiring"
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [reportModal, setReportModal] = useState(null); // listing object
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [form, setForm] = useState({
    item_name: "", item_image: "", type: "WTS",
    price: "", quantity: "1", notes: "",
    discord: "", rsn: "", category: "Other",
    bundle_only: false,
  });
  const [posting, setPosting] = useState(false);
  const [localDiscord, setLocalDiscord] = useState(null); // fetched directly — doesn't race with prop

  // ── Search autocomplete ──
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(-1);
  const searchRef = useRef(null);

  // ── Watch panel add-watch search ──
  const [watchPanelSearch, setWatchPanelSearch] = useState("");
  const [watchPanelSuggestions, setWatchPanelSuggestions] = useState([]);
  const [watchPanelHighlight, setWatchPanelHighlight] = useState(-1);
  const watchPanelRef = useRef(null);

  // ── Watch modal autocomplete (when opened directly from panel) ──
  const [watchModalSearch, setWatchModalSearch] = useState("");
  const [watchModalSuggestions, setWatchModalSuggestions] = useState([]);
  const [watchModalHighlight, setWatchModalHighlight] = useState(-1);

  // ── Watch system ──
  const [watches, setWatches] = useState([]);
  const [watchesLoading, setWatchesLoading] = useState(false);
  const [showWatches, setShowWatches] = useState(false);
  const [watchModal, setWatchModal] = useState(null); // item_name string or null
  const [watchForm, setWatchForm] = useState({ type: "Either", maxPrice: "" });
  const [savingWatch, setSavingWatch] = useState(false);

  useEffect(() => {
    loadListings();
    loadItemNames();
    // Real-time: refresh when listings change (debounced to avoid reload storms)
    let realtimeTimer = null;
    const ch = supabase.channel("trade-listings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "trade_listings" }, () => {
        clearTimeout(realtimeTimer);
        realtimeTimer = setTimeout(() => loadListings(false), 1000);
      }).subscribe();
    return () => { supabase.removeChannel(ch); clearTimeout(realtimeTimer); };
  }, [supabase, onNewListings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset user-specific state on logout
  useEffect(() => {
    if (!user) { setMyListings(false); setShowPostForm(false); setWatches([]); setLocalDiscord(null); }
    else loadWatches();
  }, [user]); // eslint-disable-line

  function getSuggestions(val, limit = 8) {
    if (!val || val.length < 2 || !allItems.length) return [];
    const v = val.toLowerCase();
    // Prioritise items that START with the query, then items that contain it
    const starts = allItems.filter(n => n.toLowerCase().startsWith(v)).slice(0, limit);
    const contains = allItems.filter(n => !n.toLowerCase().startsWith(v) && n.toLowerCase().includes(v)).slice(0, limit - starts.length);
    return [...starts, ...contains];
  }

  async function loadWatches() {
    if (!user) return;
    setWatchesLoading(true);
    try {
      const { data, error } = await supabase
        .from("trade_watches").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) {
        setWatches(data || []);
        // Sync to localStorage for offline detection
        try { localStorage.setItem("rt_trade_watches", JSON.stringify(data || [])); } catch {}
      }
    } catch (e) { console.error(e); }
    finally { setWatchesLoading(false); }
  }

  async function addWatch(itemName) {
    if (!user) return showToast("Sign in to set up watch alerts", "info");
    if (!itemName?.trim()) return showToast("Please enter an item name", "error");
    itemName = itemName.trim();
    const maxPrice = watchForm.maxPrice ? parseGPInput(watchForm.maxPrice) : null;
    // Prevent duplicate watch for same item + type
    if (watches.some(w => w.item_name.toLowerCase() === itemName.toLowerCase() && w.type === watchForm.type)) {
      return showToast(`You're already watching ${itemName} for ${watchForm.type} listings`, "info");
    }
    setSavingWatch(true);
    try {
      const { data, error } = await supabase.from("trade_watches").insert({
        user_id: user.id,
        item_name: itemName,
        type: watchForm.type,
        max_price: maxPrice || null,
      }).select().single();
      if (error) throw error;
      const updated = [data, ...watches];
      setWatches(updated);
      try { localStorage.setItem("rt_trade_watches", JSON.stringify(updated)); } catch {}
      setWatchModal(null);
      setWatchModalSearch("");
      setWatchModalSuggestions([]);
      setWatchForm({ type: "Either", maxPrice: "" });
      showToast(`Watching ${itemName} — you'll be notified when it's listed`, "success");
    } catch (e) { showToast(e?.message || "Failed to save watch", "error"); }
    finally { setSavingWatch(false); }
  }

  async function removeWatch(id) {
    try {
      await supabase.from("trade_watches").delete().eq("id", id).eq("user_id", user.id);
      const updated = watches.filter(w => w.id !== id);
      setWatches(updated);
      try { localStorage.setItem("rt_trade_watches", JSON.stringify(updated)); } catch {}
      showToast("Watch removed", "success");
    } catch { showToast("Failed to remove watch", "error"); }
  }

  function isWatching(itemName) {
    return watches.some(w => w.item_name.toLowerCase() === itemName.toLowerCase());
  }

  // Pre-fill RSN and Discord from profile
  useEffect(() => {
    if (!user) return;
    const username = user.user_metadata?.username || user.email?.split("@")[0] || "";
    setForm(f => ({ ...f, rsn: f.rsn || username }));
    // Fetch discord_username directly — don't rely on prop timing
    supabase.from("user_profiles")
      .select("discord_id, discord_username")
      .eq("user_id", user.id).single()
      .then(({ data }) => {
        // discord_id = linked, discord_username = display name (populated after re-verify)
        const isLinked = !!(data?.discord_id);
        const displayName = data?.discord_username || null;
        // Store discord_id in form for the listing, show username in UI if available
        setLocalDiscord(isLinked ? (displayName || "Discord linked") : null);
        setForm(f => ({ ...f, discord: data?.discord_username || data?.discord_id || "" }));
      });
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (discordUsername) {
      setLocalDiscord(discordUsername);
      setForm(f => ({ ...f, discord: discordUsername }));
    }
  }, [discordUsername]);

  async function loadItemNames() {
    try {
      const res = await fetch(WIKI_MAP, { headers: { "User-Agent": "RuneTrader.gg" } });
      const data = await res.json();
      setAllItems(data.map(i => i.name));
    } catch (e) { console.error(e); }
  }

  const loadListings = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trade_listings").select("*").eq("active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (!error) {
        setListings(data || []);
        // Signal new listings to parent (newest created_at)
        if (data?.length > 0 && onNewListings) {
          const newest = data.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
          if (newest?.created_at) onNewListings(newest.created_at, data);
        }

      }
    } catch (e) { console.error(e); }
    finally { if (showSpinner) setLoading(false); }
  }, [supabase, onNewListings, onWatchAlert]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleItemSearch(val) {
    setItemSearch(val);
    setForm(f => ({ ...f, item_name: val, item_image: WIKI_IMG(val) }));
    if (val.length < 2) { setItemSuggestions([]); return; }
    setItemSuggestions(allItems.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 8));
  }


  function selectItem(name) {
    setItemSearch(name);
    setForm(f => ({ ...f, item_name: name, item_image: WIKI_IMG(name) }));
    setItemSuggestions([]);
  }

  async function submitListing() {
    if (!form.item_name) return showToast("Please enter an item name", "error");
    if (allItems.length > 0 && !allItems.some(n => n.toLowerCase() === form.item_name.toLowerCase())) return showToast("Please select a valid item from the suggestions", "error");
    if (!form.price) return showToast("Please enter a price", "error");
    if (!form.discord && !form.rsn) return showToast("Please add at least one contact method", "error");
    if (!user) return showToast("Please sign in to post", "error");

    const price = parseGPInput(form.price);
    if (!price || price <= 0) return showToast("Invalid price — try e.g. 2.5m or 500k", "error");
    if (price > 999_000_000_000) return showToast("Price seems too high — max 999B gp", "error");
    const qty = Math.max(1, Math.min(2_147_483_647, parseGPInput(form.quantity) || parseInt(form.quantity) || 1));
    if (!Number.isFinite(qty)) return showToast("Invalid quantity", "error");

    // Check max listing count
    const myActiveListings = listings.filter(l => l.user_id === user.id);
    if (myActiveListings.length >= MAX_LISTINGS_PER_USER)
      return showToast(`You can have at most ${MAX_LISTINGS_PER_USER} active listings at once. Remove one to post a new listing.`, "error");

    // Check for duplicate: same user, same item, same type (WTS or WTB)
    const duplicate = listings.find(l =>
      l.user_id === user.id &&
      (l.item_name || "").toLowerCase() === form.item_name.toLowerCase() &&
      l.type === form.type
    );
    if (duplicate) return showToast(`You already have an active ${form.type} listing for ${form.item_name}. Remove or edit it before posting another.`, "error");

    setPosting(true);
    try {
      const { error } = await supabase.from("trade_listings").insert({
        user_id: user.id,
        item_name: form.item_name,
        item_image: form.item_image || null,
        type: form.type,
        price,
        quantity: qty,
        notes: form.notes || null,
        discord: form.discord || null,
        rsn: form.rsn || null,
        category: form.category,
        bundle_only: form.bundle_only || false,
        active: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
      showToast("Listing posted! Expires in 7 days.", "success");
      setShowPostForm(false);
      setForm({ item_name: "", item_image: "", type: "WTS", price: "", quantity: "1", notes: "", discord: "", rsn: user?.user_metadata?.username || "", category: "Other", bundle_only: false });
      setItemSearch("");
      loadListings(false);
    } catch (e) {
      console.error("[TradeBoard] Post error:", e);
      showToast(e?.message || "Failed to post listing. Please try again.", "error");
    } finally { setPosting(false); }
  }

  async function closeListing(id) {
    const { error } = await supabase.from("trade_listings").delete().eq("id", id).eq("user_id", user.id);
    if (error) { showToast("Failed to remove: " + error.message, "error"); return; }
    setListings(prev => prev.filter(l => l.id !== id));
    const updated = { ...bumpCooldowns }; delete updated[id];
    setBumpCooldowns(updated);
    try { localStorage.setItem("rt_bump_cooldowns", JSON.stringify(updated)); } catch {}
    showToast("Listing removed", "success");
  }

  function getBumpCooldownRemaining(id) {
    const last = bumpCooldowns[id];
    if (!last) return 0;
    return Math.max(0, BUMP_COOLDOWN_MS - (Date.now() - last));
  }

  function formatCooldown(ms) {
    const mins = Math.ceil(ms / 60000);
    if (mins >= 60) {
      const h = Math.floor(mins / 60), m = mins % 60;
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    return `${mins}m`;
  }

  async function bumpListing(id) {
    const remaining = getBumpCooldownRemaining(id);
    if (remaining > 0) return showToast(`Bump available in ${formatCooldown(remaining)}`, "error");
    if (bumping) return; // prevent double-fire
    setBumping(id);
    try {
      const newExpiry = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      const { error } = await supabase.from("trade_listings")
        .update({ created_at: new Date().toISOString(), expires_at: newExpiry })
        .eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      const updated = { ...bumpCooldowns, [id]: Date.now() };
      setBumpCooldowns(updated);
      try { localStorage.setItem("rt_bump_cooldowns", JSON.stringify(updated)); } catch {}
      showToast("Listing bumped to top!", "success");
      loadListings(false);
    } catch { showToast("Failed to bump listing", "error"); }
    finally { setBumping(null); }
  }

  function openDiscordTrade(l) {
    const mention = `@${l.discord}`;
    const totalPrice = (l.price || 0) * (l.quantity || 1);
    const priceStr = l.quantity > 1
      ? `${compactGP(l.price || 0)} each (${compactGP(totalPrice)} total)`
      : compactGP(l.price || 0);
    const msg = `${mention} — interested in your ${l.item_name} listing (${l.type === "WTS" ? "selling" : "buying"}${(l.quantity || 1) > 1 ? ` ×${l.quantity.toLocaleString()} @` : ""} ${priceStr} gp) — RuneTrader.gg`;
    // Copy message to clipboard, then open Discord trade channel
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(msg).catch(() => {}); }
    window.open(DISCORD_TRADE_URL, "_blank", "noopener,noreferrer");
    showToast("Message copied — paste it in #trade-chat to ping the seller!", "info", 5000);
  }

  async function submitReport() {
    if (!reportReason.trim()) return showToast("Please describe the issue", "error");
    setSubmittingReport(true);
    try {
      await supabase.from("trade_reports").insert({
        listing_id: reportModal.id,
        reporter_id: user?.id || null,
        reason: reportReason.trim(),
      });
      showToast("Report submitted. Thank you.", "success");
      setReportModal(null);
      setReportReason("");
    } catch { showToast("Failed to submit report", "error"); }
    finally { setSubmittingReport(false); }
  }

  const priceMinNum = parseGPInput(priceMin);
  const priceMaxNum = parseGPInput(priceMax);
  const priceFilterActive = priceMinNum > 0 || priceMaxNum > 0;

  const filtered = listings
    .filter(l => {
      if (typeFilter !== "All" && l.type !== typeFilter) return false;
      if (filter !== "All" && normaliseCategory(l.category, l.item_name) !== filter) return false;
      if (myListings && l.user_id !== user?.id) return false;
      if (search.trim() && !(l.item_name || "").toLowerCase().includes(search.trim().replace(/\s+/g, " ").toLowerCase())) return false;
      if (priceMinNum > 0 && l.price < priceMinNum) return false;
      if (priceMaxNum > 0 && l.price > priceMaxNum) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")  return (a.price || 0) - (b.price || 0);
      if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "expiring") {
        const ea = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
        const eb = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
        return ea - eb;
      }
      const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
      const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return cb - ca;
    });

  const inputStyle = { width: "100%", background: "var(--bg4)", border: "1px solid #1c2a3a", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" };
  const labelStyle = { fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, display: "block", marginBottom: "6px", fontFamily: "'DM Sans', sans-serif" };

  // Price preview in form
  const formPriceNum = parseGPInput(form.price);
  const formQtyNum = parseGPInput(form.quantity) || parseInt(form.quantity) || 1;
  const formTotal = formPriceNum * formQtyNum;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6, maxWidth: "580px" }}>
          Player-to-player trades. All transactions occur in-game — RuneTrader does not facilitate, verify, or take responsibility for any trade.
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          {user && (
            <>
              <button onClick={() => setMyListings(m => !m)}
                style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${myListings ? "var(--gold-dim)" : "var(--border)"}`, background: myListings ? "rgba(201,168,76,0.1)" : "transparent", color: myListings ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                My Listings
                {(() => { const n = listings.filter(l => l.user_id === user?.id).length; return n > 0 ? <span style={{ background: myListings ? "var(--gold)" : "var(--bg4)", color: myListings ? "#000" : "var(--text-dim)", borderRadius: "10px", padding: "0 6px", fontSize: "11px", fontWeight: 700 }}>{n}</span> : null; })()}
              </button>
              <button onClick={() => setShowWatches(w => !w)}
                style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${showWatches ? "rgba(201,168,76,0.4)" : "var(--border)"}`, background: showWatches ? "rgba(201,168,76,0.1)" : "transparent", color: showWatches ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                My Watches
                {watches.length > 0 && <span style={{ background: showWatches ? "var(--gold)" : "var(--bg4)", color: showWatches ? "#000" : "var(--text-dim)", borderRadius: "10px", padding: "0 6px", fontSize: "11px", fontWeight: 700 }}>{watches.length}</span>}
              </button>
            </>
          )}
          <button onClick={loadListings} title="Refresh"
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #1c2a3a", background: "transparent", color: "var(--text-dim)", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ↻
          </button>
          {user ? (() => {
            const myCount = listings.filter(l => l.user_id === user.id).length;
            const atLimit = myCount >= MAX_LISTINGS_PER_USER;
            return (
              <button onClick={() => !atLimit && setShowPostForm(true)}
                title={atLimit ? `Listing limit reached (${MAX_LISTINGS_PER_USER} max). Remove one to post more.` : `${MAX_LISTINGS_PER_USER - myCount} listing slot${MAX_LISTINGS_PER_USER - myCount !== 1 ? "s" : ""} remaining`}
                style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: atLimit ? "var(--bg3)" : "linear-gradient(135deg, #c9a84c, #e8c96a)", color: atLimit ? "var(--text-dim)" : "#0a0e14", fontSize: "13px", fontWeight: 700, cursor: atLimit ? "not-allowed" : "pointer", fontFamily: "'Cinzel', serif", letterSpacing: "0.5px", boxShadow: atLimit ? "none" : "0 2px 8px rgba(201,168,76,0.3)", opacity: atLimit ? 0.6 : 1 }}>
                {atLimit ? `${myCount}/${MAX_LISTINGS_PER_USER} listings` : "+ Post Listing"}
              </button>
            );
          })()
          : (
            <div style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic" }}>Sign in to post</div>
          )}
        </div>
      </div>

      {/* My Watches panel */}
      {showWatches && user && (
        <div style={{ background: "#0c1018", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", fontWeight: 700, color: "var(--gold)" }}>My Watches</span>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>— notified when a watched item is listed</span>
            </div>
            {/* Add watch search inline */}
            <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "320px" }} ref={watchPanelRef}>
              <input
                value={watchPanelSearch}
                onChange={e => { setWatchPanelSearch(e.target.value); setWatchPanelSuggestions(getSuggestions(e.target.value)); setWatchPanelHighlight(-1); }}
                onBlur={() => setTimeout(() => { setWatchPanelSuggestions([]); setWatchPanelHighlight(-1); }, 150)}
                onKeyDown={e => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setWatchPanelHighlight(h => Math.min(h + 1, watchPanelSuggestions.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setWatchPanelHighlight(h => Math.max(h - 1, -1)); }
                  else if (e.key === "Enter") {
                    e.preventDefault();
                    const name = watchPanelHighlight >= 0 ? watchPanelSuggestions[watchPanelHighlight] : watchPanelSearch.trim();
                    if (name) { setWatchModal(name); setWatchForm({ type: "Either", maxPrice: "" }); setWatchPanelSearch(""); setWatchPanelSuggestions([]); }
                  }
                  else if (e.key === "Escape") { setWatchPanelSuggestions([]); setWatchPanelHighlight(-1); }
                }}
                placeholder="Add a watch — type an item name..."
                style={{ width: "100%", background: "var(--bg4)", border: "1px solid #1c2a3a", borderRadius: "8px", padding: "7px 40px 7px 12px", color: "var(--text)", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
              />
              {watchPanelSearch.trim() && (
                <button
                  onClick={() => {
                    const name = watchPanelHighlight >= 0 ? watchPanelSuggestions[watchPanelHighlight] : watchPanelSearch.trim();
                    if (name) { setWatchModal(name); setWatchForm({ type: "Either", maxPrice: "" }); setWatchPanelSearch(""); setWatchPanelSuggestions([]); }
                  }}
                  style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "5px", color: "var(--gold)", fontSize: "11px", fontWeight: 700, padding: "2px 8px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  + Watch
                </button>
              )}
              {watchPanelSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#111620", border: "1px solid #2a3a4d", borderRadius: "8px", zIndex: 200, maxHeight: "220px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                  {watchPanelSuggestions.map((name, i) => (
                    <div key={name} onMouseDown={() => { setWatchModal(name); setWatchForm({ type: "Either", maxPrice: "" }); setWatchPanelSearch(""); setWatchPanelSuggestions([]); }}
                      style={{ padding: "9px 14px", fontSize: "13px", color: i === watchPanelHighlight ? "var(--gold)" : "var(--text)", background: i === watchPanelHighlight ? "rgba(201,168,76,0.08)" : "transparent", cursor: "pointer", borderBottom: i < watchPanelSuggestions.length - 1 ? "1px solid #1a2535" : "none", display: "flex", alignItems: "center", gap: "8px" }}
                      onMouseOver={e => { if (i !== watchPanelHighlight) e.currentTarget.style.background = "var(--bg3)"; }}
                      onMouseOut={e => { if (i !== watchPanelHighlight) e.currentTarget.style.background = "transparent"; }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {watchesLoading ? (
            <div style={{ fontSize: "13px", color: "var(--text-dim)", padding: "8px 0" }}>Loading...</div>
          ) : watches.length === 0 ? (
            <div style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic", padding: "8px 0" }}>
              No watches yet — type an item name above to add your first watch.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {watches.map(w => (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#111620", borderRadius: "8px", border: "1px solid #1c2a3a" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", flex: 1 }}>{w.item_name}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: w.type === "WTS" ? "rgba(231,76,60,0.12)" : w.type === "WTB" ? "rgba(46,204,113,0.12)" : "rgba(201,168,76,0.1)", color: w.type === "WTS" ? "var(--red)" : w.type === "WTB" ? "var(--green)" : "var(--gold)", border: `1px solid ${w.type === "WTS" ? "rgba(231,76,60,0.3)" : w.type === "WTB" ? "rgba(46,204,113,0.3)" : "rgba(201,168,76,0.3)"}` }}>{w.type}</span>
                  {w.max_price && <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>under {compactGP(w.max_price)}</span>}
                  <span style={{ fontSize: "12px", color: "#4a6070" }}>{timeAgo(w.created_at)}</span>
                  <button onClick={() => removeWatch(w.id)}
                    style={{ padding: "3px 10px", borderRadius: "5px", border: "1px solid rgba(231,76,60,0.2)", background: "transparent", color: "#c0564a", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(231,76,60,0.08)"; e.currentTarget.style.borderColor = "rgba(231,76,60,0.5)"; e.currentTarget.style.color = "var(--red)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(231,76,60,0.2)"; e.currentTarget.style.color = "#c0564a"; }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search + filter row */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Search with autocomplete */}
        <div style={{ position: "relative", minWidth: "180px", width: "200px" }} ref={searchRef}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchSuggestions(getSuggestions(e.target.value)); setSearchHighlight(-1); }}
            onFocus={e => { e.target.style.borderColor = "rgba(201,168,76,0.4)"; setSearchFocused(true); if (search.length >= 2) setSearchSuggestions(getSuggestions(search)); }}
            onBlur={() => { setTimeout(() => { setSearchFocused(false); setSearchSuggestions([]); setSearchHighlight(-1); }, 150); }}
            onKeyDown={e => {
              if (!searchSuggestions.length) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setSearchHighlight(h => Math.min(h + 1, searchSuggestions.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setSearchHighlight(h => Math.max(h - 1, -1)); }
              else if (e.key === "Enter" && searchHighlight >= 0) { e.preventDefault(); setSearch(searchSuggestions[searchHighlight]); setSearchSuggestions([]); setSearchHighlight(-1); }
              else if (e.key === "Escape") { setSearchSuggestions([]); setSearchHighlight(-1); }
            }}
            placeholder="Search items..."
            style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "7px 14px", color: "var(--text)", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" }}
          />
          {searchFocused && searchSuggestions.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#111620", border: "1px solid #2a3a4d", borderRadius: "8px", zIndex: 200, maxHeight: "240px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              {searchSuggestions.map((name, i) => (
                <div key={name} onMouseDown={() => { setSearch(name); setSearchSuggestions([]); setSearchHighlight(-1); }}
                  style={{ padding: "9px 14px", fontSize: "14px", color: i === searchHighlight ? "var(--gold)" : "var(--text)", background: i === searchHighlight ? "rgba(201,168,76,0.08)" : "transparent", cursor: "pointer", borderBottom: i < searchSuggestions.length - 1 ? "1px solid #1a2535" : "none", transition: "background 0.1s" }}
                  onMouseOver={e => { if (i !== searchHighlight) e.currentTarget.style.background = "var(--bg3)"; }}
                  onMouseOut={e => { if (i !== searchHighlight) e.currentTarget.style.background = "transparent"; }}>
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: "1px", height: "22px", background: "var(--border)", flexShrink: 0 }} />

        {/* WTS / WTB */}
        <div style={{ display: "flex", gap: "5px" }}>
          {["All", "WTS", "WTB"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "6px 14px", borderRadius: "6px", border: `1px solid ${typeFilter === t ? (t === "WTS" ? "rgba(231,76,60,0.5)" : t === "WTB" ? "rgba(46,204,113,0.5)" : "var(--gold-dim)") : "var(--border)"}`, background: typeFilter === t ? (t === "WTS" ? "rgba(231,76,60,0.1)" : t === "WTB" ? "rgba(46,204,113,0.1)" : "rgba(201,168,76,0.1)") : "transparent", color: typeFilter === t ? (t === "WTS" ? "var(--red)" : t === "WTB" ? "var(--green)" : "var(--gold)") : "var(--text-dim)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Filters button */}
          {(() => {
            const activeFilterCount = (filter !== "All" ? 1 : 0) + (priceFilterActive ? 1 : 0);
            return (
              <button onClick={() => setShowFilters(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "7px", border: `1px solid ${showFilters || activeFilterCount > 0 ? "rgba(201,168,76,0.4)" : "var(--border)"}`, background: showFilters || activeFilterCount > 0 ? "rgba(201,168,76,0.08)" : "transparent", color: showFilters || activeFilterCount > 0 ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                ⚙ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>
            );
          })()}

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "7px", color: "var(--text-dim)", fontSize: "13px", padding: "6px 10px", fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer" }}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
            <option value="expiring">Expiring soon</option>
          </select>


        </div>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Category */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a6070", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, minWidth: "70px" }}>Category</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  style={{
                    padding: "5px 13px", borderRadius: "6px", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                    fontWeight: filter === c ? 700 : 500,
                    transition: "all 0.12s",
                    border: `1px solid ${filter === c ? "rgba(201,168,76,0.35)" : "var(--border)"}`,
                    background: filter === c ? "rgba(201,168,76,0.1)" : "transparent",
                    color: filter === c ? "var(--gold)" : "var(--text-dim)",
                  }}
                  onMouseOver={e => { if (filter !== c) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.color = "var(--text)"; } }}
                  onMouseOut={e => { if (filter !== c) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; } }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a6070", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, minWidth: "70px" }}>Price</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <input value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min e.g. 100k"
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "7px", padding: "7px 12px", color: "var(--text)", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none", width: "140px", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
              <span style={{ color: "var(--text-dim)", fontSize: "14px" }}>—</span>
              <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max e.g. 5m"
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "7px", padding: "7px 12px", color: "var(--text)", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", outline: "none", width: "140px", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
              {priceMinNum > 0 && <span style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>{compactGP(priceMinNum)}</span>}
              {priceMaxNum > 0 && <span style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>→ {compactGP(priceMaxNum)}</span>}
              {priceFilterActive && (
                <button onClick={() => { setPriceMin(""); setPriceMax(""); }}
                  style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "0" }}
                  onMouseOver={e => e.currentTarget.style.color = "var(--red)"}
                  onMouseOut={e => e.currentTarget.style.color = "var(--text-dim)"}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Clear all */}
          {(filter !== "All" || priceFilterActive) && (
            <div>
              <button onClick={() => { setFilter("All"); setPriceMin(""); setPriceMax(""); }}
                style={{ background: "none", border: "none", color: "#c0564a", fontSize: "13px", fontWeight: 600, padding: "0", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                onMouseOver={e => e.currentTarget.style.color = "var(--red)"}
                onMouseOut={e => e.currentTarget.style.color = "#c0564a"}>
                ✕ Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Listing count */}
      {!loading && (
        <div style={{ fontSize: "14px", color: "#6a8099", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          <span style={{ color: "#a8bccb", fontWeight: 700 }}>{filtered.length}</span> listing{filtered.length !== 1 ? "s" : ""}
          {search && <span style={{ color: "#4a6070" }}> matching "{search}"</span>}
          {(filter !== "All") && <span style={{ color: "#4a6070" }}> in <span style={{ color: "#6a8099" }}>{filter}</span></span>}
        </div>
      )}

      {/* Listings */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ height: "88px", background: "var(--bg3)", borderRadius: "12px", opacity: 0.4 + i * 0.1 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)", background: "var(--bg3)", borderRadius: "12px", border: "1px solid #1c2a3a" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
          <div style={{ fontSize: "15px", marginBottom: "6px" }}>
            {search ? `No listings for "${search}"` : (filter !== "All" || typeFilter !== "All" || priceFilterActive) ? "No listings match your filters" : "No listings yet"}
          </div>
          <div style={{ fontSize: "13px" }}>
            {(filter !== "All" || typeFilter !== "All" || priceFilterActive) ? (
              <button onClick={() => { setFilter("All"); setTypeFilter("All"); setPriceMin(""); setPriceMax(""); setSearch(""); }}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-dim)", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", marginTop: "8px" }}>
                Clear all filters
              </button>
            ) : user ? "Be the first to post a listing." : "Sign in to post a listing."}
          </div>
          {search && user && !isWatching(search) && (
            <button onClick={() => { setWatchModal(search); setWatchForm({ type: "Either", maxPrice: "" }); }}
              style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.35)", background: "rgba(201,168,76,0.08)", color: "var(--gold)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(201,168,76,0.14)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Notify me when {search} is listed
            </button>
          )}
          {search && user && isWatching(search) && (
            <div style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "1px solid rgba(46,204,113,0.3)", background: "rgba(46,204,113,0.06)", color: "var(--green)", fontSize: "13px", fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Watching — you'll be notified when this is listed
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(l => {
            const price = l.price || 0;
            const total = price * (l.quantity || 1);
            const displayPrice = (l.quantity || 1) <= 1 ? price : total;
            const isOwn = user?.id === l.user_id;
            const pct = timeLeftPct(l.expires_at);
            const expiryColor = pct > 50 ? "var(--green)" : pct > 20 ? "#f39c12" : "var(--red)";
            const typeColor = l.type === "WTS" ? { bg: "rgba(231,76,60,0.12)", border: "rgba(231,76,60,0.35)", text: "var(--red)" } : { bg: "rgba(46,204,113,0.12)", border: "rgba(46,204,113,0.35)", text: "var(--green)" };
            const counterType = l.type === "WTS" ? "WTB" : "WTS";
            const hasMatch = !!(l.item_name && listings.some(m => m.id !== l.id && (m.item_name || "").toLowerCase() === l.item_name.toLowerCase() && m.type === counterType));
            const cat = normaliseCategory(l.category, l.item_name);
            const cooldownMs = isOwn ? getBumpCooldownRemaining(l.id) : 0;
            const onCooldown = cooldownMs > 0;

            return (
              <div key={l.id} style={{
                background: "#0f1319",
                borderTop: `1px solid ${isOwn ? "rgba(201,168,76,0.22)" : "#1c2a3a"}`,
                borderRight: `1px solid ${isOwn ? "rgba(201,168,76,0.22)" : "#1c2a3a"}`,
                borderBottom: `1px solid ${isOwn ? "rgba(201,168,76,0.22)" : "#1c2a3a"}`,
                borderLeft: `3px solid ${l.type === "WTS" ? "rgba(231,76,60,0.6)" : "rgba(46,204,113,0.6)"}`,
                borderRadius: "14px",
                overflow: "hidden",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = isOwn ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = isOwn ? "rgba(201,168,76,0.22)" : "#1c2a3a"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)"; }}>



                <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: `64px 1fr auto${!isOwn && user ? " 40px" : ""}`, gap: "16px", alignItems: "start" }}>

                  {/* Image */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <ItemImage name={l.item_name} size={56} />
                    {/* Type badge under image */}
                    <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, background: typeColor.bg, color: typeColor.text, border: `1px solid ${typeColor.border}`, letterSpacing: "0.5px" }}>
                      {l.type}
                    </span>
                  </div>

                  {/* Main content */}
                  <div style={{ minWidth: 0 }}>
                    {/* Item name row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", fontFamily: "'DM Sans', sans-serif" }}>{l.item_name || "Unknown item"}</span>
                      {l.quantity > 1 && (
                        <span style={{ fontSize: "13px", color: "var(--text-dim)", fontWeight: 600, background: "var(--bg4)", borderRadius: "6px", padding: "1px 8px" }}>×{l.quantity.toLocaleString()}</span>
                      )}
                      {l.bundle_only && (
                        <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(52,152,219,0.1)", color: "#4fc3f7", border: "1px solid rgba(52,152,219,0.25)" }}>Bundle only</span>
                      )}
                      {hasMatch && (
                        <button onClick={() => { setTypeFilter(counterType); setSearch(l.item_name); setMyListings(false); }}
                          title={`There's a ${counterType} listing for this item`}
                          style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(52,152,219,0.1)", color: "#4fc3f7", border: "1px solid rgba(52,152,219,0.25)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                          ⇄ {counterType} available
                        </button>
                      )}
                    </div>

                    {/* Category + contact row */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-dim)", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "5px", padding: "2px 8px", letterSpacing: "0.3px" }}>{cat}</span>
                      {l.rsn && (
                        <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>
                          RSN: <span style={{ color: "var(--text)", fontWeight: 600 }}>{l.rsn}</span>
                        </span>
                      )}
                      <span style={{ fontSize: "13px", color: "var(--text-dim)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          Discord:
                          {l.discord ? (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="#7289da"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                              <span style={{ color: "#7289da", fontWeight: 500 }}>{l.discord}</span>
                            </>
                          ) : (
                            <span style={{ color: "var(--text-dim)", fontStyle: "italic", opacity: 0.6 }}>Not linked</span>
                          )}
                        </span>
                    </div>

                    {/* Notes */}
                    {l.notes && (
                      <div style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic", background: "rgba(255,255,255,0.03)", borderLeft: "2px solid var(--border)", paddingLeft: "10px", marginBottom: "10px", lineHeight: 1.5, borderRadius: "0 4px 4px 0" }}>
                        {l.notes}
                      </div>
                    )}

                    {/* Footer: time + expiry + actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "#4a6070" }}>{timeAgo(l.created_at)}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <div style={{ width: "48px", height: "3px", borderRadius: "2px", background: "var(--bg4)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: expiryColor, borderRadius: "2px", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: "11px", color: expiryColor, fontWeight: 600 }}>{timeLeft(l.expires_at)}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "2px" }}>
                        {l.discord && !isOwn && (
                          <button onClick={() => openDiscordTrade(l)}
                            style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid rgba(114,137,218,0.35)", background: "rgba(114,137,218,0.08)", color: "#7289da", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "5px" }}
                            onMouseOver={e => { e.currentTarget.style.background = "rgba(114,137,218,0.18)"; e.currentTarget.style.borderColor = "rgba(114,137,218,0.6)"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(114,137,218,0.08)"; e.currentTarget.style.borderColor = "rgba(114,137,218,0.35)"; }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#7289da"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                            Contact in Discord
                          </button>
                        )}
                        {isOwn && (
                          <>
                            <button onClick={() => bumpListing(l.id)} disabled={bumping === l.id || onCooldown}
                              title={onCooldown ? `Next bump in ${formatCooldown(cooldownMs)}` : "Bump to top of listings"}
                              style={{ padding: "4px 12px", borderRadius: "6px", border: `1px solid ${onCooldown ? "var(--border)" : "rgba(201,168,76,0.3)"}`, background: onCooldown ? "transparent" : "rgba(201,168,76,0.06)", color: onCooldown ? "var(--text-dim)" : "var(--gold)", fontSize: "12px", fontWeight: 600, cursor: onCooldown || bumping === l.id ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", opacity: onCooldown ? 0.5 : 1 }}
                              onMouseOver={e => { if (!onCooldown && bumping !== l.id) { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}}
                              onMouseOut={e => { e.currentTarget.style.background = onCooldown ? "transparent" : "rgba(201,168,76,0.06)"; e.currentTarget.style.borderColor = onCooldown ? "var(--border)" : "rgba(201,168,76,0.3)"; }}>
                              {bumping === l.id ? "Bumping..." : onCooldown ? `↑ ${formatCooldown(cooldownMs)}` : "↑ Bump"}
                            </button>
                            <button onClick={() => { if (window.confirm(`Remove your ${l.item_name || "item"} listing? This cannot be undone.`)) closeListing(l.id); }}
                              style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid rgba(231,76,60,0.2)", background: "transparent", color: "#c0564a", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                              onMouseOver={e => { e.currentTarget.style.background = "rgba(231,76,60,0.08)"; e.currentTarget.style.borderColor = "rgba(231,76,60,0.5)"; e.currentTarget.style.color = "var(--red)"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(231,76,60,0.2)"; e.currentTarget.style.color = "#c0564a"; }}>
                              Remove
                            </button>
                          </>
                        )}
                        {!isOwn && user && (
                          <button onClick={() => { setReportModal(l); setReportReason(""); }}
                            style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid transparent", background: "transparent", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: 0.45, transition: "all 0.15s" }}
                            onMouseOver={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "rgba(231,76,60,0.3)"; }}
                            onMouseOut={e => { e.currentTarget.style.opacity = "0.45"; e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.borderColor = "transparent"; }}>
                            ⚑ Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price panel */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: "140px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", paddingLeft: "16px", borderLeft: "1px solid #1c2a3a" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "24px", fontWeight: 800, color: "var(--gold)", lineHeight: 1, letterSpacing: "-0.5px" }}>{compactGP(displayPrice)}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold-dim)", letterSpacing: "0.5px" }}>GP</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#4a6070", fontVariantNumeric: "tabular-nums" }}>
                      {(displayPrice || 0).toLocaleString("en-GB")} gp
                    </div>
                    {l.quantity > 1 && price !== displayPrice && (
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>
                        {compactGP(price)} <span style={{ color: "#4a6070" }}>/ item</span>
                      </div>
                    )}
                    {total > MAX_CASH && total > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--gold-dim)", marginTop: "4px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "4px", padding: "2px 6px" }}>
                        Above max cash
                      </div>
                    )}
                  </div>

                  {/* Watch bell — for non-own listings */}
                  {!isOwn && user && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingLeft: "12px" }}>
                      <button
                        onClick={() => isWatching(l.item_name) ? null : (setWatchModal(l.item_name), setWatchForm({ type: l.type === "WTS" ? "WTS" : "WTB", maxPrice: "" }))}
                        title={isWatching(l.item_name) ? "Already watching this item" : "Get notified when this item is listed again"}
                        style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${isWatching(l.item_name) ? "rgba(201,168,76,0.35)" : "var(--border)"}`, background: isWatching(l.item_name) ? "rgba(201,168,76,0.1)" : "transparent", color: isWatching(l.item_name) ? "var(--gold)" : "var(--text-dim)", cursor: isWatching(l.item_name) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}
                        onMouseOver={e => { if (!isWatching(l.item_name)) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"; e.currentTarget.style.color = "var(--gold)"; e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}}
                        onMouseOut={e => { if (!isWatching(l.item_name)) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; }}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={isWatching(l.item_name) ? "var(--gold)" : "none"} stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── WATCH MODAL ── */}
      {watchModal && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000 }} onClick={() => { setWatchModal(null); setWatchModalSearch(""); setWatchModalSuggestions([]); }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1001, width: "calc(100% - 40px)", maxWidth: "420px", background: "#111620", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)", borderRadius: "16px 16px 0 0" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", fontWeight: 700, color: "var(--gold)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  Watch this item
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "3px" }}>Get notified when a listing appears</div>
              </div>
              <button onClick={() => { setWatchModal(null); setWatchModalSearch(""); setWatchModalSuggestions([]); }} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>✕</button>
            </div>

            {watchModal === "__new__" ? (
              <div style={{ position: "relative" }}>
                <input
                  autoFocus
                  value={watchModalSearch}
                  onChange={e => { setWatchModalSearch(e.target.value); setWatchModalSuggestions(getSuggestions(e.target.value)); setWatchModalHighlight(-1); }}
                  onBlur={() => setTimeout(() => { setWatchModalSuggestions([]); }, 150)}
                  onKeyDown={e => {
                    if (e.key === "ArrowDown") { e.preventDefault(); setWatchModalHighlight(h => Math.min(h + 1, watchModalSuggestions.length - 1)); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setWatchModalHighlight(h => Math.max(h - 1, -1)); }
                    else if (e.key === "Enter" && watchModalHighlight >= 0) { e.preventDefault(); setWatchModalSearch(watchModalSuggestions[watchModalHighlight]); setWatchModalSuggestions([]); setWatchModalHighlight(-1); }
                    else if (e.key === "Escape") { setWatchModalSuggestions([]); }
                  }}
                  placeholder="Type an item name..."
                  style={{ width: "100%", background: "var(--bg3)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "10px 14px", color: "var(--text)", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                />
                {watchModalSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#111620", border: "1px solid #2a3a4d", borderRadius: "8px", zIndex: 1100, maxHeight: "220px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                    {watchModalSuggestions.map((name, i) => (
                      <div key={name} onMouseDown={() => { setWatchModalSearch(name); setWatchModalSuggestions([]); setWatchModalHighlight(-1); }}
                        style={{ padding: "9px 14px", fontSize: "14px", color: i === watchModalHighlight ? "var(--gold)" : "var(--text)", background: i === watchModalHighlight ? "rgba(201,168,76,0.08)" : "transparent", cursor: "pointer", borderBottom: i < watchModalSuggestions.length - 1 ? "1px solid #1a2535" : "none" }}
                        onMouseOver={e => { if (i !== watchModalHighlight) e.currentTarget.style.background = "var(--bg3)"; }}
                        onMouseOut={e => { if (i !== watchModalHighlight) e.currentTarget.style.background = "transparent"; }}>
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "10px 14px", background: "var(--bg3)", borderRadius: "8px", border: "1px solid #1c2a3a", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                {watchModal}
              </div>
            )}

            <div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>Notify me for</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["WTS", "WTB", "Either"].map(t => (
                  <button key={t} onClick={() => setWatchForm(f => ({ ...f, type: t }))}
                    style={{ flex: 1, padding: "9px", borderRadius: "8px", border: `1px solid ${watchForm.type === t ? (t === "WTS" ? "rgba(231,76,60,0.5)" : t === "WTB" ? "rgba(46,204,113,0.5)" : "rgba(201,168,76,0.4)") : "var(--border)"}`, background: watchForm.type === t ? (t === "WTS" ? "rgba(231,76,60,0.1)" : t === "WTB" ? "rgba(46,204,113,0.1)" : "rgba(201,168,76,0.1)") : "transparent", color: watchForm.type === t ? (t === "WTS" ? "var(--red)" : t === "WTB" ? "var(--green)" : "var(--gold)") : "var(--text-dim)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                    {t === "Either" ? "Either" : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Max price</div>
                <span style={{ fontSize: "11px", color: "var(--text-dim)", background: "var(--bg4)", border: "1px solid #1c2a3a", borderRadius: "20px", padding: "1px 7px" }}>optional</span>
              </div>
              <input
                value={watchForm.maxPrice}
                onChange={e => setWatchForm(f => ({ ...f, maxPrice: e.target.value }))}
                placeholder="e.g. 1.5b — leave blank for any price"
                style={{ width: "100%", background: "var(--bg4)", border: "1px solid #1c2a3a", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlur={e => e.target.style.borderColor = "#1c2a3a"}
              />
              {watchForm.maxPrice && parseGPInput(watchForm.maxPrice) > 0 && (
                <div style={{ fontSize: "12px", color: "var(--gold)", marginTop: "4px" }}>= {compactGP(parseGPInput(watchForm.maxPrice))}</div>
              )}
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "5px" }}>Only notify me if the listing is at or below this price.</div>
            </div>

            <button onClick={() => addWatch(watchModal === "__new__" ? watchModalSearch.trim() : watchModal)} disabled={savingWatch || (watchModal === "__new__" && !watchModalSearch.trim())}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, rgba(201,168,76,0.8), var(--gold))", color: "#000", fontSize: "14px", fontWeight: 700, cursor: savingWatch ? "wait" : "pointer", fontFamily: "'Cinzel', serif", letterSpacing: "0.5px", opacity: savingWatch ? 0.7 : 1 }}>
              {savingWatch ? "Saving..." : watchModal === "__new__" ? `Watch ${watchModalSearch || "item"} →` : "Start watching →"}
            </button>
          </div>
        </>
      )}

      {/* ── POST FORM MODAL ── */}
      {showPostForm && user && (
        <>
          {/* Backdrop — click to close */}
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000 }}
            onClick={() => { setShowPostForm(false); setItemSuggestions([]); }} />
          {/* Modal — sits above backdrop, no click handler needed */}
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1001, width: "calc(100% - 40px)", maxWidth: "500px", background: "#111620", border: "1px solid #1c2a3a", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "18px", maxHeight: "90vh", overflowY: "auto" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)" }}>Post a Listing</div>
              <button onClick={() => { setShowPostForm(false); setItemSuggestions([]); }}
                style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            {/* Item search */}
            <div style={{ position: "relative" }}>
              <label style={labelStyle}>Item Name *</label>
              <input value={itemSearch} onChange={e => handleItemSearch(e.target.value)}
                placeholder="e.g. Twisted bow"
                onBlur={() => setTimeout(() => setItemSuggestions([]), 200)}
                style={inputStyle} />
              {itemSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#111620", border: "1px solid #1c2a3a", borderRadius: "8px", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                  {itemSuggestions.map(s => (
                    <div key={s}
                      onMouseDown={e => { e.preventDefault(); selectItem(s); }}
                      style={{ padding: "8px 12px", fontSize: "14px", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
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
                <label style={labelStyle}>Type *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["WTS", "WTB"].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${form.type === t ? (t === "WTS" ? "rgba(231,76,60,0.5)" : "rgba(46,204,113,0.5)") : "var(--border)"}`, background: form.type === t ? (t === "WTS" ? "rgba(231,76,60,0.1)" : "rgba(46,204,113,0.1)") : "transparent", color: form.type === t ? (t === "WTS" ? "var(--red)" : "var(--green)") : "var(--text-dim)", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {t === "WTS" ? "Selling" : "Buying"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, padding: "10px 12px" }}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Price + Qty */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Price per item (gp) *</label>
                <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 2.5b or 500k"
                  style={inputStyle} />
                {form.price && formPriceNum > 0 && (
                  <div style={{ fontSize: "12px", color: "var(--gold)", marginTop: "5px", paddingLeft: "2px" }}>
                    = {compactGP(formPriceNum)} ({formPriceNum.toLocaleString("en-GB")} gp)
                  </div>
                )}
                {!form.price && <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "5px", paddingLeft: "2px", opacity: 0.7 }}>Supports 100k, 2.5m, 1b</div>}
              </div>
              <div>
                <label style={labelStyle}>Quantity</label>
                <input value={form.quantity} onChange={e => { const v = e.target.value; const n = parseGPInput(v) || parseInt(v) || 1; setForm(f => ({ ...f, quantity: v, bundle_only: n <= 1 ? false : f.bundle_only })); }}
                  placeholder="1"
                  style={inputStyle} />
                {form.quantity && parseGPInput(form.quantity) > 1 && (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "5px", paddingLeft: "2px" }}>
                    = {parseGPInput(form.quantity).toLocaleString("en-GB")}
                  </div>
                )}
              </div>
            </div>

            {/* Price summary */}
            {formPriceNum > 0 && (
              <div style={{ fontSize: "13px", color: "var(--gold)", background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {formQtyNum > 1 ? (
                  <>
                    <div><span style={{ color: "var(--text-dim)" }}>Per item:</span> {compactGP(formPriceNum)} ({formatGP(formPriceNum)})</div>
                    <div><span style={{ color: "var(--text-dim)" }}>Total ({formQtyNum.toLocaleString()}×):</span> <strong>{compactGP(formTotal)}</strong> ({formatGP(formTotal)})</div>
                  </>
                ) : (
                  <div><span style={{ color: "var(--text-dim)" }}>Price:</span> <strong>{compactGP(formPriceNum)}</strong> ({formatGP(formPriceNum)})</div>
                )}
                {formTotal > MAX_CASH && <div style={{ color: "var(--text-dim)", fontSize: "12px" }}>⚠ Above max cash — player-to-player trade required</div>}
              </div>
            )}

            {/* Bundle only toggle */}
            {formQtyNum > 1 && (
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", userSelect: "none" }}
                onClick={() => setForm(f => ({ ...f, bundle_only: !f.bundle_only }))}>
                <div style={{ width: "44px", height: "24px", borderRadius: "24px", background: form.bundle_only ? "rgba(201,168,76,0.15)" : "#1c2a3a", border: `1.5px solid ${form.bundle_only ? "#c9a84c" : "#2a3a4d"}`, position: "relative", flexShrink: 0, transition: "all 0.22s", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", top: "3px", left: form.bundle_only ? "22px" : "3px", width: "14px", height: "14px", borderRadius: "50%", background: form.bundle_only ? "#c9a84c" : "#4a6070", transition: "left 0.22s, background 0.22s" }} />
                </div>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: form.bundle_only ? "var(--gold)" : "var(--text)" }}>Bundle only</span>
                  <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-dim)" }}>— buyer must take the full quantity</span>
                </div>
              </label>
            )}

            {/* Contact */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Discord</label>
                {localDiscord ? (
                  <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "8px", background: "rgba(114,137,218,0.06)", borderColor: "rgba(114,137,218,0.3)", cursor: "default" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#7289da" style={{ flexShrink: 0 }}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    <span style={{ color: "#7289da", fontWeight: 600, fontSize: "14px" }}>{localDiscord === "Discord linked" ? "Linked ✓" : localDiscord}</span>
                    <span style={{ marginLeft: "auto", fontSize: "11px", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: "4px", padding: "1px 6px", color: "var(--green)" }}>linked</span>
                  </div>
                ) : (
                  <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", cursor: "default" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic" }}>Not linked</span>
                    <button onClick={() => onGoToSettings && onGoToSettings()} style={{ marginLeft: "auto", fontSize: "11px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0, whiteSpace: "nowrap" }}>Link in Settings →</button>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>RSN</label>
                <input value={form.rsn} onChange={e => setForm(f => ({ ...f, rsn: e.target.value.slice(0, 12) }))}
                  placeholder="In-game name" maxLength={12} style={inputStyle} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value.slice(0, 300) }))}
                placeholder="e.g. Will split, swap offers welcome, DM before trading..."
                rows={3}
                maxLength={300}
                style={{ ...inputStyle, resize: "vertical", minHeight: "72px", lineHeight: 1.5 }} />
              {form.notes.length > 250 && <div style={{ fontSize: "11px", color: form.notes.length >= 300 ? "var(--red)" : "var(--text-dim)", marginTop: "4px", textAlign: "right" }}>{form.notes.length}/300</div>}
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic", lineHeight: 1.6 }}>
              Listing expires after 7 days. All trades occur in-game. Sale of accounts, services, or anything violating RuneScape rules is prohibited.
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowPostForm(false); setItemSuggestions([]); }}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #1c2a3a", background: "transparent", color: "var(--text-dim)", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={submitListing} disabled={posting}
                style={{ flex: 2, padding: "12px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #c9a84c, #e8c96a)", color: "#0a0e14", fontSize: "14px", fontWeight: 700, cursor: posting ? "wait" : "pointer", fontFamily: "'Cinzel', serif", letterSpacing: "0.5px", opacity: posting ? 0.7 : 1 }}>
                {posting ? "Posting..." : "Post Listing →"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── REPORT MODAL ── */}
      {reportModal && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1001 }}
            onClick={() => setReportModal(null)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1002, width: "calc(100% - 40px)", maxWidth: "400px", background: "#111620", border: "1px solid #1c2a3a", borderRadius: "14px", padding: "26px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Report Listing</div>
            <div style={{ fontSize: "14px", color: "var(--text-dim)" }}>
              Reporting <strong style={{ color: "var(--text)" }}>{reportModal.item_name}</strong> listed by {reportModal.rsn || reportModal.discord || "unknown"}
            </div>
            <div>
              <label style={labelStyle}>Reason *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                {["Scam / phishing", "Wrong item category", "Inflated or misleading price", "Duplicate listing", "Other"].map(r => (
                  <button key={r} onClick={() => setReportReason(r)}
                    style={{ padding: "9px 14px", borderRadius: "7px", border: `1px solid ${reportReason === r ? "rgba(231,76,60,0.45)" : "var(--border)"}`, background: reportReason === r ? "rgba(231,76,60,0.08)" : "transparent", color: reportReason === r ? "var(--red)" : "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left", transition: "all 0.1s" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setReportModal(null)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={submitReport} disabled={submittingReport || !reportReason}
                style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: submittingReport || !reportReason ? "var(--bg3)" : "rgba(231,76,60,0.8)", color: submittingReport || !reportReason ? "var(--text-dim)" : "#fff", fontSize: "13px", fontWeight: 700, cursor: submittingReport || !reportReason ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
