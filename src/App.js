import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import LandingPage from "./LandingPage";
import AuthModal from "./AuthModal";
import Sparkline from "./Sparkline";
import PricingPage from "./PricingPage";
import ReferralPage from "./ReferralPage";
import TradeBoard from "./TradeBoard";
import { supabase } from "./supabaseClient";
import SettingsPage from "./SettingsPage";
import RecommendedFlips from "./RecommendedFlips";

// ── Changelog — add new entries at the top, bump DEPLOY_KEY on each deploy ──
const DEPLOY_KEY = "runetrader_seen_deploy_v1"; // change this string on each deploy to trigger the modal
const CHANGELOG = [
  {
    version: "Latest",
    date: "March 2026",
    items: [
      { type: "new", text: "High Alch Tracker — find profitable alch items with live nature rune pricing" },
      { type: "new", text: "Death's Coffer tool — find cheapest items to sacrifice, with potential savings calculator" },
      { type: "new", text: "Portfolio page rebuilt — period stats, win rate donut, per-item P&L, best/worst items" },
      { type: "new", text: "Soft gates — Merchant Mode features now shown with upgrade prompts for free users" },
      { type: "new", text: "Shareable item URLs — share runetrader.gg/item/abyssal-whip to open any item chart" },
      { type: "improved", text: "Alert feed items now clickable to open price chart" },
      { type: "improved", text: "Market sub-tabs — Flips, High Alch, Death's Coffer now in one place" },
      { type: "improved", text: "Nature rune price editable in High Alch tab — use your own cost basis" },
    ],
  },
  {
    version: "v0.9",
    date: "February 2026",
    items: [
      { type: "new", text: "Merchant Mode — full trading terminal with Operations and Analytics tabs" },
      { type: "new", text: "Live GE slot tracking via RuneLite plugin" },
      { type: "new", text: "Smart Alerts — margin spike, volume surge, dump detection, price crash" },
      { type: "new", text: "AI Advisor with live GE slot context" },
      { type: "improved", text: "Market page rebuilt with 4,525 items and advanced filters" },
    ],
  },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --gold: #c9a84c; --gold-light: #e8c96a; --gold-dim: #8a6f2e;
    --bg: #0a0c0f; --bg2: #0f1218; --bg3: #161b24; --bg4: #1e2530;
    --border: #2a3340; --text: #e8e8e8; --text-dim: #7a8a9a;
    --green: #2ecc71; --green-dim: #1a7a44; --red: #e74c3c; --red-dim: #7a1f1a; --blue: #3498db;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; font-size: 15px; }
  .app { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

  /* HEADER */
  .header { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 64px; background: var(--bg2); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; gap: 8px; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 32px; height: 32px; }
  .logo-text { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--gold); letter-spacing: 1px; }
  .logo-dot { color: var(--text-dim); font-size: 14px; margin-left: 2px; }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .live-badge { display: flex; align-items: center; gap: 6px; background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--green); }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .nav-tabs { display: flex; gap: 2px; overflow-x: auto; flex-shrink: 1; min-width: 0; }
  .nav-tab { padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; background: transparent; color: var(--text-dim); transition: all 0.2s; white-space: nowrap; }
  .nav-tab:hover { color: var(--text); background: var(--bg3); }
  .nav-tab.active { background: var(--bg3); color: var(--gold); border: 1px solid var(--border); }

  /* LAYOUT */
  .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .main { display: flex; flex: 1; min-height: 0; overflow: hidden; }
  .left-panel { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }


  /* STAT CARDS */
  .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
  .stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-value { font-size: 22px; font-weight: 600; color: var(--gold); font-family: 'Cinzel', serif; }
  .stat-sub { font-size: 11px; color: var(--text-dim); }

  /* MARKET SUB-TABS */
  .market-sub-tabs { display: flex; gap: 4px; padding: 0 0 16px 0; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .market-sub-tab { padding: 6px 16px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; background: transparent; color: var(--text-dim); transition: all 0.2s; }
  .market-sub-tab:hover { color: var(--text); background: var(--bg3); }
  .market-sub-tab.active { background: var(--bg3); color: var(--gold); border-color: var(--border); }
  .market-sub-tab .sub-tab-badge { display: inline-block; background: rgba(52,152,219,0.15); color: var(--blue); border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; margin-left: 6px; vertical-align: middle; }
  /* ALCH / COFFER TABLE */
  .alch-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: visible; }
  .alch-header { display: grid; padding: 12px 16px; background: var(--bg4); font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .alch-row { display: grid; padding: 11px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; cursor: pointer; align-items: center; }
  .alch-row:last-child { border-bottom: none; }
  .alch-row:hover { background: var(--bg4); }
  .profit-positive { font-size: 13px; font-weight: 600; color: var(--green); }
  .profit-negative { font-size: 13px; font-weight: 600; color: var(--red); }
  .coffer-efficiency-great { display: inline-flex; align-items: center; justify-content: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(46,204,113,0.12); color: var(--green); }
  .coffer-efficiency-ok { display: inline-flex; align-items: center; justify-content: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(243,156,18,0.12); color: #f39c12; }
  .coffer-efficiency-poor { display: inline-flex; align-items: center; justify-content: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(231,76,60,0.12); color: var(--red); }
  .coffer-target-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 12px; }
  .coffer-target-label { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .coffer-target-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; color: var(--text); font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; width: 160px; }
  .coffer-target-input:focus { border-color: var(--gold-dim); }
  .coffer-target-summary { font-size: 12px; color: var(--gold); font-weight: 600; }

  /* FILTER BAR */
  .filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .filter-label { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .filter-input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; color: var(--text); font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
  .filter-input:focus { border-color: var(--gold-dim); }
  .adv-filters-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--text-dim); font-size: 12px; padding: 5px 12px; cursor: pointer; font-family: Inter, sans-serif; transition: all 0.15s; white-space: nowrap; }
  .adv-filters-btn:hover, .adv-filters-btn.active { border-color: var(--gold-dim); color: var(--gold); }
  .adv-filter-badge { background: var(--gold); color: #000; border-radius: 10px; padding: 1px 7px; font-size: 10px; font-weight: 700; }
  .adv-filter-panel { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 4px; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
  .adv-filter-group { display: flex; flex-direction: column; gap: 6px; }
  .adv-filter-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .adv-filter-row { display: flex; gap: 6px; align-items: center; }
  .adv-filter-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 12px; padding: 5px 8px; width: 100%; font-family: Inter, sans-serif; transition: border-color 0.15s; }
  .adv-filter-input:focus { outline: none; border-color: var(--gold-dim); }
  .adv-filter-input::placeholder { color: var(--text-dim); opacity: 0.6; }
  .adv-filter-sep { font-size: 11px; color: var(--text-dim); flex-shrink: 0; }
  .adv-filter-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--text-dim); user-select: none; padding: 4px 0; }
  .adv-filter-toggle input { accent-color: var(--gold); width: 14px; height: 14px; cursor: pointer; }
  .adv-filter-toggle.active { color: var(--gold); }
  .adv-filter-footer { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-dim); }
  .filter-input::placeholder { color: var(--text-dim); }
  .filter-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text-dim); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .filter-btn:hover, .filter-btn.active { background: var(--bg4); color: var(--gold); border-color: var(--gold-dim); }

  /* FLIPS TABLE */
  .section-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .flips-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: visible; }
  .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px; padding: 12px 16px; background: var(--bg4); font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .sort-btn { background: none; border: none; cursor: pointer; color: inherit; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-family: "Inter", sans-serif; padding: 0; display: flex; align-items: center; gap: 4px; transition: color 0.15s; }
  .sort-btn:hover { color: var(--gold); }
  .sort-btn.active { color: var(--gold); }
  .sort-arrow { font-size: 9px; opacity: 0.7; }
  .flip-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; cursor: pointer; align-items: center; }
  .flip-row:last-child { border-bottom: none; }
  .flip-row:hover { background: var(--bg4); }
  .item-icon { width: 24px; height: 24px; object-fit: contain; flex-shrink: 0; image-rendering: pixelated; }
  .item-icon-placeholder { width: 24px; height: 24px; flex-shrink: 0; }
  .item-name { font-weight: 500; font-size: 14px; color: var(--text); }
  .item-category { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .price { font-size: 14px; color: var(--text); }
  .margin { font-size: 14px; font-weight: 600; color: var(--green); }
  .margin.neg { color: var(--red); }
  .roi { font-size: 12px; color: var(--text-dim); }
  .score-badge { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 24px; border-radius: 6px; font-size: 12px; font-weight: 700; }
  .score-high { background: rgba(46,204,113,0.15); color: var(--green); }
  .score-med { background: rgba(201,168,76,0.15); color: var(--gold); }
  .score-low { background: rgba(231,76,60,0.15); color: var(--red); }
  .skeleton { background: linear-gradient(90deg, var(--bg4) 25%, var(--bg3) 50%, var(--bg4) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; height: 14px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* FLIP CARD MODAL */
  .flip-card-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .flip-card-modal { background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 16px; width: 100%; max-width: 480px; padding: 28px; display: flex; flex-direction: column; gap: 16px; }
  .flip-card-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--gold); }
  .flip-card-image { width: 100%; border-radius: 8px; border: 1px solid var(--border); }
  .flip-card-actions { display: flex; gap: 10px; }
  .flip-card-btn { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text-dim); font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
  .flip-card-btn:hover { border-color: var(--gold-dim); color: var(--gold); }
  .flip-card-btn.primary { background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; border: none; font-weight: 700; }

  /* WHATS NEW MODAL */
  .whats-new-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .whats-new-modal { background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 16px; width: 100%; max-width: 520px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
  .whats-new-header { padding: 24px 28px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .whats-new-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--gold); }
  .whats-new-body { overflow-y: auto; padding: 20px 28px; display: flex; flex-direction: column; gap: 20px; }
  .changelog-version { display: flex; flex-direction: column; gap: 8px; }
  .changelog-version-header { display: flex; align-items: center; gap: 10px; }
  .changelog-version-name { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--text); }
  .changelog-version-date { font-size: 11px; color: var(--text-dim); }
  .changelog-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--text-dim); line-height: 1.5; }
  .changelog-badge-new { display: inline-flex; background: rgba(46,204,113,0.12); color: var(--green); border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0; margin-top: 2px; }
  .changelog-badge-improved { display: inline-flex; background: rgba(201,168,76,0.12); color: var(--gold); border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0; margin-top: 2px; }
  .changelog-badge-fix { display: inline-flex; background: rgba(52,152,219,0.12); color: var(--blue); border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0; margin-top: 2px; }
  .whats-new-footer { padding: 16px 28px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; }

  /* UPGRADE MODAL */
  .upgrade-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .upgrade-modal { background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 16px; width: 100%; max-width: 440px; padding: 36px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
  .upgrade-icon { font-size: 48px; }
  .upgrade-title { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: var(--gold); }
  .upgrade-desc { font-size: 14px; color: var(--text-dim); line-height: 1.7; max-width: 340px; }
  .upgrade-features { display: flex; flex-direction: column; gap: 8px; width: 100%; background: var(--bg3); border-radius: 10px; padding: 16px; }
  .upgrade-feature-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text); }
  .upgrade-feature-row .check { color: var(--gold); font-size: 12px; flex-shrink: 0; }
  .upgrade-cta { width: 100%; padding: 14px; border-radius: 8px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 18px; font-weight: 700; cursor: pointer; font-family: 'Cinzel', serif; letter-spacing: 1px; transition: all 0.2s; }
  .upgrade-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(201,168,76,0.4); }
  .upgrade-dismiss { font-size: 12px; color: var(--text-dim); cursor: pointer; background: none; border: none; font-family: 'Inter', sans-serif; transition: color 0.15s; }
  .upgrade-dismiss:hover { color: var(--text); }

  /* REFRESH BUTTON */
  .refresh-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; }
  .refresh-btn:hover { border-color: var(--gold-dim); color: var(--gold); }
  .refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .refresh-spin { display: inline-block; animation: spin 0.8s linear infinite; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  /* AI CHAT */
  .chat-header { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .chat-header-icon { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .chat-header-text h3 { font-size: 14px; font-weight: 600; color: var(--text); }
  .chat-header-text p { font-size: 11px; color: var(--text-dim); }

  /* Floating input layout */
  .chat-body { flex: 1; position: relative; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 16px 16px 140px 16px; display: flex; flex-direction: column; gap: 12px; min-height: 0; scroll-behavior: smooth; }
  .msg { display: flex; flex-direction: column; gap: 4px; max-width: 92%; }
  .msg.user { align-self: flex-end; }
  .msg.assistant { align-self: flex-start; }
  .msg-bubble { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6; }
  .msg.user .msg-bubble { background: linear-gradient(135deg, var(--gold-dim), #6b4f1a); color: #fff; border-radius: 12px 12px 2px 12px; white-space: pre-wrap; }
  .msg.assistant .msg-bubble { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 12px 12px 12px 2px; }
  .msg.assistant .msg-bubble ul { color: var(--text); }
  .msg.assistant .msg-bubble strong { letter-spacing: 0.1px; }
  .msg-time { font-size: 10px; color: var(--text-dim); padding: 0 4px; }
  .msg.user .msg-time { text-align: right; }
  .typing { display: flex; gap: 4px; align-items: center; padding: 12px 14px; }
  .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); animation: typing 1.2s infinite; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

  /* Floating input bar */
  .chat-float-input { position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 10; display: flex; flex-direction: column; gap: 6px; }
  .chat-input-row { display: flex; gap: 8px; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; padding: 6px 6px 6px 14px; align-items: center; box-shadow: 0 4px 24px rgba(0,0,0,0.5); transition: border-color 0.2s; }
  .chat-input-row:focus-within { border-color: var(--gold-dim); }
  .chat-input { flex: 1; background: transparent; border: none; color: var(--text); font-size: 13px; font-family: 'Inter', sans-serif; outline: none; resize: none; height: 24px; max-height: 80px; line-height: 1.5; padding: 0; overflow-y: hidden; }
  .chat-input::placeholder { color: var(--text-dim); }
  .send-btn { width: 34px; height: 34px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; flex-shrink: 0; }
  .send-btn:hover { opacity: 0.85; }
  .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Quick prompts */
  .quick-prompts-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .quick-prompt { padding: 4px 10px; border-radius: 20px; font-size: 11px; cursor: pointer; background: var(--bg2); border: 1px solid var(--border); color: var(--text-dim); transition: all 0.2s; font-family: 'Inter', sans-serif; white-space: nowrap; }
  .quick-prompt:hover { border-color: var(--gold-dim); color: var(--gold); background: var(--bg3); }

  /* CHART MODAL */
  .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 860px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.25s ease; }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 28px; border-bottom: 1px solid var(--border); }
  .modal-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--gold); }
  .modal-meta { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
  .modal-close { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text-dim); cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .modal-close:hover { border-color: var(--red); color: var(--red); }
  .modal-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); }
  .modal-stat { background: var(--bg3); padding: 16px 20px; position: relative; }
  .modal-stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 5px; }
  .modal-stat-value { font-size: 20px; font-weight: 600; margin-top: 4px; font-family: 'Cinzel', serif; }
  .stat-help { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border-radius: 50%; background: var(--bg4); border: 1px solid var(--border); color: var(--text-dim); font-size: 9px; cursor: default; flex-shrink: 0; font-family: 'Inter', sans-serif; font-weight: 600; letter-spacing: 0; text-transform: none; }
  .stat-tooltip-wrap { position: relative; display: inline-flex; }
  .stat-tooltip-wrap:hover .stat-tooltip { opacity: 1; pointer-events: none; }
  .stat-tooltip { opacity: 0; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #1a1a1a; border: 1px solid var(--gold-dim); border-radius: 8px; padding: 10px 13px; width: 240px; font-size: 12px; color: var(--text); line-height: 1.5; z-index: 9999; pointer-events: none; transition: opacity 0.15s; box-shadow: 0 8px 32px rgba(0,0,0,0.85); white-space: normal; font-family: 'Inter', sans-serif; font-weight: 400; text-transform: none; letter-spacing: 0; }
  .stat-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: var(--gold-dim); }
  .chart-section { padding: 24px 28px; }
  .time-tabs { display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap; }
  .time-tab { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; font-weight: 500; }
  .time-tab:hover { color: var(--text); border-color: var(--text-dim); }
  .time-tab.active { background: var(--bg4); color: var(--gold); border-color: var(--gold-dim); }
  .chart-container { width: 100%; height: 280px; position: relative; }
  .chart-loading { display: flex; align-items: center; justify-content: center; height: 280px; color: var(--text-dim); font-size: 14px; }
  .modal-body { padding: 0 28px 24px; display: flex; flex-direction: column; gap: 16px; }
  .modal-ask-btn { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--gold-dim); background: rgba(201,168,76,0.08); color: var(--gold); font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 8px; }
  .modal-ask-btn:hover { background: rgba(201,168,76,0.15); }
  .modal-flip-btn { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--green-dim); background: rgba(46,204,113,0.08); color: var(--green); font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 8px; }
  .modal-flip-btn:hover { background: rgba(46,204,113,0.15); }

  /* PREFS BAR */
  .prefs-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .pref-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .pref-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .pref-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--gold); font-size: 18px; font-family: "Cinzel", serif; outline: none; width: 100%; transition: border-color 0.2s; }
  .pref-input:focus { border-color: var(--gold-dim); }
  .pref-input::placeholder { color: var(--text-dim); font-family: "Inter", sans-serif; font-size: 13px; }
  .pref-sub { font-size: 11px; color: var(--text-dim); }
  .toggle-group { display: flex; gap: 4px; }
  .toggle-btn { flex: 1; padding: 7px 4px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; font-weight: 500; text-align: center; }
  .toggle-btn:hover { color: var(--text); border-color: var(--text-dim); }
  .toggle-btn.active-low { background: rgba(46,204,113,0.15); color: var(--green); border-color: var(--green-dim); }
  .toggle-btn.active-med { background: rgba(201,168,76,0.15); color: var(--gold); border-color: var(--gold-dim); }
  .toggle-btn.active-high { background: rgba(231,76,60,0.15); color: var(--red); border-color: var(--red-dim); }
  .toggle-btn.active-fast { background: rgba(52,152,219,0.15); color: var(--blue); border-color: rgba(52,152,219,0.4); }
  .toggle-btn.active-med-speed { background: rgba(201,168,76,0.15); color: var(--gold); border-color: var(--gold-dim); }
  .toggle-btn.active-slow { background: rgba(138,111,46,0.15); color: var(--gold-dim); border-color: var(--gold-dim); }

  /* TRACKER */
  .tracker-wrap { display: flex; flex-direction: column; gap: 24px; }
  .tracker-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .tracker-form { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .tracker-form-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .tracker-form-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; align-items: end; }
  .tracker-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .tracker-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .tracker-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; font-family: "Inter", sans-serif; outline: none; transition: border-color 0.2s; width: 100%; }
  .tracker-input:focus { border-color: var(--gold-dim); }
  .tracker-input::placeholder { color: var(--text-dim); }
  .tracker-input.optional-field { border-style: dashed; }
  .tracker-input.optional-field:focus { border-style: solid; border-color: var(--gold-dim); }
  .optional-hint { font-size: 10px; color: var(--text-dim); opacity: 0.7; font-style: italic; }
  .log-btn { padding: 9px 20px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 13px; font-weight: 600; font-family: "Inter", sans-serif; white-space: nowrap; transition: opacity 0.2s; height: 38px; }
  .log-btn:hover { opacity: 0.85; }
  .log-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* AUTOCOMPLETE */
  .autocomplete-list { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 8px; margin-top: 4px; max-height: 200px; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
  .autocomplete-item { padding: 9px 12px; font-size: 13px; color: var(--text); cursor: pointer; transition: background 0.15s; }
  .autocomplete-item:hover { background: var(--bg3); color: var(--gold); }

  /* FLIPS LOG */
  .flips-log { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .log-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 80px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .log-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 80px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; transition: background 0.15s; }
  .log-row:last-child { border-bottom: none; }
  .log-row:hover { background: var(--bg4); }
  .log-row.open-flip { border-left: 3px solid var(--gold-dim); background: rgba(201,168,76,0.03); }
  .merchant-sync-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: var(--gold); background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.25); border-radius: 4px; padding: 1px 6px; margin-top: 4px; letter-spacing: 0.3px; font-weight: 500; }
  .log-item-name { font-weight: 500; color: var(--text); }
  .log-date { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .delete-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .delete-btn:hover { border-color: var(--red); color: var(--red); background: rgba(231,76,60,0.1); }
  .profit-pos { color: var(--green); font-weight: 600; }
  .profit-neg { color: var(--red); font-weight: 600; }
  .roi-pos { color: var(--green); font-size: 12px; }
  .roi-neg { color: var(--red); font-size: 12px; }
  .roi-neu { color: var(--text-dim); font-size: 12px; }
  .clear-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; }
  .clear-btn:hover { border-color: var(--red); color: var(--red); }
  .tracker-empty { padding: 60px 20px; text-align: center; color: var(--text-dim); }
  .tracker-empty .icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .tracker-empty p { font-size: 14px; margin-bottom: 4px; }
  .tracker-empty small { font-size: 12px; opacity: 0.6; }

  /* OPEN FLIP BADGE + CLOSE BUTTON */
  .open-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: rgba(201,168,76,0.15); color: var(--gold); border: 1px solid var(--gold-dim); letter-spacing: 0.5px; text-transform: uppercase; }
  .close-flip-btn { padding: 5px 10px; border-radius: 6px; border: 1px solid var(--gold-dim); background: rgba(201,168,76,0.08); color: var(--gold); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; white-space: nowrap; }
  .close-flip-btn:hover { background: rgba(201,168,76,0.18); }

  /* CLOSE FLIP MODAL */
  .close-flip-modal { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .close-flip-inner { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 440px; padding: 28px; display: flex; flex-direction: column; gap: 18px; }
  .close-flip-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); }
  .close-flip-subtitle { font-size: 13px; color: var(--text-dim); margin-top: -8px; }
  .close-flip-options { display: flex; flex-direction: column; gap: 10px; }
  .close-flip-option-btn { padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg3); color: var(--text); font-size: 13px; font-weight: 500; cursor: pointer; font-family: "Inter", sans-serif; transition: all 0.2s; text-align: left; display: flex; flex-direction: column; gap: 3px; }
  .close-flip-option-btn:hover { border-color: var(--gold-dim); background: var(--bg4); }
  .close-flip-option-btn.sold:hover { border-color: var(--green-dim); }
  .close-flip-option-btn .opt-title { font-weight: 600; font-size: 13px; }
  .close-flip-option-btn .opt-sub { font-size: 11px; color: var(--text-dim); }
  .close-flip-sold-form { display: flex; flex-direction: column; gap: 14px; }
  .close-flip-field { display: flex; flex-direction: column; gap: 6px; }
  .close-flip-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .close-flip-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; font-family: "Inter", sans-serif; outline: none; transition: border-color 0.2s; width: 100%; }
  .close-flip-input:focus { border-color: var(--gold-dim); }
  .close-flip-preview { background: var(--bg4); border-radius: 8px; padding: 12px 14px; font-size: 13px; }
  .close-flip-btns { display: flex; gap: 10px; justify-content: flex-end; }
  .close-flip-cancel { padding: 9px 18px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 13px; cursor: pointer; font-family: "Inter", sans-serif; }
  .close-flip-confirm { padding: 9px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 13px; font-weight: 600; cursor: pointer; font-family: "Inter", sans-serif; }
  .close-flip-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
  .back-link { background: none; border: none; color: var(--text-dim); font-size: 12px; cursor: pointer; font-family: "Inter", sans-serif; padding: 0; text-decoration: underline; }
  .back-link:hover { color: var(--text); }

  /* PROFIT CHART */
  .profit-chart-wrap { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
  .profit-chart-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .profit-canvas-wrap { width: 100%; height: 160px; position: relative; }

  /* SMART ALERTS */
  .smart-alerts-wrap { display: flex; flex-direction: column; gap: 12px; }
  .smart-alert-toggles { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .smart-alert-toggle-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .smart-alert-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .smart-alert-toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
  .smart-alert-toggle-info { display: flex; flex-direction: column; gap: 3px; }
  .smart-alert-toggle-name { font-size: 13px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .smart-alert-toggle-desc { font-size: 11px; color: var(--text-dim); }
  .toggle-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--bg4); border: 1px solid var(--border); border-radius: 22px; transition: 0.2s; }
  .toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: var(--text-dim); border-radius: 50%; transition: 0.2s; }
  .toggle-switch input:checked + .toggle-slider { background: rgba(201,168,76,0.2); border-color: var(--gold-dim); }
  .toggle-switch input:checked + .toggle-slider:before { transform: translateX(18px); background: var(--gold); }
  .smart-events-list { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .smart-event-row { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; }
  .smart-event-row:last-child { border-bottom: none; }
  .smart-event-icon { font-size: 18px; }
  .smart-event-name { font-weight: 600; color: var(--text); font-size: 13px; }
  .smart-event-msg { font-size: 12px; color: var(--text-dim); margin-top: 2px; }
  .smart-event-time { font-size: 11px; color: var(--text-dim); white-space: nowrap; }
  .smart-badge-spike { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: rgba(46,204,113,0.15); color: var(--green); border: 1px solid var(--green-dim); }
  .smart-badge-surge { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: rgba(52,152,219,0.15); color: var(--blue); border: 1px solid rgba(52,152,219,0.4); }
  .smart-badge-autopilot { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: rgba(201,168,76,0.15); color: var(--gold); border: 1px solid rgba(201,168,76,0.4); }
  .smart-badge-dump { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: rgba(231,76,60,0.15); color: var(--red); border: 1px solid var(--red-dim); }
  .smart-badge-crash { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: rgba(201,168,76,0.15); color: var(--gold); border: 1px solid var(--gold-dim); }
  .smart-empty { padding: 40px 20px; text-align: center; color: var(--text-dim); font-size: 13px; }
  .smart-feed-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .smart-feed-select { background: var(--bg4); border: 1px solid var(--border); border-radius: 6px; padding: 5px 10px; color: var(--text); font-size: 12px; font-family: "Inter", sans-serif; outline: none; cursor: pointer; transition: border-color 0.2s; }
  .smart-feed-select:focus { border-color: var(--gold-dim); }
  .smart-refresh-btn { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; white-space: nowrap; }
  .smart-refresh-btn:hover { border-color: var(--gold-dim); color: var(--gold); }
  .smart-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* THRESHOLD POPOVER */
  .threshold-popover-wrap { position: relative; display: inline-flex; }
  .threshold-gear-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
  .threshold-gear-btn:hover, .threshold-gear-btn.active { border-color: var(--gold-dim); color: var(--gold); background: rgba(201,168,76,0.08); }
  .threshold-popover { position: absolute; right: 0; top: 32px; z-index: 200; background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 16px; width: 260px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 12px; }
  .threshold-popover-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); }
  .threshold-popover-label { font-size: 12px; color: var(--text); margin-bottom: 6px; }
  .threshold-row { display: flex; align-items: center; gap: 8px; }
  .threshold-slider { flex: 1; accent-color: var(--gold); cursor: pointer; height: 4px; }
  .threshold-number { width: 52px; background: var(--bg4); border: 1px solid var(--border); border-radius: 6px; padding: 4px 6px; color: var(--text); font-size: 12px; font-family: "Inter", sans-serif; text-align: center; outline: none; transition: border-color 0.2s; }
  .threshold-number:focus { border-color: var(--gold-dim); }
  .threshold-unit { font-size: 11px; color: var(--text-dim); width: 16px; flex-shrink: 0; }
  .threshold-default { font-size: 10px; color: var(--text-dim); }
  .threshold-reset { background: none; border: none; color: var(--gold-dim); font-size: 11px; cursor: pointer; font-family: "Inter", sans-serif; padding: 0; text-decoration: underline; }
  .threshold-reset:hover { color: var(--gold); }

  /* MERCHANT MODE */
  .merchant-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; width: 100%; }
  .merchant-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: var(--bg2); border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .merchant-header-pills { display: flex; gap: 4px; }
  .merchant-nav-pill { padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 12px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
  .merchant-nav-pill:hover { border-color: var(--gold-dim); color: var(--gold); }
  .merchant-nav-pill.active { background: rgba(201,168,76,0.15); border-color: var(--gold); color: var(--gold); font-weight: 600; }
  .merchant-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
  .merchant-layout { display: grid; grid-template-columns: 1fr 320px; flex: 1; min-height: 0; overflow: hidden; width: 100%; }
  .merchant-left { overflow-y: auto; overflow-x: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
  .merchant-right { border-left: 1px solid var(--border); background: var(--bg2); overflow-y: auto; display: flex; flex-direction: column; min-height: 0; }
  .merchant-section { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: visible; }
  .merchant-section-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .merchant-section-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1.5px; }
  .merchant-empty { padding: 32px 20px; text-align: center; }
  .capital-bar { display: grid; grid-template-columns: repeat(5,1fr); background: var(--bg3); border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .cap-cell { padding: 14px 16px 16px; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 3px; min-height: 76px; }
  .cap-cell:last-child { border-right: none; }
  .cap-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.8px; }
  .cap-value { font-size: 18px; font-weight: 600; font-family: 'Cinzel', serif; line-height: 1.3; }
  .cap-sub { font-size: 11px; color: var(--text-dim); }
  .slots-grid { display: grid; grid-template-columns: repeat(8,1fr); gap: 8px; padding: 12px 16px; }
  .ge-slot { aspect-ratio: 1; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; position: relative; transition: all 0.2s; overflow: hidden; background: var(--bg2); }
  .ge-slot.active:hover { border-color: var(--gold-dim); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.4); }
  .ge-slot.empty { border-style: dashed; opacity: 0.3; cursor: pointer; }
  .ge-slot.empty:hover { opacity: 0.6; border-color: var(--gold-dim); }
  .slot-name { font-size: 13px; font-weight: 500; color: var(--text); text-align: center; line-height: 1.2; padding: 0 4px; word-break: break-word; }
  .slot-pnl { font-size: 12px; font-weight: 600; }
  .slot-status-label { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  .slot-dot { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; }
  .ops-table { overflow: visible; }
  .autopilot-btn { background: none; border: 1px solid var(--border); border-radius: 5px; color: var(--text-dim); font-size: 12px; padding: 3px 7px; cursor: pointer; transition: all 0.15s; line-height: 1; }
  .autopilot-btn:hover { border-color: var(--gold); color: var(--gold); }
  .autopilot-btn.active { border-color: var(--gold); color: var(--gold); background: #c9a84c18; }
  .autopilot-panel { grid-column: 1 / -1; background: var(--bg2); border-top: 1px solid var(--border); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
  .autopilot-panel-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .autopilot-label { font-size: 11px; color: var(--text-dim); min-width: 140px; }
  .autopilot-input { background: var(--bg3); border: 1px solid var(--border); border-radius: 5px; color: var(--text); font-size: 12px; padding: 4px 8px; width: 90px; outline: none; }
  .autopilot-input:focus { border-color: var(--gold); }
  .autopilot-unit { font-size: 11px; color: var(--text-dim); }
  .autopilot-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid var(--border); margin-top: 2px; }
  .autopilot-save { background: var(--gold); color: #0a0a0a; border: none; border-radius: 5px; font-size: 11px; font-weight: 700; padding: 5px 14px; cursor: pointer; }
  .autopilot-save:hover { opacity: 0.85; }
  .autopilot-clear { background: none; border: none; color: var(--text-dim); font-size: 11px; cursor: pointer; text-decoration: underline; }
  .autopilot-hint { font-size: 10px; color: var(--text-dim); opacity: 0.7; }
  .ops-header { display: grid; grid-template-columns: 2fr 100px 1fr 0.7fr 1fr 1fr 1fr 110px 80px 60px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid var(--border); border-radius: 0; }
  .op-row { display: grid; grid-template-columns: 2fr 100px 1fr 0.7fr 1fr 1fr 1fr 110px 80px 60px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; transition: background 0.15s; cursor: pointer; position: relative; }
  .op-row:last-child { border-bottom: none; }
  .op-row:hover { background: var(--bg4); }
  .op-row::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: 0; }
  .op-row.op-row-healthy::before { background: var(--green); }
  .op-row.op-row-warn::before { background: #f39c12; }
  .op-row.op-row-danger::before { background: var(--red); animation: pulse 1s infinite; }
  .op-item-name { font-weight: 500; font-size: 13px; color: var(--text); }
  .op-item-sub { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
  .pos-status-select { background: var(--bg4); border: 1px solid var(--border); border-radius: 5px; padding: 3px 6px; font-size: 11px; font-family: 'Inter', sans-serif; cursor: pointer; outline: none; font-weight: 600; }
  .health-bar-wrap { display: flex; flex-direction: column; gap: 3px; }
  .health-track { height: 5px; background: var(--bg4); border-radius: 2px; overflow: hidden; width: 80px; }
  .health-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
  .health-label { font-size: 10px; }
  .op-action-btn { padding: 6px 12px; border-radius: 5px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap; }
  .op-action-btn:hover { border-color: var(--gold-dim); color: var(--gold); }
  .op-action-btn.danger-btn { border-color: rgba(231,76,60,0.4); color: var(--red); }
  .op-action-btn.danger-btn:hover { background: rgba(231,76,60,0.1); }
  .add-pos-row { display: grid; grid-template-columns: 2fr 100px 1fr 0.7fr 1fr 1fr 1fr 110px 80px; padding: 10px 16px; border-top: 1px solid var(--gold-dim); align-items: center; background: rgba(201,168,76,0.04); }
  .add-pos-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; color: var(--text); font-size: 12px; font-family: 'Inter', sans-serif; outline: none; width: 100%; transition: border-color 0.2s; }
  .add-pos-input:focus { border-color: var(--gold-dim); }
  .add-pos-input::placeholder { color: var(--text-dim); font-size: 11px; }
  .add-pos-input.readonly { background: var(--bg3); color: var(--text-dim); cursor: not-allowed; border-color: transparent; }
  .add-pos-confirm { padding: 6px 10px; border-radius: 5px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s; width: 100%; }
  .add-pos-confirm:hover { opacity: 0.85; }
  .add-pos-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
  .add-pos-cancel { padding: 6px 8px; border-radius: 5px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; width: 100%; margin-top: 4px; }
  .add-pos-cancel:hover { border-color: var(--red); color: var(--red); }
  .ops-add-btn { padding: 6px 12px; border-radius: 6px; border: 1px dashed var(--border); background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
  .ops-add-btn:hover { border-color: var(--gold-dim); color: var(--gold); background: rgba(201,168,76,0.05); }
  .merchant-ac-wrap { position: relative; width: 100%; }
  .merchant-ac-list { position: absolute; top: calc(100% + 2px); left: 0; min-width: 280px; background: var(--bg3); border: 1px solid var(--gold-dim); border-radius: 6px; z-index: 9999; max-height: 200px; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
  .merchant-ac-item { padding: 7px 10px; font-size: 12px; color: var(--text); cursor: pointer; transition: background 0.1s; }
  .merchant-ac-item:hover, .merchant-ac-item.highlighted { background: var(--bg4); color: var(--gold); }
  .m-panel-section { padding: 16px 18px; border-bottom: 1px solid var(--border); }
  .m-panel-section:last-child { border-bottom: none; }
  .m-smart-alert-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--border); }
  .m-smart-alert-row:last-child { border-bottom: none; }
  .m-panel-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; }
  .gauge-wrap { display: flex; align-items: center; gap: 16px; }
  .gauge-ring { position: relative; width: 86px; height: 86px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gauge-pct { font-size: 20px; font-weight: 700; color: var(--gold); font-family: 'Cinzel', serif; }
  .gauge-sub-lbl { font-size: 10px; color: var(--text-dim); }
  .gauge-stats { display: flex; flex-direction: column; gap: 8px; }
  .gauge-stat-label { font-size: 11px; color: var(--text-dim); }
  .gauge-stat-val { font-size: 14px; font-weight: 600; }
  .rotation-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
  .rotation-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  .rotation-card.rc-green::before { background: var(--green); }
  .rotation-card.rc-blue::before { background: var(--blue); }
  .rotation-card.rc-amber::before { background: #f39c12; }
  .rotation-card:hover { border-color: var(--gold-dim); background: var(--bg4); }
  .rc-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .rc-reason { font-size: 11px; color: var(--text-dim); line-height: 1.4; margin-bottom: 6px; }
  .rc-stats { display: flex; gap: 12px; }
  .rc-stat { font-size: 10px; color: var(--text-dim); }
  .rc-action { font-size: 10px; color: var(--gold); margin-top: 6px; }
  .pnl-chart-wrap { width: 100%; height: 72px; }
  .pnl-time-labels { display: flex; justify-content: space-between; margin-top: 4px; }
  .pnl-time-label { font-size: 9px; color: var(--text-dim); }
  .analytics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px 16px; }
  .analytics-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 7px; padding: 10px 12px; }
  .analytics-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .analytics-val { font-size: 18px; font-weight: 600; font-family: 'Cinzel', serif; }
  .capital-setup { position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .capital-setup-inner { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 420px; padding: 32px; display: flex; flex-direction: column; gap: 20px; }
  .capital-setup-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--gold); }
  .capital-setup-sub { font-size: 13px; color: var(--text-dim); line-height: 1.6; margin-top: -8px; }
  .capital-setup-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; color: var(--text); font-size: 16px; font-family: 'Inter', sans-serif; outline: none; width: 100%; transition: border-color 0.2s; }
  .capital-setup-input:focus { border-color: var(--gold-dim); }
  .capital-setup-btn { padding: 12px; border-radius: 8px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 18px; font-weight: 700; cursor: pointer; font-family: 'Cinzel', serif; letter-spacing: 0.5px; transition: opacity 0.2s; }
  .capital-setup-btn:hover { opacity: 0.85; }
  .capital-setup-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .merchant-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  .merchant-anim-overlay { position: fixed; inset: 0; z-index: 99999; background: #0a0a0a; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; animation: merchantFadeIn 0.4s ease; }
  @keyframes merchantFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .merchant-anim-scan { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, var(--gold), transparent); animation: scanLine 3.8s ease-in-out forwards; box-shadow: 0 0 24px var(--gold), 0 0 60px rgba(201,168,76,0.5); }
  @keyframes scanLine { 0% { top: 0; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
  .merchant-anim-logo { font-size: 17px; letter-spacing: 8px; color: var(--gold-dim); text-transform: uppercase; font-weight: 600; animation: fadeInUp 0.7s ease 0.6s both; }
  .merchant-anim-title { font-size: 64px; font-weight: 800; letter-spacing: 6px; color: var(--gold); text-transform: uppercase; animation: fadeInUp 0.7s ease 1.1s both; font-family: Inter, sans-serif; text-shadow: 0 0 40px rgba(201,168,76,0.4); }
  .merchant-anim-subtitle { font-size: 17px; letter-spacing: 6px; color: var(--text-dim); text-transform: uppercase; animation: fadeInUp 0.7s ease 1.1s both; }
  .merchant-anim-bars { display: flex; gap: 8px; align-items: flex-end; height: 48px; animation: fadeInUp 0.7s ease 1.4s both; }
  .merchant-anim-bar { width: 5px; background: var(--gold); border-radius: 2px; animation: barPulse 0.9s ease-in-out infinite alternate; }
  @keyframes barPulse { from { opacity: 0.2; transform: scaleY(0.3); } to { opacity: 1; transform: scaleY(1); } }
  .merchant-anim-status { font-size: 15px; letter-spacing: 5px; color: var(--green); text-transform: uppercase; animation: fadeInUp 0.5s ease 3.8s both; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .merchant-anim-exit { animation: merchantFadeOut 0.5s ease forwards; }
  @keyframes merchantFadeOut { from { opacity: 1; } to { opacity: 0; pointer-events: none; } }
  .merchant-ai-bubble { position: fixed; bottom: 28px; right: 28px; z-index: 9000; width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #c9a84c, #a06c20); border: 2px solid var(--gold); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 20px rgba(201,168,76,0.4); animation: bubblePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; transition: transform 0.2s, box-shadow 0.2s; }
  .merchant-ai-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(201,168,76,0.6); }
  .merchant-ai-bubble .bubble-ping { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid var(--gold); animation: bubblePing 2s ease-out infinite; opacity: 0; }
  @keyframes bubblePing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.6); opacity: 0; } }
  @keyframes bubblePop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .merchant-ai-modal { position: fixed; bottom: 92px; right: 28px; z-index: 9001; width: 380px; height: 520px; background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 16px; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,0.6); animation: modalSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both; overflow: hidden; }
  @keyframes modalSlideUp { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
  .merchant-ai-modal-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); background: rgba(201,168,76,0.06); flex-shrink: 0; }
  .merchant-ai-modal-header h4 { margin: 0; font-size: 14px; color: var(--gold); font-weight: 700; }
  .merchant-ai-modal-header p { margin: 0; font-size: 11px; color: var(--text-dim); }
  .merchant-ai-modal-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .merchant-ai-modal-input { padding: 10px 12px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex-shrink: 0; background: var(--bg2); }
  .merchant-ai-modal-input textarea { flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 13px; padding: 8px 10px; resize: none; font-family: Inter, sans-serif; height: 36px; }
  .merchant-ai-modal-input textarea:focus { outline: none; border-color: var(--gold-dim); }
  .merchant-ai-close { margin-left: auto; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 18px; padding: 0 4px; line-height: 1; }
  .merchant-ai-close:hover { color: var(--text); }
  .merchant-shutdown-overlay { position: fixed; inset: 0; z-index: 99999; background: #0a0a0a; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; animation: merchantFadeIn 0.3s ease; }
  .merchant-shutdown-title { font-size: 48px; font-weight: 800; letter-spacing: 4px; color: var(--gold); text-transform: uppercase; font-family: Inter, sans-serif; animation: fadeInUp 0.5s ease 0.2s both; text-shadow: 0 0 40px rgba(201,168,76,0.3); }
  .merchant-shutdown-sub { font-size: 15px; letter-spacing: 5px; color: var(--text-dim); text-transform: uppercase; animation: fadeInUp 0.5s ease 0.5s both; }
  .merchant-shutdown-bars { display: flex; gap: 8px; align-items: flex-end; height: 40px; animation: fadeInUp 0.5s ease 0.7s both; }
  .merchant-shutdown-bar { width: 5px; background: var(--gold); border-radius: 2px; animation: barDown 0.6s ease-in-out forwards; }
  @keyframes barDown { 0% { transform: scaleY(1); opacity: 1; } 100% { transform: scaleY(0.1); opacity: 0.2; } }
  .merchant-shutdown-status { font-size: 14px; letter-spacing: 4px; color: var(--red); text-transform: uppercase; animation: fadeInUp 0.4s ease 1.4s both; }
  .merchant-shutdown-exit { animation: merchantFadeOut 0.5s ease forwards; }


  .alerts-wrap { display: flex; flex-direction: column; gap: 20px; }
  .alert-form { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .alert-form-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .alert-form-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; }
  .alert-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .alert-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .alert-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; font-family: "Inter", sans-serif; outline: none; transition: border-color 0.2s; width: 100%; }
  .alert-input:focus { border-color: var(--gold-dim); }
  .alert-input::placeholder { color: var(--text-dim); }
  .alert-select { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; font-family: "Inter", sans-serif; outline: none; width: 100%; cursor: pointer; }
  .add-alert-btn { padding: 9px 20px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 13px; font-weight: 600; font-family: "Inter", sans-serif; white-space: nowrap; transition: opacity 0.2s; height: 38px; }
  .add-alert-btn:hover { opacity: 0.85; }
  .add-alert-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .alerts-list { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .alert-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; transition: background 0.15s; }
  .alert-row:last-child { border-bottom: none; }
  .alert-row:hover { background: var(--bg4); }
  .alert-item-name { font-weight: 500; color: var(--text); }
  .alert-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .alert-badge.above { background: rgba(46,204,113,0.15); color: var(--green); border: 1px solid var(--green-dim); }
  .alert-badge.below { background: rgba(231,76,60,0.15); color: var(--red); border: 1px solid var(--red-dim); }
  .alert-triggered { background: rgba(201,168,76,0.1); border-left: 3px solid var(--gold); }
  .alert-triggered-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; background: rgba(201,168,76,0.2); color: var(--gold); border: 1px solid var(--gold-dim); }
  .alert-header-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .alerts-empty { padding: 60px 20px; text-align: center; color: var(--text-dim); }
  .alerts-empty .icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .alert-info { background: rgba(52,152,219,0.08); border: 1px solid rgba(52,152,219,0.2); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: var(--text-dim); display: flex; align-items: center; gap: 8px; }
  .notif-banner { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.25); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; flex-wrap: wrap; }
  .notif-banner-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .notif-banner-icon { font-size: 24px; flex-shrink: 0; }
  .notif-banner-title { font-size: 13px; font-weight: 600; color: var(--gold); margin-bottom: 2px; }
  .notif-banner-sub { font-size: 11px; color: var(--text-dim); }
  .notif-enable-btn { padding: 8px 18px; border-radius: 8px; border: 1px solid var(--gold-dim); background: rgba(201,168,76,0.12); color: var(--gold); font-size: 13px; font-weight: 600; cursor: pointer; font-family: Inter, sans-serif; white-space: nowrap; flex-shrink: 0; transition: background 0.15s; }
  .notif-enable-btn:hover:not(:disabled) { background: rgba(201,168,76,0.22); }
  .notif-enable-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .notif-active-banner { display: flex; align-items: center; gap: 8px; background: rgba(46,204,113,0.08); border: 1px solid rgba(46,204,113,0.2); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 12px; color: var(--green); }

  /* DEMO BANNER */
  .demo-banner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 24px; background: rgba(52,152,219,0.12); border-bottom: 1px solid rgba(52,152,219,0.3); font-size: 13px; color: #4fc3f7; flex-shrink: 0; }
  .demo-banner-text { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }
  .demo-cta-btn { padding: 7px 18px; border-radius: 6px; border: 1px solid rgba(201,168,76,0.5); background: rgba(201,168,76,0.1); color: var(--gold); font-size: 12px; font-weight: 600; cursor: pointer; font-family: Inter, sans-serif; transition: all 0.15s; white-space: nowrap; }
  .demo-cta-btn:hover { background: rgba(201,168,76,0.2); }

  /* WATCHLIST */
  .watchlist-wrap { display: flex; flex-direction: column; gap: 16px; }
  .watchlist-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px 20px; text-align: center; color: var(--text-dim); }
  .watchlist-empty .icon { font-size: 40px; opacity: 0.4; }
  .watchlist-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .watchlist-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 84px 140px 44px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .watchlist-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 84px 140px 44px; padding: 11px 16px; border-bottom: 1px solid var(--border); align-items: center; cursor: pointer; transition: background 0.15s; }
  .watchlist-row:last-child { border-bottom: none; }
  .watchlist-row:hover { background: var(--bg4); }
  .watchlist-remove-btn { background: none; border: none; cursor: pointer; color: var(--text-dim); font-size: 15px; padding: 0 4px; transition: color 0.15s; line-height: 1; }
  .watchlist-remove-btn:hover { color: var(--red); }
  .watchlist-add-row { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-top: 1px solid var(--border); background: var(--bg4); position: relative; }
  .watchlist-add-input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; color: var(--text); font-size: 13px; font-family: Inter, sans-serif; outline: none; flex: 1; transition: border-color 0.15s; }
  .watchlist-add-input:focus { border-color: var(--gold-dim); }
  .watchlist-alert-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; white-space: nowrap; max-width: 136px; overflow: hidden; text-overflow: ellipsis; }
  .watchlist-alert-badge.set { background: rgba(201,168,76,0.12); color: var(--gold); border-color: var(--gold-dim); }
  .watchlist-alert-badge.unset { background: var(--bg4); color: var(--text-dim); border-color: var(--border); }
  .watchlist-alert-badge:hover { border-color: var(--gold-dim); color: var(--gold); }
  .watchlist-alert-popover { position: absolute; z-index: 200; background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; width: 230px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
  .watchlist-alert-popover-title { font-size: 18px; font-weight: 600; color: var(--gold); font-family: Cinzel, serif; text-transform: uppercase; letter-spacing: 0.5px; }
  .watchlist-alert-input { background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; color: var(--text); font-size: 12px; font-family: Inter, sans-serif; outline: none; width: 100%; transition: border-color 0.15s; }
  .watchlist-alert-input:focus { border-color: var(--gold-dim); }
  .watchlist-alert-set-btn { padding: 6px 12px; border-radius: 6px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: Inter, sans-serif; }
  .watchlist-pro-tip { display: flex; align-items: center; gap: 8px; background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.12); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--text-dim); }

  /* DEMO TOUR */
  .demo-tour-backdrop { position: fixed; inset: 0; z-index: 8000; background: rgba(0,0,0,0.7); }
  .demo-tour-highlight { position: fixed; z-index: 8001; border-radius: 6px; box-shadow: 0 0 0 4px var(--gold), 0 0 0 9999px rgba(0,0,0,0.7); pointer-events: none; transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
  .demo-tour-tooltip {
    position: fixed; z-index: 8002;
    background: var(--bg2); border: 1px solid var(--gold-dim);
    border-radius: 14px; padding: 28px 30px; width: 400px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.1);
    display: flex; flex-direction: column; gap: 16px;
  }
  .demo-tour-tooltip.center {
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 480px;
  }
  .demo-tour-label { font-size: 18px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold-dim); font-family: Cinzel, serif; }
  .demo-tour-title { font-family: Cinzel, serif; font-size: 19px; font-weight: 700; color: var(--gold); line-height: 1.3; }
  .demo-tour-desc { font-size: 15px; color: var(--text-dim); line-height: 1.7; }
  .demo-tour-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 4px; border-top: 1px solid var(--border); }
  .demo-tour-dots { display: flex; gap: 5px; align-items: center; }
  .demo-tour-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); transition: background 0.2s; }
  .demo-tour-dot.active { background: var(--gold); }
  .demo-tour-skip { background: none; border: none; color: var(--text-dim); font-size: 12px; cursor: pointer; font-family: Inter, sans-serif; padding: 0; transition: color 0.15s; }
  .demo-tour-skip:hover { color: var(--text); }
  .demo-tour-next { padding: 9px 22px; border-radius: 8px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 13px; font-weight: 700; cursor: pointer; font-family: Inter, sans-serif; transition: opacity 0.2s; white-space: nowrap; }
  .demo-tour-next:hover { opacity: 0.85; }
  .demo-tour-end-overlay { position: fixed; inset: 0; z-index: 9500; background: rgba(6,8,11,0.97); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; padding: 40px; animation: fadeInUp 0.5s ease both; }
  .demo-tour-end-title { font-family: "Cinzel", serif; font-size: clamp(36px, 5vw, 60px); font-weight: 900; color: var(--gold); line-height: 1.2; }
  .demo-tour-end-sub { font-size: 18px; color: var(--text-dim); max-width: 480px; line-height: 1.7; }
  .demo-tour-end-cta { padding: 16px 48px; border-radius: 6px; font-family: Cinzel, serif; font-size: 18px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; border: none; cursor: pointer; box-shadow: 0 0 40px rgba(201,168,76,0.3); transition: all 0.3s; }
  .demo-tour-end-cta:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(201,168,76,0.5); }
  .demo-tour-end-dismiss { background: none; border: none; color: var(--text-dim); font-size: 13px; cursor: pointer; font-family: Inter, sans-serif; padding: 0; transition: color 0.15s; text-decoration: underline; }
  .demo-tour-end-dismiss:hover { color: var(--text); }

  /* DEMO MERCHANT INTRO OVERLAY */
  .demo-merchant-intro {
    position: fixed; inset: 0; z-index: 9000;
    background: #000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0; overflow: hidden;
  }
  .demo-merchant-scan {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%);
    animation: demoScanLine 2.5s ease-in-out forwards;
    box-shadow: 0 0 30px var(--gold), 0 0 80px rgba(201,168,76,0.4);
  }
  @keyframes demoScanLine { 0%{top:0;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
  .demo-merchant-grid {
    position: absolute; inset: 0; opacity: 0;
    background-image: linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: demoGridFade 0.8s ease 0.3s both;
  }
  @keyframes demoGridFade { from{opacity:0} to{opacity:1} }
  .demo-merchant-eyebrow {
    font-size: 11px; letter-spacing: 6px; color: var(--gold-dim);
    text-transform: uppercase; font-family: Cinzel, serif; font-weight: 600;
    animation: fadeInUp 0.6s ease 0.5s both;
    position: relative; z-index: 1;
    margin-bottom: 16px;
  }
  .demo-merchant-title {
    font-size: clamp(48px, 8vw, 96px); font-weight: 900; letter-spacing: 4px;
    color: var(--gold); text-transform: uppercase; font-family: Inter, sans-serif;
    text-shadow: 0 0 60px rgba(201,168,76,0.5), 0 0 120px rgba(201,168,76,0.2);
    animation: fadeInUp 0.7s ease 0.9s both;
    position: relative; z-index: 1;
    line-height: 1;
  }
  .demo-merchant-sub {
    font-size: 15px; letter-spacing: 8px; color: var(--text-dim);
    text-transform: uppercase; animation: fadeInUp 0.6s ease 1.3s both;
    position: relative; z-index: 1;
    margin-top: 12px;
  }
  .demo-merchant-bars {
    display: flex; gap: 6px; align-items: flex-end; height: 48px;
    animation: fadeInUp 0.6s ease 1.6s both;
    position: relative; z-index: 1; margin-top: 32px;
  }
  .demo-merchant-bar {
    width: 4px; background: var(--gold); border-radius: 2px;
    animation: demoBarPulse 0.8s ease-in-out infinite alternate;
  }
  @keyframes demoBarPulse { from{opacity:0.2;transform:scaleY(0.3)} to{opacity:1;transform:scaleY(1)} }
  .demo-merchant-status {
    font-size: 13px; letter-spacing: 5px; color: var(--green);
    text-transform: uppercase; animation: fadeInUp 0.5s ease 2.2s both;
    position: relative; z-index: 1; margin-top: 20px;
  }
  .demo-merchant-intro-exit { animation: demoIntroOut 0.6s ease forwards; }
  @keyframes demoIntroOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.04);pointer-events:none} }

  /* PORTFOLIO */
  .portfolio-wrap { display: flex; flex-direction: column; gap: 20px; }
  .port-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  .port-stat { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
  .port-stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .port-stat-value { font-size: 20px; font-weight: 700; font-family: "Cinzel", serif; color: var(--gold); }
  .port-stat-sub { font-size: 11px; color: var(--text-dim); }
  .port-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .port-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .port-card-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .alloc-bar-wrap { display: flex; flex-direction: column; gap: 8px; }
  .alloc-bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
  .alloc-bar-label { width: 130px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
  .alloc-bar-track { flex: 1; height: 6px; background: var(--bg4); border-radius: 3px; overflow: hidden; }
  .alloc-bar-fill { height: 100%; border-radius: 3px; background: var(--gold); transition: width 0.4s ease; }
  .alloc-bar-val { width: 70px; text-align: right; color: var(--text-dim); flex-shrink: 0; }
  .alloc-empty { font-size: 13px; color: var(--text-dim); text-align: center; padding: 24px 0; }
  .pnl-table { display: flex; flex-direction: column; }
  .pnl-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 8px 12px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-radius: 6px 6px 0 0; }
  .pnl-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 9px 12px; border-bottom: 1px solid var(--border); font-size: 12px; align-items: center; transition: background 0.15s; }
  .pnl-row:last-child { border-bottom: none; }
  .pnl-row:hover { background: var(--bg4); }
  .winrate-ring-wrap { display: flex; align-items: center; gap: 20px; }
  .winrate-legend { display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
  .winrate-legend-row { display: flex; align-items: center; gap: 8px; color: var(--text-dim); }
  .winrate-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .bw-table { display: flex; flex-direction: column; }
  .bw-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 8px 12px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-radius: 6px 6px 0 0; }
  .bw-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 9px 12px; border-bottom: 1px solid var(--border); font-size: 12px; align-items: center; }
  .bw-row:last-child { border-bottom: none; }
  .bw-section-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border); }
  .positions-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .positions-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .position-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; transition: background 0.15s; }
  .position-row:last-child { border-bottom: none; }
  .position-row:hover { background: var(--bg4); }
  .close-pos-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--green-dim); background: rgba(46,204,113,0.08); color: var(--green); font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; }
  .close-pos-btn:hover { background: rgba(46,204,113,0.18); }
  .open-pos-form { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .open-pos-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .open-pos-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; }
  .portfolio-login-prompt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px 20px; text-align: center; color: var(--text-dim); }
  .portfolio-login-prompt .icon { font-size: 48px; opacity: 0.4; }
  .portfolio-login-prompt p { font-size: 15px; }
  .portfolio-login-prompt small { font-size: 13px; opacity: 0.7; }
  .portfolio-signin-btn { padding: 10px 28px; border-radius: 8px; border: 1px solid var(--gold-dim); background: rgba(201,168,76,0.1); color: var(--gold); font-size: 14px; font-weight: 600; cursor: pointer; font-family: "Inter", sans-serif; transition: all 0.2s; }
  .portfolio-signin-btn:hover { background: rgba(201,168,76,0.2); }
  .close-pos-modal { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .close-pos-inner { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 420px; padding: 28px; display: flex; flex-direction: column; gap: 16px; }
  .close-pos-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); }
  .close-pos-field { display: flex; flex-direction: column; gap: 6px; }
  .close-pos-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .close-pos-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; font-family: "Inter", sans-serif; outline: none; transition: border-color 0.2s; width: 100%; }
  .close-pos-input:focus { border-color: var(--gold-dim); }
  .close-pos-btns { display: flex; gap: 10px; justify-content: flex-end; }
  .close-pos-cancel { padding: 9px 18px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 13px; cursor: pointer; font-family: "Inter", sans-serif; }
  .close-pos-confirm { padding: 9px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 13px; font-weight: 600; cursor: pointer; font-family: "Inter", sans-serif; }
  .unrealised-pnl { font-size: 11px; }
  .unrealised-pnl.pos { color: var(--green); }
  .unrealised-pnl.neg { color: var(--red); }
  .from-tracker-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 20px; font-size: 10px; background: rgba(201,168,76,0.1); color: var(--gold-dim); border: 1px solid rgba(201,168,76,0.2); margin-top: 3px; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

  /* EMPTY / ERROR */
  .empty-state { padding: 60px 20px; text-align: center; color: var(--text-dim); }
  .empty-state .icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 14px; }
  .error-banner { background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3); border-radius: 8px; padding: 12px 16px; font-size: 13px; color: var(--red); display: flex; align-items: center; gap: 8px; }

  /* ONBOARDING TOUR */
  .tour-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 300; pointer-events: all; }
  .tour-highlight { position: fixed; z-index: 301; border-radius: 10px; box-shadow: 0 0 0 3px var(--gold), 0 0 0 6px rgba(201,168,76,0.2), 0 0 40px rgba(201,168,76,0.15); pointer-events: none; transition: all 0.35s cubic-bezier(0.4,0,0.2,1); animation: tourPulse 2s ease-in-out infinite; }
  @keyframes tourPulse { 0%,100%{box-shadow:0 0 0 3px var(--gold),0 0 0 6px rgba(201,168,76,0.2),0 0 40px rgba(201,168,76,0.15)} 50%{box-shadow:0 0 0 3px var(--gold-light),0 0 0 10px rgba(201,168,76,0.15),0 0 60px rgba(201,168,76,0.25)} }
  .tour-tooltip { position: fixed; z-index: 302; pointer-events: all; background: var(--bg3); border: 1px solid var(--gold-dim); border-radius: 14px; padding: 26px 28px; width: 320px; max-width: calc(100vw - 24px); max-height: calc(100vh - 120px); overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.6); animation: tooltipIn 0.25s cubic-bezier(0.4,0,0.2,1); }
  @keyframes tooltipIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .tour-step-label { font-size: 11px; color: var(--gold-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .tour-title { font-family: "Cinzel", serif; font-size: 18px; font-weight: 700; color: var(--gold); margin-bottom: 12px; }
  .tour-desc { font-size: 14px; color: var(--text); line-height: 1.7; margin-bottom: 20px; }
  .tour-actions { display: flex; align-items: center; justify-content: space-between; }
  .tour-dots { display: flex; gap: 5px; }
  .tour-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border); transition: background 0.2s; }
  .tour-dot.active { background: var(--gold); }
  .tour-btn-row { display: flex; gap: 8px; }
  .tour-skip { background: none; border: none; color: var(--text-dim); font-size: 13px; cursor: pointer; font-family: "Inter", sans-serif; padding: 0; transition: color 0.2s; }
  .tour-skip:hover { color: var(--text); }
  .tour-next { padding: 10px 22px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 14px; font-weight: 600; font-family: "Inter", sans-serif; transition: opacity 0.2s; }
  .tour-next:hover { opacity: 0.85; }

  /* TOAST */
  .toast-container { position: fixed; bottom: 24px; right: 90px; z-index: 400; display: flex; flex-direction: column; gap: 8px; pointer-events: none; max-width: 320px; }
  .toast { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 500; font-family: "Inter", sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.5); pointer-events: all; animation: toastIn 0.3s cubic-bezier(0.4,0,0.2,1); max-width: 320px; }
  @keyframes toastIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .toast.success { background: #0f1218; border: 1px solid var(--green-dim); color: var(--green); }
  .toast.error { background: #0f1218; border: 1px solid var(--red-dim); color: var(--red); }
  .toast.info { background: #0f1218; border: 1px solid var(--gold-dim); color: var(--gold); }

  /* ALPHA BANNER */
  .alpha-banner { background: linear-gradient(90deg, rgba(201,168,76,0.08), rgba(201,168,76,0.04)); border-bottom: 1px solid rgba(201,168,76,0.2); padding: 7px 32px; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 12px; color: var(--text-dim); }
  .alpha-badge { background: rgba(201,168,76,0.15); border: 1px solid var(--gold-dim); color: var(--gold); border-radius: 20px; padding: 2px 10px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .feedback-btn { background: transparent; border: 1px solid var(--border); color: var(--text-dim); border-radius: 6px; padding: 3px 12px; font-size: 11px; cursor: pointer; font-family: "Inter", sans-serif; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
  .feedback-btn:hover { border-color: var(--gold-dim); color: var(--gold); }

  /* MOBILE */
  @media (max-width: 768px) {
    .header { padding: 0 16px; }
    .logo-text { font-size: 16px; }
    .main { flex-direction: column; height: auto; overflow: visible; }
    .left-panel { padding: 16px; }

    .prefs-bar { grid-template-columns: repeat(2, 1fr); }
    .tracker-summary { grid-template-columns: repeat(2, 1fr); }
    .tracker-form-row { grid-template-columns: 1fr 1fr; }
    .alert-form-row { grid-template-columns: 1fr 1fr; }
    .table-header, .flip-row { grid-template-columns: 2fr 1fr 1fr 1fr; }
    .table-header > *:nth-child(5), .table-header > *:nth-child(6),
    .table-header > *:nth-child(7), .table-header > *:nth-child(8),
    .table-header > *:nth-child(9),
    .flip-row > *:nth-child(5), .flip-row > *:nth-child(6),
    .flip-row > *:nth-child(7), .flip-row > *:nth-child(8),
    .flip-row > *:nth-child(9) { display: none; }
    .log-header, .log-row { grid-template-columns: 2fr 1fr 1fr 1fr 80px; }
    .log-header > *:nth-child(4), .log-header > *:nth-child(5),
    .log-row > *:nth-child(4), .log-row > *:nth-child(5) { display: none; }
    .modal-stats { grid-template-columns: repeat(2, 1fr); }
    .alert-row, .alert-header-row { grid-template-columns: 2fr 1fr 1fr 40px; }
    .alert-row > *:nth-child(4), .alert-header-row > *:nth-child(4) { display: none; }
  }
`;

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatGP(n) {
  if (!n && n !== 0) return "—";
  return Math.round(n).toLocaleString();
}

function formatTime(d) {
  if (!d) return "";
  const diff = Math.floor((new Date() - new Date(d)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  return Math.floor(diff / 3600) + "h ago";
}

function timeAgo(unixSec) {
  if (!unixSec) return "—";
  const diff = Math.floor(Date.now() / 1000 - unixSec);
  if (diff < 0) return "just now";
  if (diff < 60) return diff + "s ago";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

// ── SCORING SYSTEM ──────────────────────────────────────────────────────────
// Core question: "How good is this flip for THIS player right now?"
// Built around one real metric: expected GP per 4hr buy window.
// Then shaped by risk/speed preferences and data confidence.

function getScore(margin, volume, roi, speed, risk, buyLimit, lastTradeTime) {
  // Hard disqualifiers — not a flip at all
  if (margin <= 0)  return 0;
  if (volume < 200) return 0;

  // ── Core metric: realistic GP per 4hr buy window ─────────────────────────
  // Competition model: scales with volume. Deep markets absorb all flippers.
  // At extreme volume (500k+/day), the market is so liquid that even 2000 flippers
  // each buying their full limit won't exhaust it — everyone fills.
  // At low volume, you're fighting over scraps.
  const limit = buyLimit > 0 ? buyLimit : 500;
  const marketPer4hr = volume / 6;

  let expectedFill;
  if (volume >= 500_000) {
    // Extreme volume: fills reliably — competition absorbed by market depth
    expectedFill = Math.min(limit, marketPer4hr);
  } else if (volume >= 100_000) {
    // High volume: light competition, ~60% fill rate
    expectedFill = Math.min(limit, marketPer4hr * 0.6);
  } else if (volume >= 20_000) {
    // Mid volume: real competition, ~20% fill rate
    expectedFill = Math.min(limit, marketPer4hr * 0.2);
  } else if (volume >= 5_000) {
    // Low-mid volume: thin market, ~8% fill rate
    expectedFill = Math.min(limit, marketPer4hr * 0.08);
  } else {
    // Low volume: very uncertain fills, ~3%
    expectedFill = Math.min(limit, marketPer4hr * 0.03);
  }

  const gpPer4hr = margin * Math.max(expectedFill, 1);
  if (gpPer4hr < 50_000) return 0;
  // Score 0–70 from GP/4hr (the primary signal)
  let baseScore;
  if      (gpPer4hr >= 10_000_000) baseScore = 70;
  else if (gpPer4hr >= 5_000_000)  baseScore = 62;
  else if (gpPer4hr >= 2_000_000)  baseScore = 54;
  else if (gpPer4hr >= 800_000)    baseScore = 46;
  else if (gpPer4hr >= 300_000)    baseScore = 38;
  else if (gpPer4hr >= 100_000)    baseScore = 28;
  else if (gpPer4hr >= 30_000)     baseScore = 18;
  else if (gpPer4hr >= 5_000)      baseScore = 8;
  else                             baseScore = 2;

  // ── ROI modifier: ±15pts ────────────────────────────────────────────────
  // Rewards realistic GE ROI (2–10%). Penalizes extremes heavily.
  // <0.5% = margin probably noise/tax artifact
  // >50% = thin market, likely won't fill at that price or is stale
  let roiMod = 0;
  if      (roi <  0.5)  roiMod = -10; // near-zero ROI, not worth the slot
  else if (roi <= 2)    roiMod = 5;
  else if (roi <= 10)   roiMod = 15;  // sweet spot
  else if (roi <= 25)   roiMod = 8;
  else if (roi <= 50)   roiMod = 0;
  else if (roi <= 100)  roiMod = -8;
  else                  roiMod = -15; // very high ROI = almost never fills at this spread

  // ── Data freshness: multiplicative confidence factor ─────────────────────
  // Stale data = margin shown is probably wrong. Hard kill above 2hr.
  let freshness = 0.5; // default if unknown
  if (lastTradeTime) {
    const ageSec = Math.floor(Date.now() / 1000 - lastTradeTime);
    if      (ageSec < 300)  freshness = 1.00;
    else if (ageSec < 900)  freshness = 0.90;
    else if (ageSec < 1800) freshness = 0.75;
    else if (ageSec < 3600) freshness = 0.55;
    else if (ageSec < 7200) freshness = 0.25;
    else                    freshness = 0.05;
  }

  const base = Math.max(0, Math.min(85, Math.round((baseScore + roiMod) * freshness)));

  // ── Preference shaping ───────────────────────────────────────────────────
  // This is the layer that makes the LIST actually change.
  // Preferences apply ADDITIVE bonus/penalty points (not multipliers)
  // so that the relative ordering shifts visibly without everything clamping to 100.

  if (!speed && !risk) return base;

  let prefDelta = 0;

  // SPEED preference — about fill time, driven by volume
  if (speed === "Fast") {
    // Fast = need to fill within 30min = needs massive daily volume
    if      (volume >= 1_000_000) prefDelta += 15;
    else if (volume >= 300_000)   prefDelta += 8;
    else if (volume >= 100_000)   prefDelta += 2;
    else if (volume >= 50_000)    prefDelta -= 5;
    else if (volume >= 10_000)    prefDelta -= 20;
    else                          prefDelta -= 40; // will not fill fast, hard demote
  } else if (speed === "Slow") {
    // Slow = don't care about volume, reward big margins
    if      (margin >= 500_000) prefDelta += 15;
    else if (margin >= 100_000) prefDelta += 8;
    else if (margin >= 20_000)  prefDelta += 3;
    else if (margin < 2_000)    prefDelta -= 15; // tiny margin not worth a slow slot
    // Don't penalize low volume for slow
    if (volume >= 1_000_000) prefDelta -= 5; // mega-commodities aren't "slow flip" items
  } else { // Med
    if (volume < 5_000)    prefDelta -= 10;
    if (margin < 1_000)    prefDelta -= 10;
  }

  // RISK preference — about margin stability and market depth
  if (risk === "Low") {
    // Low risk = stable, liquid, predictable. Punish thin/volatile markets hard.
    if      (volume >= 500_000)  prefDelta += 12;
    else if (volume >= 100_000)  prefDelta += 6;
    else if (volume >= 20_000)   prefDelta += 0;
    else if (volume >= 5_000)    prefDelta -= 15;
    else                         prefDelta -= 30;
    if (roi > 30)   prefDelta -= 20; // high ROI = thin market = risky
    if (roi > 15)   prefDelta -= 10;
    if (roi <= 5)   prefDelta += 8;  // low ROI = stable commodity
  } else if (risk === "High") {
    // High risk = OK with thin markets, chasing big margins
    if      (margin >= 1_000_000) prefDelta += 15;
    else if (margin >= 200_000)   prefDelta += 8;
    else if (margin >= 50_000)    prefDelta += 3;
    else if (margin < 5_000)      prefDelta -= 10; // not worth high risk for small margin
    if (roi > 20 && roi <= 80)    prefDelta += 8;  // reward higher ROI
    if (volume >= 500_000)        prefDelta -= 8;  // high risk players don't need commodities
  } else { // Med
    if (roi > 40)        prefDelta -= 12;
    if (volume < 2_000)  prefDelta -= 12;
    if (margin >= 50_000 && roi <= 30) prefDelta += 6;
  }

  return Math.max(0, Math.min(100, base + prefDelta));
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // blank line → spacer
    if (line.trim() === "") { elements.push(<div key={i} style={{ height: "6px" }} />); i++; continue; }
    // bullet line
    if (/^[-*]\s/.test(line.trim())) {
      const bulletLines = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        bulletLines.push(lines[i].trim().replace(/^[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={i} style={{ paddingLeft: "16px", margin: "4px 0", listStyle: "disc" }}>
          {bulletLines.map((bl, j) => <li key={j} style={{ marginBottom: "3px" }}>{inlineFormat(bl)}</li>)}
        </ul>
      );
      continue;
    }
    // regular line
    elements.push(<div key={i} style={{ marginBottom: "2px" }}>{inlineFormat(line)}</div>);
    i++;
  }
  return elements;
}

function inlineFormat(text) {
  // **bold**, then plain text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--gold-light)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function itemIconUrl(name) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(name.replace(/ /g, "_"))}_detail.png`;
}

function isValidFlip(item) {
  return item.high > item.low && item.low >= 50 && item.margin > 0;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const TIME_RANGES = [
  { label: "24H", seconds: 86400 }, { label: "3D", seconds: 259200 },
  { label: "7D", seconds: 604800 }, { label: "1M", seconds: 2592000 },
  { label: "6M", seconds: 15552000 }, { label: "1Y", seconds: 31536000 },
];

const TOUR_STEPS = [
  { id: "flips-table", title: "Live Market", desc: "Every tradeable OSRS item sorted by volume. Click any item to see its price history and margin. Use column headers to sort by margin, ROI, GP/Fill, and more.", target: ".flips-table", placement: "top" },
  { id: "filter-bar", title: "Filter & Search", desc: "Filter by F2P, Members, or High Volume. Star items to save them as favourites. Use the search box to find any item instantly.", target: ".filter-bar", placement: "bottom" },
  { id: "ai-advisor", title: "AI Flip Advisor", desc: "Ask the AI anything — best flips for your budget, what's trending, or whether a specific item is worth flipping. It has live GE data.", target: ".merchant-ai-bubble", placement: "left" },
  { id: "tracker-tab", title: "Track Your Flips", desc: "Log every flip to track total profit, best items, and average returns. Your history syncs across all your devices automatically.", target: ".nav-tabs", placement: "bottom" },
  { id: "done", title: "You're Ready to Flip! 📈", desc: "That's everything. Start by setting your cash stack, then check the top flips list. Good luck on the Grand Exchange!", target: null, placement: "center" },
];

const MERCHANT_TOUR_STEPS = [
  // ── Operations tab ──
  { title: "Welcome to Merchant Mode 📈", desc: "Your war room for managing multiple GE positions at once. Four tabs cover everything: Operations, Analytics, Alerts, and Market. Let's walk through each one.", target: null, placement: "center", view: "operations" },
  { title: "Capital Overview", desc: "Tracks your full GP stack at a glance. Deployed = GP locked in open positions. Idle = unused GP ready to put to work. Realised = profit closed today. Click 'Update' any time to adjust your stack.", target: ".capital-bar", placement: "bottom", view: "operations" },
  { title: "GE Slots", desc: "Your 8 GE slots, auto-filled from Tracker open flips. Dot colours show each position's status: 🟡 Buying · 🟢 Holding · 🔵 Selling · 🔴 Danger. Click any slot to view that item's price chart.", target: ".slots-grid", placement: "bottom", view: "operations" },
  { title: "Active Operations", desc: "Every open position with live P&L, hold time, and a margin health bar. Use the status dropdown to mark each flip: Buying → Holding → Selling. Hit ⚙ on any row to set Autopilot rules — margin floor, hold time limit, or price drop alert — personalised per position. Rules are stored on this device.", target: "#active-operations-section", placement: "top", view: "operations" },
  { title: "Capital Efficiency", desc: "The ring gauge shows what % of your stack is actively working. Aim for 70%+ for best returns. Below 50% means too much idle GP sitting unused.", target: ".gauge-ring", placement: "left", view: "operations" },
  { title: "🎯 Daily GP Goal", desc: "Set a daily GP target and track your progress in real time. The bar fills as you close flips, and gives you an ETA based on your current GP/hr rate.", target: "#tour-daily-goal", placement: "left", view: "operations" },
  { title: "⚡ Rotation Picks", desc: "Items suggested to fill your idle GP right now — filtered to fit your budget and ranked by score. Click any card to open the price chart and decide if it's worth a flip.", target: ".rotation-picks-section", placement: "left", view: "operations" },
  { title: "📋 Flip Queue", desc: "A wishlist of items you want to flip next. Add anything here, and the live margin updates automatically. When a slot opens up, your queue tells you exactly what to buy.", target: "#tour-flip-queue", placement: "top", view: "operations" },
  // ── Analytics tab ──
  { title: "📊 Session Intel", desc: "A full breakdown of your current session: duration, GP/hr rate, flips closed, return on capital, and more. All updated live as you trade.", target: "#tour-session-intel", placement: "right", view: "analytics" },
  { title: "⚠️ Risk Exposure", desc: "See how concentrated your capital is across items. Any position above 40% of your stack triggers a warning — over-concentration is one of the biggest risks in GE flipping.", target: "#tour-risk-exposure", placement: "right", view: "analytics" },
  { title: "✅ Closed Today", desc: "A full log of every flip you've closed today with buy price, sell price, and profit per flip. Great for reviewing what's working and what isn't.", target: "#tour-closed-today", placement: "right", view: "analytics" },
  // ── Alerts tab ──
  { title: "⚡ Smart Alerts", desc: "Four automatic alerts that fire when market conditions shift: Margin Spike, Volume Surge, Dump Detected, and Price Crash. Toggle each one on or off, and click the ⚙️ gear to fine-tune the trigger threshold.", target: "#tour-smart-alerts", placement: "right", view: "alerts" },
  { title: "📡 Live Feed", desc: "Every alert that's fired this session lands here in real time. Filter by type, click any alert to jump straight to that item's chart, and clear the feed whenever you like.", target: "#tour-live-feed", placement: "right", view: "alerts" },
  // ── AI Bubble ──
  { title: "🤖 AI Advisor", desc: "Your AI trading assistant is always one click away — look for the gold 📈 bubble in the bottom-right corner. It has full visibility of your active slots and positions, so ask it anything: why an offer isn't filling, what to flip next, or whether to relist.", target: ".merchant-ai-bubble", placement: "left", view: "operations" },
  // ── Done ──
  { title: "You're fully set up 📈", desc: "Start a buy offer in the GE in-game — the RuneTrader plugin picks it up automatically and opens a position here. Close or sell in-game and it updates in real time. Good luck on the GE.", target: null, placement: "center", view: "operations" },
];

// ─── ITEM CHART MODAL ────────────────────────────────────────────────────────

function ItemChart({ item, onClose, onAskAI, onRefresh, refreshing, refreshCooldown, onShare, isWatchlisted, onToggleWatchlist }) {
  const [range, setRange] = useState("7D");
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const canvasRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchChartData(); }, [range, item.id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (chartData) drawChart(); }, [chartData]);

  async function fetchChartData() {
    setChartLoading(true);
    try {
      const rangeObj = TIME_RANGES.find(r => r.label === range);
      // Fix: use correct timestep for each range
      let endpoint;
      if (range === "24H") endpoint = "5m";
      else if (range === "3D") endpoint = "1h";
      else if (range === "7D") endpoint = "6h";
      else if (range === "1M") endpoint = "6h";
      else endpoint = "24h"; // 6M, 1Y

      const res = await fetch(`https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=${endpoint}&id=${item.id}`, { headers: { "User-Agent": "RuneTrader/1.0" } });
      const data = await res.json();
      if (!data.data || data.data.length === 0) { setChartLoading(false); return; }
      const now = Date.now() / 1000;
      const filtered = data.data.filter(d => now - d.timestamp <= rangeObj.seconds);
      setChartData(filtered.length > 0 ? filtered : data.data.slice(-200));
    } catch { } finally { setChartLoading(false); }
  }

  function drawChart() {
    const canvas = canvasRef.current;
    if (!canvas || !chartData || chartData.length < 2) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height, pad = { top: 20, right: 20, bottom: 40, left: 82 };
    ctx.clearRect(0, 0, W, H);
    const allPrices = [...chartData.map(d => d.avgHighPrice), ...chartData.map(d => d.avgLowPrice)].filter(Boolean);
    if (!allPrices.length) return;
    const minP = Math.min(...allPrices) * 0.995, maxP = Math.max(...allPrices) * 1.005;
    const minT = chartData[0].timestamp, maxT = chartData[chartData.length - 1].timestamp;
    const xPos = t => pad.left + ((t - minT) / (maxT - minT)) * (W - pad.left - pad.right);
    const yPos = p => pad.top + (1 - (p - minP) / (maxP - minP)) * (H - pad.top - pad.bottom);
    function fmtYLabel(n) {
      if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2) + "B";
      if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
      if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K";
      return Math.round(n).toLocaleString();
    }
    ctx.strokeStyle = "rgba(42,51,64,0.8)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (H - pad.top - pad.bottom);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = "#4a5a6a"; ctx.font = "11px Inter"; ctx.textAlign = "right";
      ctx.fillText(fmtYLabel(Math.round(maxP - (i / 4) * (maxP - minP))), pad.left - 8, y + 4);
    }
    const highPoints = chartData.filter(d => d.avgHighPrice);
    if (highPoints.length > 1) {
      ctx.beginPath(); ctx.moveTo(xPos(highPoints[0].timestamp), yPos(highPoints[0].avgHighPrice));
      highPoints.forEach(d => ctx.lineTo(xPos(d.timestamp), yPos(d.avgHighPrice)));
      const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
      grad.addColorStop(0, "rgba(201,168,76,0.15)"); grad.addColorStop(1, "rgba(201,168,76,0)");
      ctx.lineTo(xPos(highPoints[highPoints.length - 1].timestamp), H - pad.bottom);
      ctx.lineTo(xPos(highPoints[0].timestamp), H - pad.bottom);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(xPos(highPoints[0].timestamp), yPos(highPoints[0].avgHighPrice));
      highPoints.forEach(d => ctx.lineTo(xPos(d.timestamp), yPos(d.avgHighPrice)));
      ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 2; ctx.stroke();
    }
    const lowPoints = chartData.filter(d => d.avgLowPrice);
    if (lowPoints.length > 1) {
      ctx.beginPath(); ctx.moveTo(xPos(lowPoints[0].timestamp), yPos(lowPoints[0].avgLowPrice));
      lowPoints.forEach(d => ctx.lineTo(xPos(d.timestamp), yPos(d.avgLowPrice)));
      ctx.strokeStyle = "#4caf7d"; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = "#4a5a6a"; ctx.font = "11px Inter"; ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const t = minT + (i / 5) * (maxT - minT);
      const d = new Date(t * 1000);
      ctx.fillText(range === "24H" ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" }), xPos(t), H - pad.bottom + 16);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{item.name}</div>
            <div className="modal-meta">{item.category} · Buy limit: {item.buyLimit > 0 ? item.buyLimit.toLocaleString() : "Unknown"} · Score: {item.score}/100</div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="refresh-btn"
              onClick={onRefresh}
              disabled={refreshing || refreshCooldown > 0}
              title={refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : "Refresh prices"}
            >
              <span className={refreshing ? "refresh-spin" : ""}>↻</span>
              {refreshing ? "Refreshing..." : refreshCooldown > 0 ? `↻ ${refreshCooldown}s` : "Refresh"}
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-stats">
          {[
            { label: "Buy Price", value: formatGP(item.adjLow ?? item.low), color: "var(--green)", tip: "The current lowest buy offer on the GE. This is what you'll pay to buy the item." },
            { label: "Sell Price", value: formatGP(item.adjHigh ?? item.high), color: "var(--text)", tip: "The current highest sell offer on the GE. This is what buyers are paying right now." },
            { label: "Margin (after tax)", value: formatGP(item.adjMargin ?? item.margin), color: (item.adjMargin ?? item.margin) > 0 ? "var(--green)" : "var(--red)", tip: "Sell price minus buy price minus GE tax (1%, capped at 5M). This is your actual profit per item." },
            { label: "ROI", value: item.roi + "%", color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12", tip: "Return on investment — margin ÷ buy price. 🟢 1–3% = Healthy sweet spot. 🟡 >4% = Risky (wide spread, hard to exit). 🟠 <1% = Competitive (thin margin, many flippers)." },
            { label: "Vol / Day", value: item.volume > 0 ? item.volume.toLocaleString() : "—", color: "var(--text-dim)", tip: "Total items traded across all GE slots per day. Higher volume = easier fills and less competition risk." },
            { label: "GP / Fill", value: item.buyLimit > 0 ? formatGP((item.adjMargin ?? item.margin) * item.buyLimit) : "—", color: "var(--gold)", tip: "Maximum GP profit per 4-hour buy limit window (margin × buy limit). Use this to compare how much a full cycle is worth." },
            { label: "Cycles / Day", value: item.buyLimit > 0 && item.volume > 0 ? (item.volume / item.buyLimit).toFixed(1) + "×" : "—", color: item.buyLimit > 0 && item.volume / item.buyLimit >= 71 ? "var(--green)" : item.buyLimit > 0 && item.volume / item.buyLimit >= 31 ? "#f39c12" : "var(--red)", tip: "How many times the daily volume could fill your buy limit (vol ÷ limit). 🟢 71×+ = Liquid. 🟠 31–70× = Active. 🔴 ≤30× = Competitive (fills may be slow)." },
            { label: "Last Trade", value: item.lastTradeTime ? formatTime(item.lastTradeTime * 1000) : "—", color: "var(--text-dim)", tip: "When this item last traded on the GE. Stale data (hours ago) means low activity — prices may not reflect reality." },
          ].map((s, i) => (
            <div key={i} className="modal-stat">
              <div className="modal-stat-label">
                {s.label}
                {s.tip && (
                  <span className="stat-tooltip-wrap">
                    <span className="stat-help">?</span>
                    <span className="stat-tooltip">{s.tip}</span>
                  </span>
                )}
              </div>
              <div className="modal-stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="chart-section">
          <div className="time-tabs">{TIME_RANGES.map(r => <button key={r.label} className={"time-tab" + (range === r.label ? " active" : "")} onClick={() => setRange(r.label)}>{r.label}</button>)}</div>
          <div className="chart-container">
            {chartLoading ? <div className="chart-loading">Loading price history...</div> : !chartData ? <div className="chart-loading">No price history available</div> : <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />}
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-dim)" }}><div style={{ width: "20px", height: "2px", background: "#c9a84c" }} />Sell Price</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-dim)" }}><div style={{ width: "20px", height: "2px", background: "#4caf7d" }} />Buy Price</div>
          </div>
        </div>
        <div className="modal-body">
          <button className="modal-ask-btn" onClick={() => { onToggleWatchlist && onToggleWatchlist(); }} style={{ background: isWatchlisted ? "rgba(201,168,76,0.12)" : undefined, borderColor: isWatchlisted ? "var(--gold-dim)" : undefined, color: isWatchlisted ? "var(--gold)" : undefined }}>
            {isWatchlisted ? "🔖 Remove from Watchlist" : "🔖 Add to Watchlist"}
          </button>
          <button className="modal-ask-btn" onClick={() => { onAskAI(`Analyse ${item.name} for me. Is now a good time to flip it? Buy at ${formatGP(item.adjLow ?? item.low)}, sell at ${formatGP(item.adjHigh ?? item.high)}, margin ${formatGP(item.adjMargin ?? item.margin)}.`); onClose(); }}>
            📈 Ask AI to analyse this flip →
          </button>
          {onShare && (
            <button className="modal-ask-btn" style={{ opacity: 0.7 }} onClick={onShare}>
              🔗 Copy shareable link →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROFIT CHART ────────────────────────────────────────────────────────────

function ProfitChart({ flipsLog, autoFlipsLog = [] }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height, pad = { top: 10, right: 10, bottom: 30, left: 60 };
    ctx.clearRect(0, 0, W, H);
    // Merge manual closed flips + auto closed flips, sorted by date
    const manualClosed = flipsLog.filter(f => f.status !== "open").map(f => ({ profit: f.totalProfit || 0, date: f.date }));
    const autoClosed = autoFlipsLog.map(f => ({ profit: f.profit || 0, date: f.sell_completed_at }));
    const closedFlips = [...manualClosed, ...autoClosed];
    if (closedFlips.length < 2) return;
    const sorted = [...closedFlips].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    let cum = 0;
    const points = sorted.map(f => { cum += f.profit; return cum; });
    const minV = Math.min(0, ...points), maxV = Math.max(0, ...points);
    const range = maxV - minV || 1;
    const xPos = i => pad.left + (i / (points.length - 1)) * (W - pad.left - pad.right);
    const yPos = v => pad.top + (1 - (v - minV) / range) * (H - pad.top - pad.bottom);
    ctx.strokeStyle = "rgba(42,51,64,0.6)"; ctx.lineWidth = 1;
    [0, 0.5, 1].forEach(t => {
      const y = pad.top + t * (H - pad.top - pad.bottom);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const val = maxV - t * range;
      ctx.fillStyle = "#4a5a6a"; ctx.font = "10px Inter"; ctx.textAlign = "right";
      ctx.fillText((val >= 0 ? "+" : "") + formatGP(Math.round(val)), pad.left - 4, y + 4);
    });
    if (minV < 0 && maxV > 0) {
      const y = yPos(0);
      ctx.strokeStyle = "rgba(122,138,154,0.4)"; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.setLineDash([]);
    }
    const isPositive = points[points.length - 1] >= 0;
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(points[0]));
    points.forEach((p, i) => ctx.lineTo(xPos(i), yPos(p)));
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, isPositive ? "rgba(46,204,113,0.2)" : "rgba(231,76,60,0.2)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.lineTo(xPos(points.length - 1), H - pad.bottom); ctx.lineTo(xPos(0), H - pad.bottom);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(points[0]));
    points.forEach((p, i) => ctx.lineTo(xPos(i), yPos(p)));
    ctx.strokeStyle = isPositive ? "#2ecc71" : "#e74c3c"; ctx.lineWidth = 2; ctx.stroke();
  }, [flipsLog, autoFlipsLog]);

  const closedCount = flipsLog.filter(f => f.status !== "open").length + autoFlipsLog.length;
  if (closedCount < 2) return null;
  return (
    <div className="profit-chart-wrap">
      <div className="profit-chart-title">📈 Cumulative Profit</div>
      <div className="profit-canvas-wrap">
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

// ─── CLOSE FLIP MODAL ────────────────────────────────────────────────────────

function CloseFlipModal({ flip, items, onSold, onCancelled, onDismiss, loading }) {
  const [step, setStep] = useState("choose"); // "choose" | "sold"
  const [sellPrice, setSellPrice] = useState("");

  const liveItem = items.find(i => i.name.toLowerCase() === flip.item.toLowerCase());
  const defaultSell = liveItem ? String(liveItem.high) : "";

  useEffect(() => {
    if (step === "sold" && !sellPrice) setSellPrice(defaultSell);
  }, [step]); // eslint-disable-line

  const sellNum = parseInt(sellPrice.replace(/,/g, ""));
  const previewProfit = !isNaN(sellNum) ? (() => {
    const tax = Math.min(Math.floor(sellNum * 0.02), 5_000_000);
    return (sellNum - flip.buyPrice - tax) * (flip.qty || 1);
  })() : null;

  return (
    <div className="close-flip-modal" onClick={e => e.target === e.currentTarget && onDismiss()}>
      <div className="close-flip-inner">
        <div>
          <div className="close-flip-title">Close: {flip.item}</div>
          <div className="close-flip-subtitle">
            Bought {(flip.qty || 1).toLocaleString()}x at {formatGP(flip.buyPrice)} gp each
          </div>
        </div>

        {step === "choose" && (
          <div className="close-flip-options">
            <button className="close-flip-option-btn sold" onClick={() => setStep("sold")}>
              <span className="opt-title">✅ Sold</span>
              <span className="opt-sub">I sold this item — enter my sell price and log the profit</span>
            </button>
            <button className="close-flip-option-btn" onClick={() => onCancelled(flip)}>
              <span className="opt-title">❌ Cancelled</span>
              <span className="opt-sub">Order didn&apos;t fill or I changed my mind — remove from open flips</span>
            </button>
          </div>
        )}

        {step === "sold" && (
          <div className="close-flip-sold-form">
            <button className="back-link" onClick={() => setStep("choose")}>← Back</button>
            <div className="close-flip-field">
              <label className="close-flip-label">Sell Price (gp)</label>
              <input
                className="close-flip-input"
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
                placeholder="Enter your actual sell price"
                autoFocus
              />
            </div>
            {previewProfit !== null && (
              <div className="close-flip-preview">
                <span style={{ color: "var(--text-dim)" }}>Estimated profit: </span>
                <span style={{ fontWeight: 700, color: previewProfit >= 0 ? "var(--green)" : "var(--red)" }}>
                  {previewProfit >= 0 ? "+" : ""}{formatGP(previewProfit)} gp
                </span>
              </div>
            )}
            <div className="close-flip-btns">
              <button className="close-flip-cancel" onClick={onDismiss} disabled={loading}>Cancel</button>
              <button
                className="close-flip-confirm"
                disabled={!sellPrice || isNaN(sellNum) || loading}
                onClick={() => onSold(flip, sellPrice)}
              >
                {loading ? "Saving..." : "Confirm & Log Profit"}
              </button>
            </div>
          </div>
        )}

        {step === "choose" && (
          <div className="close-flip-btns">
            <button className="close-flip-cancel" onClick={onDismiss}>Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────────────────

function PortfolioPage({ user, flipsLog, autoFlipsLog = [], items, onSignIn }) {
  const [portPeriod, setPortPeriod] = useState("month"); // "week" | "month" | "all"

  if (!user) {
    return (
      <div className="portfolio-login-prompt">
        <div className="icon">📊</div>
        <p>Portfolio tracking requires an account</p>
        <small>Sign up and connect the RuneLite plugin to start tracking your flips.</small>
        <button className="portfolio-signin-btn" onClick={onSignIn}>Sign In / Create Account</button>
      </div>
    );
  }

  // ── Helper: get date cutoff for period ──
  function getPeriodCutoff(period) {
    const now = new Date();
    if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    if (period === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    return null; // all time
  }

  // ── All closed flips (plugin + tracker) ──
  const allClosed = [
    ...flipsLog.filter(f => f.status !== "open").map(f => ({ ...f, _date: f.date ? new Date(f.date) : null })),
    ...autoFlipsLog.map(f => ({ item: f.item_name, totalProfit: f.profit || 0, roi: f.roi || 0, qty: f.quantity || 1, buyPrice: f.buy_price || 0, _date: f.sell_completed_at ? new Date(f.sell_completed_at) : null })),
  ];

  // ── Open positions (tracker open flips only — no manual entry) ──
  const trackerOpenFlips = flipsLog.filter(f => f.status === "open");
  const totalOpenValue = trackerOpenFlips.reduce((s, f) => s + (f.buyPrice || 0) * (f.qty || 1), 0);

  // Capital allocation — open tracker flips only
  const allOpen = trackerOpenFlips.map(f => ({ name: f.item, value: (f.buyPrice || 0) * (f.qty || 1) }));
  const maxAlloc = Math.max(...allOpen.map(p => p.value), 1);

  // ── Period-filtered stats (for tables) ──
  const cutoff = getPeriodCutoff(portPeriod);
  const periodClosed = cutoff ? allClosed.filter(f => f._date && f._date >= cutoff) : allClosed;
  const periodProfit = periodClosed.reduce((s, f) => s + (f.totalProfit || 0), 0);
  const periodFlips = periodClosed.length;
  const periodWins = periodClosed.filter(f => (f.totalProfit || 0) > 0).length;
  const periodWinRate = periodFlips > 0 ? Math.round((periodWins / periodFlips) * 100) : null;
  const periodAvgProfit = periodFlips > 0 ? Math.round(periodProfit / periodFlips) : 0;

  // Per-item aggregation for selected period
  const periodItemMap = {};
  periodClosed.forEach(f => {
    const key = f.item || "Unknown";
    if (!periodItemMap[key]) periodItemMap[key] = { name: key, totalProfit: 0, flips: 0, wins: 0 };
    periodItemMap[key].totalProfit += f.totalProfit || 0;
    periodItemMap[key].flips += 1;
    if ((f.totalProfit || 0) > 0) periodItemMap[key].wins += 1;
  });
  const periodItemStats = Object.values(periodItemMap).sort((a, b) => b.totalProfit - a.totalProfit);
  const periodBestItems = periodItemStats.slice(0, 5);
  const periodWorstItems = [...periodItemStats].sort((a, b) => a.totalProfit - b.totalProfit).filter(i => i.totalProfit < 0).slice(0, 3);

  const periodLabel = portPeriod === "week" ? "This Week" : portPeriod === "month" ? "This Month" : "All Time";

  return (
    <div className="portfolio-wrap">

      {/* ── PERIOD SELECTOR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {[["week","This Week"],["month","This Month"],["all","All Time"]].map(([v,l]) => (
          <button key={v}
            onClick={() => setPortPeriod(v)}
            style={{ padding: "6px 16px", borderRadius: "6px", border: `1px solid ${portPeriod === v ? "var(--gold-dim)" : "var(--border)"}`, background: portPeriod === v ? "var(--bg3)" : "transparent", color: portPeriod === v ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
          >{l}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-dim)" }}>
          {periodFlips > 0 ? `${periodFlips} flips · ${formatGP(periodProfit)} profit` : "No flips in this period"}
        </span>
      </div>

      {/* ── PERIOD STAT CARDS ── */}
      <div className="port-stats">
        <div className="port-stat">
          <span className="port-stat-label">Profit</span>
          <span className="port-stat-value" style={{ color: periodProfit >= 0 ? "var(--green)" : "var(--red)" }}>{periodFlips > 0 ? formatGP(periodProfit) : "—"}</span>
          <span className="port-stat-sub">{periodLabel}</span>
        </div>
        <div className="port-stat">
          <span className="port-stat-label">Win Rate</span>
          <span className="port-stat-value" style={{ color: periodWinRate === null ? "var(--text-dim)" : periodWinRate >= 60 ? "var(--green)" : periodWinRate >= 40 ? "var(--gold)" : "var(--red)" }}>
            {periodWinRate === null ? "—" : `${periodWinRate}%`}
          </span>
          <span className="port-stat-sub">{periodWins}W / {periodFlips - periodWins}L</span>
        </div>
        <div className="port-stat">
          <span className="port-stat-label">Avg / Flip</span>
          <span className="port-stat-value" style={{ color: periodAvgProfit >= 0 ? "var(--gold)" : "var(--red)" }}>{periodFlips > 0 ? formatGP(periodAvgProfit) : "—"}</span>
          <span className="port-stat-sub">after 2% GE tax</span>
        </div>
        <div className="port-stat">
          <span className="port-stat-label">Capital Deployed</span>
          <span className="port-stat-value">{formatGP(totalOpenValue)}</span>
          <span className="port-stat-sub">{trackerOpenFlips.length} open slot{trackerOpenFlips.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="port-stat">
          <span className="port-stat-label">Items Traded</span>
          <span className="port-stat-value">{periodItemStats.length}</span>
          <span className="port-stat-sub">unique · {periodLabel}</span>
        </div>
      </div>

      {/* ── TWO COL: CAPITAL ALLOCATION + WIN RATE ── */}
      <div className="port-two-col">
        <div className="port-card">
          <div className="port-card-title">💰 Capital Allocation</div>
          {allOpen.length === 0 ? (
            <div className="alloc-empty">No open GE slots — connect the RuneLite plugin to see live positions</div>
          ) : (
            <div className="alloc-bar-wrap">
              {allOpen.sort((a, b) => b.value - a.value).map((pos, i) => (
                <div key={i} className="alloc-bar-row">
                  <div className="alloc-bar-label" title={pos.name}>{pos.name}</div>
                  <div className="alloc-bar-track">
                    <div className="alloc-bar-fill" style={{ width: `${Math.round((pos.value / maxAlloc) * 100)}%` }} />
                  </div>
                  <div className="alloc-bar-val">{formatGP(pos.value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="port-card">
          <div className="port-card-title">🏆 Win Rate — {periodLabel}</div>
          {periodFlips === 0 ? (
            <div className="alloc-empty">No closed flips in this period</div>
          ) : (
            <div className="winrate-ring-wrap">
              <svg width="100" height="100" viewBox="0 0 100 100">
                {(() => {
                  const r = 38; const cx = 50; const cy = 50;
                  const circ = 2 * Math.PI * r;
                  const winDash = (periodWins / periodFlips) * circ;
                  const lossDash = circ - winDash;
                  return (
                    <>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg4)" strokeWidth="12" />
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2ecc71" strokeWidth="12"
                        strokeDasharray={`${winDash} ${circ - winDash}`}
                        strokeDashoffset={circ / 4} strokeLinecap="butt" />
                      {lossDash > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e74c3c" strokeWidth="12"
                        strokeDasharray={`${lossDash} ${circ - lossDash}`}
                        strokeDashoffset={circ / 4 - winDash} strokeLinecap="butt" />}
                      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="700" fontFamily="Cinzel, serif">{periodWinRate}%</text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="Inter, sans-serif">WIN RATE</text>
                    </>
                  );
                })()}
              </svg>
              <div className="winrate-legend">
                <div className="winrate-legend-row"><div className="winrate-dot" style={{ background: "var(--green)" }} />{periodWins} profitable</div>
                <div className="winrate-legend-row"><div className="winrate-dot" style={{ background: "var(--red)" }} />{periodFlips - periodWins} losing</div>
                <div className="winrate-legend-row" style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-dim)" }}>
                  Avg: <span style={{ color: periodAvgProfit >= 0 ? "var(--gold)" : "var(--red)", marginLeft: "4px" }}>{formatGP(periodAvgProfit)} gp</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TWO COL: PER-ITEM P&L + BEST/WORST ── */}
      <div className="port-two-col">
        <div className="port-card">
          <div className="port-card-title">📊 Per-Item P&amp;L — {periodLabel}</div>
          {periodItemStats.length === 0 ? (
            <div className="alloc-empty">No flips in this period</div>
          ) : (
            <div className="pnl-table">
              <div className="pnl-header"><span>Item</span><span>Flips</span><span>Win %</span><span>Total P&amp;L</span></div>
              {periodItemStats.slice(0, 10).map((item, i) => (
                <div key={i} className="pnl-row">
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{item.name}</span>
                  <span style={{ color: "var(--text-dim)" }}>{item.flips}</span>
                  <span style={{ color: item.wins / item.flips >= 0.6 ? "var(--green)" : item.wins / item.flips >= 0.4 ? "var(--gold)" : "var(--red)" }}>
                    {Math.round((item.wins / item.flips) * 100)}%
                  </span>
                  <span style={{ fontWeight: 600, color: item.totalProfit >= 0 ? "var(--green)" : "var(--red)" }}>
                    {item.totalProfit >= 0 ? "+" : ""}{formatGP(item.totalProfit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="port-card">
          <div className="port-card-title">⚡ Best &amp; Worst — {periodLabel}</div>
          {periodItemStats.length === 0 ? (
            <div className="alloc-empty">No flips in this period</div>
          ) : (
            <div className="bw-table">
              <div className="bw-header"><span>Item</span><span>Flips</span><span>Win %</span><span>P&amp;L</span></div>
              <div className="bw-section-label">🏆 Best performers</div>
              {periodBestItems.map((item, i) => (
                <div key={`b${i}`} className="bw-row">
                  <span style={{ color: "var(--text)" }}>{item.name}</span>
                  <span style={{ color: "var(--text-dim)" }}>{item.flips}</span>
                  <span style={{ color: "var(--green)" }}>{Math.round((item.wins / item.flips) * 100)}%</span>
                  <span style={{ fontWeight: 600, color: "var(--green)" }}>+{formatGP(item.totalProfit)}</span>
                </div>
              ))}
              {periodWorstItems.length > 0 && (
                <>
                  <div className="bw-section-label">📉 Worst performers</div>
                  {periodWorstItems.map((item, i) => (
                    <div key={`w${i}`} className="bw-row">
                      <span style={{ color: "var(--text)" }}>{item.name}</span>
                      <span style={{ color: "var(--text-dim)" }}>{item.flips}</span>
                      <span style={{ color: "var(--red)" }}>{Math.round((item.wins / item.flips) * 100)}%</span>
                      <span style={{ fontWeight: 600, color: "var(--red)" }}>{formatGP(item.totalProfit)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── WELCOME MESSAGE ─────────────────────────────────────────────────────────

const WELCOME_MSG = {
  role: "assistant",
  content: "Hey! I'm your RuneTrader AI assistant 👋\n\nI have access to live Grand Exchange data and can help you find the best flips for your budget, explain market trends, and answer any OSRS trading questions.\n\nWhat are you working with today?",
  time: new Date(),
};

// ─── DEMO DATA ───────────────────────────────────────────────────────────────

// Fake live ops (ge_flips_live rows)
const DEMO_LIVE_OPS = [
  { id: "dop1", item_name: "Abyssal whip",      slot: 0, status: "HOLDING",  buy_price: 1_810_000, quantity: 2,   buy_started_at: new Date(Date.now() - 2.1*3600000).toISOString(), profit: null, roi: null },
  { id: "dop2", item_name: "Shark",              slot: 1, status: "BUYING",   buy_price: 820,       quantity: 500, buy_started_at: new Date(Date.now() - 0.3*3600000).toISOString(), profit: null, roi: null },
  { id: "dop3", item_name: "Law rune",           slot: 2, status: "SELLING",  buy_price: 178,       quantity: 2000,buy_started_at: new Date(Date.now() - 4.5*3600000).toISOString(), profit: null, roi: null },
  { id: "dop4", item_name: "Dragon scimitar",    slot: 3, status: "HOLDING",  buy_price: 57_500,    quantity: 5,   buy_started_at: new Date(Date.now() - 1.2*3600000).toISOString(), profit: null, roi: null },
];

// Fake closed flips for analytics
const DEMO_AUTO_FLIPS = [
  { id: "daf1", item_name: "Abyssal whip",    buy_price: 1_800_000, sell_price: 1_846_000, quantity: 2,    profit: 72_040,  roi: 4.0,  sell_completed_at: new Date(Date.now() - 6*3600000).toISOString(),  status: "SOLD" },
  { id: "daf2", item_name: "Shark",           buy_price: 812,       sell_price: 833,       quantity: 500,  profit: 7_500,   roi: 2.6,  sell_completed_at: new Date(Date.now() - 10*3600000).toISOString(), status: "SOLD" },
  { id: "daf3", item_name: "Law rune",        buy_price: 176,       sell_price: 182,       quantity: 2000, profit: 8_000,   roi: 3.4,  sell_completed_at: new Date(Date.now() - 14*3600000).toISOString(), status: "SOLD" },
  { id: "daf4", item_name: "Dragon scimitar", buy_price: 56_000,    sell_price: 59_200,    quantity: 5,    profit: 12_000,  roi: 4.3,  sell_completed_at: new Date(Date.now() - 18*3600000).toISOString(), status: "SOLD" },
  { id: "daf5", item_name: "Mystic robe top", buy_price: 37_800,    sell_price: 39_200,    quantity: 4,    profit: 3_920,   roi: 2.6,  sell_completed_at: new Date(Date.now() - 22*3600000).toISOString(), status: "SOLD" },
];

// Fake P&L sparkline history
const DEMO_PNL_HISTORY = (() => {
  const vals = [0, 8000, 14000, 12000, 22000, 30000, 28000, 42000, 55000, 61000, 58000, 72000, 80000, 88000, 95000, 103460];
  return vals.map((v, i) => ({ time: Date.now() - (vals.length - 1 - i) * 900000, value: v }));
})();

// No-op supabase stub for demo mode — prevents network calls inside MerchantMode
const DEMO_SUPABASE_STUB = {
  from: () => ({
    select: () => ({
      eq: () => ({
        not: () => ({ order: () => Promise.resolve({ data: [] }) }),
        order: () => Promise.resolve({ data: [] }),
        single: () => Promise.resolve({ data: null }),
      }),
      order: () => Promise.resolve({ data: [] }),
      single: () => Promise.resolve({ data: null }),
    }),
  }),
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  removeChannel: () => {},
};

const DEMO_CAPITAL = 50_000_000;

// ── Demo Tour Steps ──────────────────────────────────────────────────────────
const DEMO_TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to RuneTrader 📈",
    desc: "RuneTrader is your Grand Exchange command centre. In the next 60 seconds we'll show you everything — live market data, smart alerts, and Merchant Mode. Let's go.",
    target: null,
    placement: "center",
    tab: null,
    merchantView: null,
  },
  {
    id: "market-table",
    title: "4,525 Items Tracked Live",
    desc: "Every tradeable item on the Grand Exchange, updated in real time via the OSRS Wiki API. Sorted by volume so the best opportunities surface first. Click any row to see a full price history chart.",
    target: ".flips-table",
    placement: "center",
    tab: "market",
    merchantView: null,
  },
  {
    id: "sparklines",
    title: "24-Hour Trend Sparklines",
    desc: "Every item has a live 24hr margin trend chart. Green means the spread is widening — more profit per flip. Red means it's compressing. Spot momentum at a glance without opening the chart modal.",
    target: ".flips-table",
    placement: "center",
    tab: "market",
    merchantView: null,
  },
  {
    id: "watchlist",
    title: "Watchlist — Your Favourites",
    desc: "Bookmark items you flip regularly with the 🔖 icon. Set price alerts so you get notified when the margin hits your target. Your watchlist syncs across devices when you sign in.",
    target: ".watchlist-table",
    placement: "top",
    tab: "watchlist",
    merchantView: null,
  },
  {
    id: "tracker",
    title: "Track Every Flip",
    desc: "Log your buy and sell prices to track total profit, win rate, and your best-performing items. Connect the RuneLite plugin and your GE slots sync automatically — no manual entry needed.",
    target: ".profit-chart-wrap",
    placement: "bottom",
    tab: "tracker",
    merchantView: null,
  },
  {
    id: "merchant-intro",
    title: "Meet Merchant Mode 📈",
    desc: "RuneTrader's flagship feature — a self-contained trading terminal. Manage all your GE slots, track live P&L, get rotation picks, set autopilot rules, and monitor risk exposure. All in one place.",
    target: null,
    placement: "center",
    tab: "market",
    merchantView: "operations",
    activateMerchant: true,
  },
  {
    id: "merchant-ops",
    title: "Active Operations",
    desc: "Every open position with live P&L, hold time, and a margin health bar. The status dots show where each flip is: 🟡 Buying · 🟢 Holding · 🔵 Selling · 🔴 Danger. Click ⚙ to set per-slot Autopilot rules.",
    target: "#active-operations-section",
    placement: "top",
    tab: null,
    merchantView: "operations",
  },
  {
    id: "merchant-capital",
    title: "Capital & Daily Goal",
    desc: "Track how much GP you have deployed vs idle. Set a daily GP target and watch your progress fill in real time. The ring gauge shows capital efficiency — aim for 70%+ to maximise returns.",
    target: ".capital-bar",
    placement: "bottom",
    tab: null,
    merchantView: "operations",
  },
  {
    id: "ai-advisor",
    title: "AI Advisor — Always On",
    desc: "Ask the AI anything: best flips for your budget, why an offer isn't filling, whether to relist. It has full visibility of your active slots and live market data. Tap the 📈 bubble any time.",
    target: ".merchant-ai-bubble",
    placement: "left",
    tab: null,
    merchantView: "operations",
  },
];

// ─── WATCHLIST PAGE ────────────────────────────────────────────

function WatchlistPage({
  user, items, watchlist, watchlistAlerts,
  toggleWatchlist, setWatchlistAlert, clearWatchlistAlert,
  watchlistAlertOpen, setWatchlistAlertOpen,
  watchlistAlertInputs, setWatchlistAlertInputs,
  watchlistAddSearch, setWatchlistAddSearch,
  watchlistAddAutocomplete, setWatchlistAddAutocomplete,
  setSelectedItem, onSignIn, setUpgradeModal,
  demoMode, formatGP,
}) {
  const watchedItems = items.filter(i => watchlist.includes(i.id));

  function handleAddSearch(val) {
    setWatchlistAddSearch(val);
    if (!val.trim()) { setWatchlistAddAutocomplete([]); return; }
    const matches = items.filter(i => i.name.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
    setWatchlistAddAutocomplete(matches);
  }

  function addToWatchlist(item) {
    if (!watchlist.includes(item.id)) toggleWatchlist(item.id);
    setWatchlistAddSearch("");
    setWatchlistAddAutocomplete([]);
  }

  function openAlertPopover(itemId) {
    const existing = watchlistAlerts[itemId] || {};
    setWatchlistAlertInputs({ above: existing.above ? String(existing.above) : "", below: existing.below ? String(existing.below) : "" });
    setWatchlistAlertOpen(itemId);
  }

  function saveAlerts(itemId) {
    const above = parseFloat(String(watchlistAlertInputs.above).replace(/,/g, ""));
    const below = parseFloat(String(watchlistAlertInputs.below).replace(/,/g, ""));
    if (!isNaN(above) && above > 0) setWatchlistAlert(itemId, "above", above);
    else clearWatchlistAlert(itemId, "above");
    if (!isNaN(below) && below > 0) setWatchlistAlert(itemId, "below", below);
    else clearWatchlistAlert(itemId, "below");
    setWatchlistAlertOpen(null);
  }

  const hasAlertFor = (itemId) => { const a = watchlistAlerts[itemId]; return a && (a.above || a.below); };

  return (
    <div className="watchlist-wrap">
      <div className="watchlist-pro-tip">
        <span>🔖</span>
        <span>Watch items you flip regularly. Set price alerts to get notified when the market moves.
          {!user && !demoMode && (<span> <button onClick={onSignIn} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: "inherit", fontFamily: "inherit", padding: 0, textDecoration: "underline" }}>Sign in</button> to sync your watchlist across devices.</span>)}
        </span>
      </div>
      {watchedItems.length === 0 ? (
        <div className="watchlist-empty">
          <div className="icon">🔖</div>
          <p style={{ fontSize: "15px" }}>Your watchlist is empty</p>
          <p style={{ fontSize: "13px" }}>Click the 🔖 icon on any item in the Market tab to add it here, or search below.</p>
        </div>
      ) : (
        <div className="watchlist-table">
          <div className="watchlist-header">
            <span>Item</span><span>Buy</span><span>Sell</span><span>Margin</span><span>24hr Trend</span><span>Alert</span><span />
          </div>
          {watchedItems.map(item => {
            const alertSet = hasAlertFor(item.id);
            const al = watchlistAlerts[item.id] || {};
            return (
              <div key={item.id} style={{ position: "relative" }}>
                <div className="watchlist-row" onClick={() => setSelectedItem(item)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.name.replace(/ /g, "_"))}_detail.png`} alt="" style={{ width: 24, height: 24, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0 }} onError={e => { e.target.style.display = "none"; }} />
                    <span style={{ fontWeight: 500, fontSize: "13px" }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: "13px" }}>{item.hasPrice ? formatGP(item.low) : "—"}</span>
                  <span style={{ fontSize: "13px" }}>{item.hasPrice ? formatGP(item.high) : "—"}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: item.margin > 0 ? "var(--green)" : "var(--red)" }}>{item.hasPrice ? formatGP(item.margin) : "—"}</span>
                  <div onClick={e => e.stopPropagation()}><Sparkline itemId={item.id} width={78} height={28} /></div>
                  <div onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
                    <button className={`watchlist-alert-badge ${alertSet ? "set" : "unset"}`} onClick={() => { if (!user && !demoMode) { setUpgradeModal({ feature: "Watchlist Alerts", description: "Sign up free to set price alerts on your watchlist items." }); return; } openAlertPopover(item.id); }}>
                      🔔 {alertSet ? `${al.above ? "↑" + formatGP(al.above) : ""}${al.above && al.below ? " · " : ""}${al.below ? "↓" + formatGP(al.below) : ""}` : "Set alert"}
                    </button>
                    {watchlistAlertOpen === item.id && (
                      <div className="watchlist-alert-popover" style={{ top: "32px", left: 0 }}>
                        <div className="watchlist-alert-popover-title">Price Alert</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Alert when sell price goes above:</div>
                          <input className="watchlist-alert-input" placeholder="e.g. 1,850,000" value={watchlistAlertInputs.above} onChange={e => setWatchlistAlertInputs(v => ({ ...v, above: e.target.value }))} />
                          <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Alert when buy price drops below:</div>
                          <input className="watchlist-alert-input" placeholder="e.g. 1,800,000" value={watchlistAlertInputs.below} onChange={e => setWatchlistAlertInputs(v => ({ ...v, below: e.target.value }))} />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="watchlist-alert-set-btn" style={{ flex: 1 }} onClick={() => saveAlerts(item.id)}>Save</button>
                          <button onClick={() => setWatchlistAlertOpen(null)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
                        </div>
                        {alertSet && (<button onClick={() => { clearWatchlistAlert(item.id, "above"); clearWatchlistAlert(item.id, "below"); setWatchlistAlertOpen(null); }} style={{ background: "none", border: "none", color: "var(--red)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0 }}>Clear all alerts for this item</button>)}
                      </div>
                    )}
                  </div>
                  <button className="watchlist-remove-btn" onClick={e => { e.stopPropagation(); toggleWatchlist(item.id); }} title="Remove from watchlist">✕</button>
                </div>
              </div>
            );
          })}
          <div className="watchlist-add-row" style={{ position: "relative" }}>
            <input className="watchlist-add-input" placeholder="Search to add an item..." value={watchlistAddSearch} onChange={e => handleAddSearch(e.target.value)} />
            {watchlistAddAutocomplete.length > 0 && (
              <div style={{ position: "absolute", bottom: "100%", left: "16px", right: "16px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", zIndex: 50, marginBottom: "4px" }}>
                {watchlistAddAutocomplete.map(i => (
                  <div key={i.id} style={{ padding: "9px 14px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onClick={() => addToWatchlist(i)}>
                    <img src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(i.name.replace(/ /g, "_"))}_detail.png`} alt="" style={{ width: 20, height: 20, objectFit: "contain", imageRendering: "pixelated" }} onError={e => { e.target.style.display = "none"; }} />
                    <span>{i.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-dim)" }}>{i.hasPrice ? formatGP(i.margin) + " margin" : "no data"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

// ── MERCHANT MODE COMPONENT ──
function AutopilotRow({ op, liveItem, statusColor, statusLabel, pnlTotal, pnlPct, fillPct, hasRules, isAutopilotOpen, autopilotRules, setAutopilotOpen, saveAutopilotRules, clearAutopilotRules, formatGP, setSelectedItem, getHoldTime }) {
  const saved = autopilotRules[op.item_name] || { marginFloor: "", holdHours: "", priceDrop: "" };
  const [apMargin, setApMargin] = useState(saved.marginFloor);
  const [apHold, setApHold] = useState(saved.holdHours);
  const [apDrop, setApDrop] = useState(saved.priceDrop);
  useEffect(() => {
    const s = autopilotRules[op.item_name] || { marginFloor: "", holdHours: "", priceDrop: "" };
    setApMargin(s.marginFloor); setApHold(s.holdHours); setApDrop(s.priceDrop);
  }, [autopilotRules, op.item_name]);
  return (
    <>
      <div className="op-row op-row-healthy" onClick={(e) => { if (e.target.closest(".autopilot-btn")) return; liveItem && setSelectedItem(liveItem); }}>
        <div>
          <div className="op-item-name">{op.item_name}</div>
          <div className="op-item-sub">Slot {op.slot + 1} · {op.buy_started_at ? getHoldTime(op.buy_started_at) : ""}</div>
        </div>
        <span style={{ fontSize: "12px", color: statusColor }}>{statusLabel}</span>
        <span style={{ fontSize: "12px" }}>{op.buy_price && op.quantity ? formatGP(op.buy_price * op.quantity) : "—"}</span>
        <span style={{ fontSize: "12px" }}>{(op.quantity || 0).toLocaleString()}</span>
        <span style={{ fontSize: "12px" }}>{op.buy_price ? formatGP(op.buy_price) : "—"}</span>
        <span style={{ fontSize: "12px", color: liveItem ? "var(--text)" : "var(--text-dim)" }}>{liveItem ? formatGP(liveItem.high) : "—"}</span>
        <div>
          {op.status === "SOLD" ? (
            <><div style={{ color: (op.profit || 0) >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600, fontSize: "12px" }}>{(op.profit || 0) >= 0 ? "+" : ""}{formatGP(op.profit || 0)}</div><div style={{ fontSize: "10px", color: (op.roi || 0) >= 0 ? "var(--green)" : "var(--red)" }}>{op.roi}% ROI</div></>
          ) : op.buy_price ? (
            <><div style={{ color: pnlTotal >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600, fontSize: "12px" }}>{pnlTotal >= 0 ? "+" : ""}{formatGP(pnlTotal)}</div><div style={{ fontSize: "10px", color: pnlTotal >= 0 ? "var(--green)" : "var(--red)" }}>{pnlPct}%</div></>
          ) : <span style={{ color: "var(--text-dim)", fontSize: "12px" }}>—</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ background: "var(--bg4)", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
            <div style={{ background: statusColor, height: "100%", width: fillPct + "%", borderRadius: "3px" }} />
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>{fillPct}% filled</span>
        </div>
        <span />
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {hasRules && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} title="Autopilot active" />}
          <button className={`autopilot-btn${isAutopilotOpen ? " active" : ""}`} onClick={e => { e.stopPropagation(); setAutopilotOpen(isAutopilotOpen ? null : op.item_name); }}>⚙</button>
        </div>
      </div>
      {isAutopilotOpen && (
        <div className="autopilot-panel">
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--gold)", marginBottom: "4px" }}>Autopilot — {op.item_name}</div>
          <div className="autopilot-panel-row">
            <span className="autopilot-label">Margin drops below</span>
            <input className="autopilot-input" type="number" placeholder="e.g. 50" value={apMargin} onChange={e => setApMargin(e.target.value)} />
            <span className="autopilot-unit">gp → alert</span>
          </div>
          <div className="autopilot-panel-row">
            <span className="autopilot-label">Held longer than</span>
            <input className="autopilot-input" type="number" placeholder="e.g. 24" value={apHold} onChange={e => setApHold(e.target.value)} />
            <span className="autopilot-unit">hours → alert</span>
          </div>
          <div className="autopilot-panel-row">
            <span className="autopilot-label">Sell price drops by</span>
            <input className="autopilot-input" type="number" placeholder="e.g. 10" value={apDrop} onChange={e => setApDrop(e.target.value)} />
            <span className="autopilot-unit">% since buy → alert</span>
          </div>
          <div className="autopilot-footer">
            <span className="autopilot-hint">Saved locally — cleared if you clear browser data.</span>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button className="autopilot-clear" onClick={() => { clearAutopilotRules(op.item_name); setAutopilotOpen(null); }}>Clear rules</button>
              <button className="autopilot-save" onClick={() => { saveAutopilotRules(op.item_name, { marginFloor: apMargin, holdHours: apHold, priceDrop: apDrop }); setAutopilotOpen(null); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MerchantMode({ items, allItems, flipsLog, autoFlipsLog = [], manualPositions, geOffers = [], supabase: sb, user, merchantCapital, pnlHistory, pnlCanvasRef, formatGP, setSelectedItem, onUpdateCapital, onAddPosition, smartAlertSettings, saveSmartAlertSettings, thresholds, saveThreshold, openPopover, setOpenPopover, smartEvents, setSmartEvents, onRefresh, refreshing, refreshCooldown, onCloseFlip, onClosePortfolioPos, activeView, setActiveView, filter, setFilter, search, setSearch, favourites, toggleFavourite, sortCol, sortDir, handleSort, filtered, marketRowsShown, setMarketRowsShown, showAdvFilters, setShowAdvFilters, advFilters, advFilterCount, setAdv, resetAdvFilters, loading }) {

  // liveOps must be declared before allOpenPositions calculation below
  const [liveOps, setLiveOps] = useState([]);

  // ── Position Autopilot ──
  const [autopilotRules, setAutopilotRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_autopilot") || "{}"); } catch { return {}; }
  });
  const [autopilotOpen, setAutopilotOpen] = useState(null); // item_name of open rule panel

  function saveAutopilotRules(itemName, rules) {
    const updated = { ...autopilotRules, [itemName]: rules };
    setAutopilotRules(updated);
    localStorage.setItem("runetrader_autopilot", JSON.stringify(updated));
  }
  function clearAutopilotRules(itemName) {
    const updated = { ...autopilotRules };
    delete updated[itemName];
    setAutopilotRules(updated);
    localStorage.setItem("runetrader_autopilot", JSON.stringify(updated));
  }

  // Check autopilot rules on each items update
  const autopilotCheckRef = useRef({});
  useEffect(() => {
    if (!liveOps.length) return;
    const now = Date.now();
    const COOLDOWN = 15 * 60 * 1000; // 15 min per rule per item
    liveOps.forEach(op => {
      const rules = autopilotRules[op.item_name];
      if (!rules) return;
      const liveItem = items.find(i => i.name.toLowerCase() === op.item_name.toLowerCase());
      const holdMs = op.buy_started_at ? now - new Date(op.buy_started_at).getTime() : 0;
      const holdHrs = holdMs / 3600000;

      function canFire(key) {
        const k = `${op.item_name}_${key}`;
        if (autopilotCheckRef.current[k] && now - autopilotCheckRef.current[k] < COOLDOWN) return false;
        autopilotCheckRef.current[k] = now;
        return true;
      }
      function fire(key, message) {
        if (!canFire(key)) return;
        const event = {
          id: `autopilot_${op.item_name}_${key}_${now}`,
          itemId: op.id, itemName: op.item_name,
          type: "autopilot", icon: "🤖", badge: "autopilot",
          message, time: new Date(),
        };
        setSmartEvents(prev => [event, ...prev]);
        // Sound alert
        if (smartAlertSettings?.autopilotSound !== false) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          } catch {}
        }
        // Push notification
        if (smartAlertSettings?.autopilotPush !== false && typeof Notification !== "undefined" && Notification.permission === "granted") {
          try { new Notification(`RuneTrader Autopilot: ${op.item_name}`, { body: message, icon: "/icons/icon-192.png" }); } catch {}
        }
      }

      if (rules.marginFloor !== "" && liveItem && liveItem.margin < parseFloat(rules.marginFloor)) {
        fire("marginFloor", `${op.item_name}: margin dropped to ${formatGP(liveItem.margin)} gp (floor: ${formatGP(parseFloat(rules.marginFloor))} gp)`);
      }
      if (rules.holdHours !== "" && holdHrs > parseFloat(rules.holdHours)) {
        fire("holdHours", `${op.item_name}: held for ${holdHrs.toFixed(1)}hrs (limit: ${rules.holdHours}hrs)`);
      }
      if (rules.priceDrop !== "" && liveItem && op.buy_price > 0) {
        const dropPct = ((op.buy_price - liveItem.high) / op.buy_price) * 100;
        if (dropPct >= parseFloat(rules.priceDrop)) {
          fire("priceDrop", `${op.item_name}: sell price dropped ${dropPct.toFixed(1)}% since buy (limit: ${rules.priceDrop}%)`);
        }
      }
    });
  }, [liveOps, items, smartAlertSettings]); // eslint-disable-line

  // ── Build open positions ──
  const trackerOpen = flipsLog.filter(f => f.status === "open").map(f => ({
    id: f.id, name: f.item, gpIn: (f.buyPrice || 0) * (f.qty || 1),
    qty: f.qty || 1, buyPrice: f.buyPrice || 0, source: "tracker",
    openedAt: f.date ? new Date(f.date) : new Date(),
    posStatus: f.posStatus || "buying",
  }));
  const trackerNames = new Set(trackerOpen.map(p => p.name.toLowerCase()));
  const portfolioOnly = manualPositions
    .filter(p => !trackerNames.has(p.item_name.toLowerCase()))
    .map(p => ({
      id: p.id, name: p.item_name, gpIn: (p.buy_price || 0) * (p.qty || 1),
      qty: p.qty || 1, buyPrice: p.buy_price || 0, source: "portfolio",
      openedAt: p.date_opened ? new Date(p.date_opened) : new Date(),
      posStatus: p.pos_status || "buying",
    }));
  // Include auto-tracked open positions from ge_flips_live
  // Exclude items already tracked manually to avoid double-counting
  const allManualNames = new Set([...trackerNames, ...manualPositions.map(p => p.item_name.toLowerCase())]);
  const autoOpen = liveOps
    .filter(op => !allManualNames.has(op.item_name.toLowerCase()))
    .map(op => ({
      id: op.id, name: op.item_name,
      gpIn: (op.buy_price || 0) * (op.quantity || 1),
      qty: op.quantity || 1, buyPrice: op.buy_price || 0, source: "auto",
      openedAt: op.buy_started_at ? new Date(op.buy_started_at) : new Date(),
      posStatus: op.status === "BUYING" ? "buying" : op.status === "SELLING" ? "selling" : "holding",
    }));
  const allOpenPositions = [...trackerOpen, ...portfolioOnly, ...autoOpen];

  // ── Core metrics ──
  const totalDeployed = allOpenPositions.reduce((s, p) => s + p.gpIn, 0);
  const idleGP = Math.max(0, merchantCapital - totalDeployed);
  const efficiencyPct = merchantCapital > 0 ? Math.round((totalDeployed / merchantCapital) * 100) : 0;
  const circumference = 2 * Math.PI * 32;
  const dashOffset = circumference - (efficiencyPct / 100) * circumference;
  const todayFlips = flipsLog.filter(f => f.status !== "open" && f.date && new Date(f.date).toDateString() === new Date().toDateString());
  const autoTodayFlips = (autoFlipsLog || []).filter(f => f.sell_completed_at && new Date(f.sell_completed_at).toDateString() === new Date().toDateString());
  const realisedToday = todayFlips.reduce((s, f) => s + (f.totalProfit || 0), 0) + autoTodayFlips.reduce((s, f) => s + (f.profit || 0), 0);
  const unrealisedTotal = allOpenPositions.reduce((s, pos) => {
    const liveItem = items.find(i => i.name.toLowerCase() === pos.name.toLowerCase());
    if (!liveItem) return s;
    const tax = Math.min(Math.floor(liveItem.high * 0.02), 5_000_000);
    return s + (liveItem.high - pos.buyPrice - tax) * pos.qty;
  }, 0);

  // ── State ──
  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (!user || !sb) return;
    sb.from("ge_flips_live")
      .select("*")
      .eq("user_id", user.id)
      .not("status", "in", '(SOLD,CANCELLED)')
      .order("buy_started_at", { ascending: false })
      .then(({ data }) => setLiveOps(data || []));

    const ch = sb.channel("merchant-live-ops-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "ge_flips_live", filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === "DELETE") {
          // Re-fetch on DELETE — don't rely on payload.old which requires REPLICA IDENTITY FULL
          sb.from("ge_flips_live").select("*").eq("user_id", user.id)
            .not("status", "in", "(SOLD,CANCELLED)")
            .order("buy_started_at", { ascending: false })
            .then(({ data }) => setLiveOps(data || []));
        } else {
          const op = payload.new;
          if (["SOLD", "CANCELLED"].includes(op.status)) {
            // Remove by slot — more reliable than id without REPLICA IDENTITY FULL
            setLiveOps(prev => prev.filter(o => o.slot !== op.slot));
          } else {
            setLiveOps(prev => {
              // Try matching by id first, fall back to slot for reliability
              const idx = prev.findIndex(o => o.id === op.id || o.slot === op.slot);
              if (idx >= 0) { const next = [...prev]; next[idx] = op; return next; }
              return [op, ...prev];
            });
          }
        }
      }).subscribe();
    return () => sb.removeChannel(ch);
  }, [user, sb]); // eslint-disable-line react-hooks/exhaustive-deps
  const [merchantFeedFilter, setMerchantFeedFilter] = useState("all");
  const [merchantFeedSort, setMerchantFeedSort] = useState("recent");
  const [merchantFeedSortDir, setMerchantFeedSortDir] = useState("desc");
  const [closingPos, setClosingPos] = useState(null);
  const [posStatuses, setPosStatuses] = useState({}); // eslint-disable-line no-unused-vars
  const [dailyGoal, setDailyGoal] = useState(() => { try { return parseInt(localStorage.getItem("rt_daily_goal") || "0"); } catch { return 0; } });
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [flipQueue, setFlipQueue] = useState(() => { try { return JSON.parse(localStorage.getItem("rt_flip_queue") || "[]"); } catch { return []; } });
  const [showQueueAdd, setShowQueueAdd] = useState(false);
  const [queueInput, setQueueInput] = useState("");
  const [sessionStart] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  // activeView and setActiveView come from props (lifted to RuneTrader for tour control)

  // Live clock for session timer
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Helpers ──
  function getHoldTime(openedAt) {
    const ms = Date.now() - new Date(openedAt).getTime();
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function getSessionTime() {
    const ms = now - sessionStart;
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function getGPHr() {
    const hrs = (now - sessionStart) / 3600000;
    if (hrs < 0.01 || realisedToday === 0) return null;
    return Math.round(realisedToday / hrs);
  }

  function getHealthPct(pos) {
    const liveItem = items.find(i => i.name.toLowerCase() === pos.name.toLowerCase());
    if (!liveItem) return 50;
    const currentMargin = liveItem.high - pos.buyPrice - Math.min(Math.floor(liveItem.high * 0.02), 5_000_000);
    const originalMargin = liveItem.margin;
    if (originalMargin <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((currentMargin / originalMargin) * 100)));
  }

  function getPosStatus(pos) {
    const override = posStatuses[pos.id];
    if (override) return override;
    const holdMs = Date.now() - new Date(pos.openedAt).getTime();
    const healthPct = getHealthPct(pos);
    if (healthPct < 20) return "danger";
    if (holdMs < 20 * 60 * 1000) return "buying";
    if (healthPct >= 60) return "holding";
    return "selling";
  }

  function saveGoal(val) {
    const n = parseInt(val.replace(/[^0-9]/g, "")) || 0;
    setDailyGoal(n);
    localStorage.setItem("rt_daily_goal", String(n));
    setShowGoalInput(false);
  }

  function addToQueue(name) {
    if (!name.trim()) return;
    const item = items.find(i => i.name.toLowerCase() === name.trim().toLowerCase());
    const entry = { id: Date.now(), name: name.trim(), margin: item?.margin || 0, score: item?.score || 0, buyLimit: item?.buyLimit || 0 };
    const updated = [...flipQueue, entry];
    setFlipQueue(updated);
    localStorage.setItem("rt_flip_queue", JSON.stringify(updated));
    setQueueInput("");
    setShowQueueAdd(false);
  }

  function removeFromQueue(id) {
    const updated = flipQueue.filter(q => q.id !== id);
    setFlipQueue(updated);
    localStorage.setItem("rt_flip_queue", JSON.stringify(updated));
  }

  // ── Rotation picks ──
  const rotationPicks = items
    .filter(i => i.low <= idleGP && i.margin > 0 && i.score >= 60)
    .filter(i => !allOpenPositions.some(p => p.name.toLowerCase() === i.name.toLowerCase()))
    .slice(0, 3);

  // ── Risk exposure ──
  const riskItems = allOpenPositions.map(pos => {
    const pct = merchantCapital > 0 ? Math.round((pos.gpIn / merchantCapital) * 100) : 0;
    return { ...pos, pct };
  }).sort((a, b) => b.pct - a.pct);
  const topRiskPct = riskItems[0]?.pct || 0;
  const gpHr = getGPHr();

  const STATUS_COLORS = { buying: "#f39c12", selling: "var(--blue)", holding: "var(--green)", danger: "var(--red)" };
  const STATUS_LABELS = { buying: "Buying", selling: "Selling", holding: "Holding", danger: "⚠ Danger" };

  return (
    <>
    <div className="merchant-wrap">
      {/* ── HEADER BAR ── */}
      <div className="merchant-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="merchant-dot" />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)", letterSpacing: "1.5px" }}>MERCHANT MODE</span>
          </div>
          <div className="merchant-header-pills">
            {[["operations", "📈 Operations"], ["analytics", "📊 Analytics"], ["market", "📈 Market"], ["alerts", "⚡ Alerts"]].map(([v, l]) => (
              <button key={v} className={`merchant-nav-pill${activeView === v ? " active" : ""}`} onClick={() => setActiveView(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Session timer */}
          <div style={{ fontSize: "11px", color: "var(--text-dim)", display: "flex", gap: "10px", alignItems: "center" }}>
            <span>⏱ {getSessionTime()}</span>
            {gpHr !== null && <span style={{ color: gpHr >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{gpHr >= 0 ? "+" : ""}{formatGP(gpHr)} gp/hr</span>}
          </div>
          <button className="refresh-btn" disabled={refreshing || refreshCooldown > 0} onClick={onRefresh} style={{ fontSize: "12px" }}>
            <span className={refreshing ? "refresh-spin" : ""}>↻</span>
            {refreshing ? "Refreshing..." : refreshCooldown > 0 ? `${refreshCooldown}s` : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── CAPITAL BAR ── */}
      <div className="capital-bar">
        {[
          { label: "Total Capital", value: formatGP(merchantCapital), color: "var(--gold)", sub: <span style={{ cursor: "pointer", textDecoration: "underline", color: "var(--text-dim)", fontSize: "11px" }} onClick={onUpdateCapital}>Update</span> },
          { label: "Deployed", value: formatGP(totalDeployed), color: "var(--blue)", sub: `${efficiencyPct}% of stack` },
          { label: "Idle GP", value: formatGP(idleGP), color: idleGP > merchantCapital * 0.4 ? "#f39c12" : "var(--text)", sub: idleGP > merchantCapital * 0.3 ? <span style={{ color: "#f39c12" }}>⚠ Sitting unused</span> : "Available" },
          { label: "Unrealised P&L", value: `${unrealisedTotal >= 0 ? "+" : ""}${formatGP(unrealisedTotal)}`, color: unrealisedTotal >= 0 ? "var(--green)" : "var(--red)", sub: `${allOpenPositions.length} open positions` },
          { label: "Realised Today", value: `${realisedToday >= 0 ? "+" : ""}${formatGP(realisedToday)}`, color: realisedToday >= 0 ? "var(--green)" : "var(--red)", sub: `${todayFlips.length + autoTodayFlips.length} flips closed` },
        ].map((c, i) => (
          <div key={i} className="cap-cell">
            <span className="cap-label">{c.label}</span>
            <span className="cap-value" style={{ color: c.color }}>{c.value}</span>
            <span className="cap-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      <div className="merchant-body">
        {/* ══════════════════════ OPERATIONS VIEW ══════════════════════ */}
        {activeView === "operations" && (
          <div className="merchant-layout">

            {/* ── LEFT: GE Slots + Active Operations ── */}
            <div className="merchant-left">

              {/* GE Slot Grid */}
              <div className="merchant-section">
                <div className="merchant-section-header">
                  <span className="merchant-section-title">GE Slots</span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{Math.max(geOffers.filter(o => o.status !== "EMPTY").length, allOpenPositions.length)} / 8 occupied</span>
                </div>
                <div className="slots-grid">
                  {Array.from({ length: 8 }).map((_, i) => {
                    // SOLD = item sold but not yet collected, still occupies slot
                    const liveOffer = geOffers.find(o => o.slot === i && ["BUYING","BOUGHT","SELLING","SOLD"].includes(o.status));
                    // Only show manual/portfolio positions as slot card fallback.
                    // Auto-tracked positions are already shown via geOffers/liveOffer above.
                    const manualPositionsOnly = allOpenPositions.filter(p => p.source !== "auto");
                    const pos = manualPositionsOnly[i] || null;
                    if (liveOffer) {
                      const slotColor = { BUYING: "#f39c12", BOUGHT: "var(--green)", SELLING: "#4fc3f7", SOLD: "var(--green)" }[liveOffer.status] || "var(--border)";
                      const pct = liveOffer.qty_total > 0 ? Math.round((liveOffer.qty_filled / liveOffer.qty_total) * 100) : 0;
                      return (
                        <div key={i} className="ge-slot active" title={`${liveOffer.item_name} · ${liveOffer.status} · ${pct}% filled`}
                          onClick={() => { const it = items.find(x => x.name.toLowerCase() === liveOffer.item_name.toLowerCase()); if (it) setSelectedItem(it); }}>
                          <div className="slot-dot" style={{ background: slotColor }} />
                          <img src={itemIconUrl(liveOffer.item_name)} alt="" style={{ width: 64, height: 64, objectFit: "contain", imageRendering: "pixelated" }} onError={e => { e.target.style.display = "none"; }} />
                          <div className="slot-name">{liveOffer.item_name.length > 14 ? liveOffer.item_name.slice(0, 13) + "…" : liveOffer.item_name}</div>
                          <div className="slot-status-label" style={{ color: slotColor }}>{liveOffer.status}</div>
                          <div className="slot-pnl" style={{ color: "var(--text-dim)", fontSize: "11px" }}>{pct}% filled</div>
                        </div>
                      );
                    }
                    if (!pos) return (
                      <div key={i} className="ge-slot empty" title="Empty slot">
                        <div style={{ fontSize: "20px", color: "var(--border)", lineHeight: 1 }}>+</div>
                        <div style={{ fontSize: "8px", color: "var(--border)", marginTop: "2px" }}>Empty</div>
                      </div>
                    );
                    const liveItem = items.find(it => it.name.toLowerCase() === pos.name.toLowerCase());
                    const tax = liveItem ? Math.min(Math.floor(liveItem.high * 0.02), 5_000_000) : 0;
                    const pnlTotal = liveItem ? (liveItem.high - pos.buyPrice - tax) * pos.qty : 0;
                    const status = getPosStatus(pos);
                    return (
                      <div key={i} className={`ge-slot active slot-status-${status}`}
                        onClick={() => liveItem && setSelectedItem(liveItem)}
                        title={`${pos.name} · ${STATUS_LABELS[status]} · Click to view chart`}>
                        <div className={`slot-dot`} style={{ background: STATUS_COLORS[status] }} />
                        <img src={itemIconUrl(pos.name)} alt="" style={{ width: 64, height: 64, objectFit: "contain", imageRendering: "pixelated" }}
                          onError={e => { e.target.style.display = "none"; }} />
                        <div className="slot-name">{pos.name.length > 14 ? pos.name.slice(0, 13) + "…" : pos.name}</div>
                        <div className="slot-status-label" style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</div>
                        <div className="slot-pnl" style={{ color: pnlTotal >= 0 ? "var(--green)" : "var(--red)" }}>
                          {pnlTotal >= 0 ? "+" : ""}{formatGP(pnlTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "20px", padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                  {[["#f39c12","Buying"],["var(--green)","Holding"],["var(--blue)","Selling"],["var(--red)","Danger"]].map(([c,l]) => (
                    <span key={l} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-dim)" }}>
                      <span style={{ background: c, borderRadius: "50%", display: "inline-block", width: 9, height: 9, flexShrink: 0 }} />{l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Operations Table */}
              <div id="active-operations-section" className="merchant-section" style={{ flex: 1 }}>
                <div className="merchant-section-header">
                  <span className="merchant-section-title">Active Operations</span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Auto-tracked via plugin</span>
                </div>

                {liveOps.length === 0 ? (
                  <div className="merchant-empty">
                    <div style={{ fontSize: "36px", opacity: 0.3 }}>📈</div>
                    <p style={{ marginTop: "10px", color: "var(--text-dim)", fontSize: "13px" }}>No open positions</p>
                    <small style={{ color: "var(--text-dim)", fontSize: "11px" }}>Start a buy offer in-game — it will appear here automatically.</small>
                  </div>
                ) : (
                  <div className="ops-table">
                    <div className="ops-header">
                      <span>Item</span><span>Status</span><span>Investment</span><span>Qty</span><span>Buy Price</span><span>Market Value</span><span>Live P&amp;L</span><span>Progress</span><span></span><span>Auto</span>
                    </div>
                    {liveOps.map(op => {
                      const liveItem = items.find(i => i.name.toLowerCase() === op.item_name.toLowerCase());
                      const tax = liveItem ? Math.min(Math.floor(liveItem.high * 0.02), 5_000_000) : 0;
                      const pnlEach = (op.buy_price && liveItem) ? liveItem.high - op.buy_price - tax : 0;
                      const pnlTotal = pnlEach * (op.quantity || 1);
                      const pnlPct = op.buy_price > 0 ? ((pnlEach / op.buy_price) * 100).toFixed(1) : "0.0";
                      const fillPct = op.quantity > 0 ? Math.round(((op.status === "BUYING" ? op.qty_filled_buy : op.qty_filled_sell) || 0) / op.quantity * 100) : 0;
                      const statusColor = { BUYING: "#f39c12", BOUGHT: "var(--green)", SELLING: "#4fc3f7", SOLD: "var(--green)" }[op.status] || "var(--text-dim)";
                      const statusLabel = { BUYING: "🟡 Buying", BOUGHT: "🟢 Holding", SELLING: "🔵 Selling", SOLD: "✅ Sold" }[op.status] || op.status;
                      const hasRules = autopilotRules[op.item_name] && Object.values(autopilotRules[op.item_name]).some(v => v !== "");
                      const isAutopilotOpen = autopilotOpen === op.item_name;
                      return (
                        <AutopilotRow key={op.id}
                          op={op} liveItem={liveItem} statusColor={statusColor} statusLabel={statusLabel}
                          pnlTotal={pnlTotal} pnlPct={pnlPct} fillPct={fillPct}
                          hasRules={hasRules} isAutopilotOpen={isAutopilotOpen}
                          autopilotRules={autopilotRules}
                          setAutopilotOpen={setAutopilotOpen}
                          saveAutopilotRules={saveAutopilotRules}
                          clearAutopilotRules={clearAutopilotRules}
                          formatGP={formatGP} setSelectedItem={setSelectedItem}
                          getHoldTime={getHoldTime}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="merchant-right">

              {/* Capital Efficiency Ring */}
              <div className="m-panel-section">
                <div className="m-panel-title">Capital Efficiency</div>
                <div className="gauge-wrap">
                  <div className="gauge-ring">
                    <svg width="76" height="76" viewBox="0 0 76 76">
                      <circle cx="38" cy="38" r="32" fill="none" stroke="var(--bg4)" strokeWidth="8" />
                      <circle cx="38" cy="38" r="32" fill="none" stroke="url(#gGrad)" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                        style={{ transition: "stroke-dashoffset 1s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                      <defs>
                        <linearGradient id="gGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="var(--gold-dim)" />
                          <stop offset="100%" stopColor="var(--gold)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="gauge-center">
                      <span className="gauge-pct">{efficiencyPct}%</span>
                      <span className="gauge-sub-lbl">deployed</span>
                    </div>
                  </div>
                  <div className="gauge-stats">
                    <div><div className="gauge-stat-label">GP Working</div><div className="gauge-stat-val" style={{ color: "var(--gold)" }}>{formatGP(totalDeployed)}</div></div>
                    <div><div className="gauge-stat-label">Slots Used</div><div className="gauge-stat-val">{allOpenPositions.length} / 8</div></div>
                    <div><div className="gauge-stat-label">{"Today's"} P&amp;L</div><div className="gauge-stat-val" style={{ color: realisedToday >= 0 ? "var(--green)" : "var(--red)" }}>{realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)}</div></div>
                  </div>
                </div>
              </div>

              {/* Daily GP Goal */}
              <div id="tour-daily-goal" className="m-panel-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div className="m-panel-title" style={{ marginBottom: 0 }}>🎯 Daily Goal</div>
                  <button style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                    onClick={() => { setShowGoalInput(true); setGoalInput(dailyGoal > 0 ? String(dailyGoal) : ""); }}>
                    {dailyGoal > 0 ? "Edit" : "Set Goal"}
                  </button>
                </div>
                {showGoalInput ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input className="add-pos-input" style={{ flex: 1 }} placeholder="e.g. 5000000" value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveGoal(goalInput); if (e.key === "Escape") setShowGoalInput(false); }}
                      autoFocus />
                    <button className="add-pos-confirm" onClick={() => saveGoal(goalInput)}>✓</button>
                    <button className="add-pos-cancel" onClick={() => setShowGoalInput(false)}>✕</button>
                  </div>
                ) : dailyGoal > 0 ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                        {formatGP(realisedToday)} / {formatGP(dailyGoal)}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: realisedToday >= dailyGoal ? "var(--green)" : "var(--gold)" }}>
                        {Math.min(100, Math.round((realisedToday / dailyGoal) * 100))}%
                      </span>
                    </div>
                    <div style={{ background: "var(--bg4)", borderRadius: "4px", overflow: "hidden", height: "8px" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, (realisedToday / dailyGoal) * 100)}%`,
                        background: realisedToday >= dailyGoal ? "var(--green)" : "linear-gradient(90deg, var(--gold-dim), var(--gold))",
                        transition: "width 0.6s ease", borderRadius: "4px"
                      }} />
                    </div>
                    {realisedToday >= dailyGoal && (
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--green)", fontWeight: 600, textAlign: "center" }}>
                        🎉 Goal reached!
                      </div>
                    )}
                    {realisedToday < dailyGoal && gpHr !== null && gpHr > 0 && (
                      <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-dim)" }}>
                        ~{Math.ceil((dailyGoal - realisedToday) / gpHr * 60)}min at current rate
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "8px 0" }}>
                    No goal set. Set a daily GP target to track progress.
                  </div>
                )}
              </div>

              {/* Today P&L chart */}
              <div className="m-panel-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div className="m-panel-title" style={{ marginBottom: 0 }}>{"Today's"} P&amp;L</div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: realisedToday >= 0 ? "var(--green)" : "var(--red)" }}>
                    {realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)}
                  </span>
                </div>
                {pnlHistory.length < 2 ? (
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>P&amp;L timeline builds as you close flips today.</div>
                ) : (
                  <>
                    <div className="pnl-chart-wrap">
                      <canvas ref={pnlCanvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
                    </div>
                    <div className="pnl-time-labels">
                      <span className="pnl-time-label">Start of day</span>
                      <span className="pnl-time-label" style={{ color: realisedToday >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                        {realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)} now
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Rotation Picks */}
              <div className="m-panel-section rotation-picks-section">
                <div className="m-panel-title">⚡ Rotation Picks</div>
                <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "10px" }}>
                  Best fits for your {formatGP(idleGP)} idle GP:
                </div>
                {rotationPicks.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>No picks — all capital deployed or no good candidates.</div>
                ) : rotationPicks.map((item, i) => (
                  <div key={item.id} className={`rotation-card ${["rc-green","rc-blue","rc-amber"][i]}`} onClick={() => setSelectedItem(item)}>
                    <div className="rc-name">{item.name}</div>
                    <div className="rc-reason">Score {item.score}/100 · {item.volume.toLocaleString()}/day</div>
                    <div className="rc-stats">
                      <div className="rc-stat">Margin <span style={{ color: "var(--green)" }}>{formatGP(item.margin)}</span></div>
                      <div className="rc-stat">ROI <span style={{ color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12" }}>{item.roi}%</span></div>
                      <div className="rc-stat">Limit <span style={{ color: "var(--text)" }}>{item.buyLimit > 0 ? item.buyLimit.toLocaleString() : "?"}</span></div>
                    </div>
                    <div className="rc-action">→ Click to view chart</div>
                  </div>
                ))}
              </div>

              {/* Flip Queue */}
              <div id="tour-flip-queue" className="m-panel-section" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div className="m-panel-title" style={{ marginBottom: 0 }}>📋 Flip Queue</div>
                  <button style={{ background: "transparent", border: "none", color: "var(--gold)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}
                    onClick={() => setShowQueueAdd(v => !v)}>+</button>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px" }}>Items to flip when a slot opens up.</div>
                {showQueueAdd && (
                  <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                    <input className="add-pos-input" style={{ flex: 1 }} placeholder="Item name..." value={queueInput}
                      onChange={e => setQueueInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addToQueue(queueInput); if (e.key === "Escape") setShowQueueAdd(false); }}
                      autoFocus />
                    <button className="add-pos-confirm" onClick={() => addToQueue(queueInput)}>Add</button>
                  </div>
                )}
                {flipQueue.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "8px 0" }}>
                    Queue is empty. Add items you want to flip next.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {flipQueue.map((q, i) => {
                      const liveItem = items.find(it => it.name.toLowerCase() === q.name.toLowerCase());
                      return (
                        <div key={q.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg3)", borderRadius: "6px", padding: "8px 10px", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-dim)", width: "14px" }}>#{i + 1}</span>
                          <div style={{ flex: 1, cursor: liveItem ? "pointer" : "default" }} onClick={() => liveItem && setSelectedItem(liveItem)}>
                            <div style={{ fontSize: "12px", color: liveItem ? "var(--gold)" : "var(--text)", fontWeight: 500 }}>{q.name}</div>
                            {liveItem && <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "1px" }}>
                              Margin {formatGP(liveItem.margin)} · ROI {liveItem.roi}%
                            </div>}
                          </div>
                          <button onClick={() => removeFromQueue(q.id)}
                            style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════ ANALYTICS VIEW ══════════════════════ */}
        {activeView === "analytics" && (
          <div className="merchant-layout">
            <div className="merchant-left">

              {/* Session Intel */}
              <div id="tour-session-intel" className="merchant-section">
                <div className="merchant-section-header">
                  <span className="merchant-section-title">📊 Session Intel</span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Started {getSessionTime()} ago</span>
                </div>
                <div className="analytics-grid">
                  {[
                    { label: "Session Duration", val: getSessionTime(), color: "var(--text)" },
                    { label: "GP / Hour", val: gpHr !== null ? `${gpHr >= 0 ? "+" : ""}${formatGP(gpHr)}` : "—", color: gpHr !== null ? (gpHr >= 0 ? "var(--green)" : "var(--red)") : "var(--text-dim)" },
                    { label: "Flips Closed Today", val: todayFlips.length + autoTodayFlips.length, color: "var(--text)" },
                    { label: "Realised Today", val: `${realisedToday >= 0 ? "+" : ""}${formatGP(realisedToday)}`, color: realisedToday >= 0 ? "var(--green)" : "var(--red)" },
                    { label: "Unrealised P&L", val: `${unrealisedTotal >= 0 ? "+" : ""}${formatGP(unrealisedTotal)}`, color: unrealisedTotal >= 0 ? "var(--green)" : "var(--red)" },
                    { label: "Return on Capital", val: merchantCapital > 0 ? `${((realisedToday / merchantCapital) * 100).toFixed(2)}%` : "—", color: realisedToday >= 0 ? "var(--green)" : "var(--red)" },
                    { label: "Capital Deployed", val: `${efficiencyPct}%`, color: "var(--blue)" },
                    { label: "Idle GP", val: formatGP(idleGP), color: idleGP > merchantCapital * 0.3 ? "#f39c12" : "var(--text-dim)" },
                  ].map(row => (
                    <div key={row.label} className="analytics-card">
                      <div className="analytics-label">{row.label}</div>
                      <div className="analytics-val" style={{ color: row.color }}>{row.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Exposure */}
              <div id="tour-risk-exposure" className="merchant-section">
                <div className="merchant-section-header">
                  <span className="merchant-section-title">⚖️ Risk Exposure</span>
                  {topRiskPct > 50 && <span style={{ fontSize: "11px", color: "var(--red)", fontWeight: 600 }}>Concentrated position</span>}
                </div>
                {riskItems.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "12px 16px" }}>No open positions to analyse.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 16px" }}>
                    {riskItems.map(pos => (
                      <div key={pos.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: pos.pct > 40 ? "#f39c12" : "var(--text)" }}>{pos.name}</span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: pos.pct > 50 ? "var(--red)" : pos.pct > 30 ? "#f39c12" : "var(--green)" }}>{pos.pct}%</span>
                        </div>
                        <div style={{ background: "var(--bg4)", borderRadius: "3px", overflow: "hidden", height: "6px" }}>
                          <div style={{
                            height: "100%",
                            width: `${pos.pct}%`,
                            background: pos.pct > 50 ? "var(--red)" : pos.pct > 30 ? "#f39c12" : "var(--green)",
                            transition: "width 0.6s ease", borderRadius: "3px"
                          }} />
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                          {formatGP(pos.gpIn)} invested · {pos.qty.toLocaleString()} qty
                        </div>
                      </div>
                    ))}
                    {topRiskPct > 40 && (
                      <div style={{ marginTop: "4px", fontSize: "11px", color: "#f39c12", background: "rgba(243,156,18,0.08)", border: "1px solid rgba(243,156,18,0.2)", borderRadius: "6px", padding: "8px 10px" }}>
                        ⚠️ {riskItems[0].name} represents {topRiskPct}% of your capital. Consider diversifying.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Today Closed Flips */}
              <div id="tour-closed-today" className="merchant-section" style={{ flex: 1 }}>
                {(() => {
                  // Merge manual + auto flips into one normalised list, sorted by date desc
                  const allTodayFlips = [
                    ...todayFlips.map(f => ({ id: f.id, item: f.item, qty: f.qty, buyPrice: f.buyPrice, sellPrice: f.sellPrice, profit: f.totalProfit || 0, roi: f.roi, date: f.date })),
                    ...autoTodayFlips.map(f => ({ id: f.id, item: f.item_name, qty: f.quantity, buyPrice: f.buy_price, sellPrice: f.sell_price, profit: f.profit || 0, roi: f.roi, date: f.sell_completed_at })),
                  ].sort((a, b) => new Date(b.date) - new Date(a.date));
                  return (<>
                    <div className="merchant-section-header">
                      <span className="merchant-section-title">✅ Closed Today</span>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{allTodayFlips.length} flips</span>
                    </div>
                    {allTodayFlips.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "12px 16px" }}>No flips closed today yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px 12px" }}>
                        {allTodayFlips.slice(0, 10).map(f => (
                          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--bg3)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                            <div>
                              <div style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>{f.item}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "1px" }}>
                                {f.qty?.toLocaleString()}x · Buy {formatGP(f.buyPrice)} → Sell {formatGP(f.sellPrice)}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: f.profit >= 0 ? "var(--green)" : "var(--red)" }}>
                                {f.profit >= 0 ? "+" : ""}{formatGP(f.profit)}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{Number(f.roi || 0).toFixed(1)}% ROI</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>);
                })()}
              </div>
            </div>

            <div className="merchant-right">
              {/* P&L Chart */}
              <div className="m-panel-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div className="m-panel-title" style={{ marginBottom: 0 }}>{"Today's"} P&amp;L</div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: realisedToday >= 0 ? "var(--green)" : "var(--red)" }}>
                    {realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)}
                  </span>
                </div>
                {pnlHistory.length < 2 ? (
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>P&amp;L timeline builds as you close flips today.</div>
                ) : (
                  <>
                    <div className="pnl-chart-wrap">
                      <canvas ref={pnlCanvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
                    </div>
                    <div className="pnl-time-labels">
                      <span className="pnl-time-label">Start of day</span>
                      <span className="pnl-time-label" style={{ color: realisedToday >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                        {realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Daily Goal */}
              <div className="m-panel-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div className="m-panel-title" style={{ marginBottom: 0 }}>🎯 Daily Goal</div>
                  <button style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                    onClick={() => { setShowGoalInput(true); setGoalInput(dailyGoal > 0 ? String(dailyGoal) : ""); }}>
                    {dailyGoal > 0 ? "Edit" : "Set Goal"}
                  </button>
                </div>
                {showGoalInput ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input className="add-pos-input" style={{ flex: 1 }} placeholder="e.g. 5000000" value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveGoal(goalInput); if (e.key === "Escape") setShowGoalInput(false); }}
                      autoFocus />
                    <button className="add-pos-confirm" onClick={() => saveGoal(goalInput)}>✓</button>
                    <button className="add-pos-cancel" onClick={() => setShowGoalInput(false)}>✕</button>
                  </div>
                ) : dailyGoal > 0 ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{formatGP(realisedToday)} / {formatGP(dailyGoal)}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: realisedToday >= dailyGoal ? "var(--green)" : "var(--gold)" }}>
                        {Math.min(100, Math.round((realisedToday / dailyGoal) * 100))}%
                      </span>
                    </div>
                    <div style={{ background: "var(--bg4)", borderRadius: "4px", overflow: "hidden", height: "8px" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (realisedToday / dailyGoal) * 100)}%`, background: realisedToday >= dailyGoal ? "var(--green)" : "linear-gradient(90deg, var(--gold-dim), var(--gold))", transition: "width 0.6s ease", borderRadius: "4px" }} />
                    </div>
                    {realisedToday >= dailyGoal && <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--green)", fontWeight: 600, textAlign: "center" }}>🎉 Goal reached!</div>}
                  </>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "8px 0" }}>No goal set.</div>
                )}
              </div>

              {/* Update Capital */}
              <div className="m-panel-section">
                <button className="op-action-btn" style={{ width: "100%", textAlign: "center", padding: "9px" }} onClick={onUpdateCapital}>
                  💰 Update Total Capital
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════ ALERTS VIEW ══════════════════════ */}
        {activeView === "alerts" && (
          <div className="merchant-layout">
            <div className="merchant-left">

              {/* Alert toggles */}
              <div id="tour-smart-alerts" className="merchant-section">
                <div className="merchant-section-header">
                  <span className="merchant-section-title">⚡ Smart Alerts</span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Auto-fires on market shifts</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {[
                    { key: "marginSpike",  icon: "📈", label: "Margin Spike",  desc: "Margin jumps above threshold",    unit: "%",  min: 5,   max: 200, step: 5   },
                    { key: "volumeSurge",  icon: "🔥", label: "Volume Surge",  desc: "Volume multiplies suddenly",      unit: "x",  min: 1.5, max: 10,  step: 0.5 },
                    { key: "dumpDetected", icon: "⚠️", label: "Dump Detected", desc: "Sell price drops sharply",        unit: "%",  min: 2,   max: 50,  step: 1   },
                    { key: "priceCrash",   icon: "💥", label: "Price Crash",   desc: "Both buy & sell price collapse",  unit: "%",  min: 2,   max: 50,  step: 1   },
                  ].map(({ key, icon, label, desc, unit, min, max, step }) => (
                    <div key={key} className="m-smart-alert-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: "5px" }}>{icon} {label}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{desc}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <ThresholdPopover alertKey={key} label={label} unit={unit} min={min} max={max} step={step} thresholds={thresholds} openPopover={openPopover} setOpenPopover={setOpenPopover} saveThreshold={saveThreshold} />
                        <label className="toggle-switch">
                          <input type="checkbox" checked={smartAlertSettings?.[key] ?? true} onChange={e => saveSmartAlertSettings?.(key, e.target.checked)} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Feed */}
              <div id="tour-live-feed" className="merchant-section" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="merchant-section-title" style={{ marginBottom: 0 }}>📡 Live Feed</span>
                    {smartEvents?.length > 0 && (
                      <span style={{ background: "rgba(201,168,76,0.2)", border: "1px solid var(--gold-dim)", borderRadius: "10px", padding: "1px 7px", fontSize: "10px", color: "var(--gold)", fontWeight: 700 }}>
                        {smartEvents.length}
                      </span>
                    )}
                  </div>
                  {smartEvents?.length > 0 && (
                    <button style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-dim)", fontSize: "11px", cursor: "pointer", padding: "3px 8px", fontFamily: "Inter, sans-serif" }}
                      onClick={() => setSmartEvents?.([])}>Clear</button>
                  )}
                </div>
                {smartEvents?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {[["all","All"],["spike","📈 Margin"],["surge","🔥 Volume"],["dump","⚠️ Dump"],["crash","💥 Crash"],["autopilot","🤖 Autopilot"]].map(([v,l]) => (
                        <button key={v} onClick={() => setMerchantFeedFilter(v)}
                          style={{ padding: "3px 10px", borderRadius: "12px", border: "1px solid var(--border)", background: merchantFeedFilter === v ? "rgba(201,168,76,0.15)" : "transparent", color: merchantFeedFilter === v ? "var(--gold)" : "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Sort:</span>
                      {[["recent","Recent"],["change","% Change"],["margin","Margin"]].map(([v,l]) => (
                        <button key={v} onClick={() => { if (merchantFeedSort === v) { setMerchantFeedSortDir(d => d === "desc" ? "asc" : "desc"); } else { setMerchantFeedSort(v); setMerchantFeedSortDir("desc"); } }}
                          style={{ padding: "3px 10px", borderRadius: "12px", border: "1px solid var(--border)", background: merchantFeedSort === v ? "rgba(201,168,76,0.15)" : "transparent", color: merchantFeedSort === v ? "var(--gold)" : "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "3px" }}>
                          {l}{merchantFeedSort === v && <span style={{ fontSize: "9px" }}>{merchantFeedSortDir === "desc" ? "▼" : "▲"}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="smart-events-list" style={{ borderRadius: "8px" }}>
                  {(() => {
                    const mDir = merchantFeedSortDir === "asc" ? 1 : -1;
                    let feed = (smartEvents || []).filter(e => !merchantFeedFilter || merchantFeedFilter === "all" || e.badge === merchantFeedFilter);
                    if (merchantFeedSort === "change") {
                      feed = [...feed].sort((a, b) => {
                        const pA = a.oldVal ? Math.abs((a.newVal - a.oldVal) / Math.abs(a.oldVal)) : 0;
                        const pB = b.oldVal ? Math.abs((b.newVal - b.oldVal) / Math.abs(b.oldVal)) : 0;
                        return mDir * (pA - pB);
                      });
                    } else if (merchantFeedSort === "margin") {
                      feed = [...feed].sort((a, b) => {
                        const mA = allItems.find(i => i.id === a.itemId)?.margin || 0;
                        const mB = allItems.find(i => i.id === b.itemId)?.margin || 0;
                        return mDir * (mA - mB);
                      });
                    } else {
                      feed = [...feed].sort((a, b) => mDir * (new Date(a.time) - new Date(b.time)));
                    }
                    if (feed.length === 0) return (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                        <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.4 }}>📡</div>
                        No alerts yet. Monitoring every 30 seconds.
                      </div>
                    );
                    return feed.map(e => {
                      const liveItem = allItems.find(i => i.id === e.itemId) || allItems.find(i => i.name === e.itemName);
                      return (
                        <div key={e.id} className="smart-event-row" style={{ cursor: liveItem ? "pointer" : "default" }}
                          onClick={() => liveItem && setSelectedItem(liveItem)}>
                          <span className="smart-event-icon">{e.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span className="smart-event-name" style={{ color: liveItem ? "var(--gold)" : "var(--text)", cursor: liveItem ? "pointer" : "default" }}>{e.itemName}</span>
                              <span className={`smart-badge-${e.badge}`}>{e.badge.toUpperCase()}</span>
                              {liveItem && <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>· click to view →</span>}
                            </div>
                            <div className="smart-event-msg">{e.message}</div>
                            {liveItem && (
                              <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "11px" }}>
                                <span style={{ color: "var(--text-dim)" }}>Margin: <span style={{ color: liveItem.margin > 0 ? "var(--green)" : "var(--red)" }}>{formatGP(liveItem.margin)}</span></span>
                                <span style={{ color: "var(--text-dim)" }}>ROI: <span style={{ color: liveItem.roi > 4 ? "var(--gold)" : liveItem.roi >= 1 ? "var(--green)" : "#f39c12" }}>{liveItem.roi}%</span></span>
                              </div>
                            )}
                          </div>
                          <span className="smart-event-time">{formatTime(e.time)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="merchant-right">
              <div className="m-panel-section">
                <div className="m-panel-title">📊 Alert Summary</div>
                {smartEvents?.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>No events fired this session.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { badge: "spike", icon: "📈", label: "Margin Spikes" },
                      { badge: "surge", icon: "🔥", label: "Volume Surges" },
                      { badge: "dump",  icon: "⚠️", label: "Dumps Detected" },
                      { badge: "crash", icon: "💥", label: "Price Crashes" },
                    ].map(({ badge, icon, label }) => {
                      const count = (smartEvents || []).filter(e => e.badge === badge).length;
                      return (
                        <div key={badge} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--bg3)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: "12px", color: "var(--text)" }}>{icon} {label}</span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: count > 0 ? "var(--gold)" : "var(--text-dim)" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "market" && (
          <div className="merchant-layout">
            <div className="merchant-left" style={{ paddingTop: "20px" }}>

            {/* Filter bar */}
            <div className="filter-bar" style={{ marginBottom: "12px" }}>
              <span className="filter-label">Filter:</span>
              {["all", "f2p", "members", "highvol", "favourites"].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f === "all" ? "All Items" : f === "f2p" ? "F2P" : f === "members" ? "Members" : f === "highvol" ? "High Volume" : `🔖 Watchlist${favourites.length > 0 ? ` (${favourites.length})` : ""}`}
                </button>
              ))}
              <input className="filter-input" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: "auto" }} />
              <button
                className={`adv-filters-btn${showAdvFilters || advFilterCount > 0 ? " active" : ""}`}
                onClick={() => setShowAdvFilters(v => !v)}
              >
                ⚙ Filters {advFilterCount > 0 && <span className="adv-filter-badge">{advFilterCount}</span>}
              </button>
            </div>

            {/* Advanced filter panel */}
            {showAdvFilters && (
              <div className="adv-filter-panel" style={{ marginBottom: "12px" }}>
                <div className="adv-filter-group">
                  <div className="adv-filter-label">Margin (gp)</div>
                  <div className="adv-filter-row">
                    <input className="adv-filter-input" placeholder="Min" value={advFilters.minMargin} onChange={e => setAdv("minMargin", e.target.value)} type="number" />
                    <span className="adv-filter-sep">–</span>
                    <input className="adv-filter-input" placeholder="Max" value={advFilters.maxMargin} onChange={e => setAdv("maxMargin", e.target.value)} type="number" />
                  </div>
                </div>
                <div className="adv-filter-group">
                  <div className="adv-filter-label">ROI (%)</div>
                  <div className="adv-filter-row">
                    <input className="adv-filter-input" placeholder="Min" value={advFilters.minRoi} onChange={e => setAdv("minRoi", e.target.value)} type="number" step="0.1" />
                    <span className="adv-filter-sep">–</span>
                    <input className="adv-filter-input" placeholder="Max" value={advFilters.maxRoi} onChange={e => setAdv("maxRoi", e.target.value)} type="number" step="0.1" />
                  </div>
                </div>
                <div className="adv-filter-group">
                  <div className="adv-filter-label">Vol/Day</div>
                  <div className="adv-filter-row">
                    <input className="adv-filter-input" placeholder="Min" value={advFilters.minVolume} onChange={e => setAdv("minVolume", e.target.value)} type="number" />
                    <span className="adv-filter-sep">–</span>
                    <input className="adv-filter-input" placeholder="Max" value={advFilters.maxVolume} onChange={e => setAdv("maxVolume", e.target.value)} type="number" />
                  </div>
                </div>
                <div className="adv-filter-group">
                  <div className="adv-filter-label">Buy Price (gp)</div>
                  <div className="adv-filter-row">
                    <input className="adv-filter-input" placeholder="Min" value={advFilters.minPrice} onChange={e => setAdv("minPrice", e.target.value)} type="number" />
                    <span className="adv-filter-sep">–</span>
                    <input className="adv-filter-input" placeholder="Max" value={advFilters.maxPrice} onChange={e => setAdv("maxPrice", e.target.value)} type="number" />
                  </div>
                </div>
                <div className="adv-filter-group">
                  <div className="adv-filter-label">Min GP/Fill</div>
                  <input className="adv-filter-input" placeholder="e.g. 500000" value={advFilters.minGpFill} onChange={e => setAdv("minGpFill", e.target.value)} type="number" />
                </div>
                <div className="adv-filter-group">
                  <div className="adv-filter-label">Last Traded Within</div>
                  <div className="adv-filter-row" style={{ flexWrap: "wrap", gap: "6px" }}>
                    {[["1", "1hr"], ["6", "6hr"], ["24", "24hr"], ["168", "7d"]].map(([val, label]) => (
                      <button key={val}
                        className={`filter-btn${advFilters.maxLastTrade === val ? " active" : ""}`}
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                        onClick={() => setAdv("maxLastTrade", advFilters.maxLastTrade === val ? "" : val)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="adv-filter-group" style={{ justifyContent: "center", gap: "8px" }}>
                  <label className={`adv-filter-toggle${advFilters.positiveOnly ? " active" : ""}`}>
                    <input type="checkbox" checked={advFilters.positiveOnly} onChange={e => setAdv("positiveOnly", e.target.checked)} />
                    Positive margin only
                  </label>
                  <label className={`adv-filter-toggle${advFilters.priceDataOnly ? " active" : ""}`}>
                    <input type="checkbox" checked={advFilters.priceDataOnly} onChange={e => setAdv("priceDataOnly", e.target.checked)} />
                    Has live price data
                  </label>
                </div>
                <div className="adv-filter-footer">
                  <span>{filtered.length.toLocaleString()} items match</span>
                  {advFilterCount > 0 && <button className="adv-filters-btn" onClick={resetAdvFilters}>✕ Clear all filters</button>}
                </div>
              </div>
            )}

            {/* Table */}
            <div className="section-title">All Items <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "Inter, sans-serif", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{loading ? "loading…" : `${filtered.length.toLocaleString()} items`}</span></div>
            <div className="flips-table">
              <div className="table-header" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px" }}>
                {[
                  ["name", "Item", null],
                  ["low", "Buy Price", "Lowest current buy offer on the GE"],
                  ["high", "Sell Price", "Highest current sell offer on the GE"],
                  ["margin", "Margin", "Sell price minus buy price minus GE tax."],
                  ["roi", "ROI", "Margin ÷ buy price."],
                  ["volume", "Vol/Day", "Total items traded per day."],
                  ["buylimit", "Limit", "Max items you can buy every 4 hours"],
                  ["gpPerFill", "GP/Fill", "Realistic GP profit per 4hr window"],
                  ["lastTradeTime", "Last Trade", "When this item last traded."],
                  ["sparkline", "24hr Trend", null],
                ].map(([col, label, tip]) => (
                  <button key={col} className={`sort-btn ${sortCol === col ? "active" : ""}`} onClick={() => handleSort(col)}>
                    {label} {sortCol === col && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                    {tip && (
                      <span className="stat-tooltip-wrap" onClick={e => e.stopPropagation()}>
                        <span className="stat-help">?</span>
                        <span className="stat-tooltip">{tip}</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flip-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px" }}>
                    {Array.from({ length: 10 }).map((_, j) => <div key={j} className="skeleton" style={{ width: j === 0 ? "80%" : "60%", animationDelay: `${i * 0.1}s` }} />)}
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="empty-state"><div className="icon">🔍</div><p>No items match your filters</p></div>
              ) : (
                filtered.slice(0, marketRowsShown).map(item => {
                  const ageSec = item.lastTradeTime ? Math.floor(Date.now() / 1000 - item.lastTradeTime) : null;
                  const tradeColor = !ageSec ? "var(--text-dim)" : ageSec < 300 ? "var(--green)" : ageSec < 3600 ? "var(--text)" : "var(--text-dim)";
                  const lim = item.buyLimit > 0 ? item.buyLimit : 500;
                  const mkt4hr = item.volume / 6;
                  let expFill;
                  if      (item.volume >= 500_000) expFill = Math.min(lim, mkt4hr);
                  else if (item.volume >= 100_000) expFill = Math.min(lim, mkt4hr * 0.6);
                  else if (item.volume >= 20_000)  expFill = Math.min(lim, mkt4hr * 0.2);
                  else if (item.volume >= 5_000)   expFill = Math.min(lim, mkt4hr * 0.08);
                  else                             expFill = Math.min(lim, mkt4hr * 0.03);
                  const gpPerFill = Math.round(item.margin * Math.max(expFill, 1));
                  const gpPerFillMax = Math.round(item.margin * Math.min(lim, mkt4hr));
                  return (
                    <div key={item.id} className="flip-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px" }} onClick={() => setSelectedItem(item)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button onClick={e => { e.stopPropagation(); toggleFavourite(item.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", opacity: favourites.includes(item.id) ? 1 : 0.25, transition: "opacity 0.15s", padding: "0", flexShrink: 0 }} title={favourites.includes(item.id) ? "Remove from Watchlist" : "Add to Watchlist"}>🔖</button>
                        <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                        <div className="item-name">{item.name}</div>
                      </div>
                      <span className="price">{item.hasPrice ? formatGP(item.low) : "—"}</span>
                      <span className="price">{item.hasPrice ? formatGP(item.high) : "—"}</span>
                      <span className={`margin ${item.margin < 0 ? "neg" : ""}`}>{item.hasPrice ? formatGP(item.margin) : "—"}</span>
                      <span className="roi" style={{ color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12" }}>{item.hasPrice ? `${item.roi}%` : "—"}</span>
                      <span className="price" style={{ color: item.volume >= 500 ? "var(--green)" : item.volume >= 100 ? "var(--text)" : "var(--text-dim)" }}>
                        {item.volume >= 1000 ? (item.volume/1000).toFixed(1)+"k" : item.volume.toLocaleString()}
                        {item.buyLimit > 0 && item.volume < item.buyLimit && <span style={{ color: "var(--red)", fontSize: "10px", marginLeft: "3px" }}>⚠</span>}
                      </span>
                      <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit ? item.buyLimit.toLocaleString() : "?"}</span>
                      <div>
                        {item.hasPrice ? (
                          <span style={{ fontSize: "12px", fontWeight: 600, color: gpPerFill >= 1000000 ? "var(--green)" : gpPerFill >= 200000 ? "var(--gold)" : "var(--text-dim)" }}
                            title={`Realistic: ${formatGP(gpPerFill)} GP/fill\nBest case: ${formatGP(gpPerFillMax)} GP`}>
                            {formatGP(gpPerFill)}
                          </span>
                        ) : <span style={{ color: "var(--text-dim)" }}>—</span>}
                      </div>
                      <span style={{ fontSize: "11px", color: tradeColor }}>{item.lastTradeTime ? timeAgo(item.lastTradeTime) : "—"}</span>
                      <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center" }}>
                        <Sparkline itemId={item.id} width={78} height={30} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {!loading && filtered.length > marketRowsShown && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <button
                  onClick={() => setMarketRowsShown(n => n + 200)}
                  style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: "8px", padding: "8px 24px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
                >
                  Load more ({filtered.length - marketRowsShown} remaining)
                </button>
              </div>
            )}
            </div>{/* end merchant-left */}
            <div className="merchant-right" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>Active Positions</div>
              {(() => { const open = (manualPositions || []).filter(p => p.status !== "closed"); return open.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "24px 0" }}>No open positions</div>
              ) : open.map(p => (
                <div key={p.id} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{p.item_name}</span>
                    <span style={{ fontSize: "12px", color: p.pnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{p.pnl >= 0 ? "+" : ""}{formatGP(p.pnl || 0)}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Slot {(p.slot||0)+1} · {p.status} · {p.qty} qty</div>
                </div>
              )); })()
              }
            </div>{/* end merchant-right */}
          </div>
        )}

      </div>
    </div>

    {/* Close Position Modal */}
    {closingPos && (() => {
      const flip = closingPos.type === "tracker"
        ? flipsLog.find(f => f.id === closingPos.pos.id)
        : { id: closingPos.pos.id, item: closingPos.pos.name, buyPrice: closingPos.pos.buyPrice, qty: closingPos.pos.qty };
      if (!flip) return null;
      return (
        <CloseFlipModal
          flip={flip}
          items={items}
          onSold={(f, sellPrice) => { if (closingPos.type === "tracker") onCloseFlip(f, sellPrice); else onClosePortfolioPos(closingPos.pos, sellPrice); setClosingPos(null); }}
          onCancelled={(f) => { if (closingPos.type === "tracker") onCloseFlip(f, null, true); else onClosePortfolioPos(closingPos.pos, null, true); setClosingPos(null); }}
          onDismiss={() => setClosingPos(null)}
          loading={false}
        />
      );
    })()}
    </>
  );
}


// ── ThresholdPopover — top-level component (must not be defined inside RuneTrader to avoid remount crashes)
const THRESHOLD_DEFAULTS = { marginSpike: 50, volumeSurge: 3, dumpDetected: 10, priceCrash: 15 };

function ThresholdPopover({ alertKey, label, unit, min, max, step, thresholds, openPopover, setOpenPopover, saveThreshold }) {
  const val = thresholds[alertKey];
  const isDefault = val === THRESHOLD_DEFAULTS[alertKey];
  return (
    <div className="threshold-popover-wrap">
      <button className={`threshold-gear-btn${openPopover === alertKey ? " active" : ""}`}
        onClick={e => { e.stopPropagation(); setOpenPopover(openPopover === alertKey ? null : alertKey); }}
        title="Adjust threshold">⚙️</button>
      {openPopover === alertKey && (
        <div className="threshold-popover" onClick={e => e.stopPropagation()}>
          <div className="threshold-popover-title">Threshold — {label}</div>
          <div className="threshold-popover-label">
            Trigger when: {alertKey === "volumeSurge" ? `volume is ${val}x previous` : `change is ≥ ${val}${unit}`}
          </div>
          <div className="threshold-row">
            <input type="range" className="threshold-slider" min={min} max={max} step={step} value={val}
              onChange={e => saveThreshold(alertKey, e.target.value)} />
            <input type="number" className="threshold-number" min={min} max={max} step={step} value={val}
              onChange={e => saveThreshold(alertKey, e.target.value)} />
            <span className="threshold-unit">{unit}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="threshold-default">Default: {THRESHOLD_DEFAULTS[alertKey]}{unit}</span>
            {!isDefault && <button className="threshold-reset" onClick={() => saveThreshold(alertKey, THRESHOLD_DEFAULTS[alertKey])}>Reset</button>}
          </div>
        </div>
      )}
    </div>
  );
}


// ── LIVE GE SLOTS COMPONENT ──────────────────────────────────

// ── AUTO FLIP HISTORY COMPONENT ─────────────────────────────────────────────
function AutoFlipHistory({ user, supabase: sb, formatGP }) {
  const [flips, setFlips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (!user) return;
    sb.from("ge_flips_live")
      .select("*")
      .eq("user_id", user.id)
      .order("buy_started_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { setFlips(data || []); setLoading(false); });

    const ch = sb.channel("auto-flip-history-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "ge_flips_live", filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === "DELETE") {
          // Re-fetch on DELETE — don't rely on payload.old which requires REPLICA IDENTITY FULL
          sb.from("ge_flips_live").select("*").eq("user_id", user.id)
            .order("buy_started_at", { ascending: false }).limit(50)
            .then(({ data }) => setFlips(data || []));
        } else {
          setFlips(prev => {
            // Try matching by id first, fall back to slot for reliability
            const idx = prev.findIndex(f => f.id === payload.new.id || f.slot === payload.new.slot);
            if (idx >= 0) { const next = [...prev]; next[idx] = payload.new; return next; }
            return [payload.new, ...prev].slice(0, 50);
          });
        }
      }).subscribe();
    return () => sb.removeChannel(ch);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const statusBadge = s => {
    const map = { BUYING: ["#f39c12", "Buying"], BOUGHT: ["var(--green)", "Holding"], SELLING: ["#4fc3f7", "Selling"], SOLD: ["var(--green)", "Closed"], CANCELLED: ["var(--text-dim)", "Cancelled"] };
    const [color, label] = map[s] || ["var(--text-dim)", s];
    return <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "10px", border: `1px solid ${color}`, color }}>{label}</span>;
  };

  if (!user) return null;
  const openFlips = flips.filter(f => !["SOLD", "CANCELLED"].includes(f.status));
  const closedFlips = flips.filter(f => ["SOLD", "CANCELLED"].includes(f.status));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Open flips */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
          📈 Open Flips <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "Inter", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{openFlips.length} active</span>
        </div>
        {loading ? <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>Loading...</div>
        : openFlips.length === 0 ? (
          <div style={{ color: "var(--text-dim)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "24px", opacity: 0.4, marginBottom: "8px" }}>📋</div>
            <div>No open flips — start a buy offer in-game</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 80px 80px 80px 100px", gap: "10px", padding: "0 4px 8px", fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span>Item</span><span>Status</span><span>Buy</span><span>Sell</span><span>Qty</span><span>Started</span>
            </div>
            {openFlips.map(f => (
              <div key={f.id} style={{ display: "grid", gridTemplateColumns: "2fr 90px 80px 80px 80px 100px", gap: "10px", padding: "10px 4px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{f.item_name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Slot {f.slot + 1}</div>
                </div>
                {statusBadge(f.status)}
                <span style={{ fontSize: "12px" }}>{f.buy_price ? formatGP(f.buy_price) : "—"}</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{f.sell_price ? formatGP(f.sell_price) : "—"}</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{(f.quantity || 0).toLocaleString()}</span>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{fmtDate(f.buy_started_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed flips */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
          📜 Flip History
        </div>
        {loading ? <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>Loading...</div>
        : closedFlips.length === 0 ? (
          <div style={{ color: "var(--text-dim)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "24px", opacity: 0.4, marginBottom: "8px" }}>📊</div>
            <div>No completed flips yet</div>
            <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.6 }}>Complete a buy + sell in-game to see your P&L here</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 80px 60px 60px 90px 90px", gap: "10px", padding: "0 4px 8px", fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span>Item</span><span>Buy</span><span>Sell</span><span>Qty</span><span>Tax</span><span>Profit</span><span>Closed</span>
            </div>
            {closedFlips.map(f => (
              <div key={f.id} style={{ display: "grid", gridTemplateColumns: "2fr 80px 80px 60px 60px 90px 90px", gap: "10px", padding: "10px 4px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{f.item_name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Slot {f.slot + 1}</div>
                </div>
                <span style={{ fontSize: "12px" }}>{f.buy_price ? formatGP(f.buy_price) : "—"}</span>
                <span style={{ fontSize: "12px" }}>{f.sell_price ? formatGP(f.sell_price) : "—"}</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{(f.quantity || 0).toLocaleString()}</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{f.tax ? formatGP(f.tax) : "—"}</span>
                <div>
                  {f.status === "SOLD" ? (
                    <>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: (f.profit || 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                        {(f.profit || 0) >= 0 ? "+" : ""}{formatGP(f.profit || 0)}
                      </div>
                      {f.roi != null && <div style={{ fontSize: "11px", color: f.roi >= 0 ? "var(--green)" : "var(--red)" }}>{f.roi >= 0 ? "+" : ""}{Number(f.roi).toFixed(1)}% ROI</div>}
                    </>
                  ) : <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Cancelled</span>}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{fmtDate(f.sell_completed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DRIFT DETECTION CONSTANTS ───────────────────────────────────────────────
// How aggressively we flag drift based on item price tier.
// Cheap items: even 2% off matters (200gp on a 10k item = real money).
// Expensive items: 1% tolerance is too tight — market noise is bigger.
const getDriftThresholds = (price) => {
  if (price >= 1_000_000) return { cancel: 0.04, adjust: 0.02 }; // 4% / 2%
  if (price >= 100_000)   return { cancel: 0.05, adjust: 0.025 }; // 5% / 2.5%
  return                         { cancel: 0.06, adjust: 0.03 };  // 6% / 3%
};

// Time-weighted urgency: drift matters more the longer it's been sitting unfilled.
// A 3% drift after 2 minutes = noise. Same drift after 30 minutes = problem.
const getUrgency = (driftPct, ageMinutes, pctFilled) => {
  if (pctFilled >= 95) return "filled";   // basically done, no alert needed
  if (pctFilled >= 50) return "partial";  // half filled — softer alert
  const timeFactor = Math.log10(Math.max(ageMinutes, 1) + 1);
  return driftPct * timeFactor;
};

// What price should they relist at?
// For buys: 1gp above current instabuy (to be at top of queue)
// For sells: 1gp below current instasell
const getRelistPrice = (offerType, wikiData) => {
  if (!wikiData) return null;
  if (offerType === "BUY")  return (wikiData.high || 0) + 1;
  if (offerType === "SELL") return (wikiData.low  || 0) - 1;
  return null;
};

// ─── UPGRADED LiveGESlots COMPONENT ──────────────────────────────────────────
function LiveGESlots({ user, supabase: sb, items, onLiveWiki }) {
  const [offers, setOffers]         = useState([]);
  const [autoFlips, setAutoFlips]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [liveWiki, setLiveWiki]     = useState({});   // item_id → {high, low, timestamp}
  const [wikiLoading, setWikiLoading] = useState(false);
  const pollRef                     = useRef(null);

  // ── Build name → id lookup from items prop (comes from Wiki mapping) ───────
  const nameToId = useMemo(() => {
    const map = {};
    (items || []).forEach(i => { if (i.name && i.id) map[i.name.toLowerCase()] = i.id; });
    return map;
  }, [items]);

  // ── Initial data load + realtime subscriptions ────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      sb.from("ge_offers").select("*").eq("user_id", user.id).order("slot"),
      sb.from("ge_flips_live").select("*").eq("user_id", user.id).eq("status", "SOLD")
        .order("sell_completed_at", { ascending: false }).limit(20),
    ]).then(([{ data: offersData }, { data: flipsData }]) => {
      setOffers(offersData || []);
      setAutoFlips(flipsData || []);
      setLoading(false);
    });

    const offersChannel = sb.channel("live-ge-offers-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "ge_offers",
        filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === "DELETE") {
          sb.from("ge_offers").select("*").eq("user_id", user.id).order("slot")
            .then(({ data }) => setOffers(data || []));
        } else {
          setOffers(prev => {
            const idx = prev.findIndex(o => o.slot === payload.new.slot);
            if (idx >= 0) { const next = [...prev]; next[idx] = payload.new; return next; }
            return [...prev, payload.new].sort((a, b) => a.slot - b.slot);
          });
        }
      }).subscribe();

    const flipsChannel = sb.channel("live-ge-flips-" + user.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ge_flips_live",
        filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.new?.status !== "SOLD") return;
        setAutoFlips(prev => [payload.new, ...prev].slice(0, 20));
      }).subscribe();

    return () => {
      sb.removeChannel(offersChannel);
      sb.removeChannel(flipsChannel);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live Wiki price polling for active slots ──────────────────────────────
  // Runs every 30s when there are active offers. Bypasses cache — always fresh.
  const fetchLiveWiki = useCallback(async (activeOffers) => {
    if (activeOffers.length === 0) return;

    // Resolve item names → IDs using the mapping
    const ids = activeOffers
      .map(o => nameToId[o.item_name?.toLowerCase()])
      .filter(Boolean);

    if (ids.length === 0) return;

    setWikiLoading(true);
    try {
      const res = await fetch(`/api/prices-live?ids=${ids.join(",")}`);
      if (!res.ok) return;
      const json = await res.json();
      const fresh = json.data || {};
      setLiveWiki(prev => Object.keys(fresh).length > 0 ? { ...prev, ...fresh } : prev);
      if (onLiveWiki) onLiveWiki(fresh);
    } catch (e) {
      console.warn("[drift] prices-live fetch failed:", e.message);
    } finally {
      setWikiLoading(false);
    }
  }, [nameToId, onLiveWiki]);

  // Set up polling whenever offers change
  useEffect(() => {
    const activeOffers = offers.filter(o =>
      ["BUYING", "SELLING"].includes(o.status)
    );
    // Fetch immediately
    fetchLiveWiki(activeOffers);
    // Then poll every 30s
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeOffers.length > 0) {
      pollRef.current = setInterval(() => fetchLiveWiki(activeOffers), 30_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [offers, fetchLiveWiki]);

  // ── Drift calculation for a single offer ─────────────────────────────────
  const getDriftAlert = useCallback((offer) => {
    if (!["BUYING", "SELLING"].includes(offer.status)) return null;
    if (!offer.offer_price || offer.offer_price <= 0)  return null;

    const itemId   = nameToId[offer.item_name?.toLowerCase()];
    const wikiData = itemId ? liveWiki[itemId] : null;
    if (!wikiData) return null;

    const offerPrice  = offer.offer_price;
    const marketPrice = offer.offer_type === "BUY" ? wikiData.high : wikiData.low;
    if (!marketPrice || marketPrice <= 0) return null;

    // Drift: how far off is their price from current market?
    // Positive drift on BUY = market moved up, their bid is now too low
    // Positive drift on SELL = market moved down, their ask is now too high
    const drift = offer.offer_type === "BUY"
      ? (marketPrice - offerPrice) / offerPrice    // they're bidding too low
      : (offerPrice - marketPrice) / offerPrice;   // they're asking too high

    if (drift <= 0) return null; // their price is competitive or better

    const pctFilled  = offer.qty_total > 0
      ? (offer.qty_filled / offer.qty_total) * 100 : 0;
    const ageMinutes = offer.buy_started_at
      ? (Date.now() - new Date(offer.buy_started_at).getTime()) / 60_000 : 0;
    const urgency    = getUrgency(drift, ageMinutes, pctFilled);
    const thresholds = getDriftThresholds(offerPrice);
    const relistAt   = getRelistPrice(offer.offer_type, wikiData);

    if (urgency === "filled" || urgency === "partial") return null;

    if (drift >= thresholds.cancel) {
      return {
        level:     "cancel",
        color:     "var(--red)",
        bg:        "rgba(231,76,60,0.08)",
        border:    "rgba(231,76,60,0.25)",
        icon:      "🔴",
        label:     "Cancel & Relist",
        message:   `Your ${offer.offer_type === "BUY" ? "buy" : "sell"} offer is ${(drift * 100).toFixed(1)}% off market`,
        relistAt,
        drift,
        ageMinutes,
      };
    }

    if (drift >= thresholds.adjust) {
      return {
        level:     "adjust",
        color:     "var(--gold)",
        bg:        "rgba(201,168,76,0.08)",
        border:    "rgba(201,168,76,0.25)",
        icon:      "🟡",
        label:     "Consider Adjusting",
        message:   `${offer.offer_type === "BUY" ? "Buy" : "Sell"} offer drifted ${(drift * 100).toFixed(1)}% from market`,
        relistAt,
        drift,
        ageMinutes,
      };
    }

    return null; // within tolerance — all good
  }, [nameToId, liveWiki]);

  // ── Derive alerts across all active slots ────────────────────────────────
  const alerts = useMemo(() => {
    return offers
      .map(o => ({ offer: o, alert: getDriftAlert(o) }))
      .filter(({ alert }) => alert !== null)
      .sort((a, b) => b.alert.drift - a.alert.drift); // worst first
  }, [offers, getDriftAlert]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const slotColor  = s => ({ BUYING: "var(--gold)", BOUGHT: "var(--green)",
    SELLING: "#4fc3f7", SOLD: "var(--green)",
    CANCELLED_BUY: "var(--red)", CANCELLED_SELL: "var(--red)" }[s] || "#555");
  const slotLabel  = s => !s || s === "EMPTY" ? "Empty"
    : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");
  const fmtGP      = n => {
    if (!n && n !== 0) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n.toLocaleString();
  };
  const fmtMin     = m => m < 60 ? `${Math.round(m)}m` : `${(m / 60).toFixed(1)}h`;
  const pct        = o => o.qty_total > 0
    ? Math.round((o.qty_filled / o.qty_total) * 100) : 0;
  const activeOffers = offers.filter(o =>
    !["EMPTY", "CANCELLED_BUY", "CANCELLED_SELL"].includes(o.status));

  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── ALERT STRIP ─────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{
          background: "var(--bg3)", border: "1px solid var(--border)",
          borderRadius: "10px", overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "18px",
              fontWeight: 700, color: "var(--red)", textTransform: "uppercase",
              letterSpacing: "1px" }}>
              ⚠ Slot Alerts
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              {alerts.length} offer{alerts.length > 1 ? "s" : ""} need attention
            </span>
            {wikiLoading && (
              <span style={{ fontSize: "10px", color: "var(--text-dim)",
                marginLeft: "auto" }}>
                🔄 Checking prices...
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {alerts.map(({ offer, alert }) => (
              <div key={offer.slot} style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                background: alert.bg,
                borderLeft: `3px solid ${alert.color}`,
                display: "flex", alignItems: "flex-start",
                gap: "12px",
              }}>
                {/* Icon + slot */}
                <div style={{ display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "2px", flexShrink: 0 }}>
                  <span style={{ fontSize: "18px" }}>{alert.icon}</span>
                  <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>
                    Slot {offer.slot + 1}
                  </span>
                </div>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center",
                    gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600,
                      color: "var(--text)" }}>
                      {offer.item_name}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700,
                      color: alert.color, textTransform: "uppercase",
                      letterSpacing: "0.5px" }}>
                      {alert.label}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                      · {fmtMin(alert.ageMinutes)} unfilled · {pct(offer)}% done
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)",
                    marginBottom: "6px" }}>
                    {alert.message}
                  </div>

                  {/* Price comparison row */}
                  <div style={{ display: "flex", alignItems: "center",
                    gap: "16px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                        Your price
                      </span>
                      <div style={{ fontSize: "13px", color: "var(--text)",
                        fontWeight: 500 }}>
                        {fmtGP(offer.offer_price)} gp
                      </div>
                    </div>
                    <span style={{ fontSize: "16px", color: "var(--text-dim)" }}>→</span>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                        Relist at
                      </span>
                      <div style={{ fontSize: "13px", fontWeight: 700,
                        color: alert.level === "cancel" ? "var(--red)" : "var(--gold)" }}>
                        {alert.relistAt ? fmtGP(alert.relistAt) + " gp" : "—"}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                        Difference
                      </span>
                      <div style={{ fontSize: "13px", fontWeight: 600,
                        color: "var(--red)" }}>
                        {alert.relistAt
                          ? fmtGP(Math.abs(alert.relistAt - offer.offer_price)) + " gp off"
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIVE GE SLOTS ────────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "18px",
            fontWeight: 700, color: "var(--gold)", textTransform: "uppercase",
            letterSpacing: "1px" }}>
            🔴 Live GE Slots
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!wikiLoading && Object.keys(liveWiki).length > 0 && (
              <span style={{ fontSize: "10px", color: "var(--green)",
                display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%",
                  background: "var(--green)", display: "inline-block" }} />
                Prices live
              </span>
            )}
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              {activeOffers.length} / 8 slots
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-dim)", fontSize: "13px",
            padding: "20px 0" }}>
            Loading slots...
          </div>
        ) : activeOffers.length === 0 ? (
          <div style={{ color: "var(--text-dim)", fontSize: "13px",
            padding: "20px 0", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.4 }}>📦</div>
            <div>No active GE offers</div>
            <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.6 }}>
              Open offers in-game — they will appear here in real time
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {/* Table header */}
            <div style={{ display: "grid",
              gridTemplateColumns: "24px 2fr 60px 80px 100px 70px 70px 80px",
              gap: "10px", padding: "0 4px 8px",
              fontSize: "10px", color: "var(--text-dim)",
              textTransform: "uppercase", letterSpacing: "0.5px",
              borderBottom: "1px solid var(--border)" }}>
              <span>#</span>
              <span>Item</span>
              <span>Type</span>
              <span>Your price</span>
              <span>Progress</span>
              <span>Qty</span>
              <span>Market</span>
              <span>Status</span>
            </div>

            {activeOffers.map(o => {
              const itemId    = nameToId[o.item_name?.toLowerCase()];
              const wikiData  = itemId ? liveWiki[itemId] : null;
              const marketNow = wikiData
                ? (o.offer_type === "BUY" ? wikiData.high : wikiData.low) : null;
              const driftAmt  = marketNow && o.offer_price
                ? (o.offer_type === "BUY"
                  ? marketNow - o.offer_price
                  : o.offer_price - marketNow)
                : null;
              const hasAlert  = alerts.some(a => a.offer.slot === o.slot);
              const fillPct   = pct(o);

              return (
                <div key={o.slot} style={{
                  display: "grid",
                  gridTemplateColumns: "24px 2fr 60px 80px 100px 70px 70px 80px",
                  gap: "10px", padding: "10px 4px",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "center",
                  background: hasAlert ? "rgba(231,76,60,0.03)" : "transparent",
                  transition: "background 0.2s",
                }}>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    {o.slot + 1}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <img
                      src={`https://oldschool.runescape.wiki/images/${encodeURIComponent((o.item_name || "").replace(/ /g, "_"))}_detail.png`}
                      alt="" style={{ width: 20, height: 20, objectFit: "contain",
                        imageRendering: "pixelated" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      {o.item_name}
                    </span>
                    {hasAlert && (
                      <span style={{ fontSize: "10px" }}>⚠</span>
                    )}
                  </div>

                  <span style={{ fontSize: "11px",
                    color: o.offer_type === "BUY" ? "var(--gold)" : "#4fc3f7" }}>
                    {o.offer_type}
                  </span>

                  <span style={{ fontSize: "12px" }}>
                    {fmtGP(o.offer_price)}
                  </span>

                  {/* Progress bar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ background: "var(--bg4)", borderRadius: "3px",
                      height: "4px", overflow: "hidden" }}>
                      <div style={{ background: slotColor(o.status), height: "100%",
                        width: fillPct + "%", transition: "width 0.4s ease",
                        borderRadius: "3px" }} />
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                      {fillPct}%
                    </span>
                  </div>

                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    {(o.qty_filled || 0).toLocaleString()} / {(o.qty_total || 0).toLocaleString()}
                  </span>

                  {/* Live market price + drift indicator */}
                  <div>
                    {marketNow ? (
                      <>
                        <div style={{ fontSize: "12px", color: "var(--text)" }}>
                          {fmtGP(marketNow)}
                        </div>
                        {driftAmt !== null && Math.abs(driftAmt) > 0 && (
                          <div style={{ fontSize: "10px",
                            color: driftAmt > 0 ? "var(--red)" : "var(--green)" }}>
                            {driftAmt > 0 ? "↑" : "↓"} {fmtGP(Math.abs(driftAmt))}
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>—</span>
                    )}
                  </div>

                  <span style={{ fontSize: "11px", display: "flex",
                    alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%",
                      background: slotColor(o.status), display: "inline-block" }} />
                    {slotLabel(o.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AUTO-DETECTED FLIPS ──────────────────────────────────────────── */}
      {autoFlips.length > 0 && (
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px",
            fontWeight: 700, color: "var(--gold)", textTransform: "uppercase",
            letterSpacing: "1px", marginBottom: "16px" }}>
            ⚡ Auto-Detected Flips
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <div style={{ display: "grid",
              gridTemplateColumns: "2fr 80px 80px 80px 80px 90px",
              gap: "10px", padding: "0 4px 8px",
              fontSize: "10px", color: "var(--text-dim)",
              textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span>Item</span><span>Buy</span><span>Sell</span>
              <span>Qty</span><span>Tax</span><span>Profit</span>
            </div>
            {autoFlips.map(f => (
              <div key={f.id} style={{ display: "grid",
                gridTemplateColumns: "2fr 80px 80px 80px 80px 90px",
                gap: "10px", padding: "10px 4px",
                borderTop: "1px solid var(--border)", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>
                    {f.item_name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    {f.sell_completed_at
                      ? new Date(f.sell_completed_at).toLocaleDateString([],
                          { month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </div>
                </div>
                <span style={{ fontSize: "12px" }}>{fmtGP(f.buy_price)}</span>
                <span style={{ fontSize: "12px" }}>{fmtGP(f.sell_price)}</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                  {(f.quantity || 0).toLocaleString()}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>—</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600,
                    color: f.profit >= 0 ? "var(--green)" : "var(--red)" }}>
                    {f.profit >= 0 ? "+" : ""}{fmtGP(f.profit)}
                  </div>
                  {f.roi != null && (
                    <div style={{ fontSize: "11px",
                      color: f.roi >= 0 ? "var(--green)" : "var(--red)" }}>
                      {f.roi >= 0 ? "+" : ""}{Number(f.roi).toFixed(1)}% ROI
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export default function RuneTrader() {
  const [showApp, setShowApp] = useState(() => /^\/item\//.test(window.location.pathname));
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [tourRects, setTourRects] = useState({});
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.body.style.overflow = showApp ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showApp]);

  function showToast(msg, type = "success", duration = 3000) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }

  // ── Capture referral code from URL on load ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("rt_ref_code", ref);
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.toString());
    }
    // Handle Stripe redirect back
    const upgradeStatus = params.get("upgrade");
    if (upgradeStatus === "success") {
      setIsPro(true);
      const upgradeUrl = new URL(window.location.href);
      upgradeUrl.searchParams.delete("upgrade");
      window.history.replaceState({}, "", upgradeUrl.toString());
      setTimeout(() => showToast("Welcome to Pro! 📈 Merchant Mode is now unlocked.", "success", 5000), 500);
    }
    // Detect /item/:slug — e.g. runetrader.gg/item/abyssal-whip
    const match = window.location.pathname.match(/^\/item\/(.+)$/);
    if (match) {
      const slug = decodeURIComponent(match[1]).replace(/-/g, " ");
      setPendingItemSlug(slug.toLowerCase());
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setDemoMode(false); // exit demo when signed in
      if (event === "SIGNED_IN") {
        const createdAt = session?.user?.created_at;
        const isNewUser = createdAt && (Date.now() - new Date(createdAt).getTime()) < 10000;
        if (isNewUser) {
          // Handle referral on new sign-up
          const pendingRef = localStorage.getItem("rt_ref_code");
          if (pendingRef && session?.user?.id) {
            (async () => {
              const { data: referrerProfile } = await supabase
                .from("user_profiles").select("user_id").eq("ref_code", pendingRef).single();
              if (referrerProfile && referrerProfile.user_id !== session.user.id) {
                await supabase.from("referrals").insert({
                  referrer_id: referrerProfile.user_id,
                  referee_id: session.user.id,
                  ref_code: pendingRef,
                  status: "signed_up",
                  created_at: new Date().toISOString(),
                });
                localStorage.removeItem("rt_ref_code");
              }
            })();
          }
          // Give new user their own ref code
          (async () => {
            const newCode = session.user.id.slice(0, 8).toUpperCase();
            const { data } = await supabase.from("user_profiles")
              .upsert({ user_id: session.user.id, ref_code: newCode }, { onConflict: "user_id" })
              .select("ref_code").single();
            if (data?.ref_code) setUserRefCode(data.ref_code);
          })();
          setTimeout(() => {
            const el = document.querySelector(TOUR_STEPS[0].target);
            if (el) { const r = el.getBoundingClientRect(); setTourRects({ top: r.top, left: r.left, width: r.width, height: r.height }); }
            setTourStep(0);
          }, 800);
        } else if (session?.user?.id) {
          // Load ref code and pro status for returning users
          supabase.from("user_profiles").select("ref_code, is_pro").eq("user_id", session.user.id).single()
            .then(({ data }) => { if (data?.ref_code) setUserRefCode(data.ref_code); if (data?.is_pro) setIsPro(true); });
          // Show What's New modal if this deploy is new to them
          const seen = localStorage.getItem(DEPLOY_KEY);
          if (!seen) { setTimeout(() => setShowWhatsNew(true), 1200); }
          localStorage.setItem(DEPLOY_KEY, "1");
          // ── Login streak ──
          const today = new Date().toISOString().slice(0, 10);
          const lastLogin = localStorage.getItem("rt_last_login");
          const storedStreak = parseInt(localStorage.getItem("rt_login_streak") || "0");
          let newStreak = 1;
          if (lastLogin) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (lastLogin === today) { newStreak = storedStreak; }
            else if (lastLogin === yesterday) { newStreak = storedStreak + 1; }
            else { newStreak = 1; }
          }
          localStorage.setItem("rt_last_login", today);
          localStorage.setItem("rt_login_streak", String(newStreak));
          setLoginStreak(newStreak);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function endTour() { setTourStep(-1); }
  function advanceTour(next) {
    if (next >= TOUR_STEPS.length) { endTour(); return; }
    const target = TOUR_STEPS[next].target;
    if (target) {
      const el = document.querySelector(target);
      if (el) { const r = el.getBoundingClientRect(); setTourRects({ top: r.top, left: r.left, width: r.width, height: r.height }); }
    }
    setTourStep(next);
  }

  // ── Market data ──
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0); // seconds remaining
  const cooldownRef = useRef(null);
  const mappingCacheRef = useRef(null);   // static — only fetched once
  const volumeCacheRef = useRef(null);    // daily — refetched every 10 min
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [allItemsMap, setAllItemsMap] = useState({});

  // ── Merchant Mode ──
  const [merchantMode, setMerchantMode] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [userRefCode, setUserRefCode] = useState(null); // eslint-disable-line no-unused-vars
  const [showMerchantAnim, setShowMerchantAnim] = useState(false);
  const [showMerchantShutdown, setShowMerchantShutdown] = useState(false);
  const [merchantTransitioning, setMerchantTransitioning] = useState(false);
  const [merchantAIOpen, setMerchantAIOpen] = useState(false);
  const merchantAIMessagesEndRef = useRef(null);

  function activateMerchantWithAnim(cb) {
    setMerchantTransitioning(true);
    setShowMerchantAnim('active');
    setTimeout(() => { if (cb) cb(); }, 5600);
    setTimeout(() => setShowMerchantAnim('fading'), 5800);
    setTimeout(() => { setShowMerchantAnim('done'); setMerchantTransitioning(false); }, 6400);
  }
  const [merchantCapital, setMerchantCapital] = useState(0);
  const [merchantCapitalInput, setMerchantCapitalInput] = useState("");
  const [showCapitalSetup, setShowCapitalSetup] = useState(false);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [merchantTourStep, setMerchantTourStep] = useState(-1);
  const [merchantTourRect, setMerchantTourRect] = useState(null);
  const [merchantView, setMerchantView] = useState("operations");
  const [pnlHistory, setPnlHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_pnl_history") || "[]"); } catch { return []; }
  });
  const pnlCanvasRef = useRef(null);

  async function loadMerchantSettings() {
    if (!user) return;
    const { data } = await supabase.from("merchant_settings").select("*").eq("user_id", user.id).single();
    if (data) {
      setMerchantCapital(data.total_capital || 0);
      if (data.mode_enabled) { setMerchantMode(true); }
    }
  }

  async function saveMerchantCapital(val) {
    const gp = parseInt(val.replace(/[^0-9]/g, ""));
    if (isNaN(gp) || gp <= 0) return;
    setMerchantLoading(true);
    await supabase.from("merchant_settings").upsert({ user_id: user.id, total_capital: gp, mode_enabled: true, updated_at: new Date().toISOString() });
    setMerchantCapital(gp);
    setShowCapitalSetup(false);
    setMerchantLoading(false);
    activateMerchantWithAnim(() => {
      setMerchantMode(true);
      showToast("Merchant Mode activated!", "success");
    });
    const tourKey = `runetrader_merchant_tour_seen_${user.id}`;
    if (!localStorage.getItem(tourKey)) {
      localStorage.setItem(tourKey, "1");
      setTimeout(() => startMerchantTour(), 400);
    }
  }

  function startMerchantTour() {
    advanceMerchantTour(0);
  }

  function endMerchantTour() { setMerchantTourStep(-1); setMerchantTourRect(null); }

  function advanceMerchantTour(next) {
    if (next >= MERCHANT_TOUR_STEPS.length) { endMerchantTour(); return; }
    const step = MERCHANT_TOUR_STEPS[next];
    // Switch to the required tab first, then measure after render
    if (step.view) setMerchantView(step.view);
    setMerchantTourStep(next);
    if (step.target) {
      // Delay so React re-renders the correct tab before we measure
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) { el.scrollIntoView({ block: "nearest", behavior: "instant" }); const r = el.getBoundingClientRect(); setMerchantTourRect({ top: r.top, left: r.left, width: r.width, height: r.height }); }
        else { setMerchantTourRect(null); }
      }, 80);
    } else { setMerchantTourRect(null); }
  }

  async function toggleMerchantMode() {
    if (!user) { setShowAuth(true); return; }
    if (!merchantMode) {
      if (merchantCapital === 0) { setShowCapitalSetup(true); return; }
      await supabase.from("merchant_settings").upsert({ user_id: user.id, mode_enabled: true, updated_at: new Date().toISOString() });
      activateMerchantWithAnim(() => { setMerchantMode(true); });
    } else {
      setMerchantTransitioning(true);
      setShowMerchantShutdown('active');
      setMerchantAIOpen(false);
      await supabase.from("merchant_settings").upsert({ user_id: user.id, mode_enabled: false, updated_at: new Date().toISOString() });
      setTimeout(() => setShowMerchantShutdown('fading'), 2400);
      setTimeout(() => { setMerchantMode(false); }, 2850);
      setTimeout(() => { setShowMerchantShutdown('done'); setMerchantTransitioning(false); }, 2950);
    }
  }

  useEffect(() => { if (user) loadMerchantSettings(); }, [user]); // eslint-disable-line

  // Load manual positions for Merchant Mode (read-only copy)
  const [merchantPositions, setMerchantPositions] = useState([]);
  const [geOffers, setGeOffers] = useState([]);
  const [liveWikiPrices, setLiveWikiPrices] = useState({}); // item_id → {high,low} — populated by LiveGESlots poll
  useEffect(() => {
    if (!user) return;
    supabase.from("positions").select("*").then(({ data }) => setMerchantPositions(data || []));
    supabase.from("ge_offers").select("*").eq("user_id", user.id).order("slot")
      .then(({ data }) => setGeOffers(data || []));
    const ch = supabase.channel("merchant-ge-offers-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "ge_offers", filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === "DELETE") {
          // Re-fetch on DELETE — don't rely on payload.old.slot which requires REPLICA IDENTITY FULL
          supabase.from("ge_offers").select("*").eq("user_id", user.id).order("slot")
            .then(({ data }) => setGeOffers(data || []));
        } else {
          setGeOffers(prev => {
            const o = payload.new;
            const idx = prev.findIndex(x => x.slot === o.slot);
            if (idx >= 0) { const next = [...prev]; next[idx] = o; return next; }
            return [...prev, o].sort((a, b) => a.slot - b.slot);
          });
        }
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]); // eslint-disable-line

  async function addPositionFromMerchant({ item, buyPrice, qty }) {
    if (!user) return;
    // Write only to flips table as an open flip — this shows in Tracker and Merchant Mode
    // (previously also wrote to positions table causing duplicate entries)
    const { data: flipData, error } = await supabase.from("flips").insert({
      user_id: user.id, item, buy_price: buyPrice, qty, status: "open",
      date: new Date().toISOString(),
    }).select().single();
    if (error) { showToast("Failed to add position.", "error"); return; }
    if (flipData) setFlipsLog(prev => [mapFlipRow(flipData), ...prev]);
    showToast(`Position opened: ${item}`, "success");
  }



  // ── Prefs ──
  const [prefs] = useState(() => { try { return JSON.parse(localStorage.getItem("runetrader_prefs") || "{}"); } catch { return {}; } });
  const [budget] = useState(() => { try { return JSON.parse(localStorage.getItem("runetrader_prefs") || "{}").budget || ""; } catch { return ""; } });

  // ── UI state ──
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("market");
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [loginStreak, setLoginStreak] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingItemSlug, setPendingItemSlug] = useState(null); // from /item/:slug URL
  const [sortCol, setSortCol] = useState("volume");
  const [sortDir, setSortDir] = useState("desc");
  const [marketRowsShown, setMarketRowsShown] = useState(200);
  const [marketSubTab, setMarketSubTab] = useState("flips");
  const [natureRunePrice, setNatureRunePrice] = useState(0);
  const [customNatureRunePrice, setCustomNatureRunePrice] = useState(""); // empty = use live price
  const [alchShowLosses, setAlchShowLosses] = useState(false);
  const [alchSearch, setAlchSearch] = useState("");
  const [alchSortState, setAlchSortState] = useState({ col: "alchProfit", dir: "desc" });
  const [alchRowsShown, setAlchRowsShown] = useState(200);
  const [cofferTarget, setCofferTarget] = useState("");
  const [cofferSearch, setCofferSearch] = useState("");
  const [cofferShowLosses, setCofferShowLosses] = useState(false);
  const [cofferSortState, setCofferSortState] = useState({ col: "potentialSavings", dir: "desc" });
  const [cofferRowsShown, setCofferRowsShown] = useState(200);
  function handleSort(col) { if (sortCol === col) { setSortDir(d => d === "desc" ? "asc" : "desc"); } else { setSortCol(col); setSortDir("desc"); } }
  useEffect(() => { setMarketRowsShown(200); }, [filter, search]);

  // ── Advanced filters ──
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    minMargin: "", maxMargin: "",
    minRoi: "", maxRoi: "",
    minVolume: "", maxVolume: "",
    minPrice: "", maxPrice: "",
    minGpFill: "",
    maxLastTrade: "", // hours, e.g. "1", "6", "24"
    positiveOnly: false,
    priceDataOnly: false,
  });
  function setAdv(key, val) { setAdvFilters(f => ({ ...f, [key]: val })); setMarketRowsShown(200); }
  function resetAdvFilters() { setAdvFilters({ minMargin: "", maxMargin: "", minRoi: "", maxRoi: "", minVolume: "", maxVolume: "", minPrice: "", maxPrice: "", minGpFill: "", maxLastTrade: "", positiveOnly: false, priceDataOnly: false }); }
  const advFilterCount = Object.entries(advFilters).filter(([, v]) => v !== "" && v !== false).length;

  // ── AI Chat ──
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const itemsRef = useRef([]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { merchantAIMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, merchantAIOpen]);

  // ── Tracker ──
  const [flipsLog, setFlipsLog] = useState(() => { try { return JSON.parse(localStorage.getItem("runetrader_flips") || "[]"); } catch { return []; } });
  // eslint-disable-next-line no-unused-vars
  const [flipsLoading, setFlipsLoading] = useState(false); // eslint-disable-line no-unused-vars
  const [autoFlipsLog, setAutoFlipsLog] = useState([]);


  // ── Merchant P&L tracking (after flipsLog is declared) ──
  useEffect(() => {
    if (!merchantMode) return;
    const todayManual = flipsLog.filter(f => f.status !== "open" && f.date && new Date(f.date).toDateString() === new Date().toDateString()).reduce((s, f) => s + (f.totalProfit || 0), 0);
    const todayAuto = autoFlipsLog.filter(f => f.sell_completed_at && new Date(f.sell_completed_at).toDateString() === new Date().toDateString()).reduce((s, f) => s + (f.profit || 0), 0);
    const totalRealised = todayManual + todayAuto;
    const snap = { time: Date.now(), value: totalRealised };
    setPnlHistory(prev => {
      const today = prev.filter(p => new Date(p.time).toDateString() === new Date().toDateString());
      const updated = [...today.slice(-48), snap];
      localStorage.setItem("runetrader_pnl_history", JSON.stringify(updated));
      return updated;
    });
  }, [flipsLog, autoFlipsLog, merchantMode]); // eslint-disable-line

  useEffect(() => {
    if (!merchantMode || !pnlCanvasRef.current || pnlHistory.length < 2) return;
    const canvas = pnlCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height, pad = { top: 6, right: 6, bottom: 6, left: 6 };
    const vals = pnlHistory.map(p => p.value);
    const minV = Math.min(0, ...vals), maxV = Math.max(...vals) * 1.1 || 1;
    const xPos = i => pad.left + (i / (pnlHistory.length - 1)) * (W - pad.left - pad.right);
    const yPos = v => pad.top + (1 - (v - minV) / (maxV - minV)) * (H - pad.top - pad.bottom);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(46,204,113,0.3)"); grad.addColorStop(1, "rgba(46,204,113,0)");
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(vals[0]));
    vals.forEach((v, i) => ctx.lineTo(xPos(i), yPos(v)));
    ctx.lineTo(xPos(vals.length - 1), H); ctx.lineTo(xPos(0), H);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(vals[0]));
    vals.forEach((v, i) => ctx.lineTo(xPos(i), yPos(v)));
    ctx.strokeStyle = "var(--green)"; ctx.lineWidth = 2; ctx.stroke();
    const lx = xPos(vals.length - 1), ly = yPos(vals[vals.length - 1]);
    ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fillStyle = "var(--green)"; ctx.fill();
  }, [pnlHistory, merchantMode]); // eslint-disable-line


  const [logForm, setLogForm] = useState({ item: "", buyPrice: "", sellPrice: "", qty: "1" });
  // eslint-disable-next-line no-unused-vars
  const [autocomplete, setAutocomplete] = useState([]); // eslint-disable-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  const [showAutocomplete, setShowAutocomplete] = useState(false); // eslint-disable-line no-unused-vars

  // ── Close flip modal ──
  const [closingFlip, setClosingFlip] = useState(null);
  const [closeFlipLoading, setCloseFlipLoading] = useState(false);
  const [flipCard, setFlipCard] = useState(null); // { itemName, profit, roi, dataUrl }

  // ── Demo Mode ──
  const [demoMode, setDemoMode] = useState(false);
  const [demoTourStep, setDemoTourStep] = useState(-1); // -1 = inactive, -2 = end screen
  const [demoTourRect, setDemoTourRect] = useState(null);
  const [demoTourTransitioning, setDemoTourTransitioning] = useState(false);
  const [demoMerchantIntro, setDemoMerchantIntro] = useState(false); // dramatic MM intro overlay

  // ── Watchlist (replaces Favourites) ──
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const wl = localStorage.getItem("runetrader_watchlist");
      if (wl) return JSON.parse(wl);
      const old = localStorage.getItem("runetrader_favs");
      if (old) { localStorage.setItem("runetrader_watchlist", old); return JSON.parse(old); }
      return [];
    } catch { return []; }
  });
  const favourites = watchlist; // alias — MerchantMode and filtered still use `favourites`

  function toggleWatchlist(itemId) {
    setWatchlist(prev => {
      const next = prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId];
      localStorage.setItem("runetrader_watchlist", JSON.stringify(next));
      return next;
    });
  }
  const toggleFavourite = toggleWatchlist; // backwards compat

  const [watchlistAlerts, setWatchlistAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_watchlist_alerts") || "{}"); } catch { return {}; }
  });

  function setWatchlistAlert(itemId, type, price) {
    setWatchlistAlerts(prev => {
      const updated = { ...prev, [itemId]: { ...(prev[itemId] || {}), [type]: price } };
      localStorage.setItem("runetrader_watchlist_alerts", JSON.stringify(updated));
      return updated;
    });
  }

  function clearWatchlistAlert(itemId, type) {
    setWatchlistAlerts(prev => {
      const entry = { ...(prev[itemId] || {}) };
      delete entry[type];
      const updated = { ...prev, [itemId]: entry };
      if (!entry.above && !entry.below) delete updated[itemId];
      localStorage.setItem("runetrader_watchlist_alerts", JSON.stringify(updated));
      return updated;
    });
  }

  const [watchlistAddSearch, setWatchlistAddSearch] = useState("");
  const [watchlistAddAutocomplete, setWatchlistAddAutocomplete] = useState([]);
  const [watchlistAlertOpen, setWatchlistAlertOpen] = useState(null);
  const [watchlistAlertInputs, setWatchlistAlertInputs] = useState({ above: "", below: "" });

  // ── Alerts ──
  const [alerts, setAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_alerts") || "[]"); } catch { return []; }
  });
  const [alertForm, setAlertForm] = useState({ item: "", price: "", type: "above" });
  const [alertAutocomplete, setAlertAutocomplete] = useState([]);
  const [showAlertAutocomplete, setShowAlertAutocomplete] = useState(false);

  const [thresholds, setThresholds] = useState(() => {
    try { return { ...THRESHOLD_DEFAULTS, ...JSON.parse(localStorage.getItem("runetrader_thresholds") || "{}") }; }
    catch { return { ...THRESHOLD_DEFAULTS }; }
  });
  const [openPopover, setOpenPopover] = useState(null); // key of open popover

  function saveThreshold(key, val) {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed <= 0) return;
    const updated = { ...thresholds, [key]: parsed };
    setThresholds(updated);
    localStorage.setItem("runetrader_thresholds", JSON.stringify(updated));
  }

  // Close popover on outside click
  useEffect(() => {
    if (!openPopover) return;
    function handler(e) {
      if (!e.target.closest(".threshold-popover-wrap")) setOpenPopover(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openPopover]);

  // ── Smart Alerts ──
  const [smartAlertSettings, setSmartAlertSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_smart_alerts") || '{"marginSpike":true,"volumeSurge":true,"dumpDetected":true,"priceCrash":true,"autopilotSound":true,"autopilotPush":true}'); }
    catch { return { marginSpike: true, volumeSurge: true, dumpDetected: true, priceCrash: true, autopilotSound: true, autopilotPush: true }; }
  });
  const [smartEvents, setSmartEvents] = useState([]);
  const [smartFeedFilter, setSmartFeedFilter] = useState("all"); // all | spike | surge | dump | crash
  const [smartFeedSort, setSmartFeedSort] = useState("recent");  // recent | change | margin
  const [smartFeedSortDir, setSmartFeedSortDir] = useState("desc"); // asc | desc
  const prevItemsRef = useRef({});
  const smartCooldownRef = useRef({}); // key: `${itemId}_${type}` → timestamp

  function saveSmartAlertSettings(key, val) {
    const updated = { ...smartAlertSettings, [key]: val };
    setSmartAlertSettings(updated);
    localStorage.setItem("runetrader_smart_alerts", JSON.stringify(updated));
  }

  function runSmartAlerts(newItems) {
    const prev = prevItemsRef.current;
    if (!Object.keys(prev).length) {
      // First load — just store baseline, don't fire
      const baseline = {};
      newItems.forEach(i => { baseline[i.id] = { margin: i.margin, volume: i.volume, high: i.high, low: i.low }; });
      prevItemsRef.current = baseline;
      return;
    }
    const now = Date.now();
    const COOLDOWN_MS = 30 * 60 * 1000; // 30 min per item per type
    const newEvents = [];

    newItems.forEach(item => {
      const p = prev[item.id];
      if (!p) return;

      function canFire(type) {
        const key = `${item.id}_${type}`;
        if (smartCooldownRef.current[key] && now - smartCooldownRef.current[key] < COOLDOWN_MS) return false;
        return true;
      }
      function fire(type, icon, badge, message, oldVal, newVal) {
        const key = `${item.id}_${type}`;
        smartCooldownRef.current[key] = now;
        const event = { id: `${item.id}_${type}_${now}`, itemId: item.id, itemName: item.name, type, icon, badge, message, oldVal, newVal, time: new Date() };
        newEvents.push(event);
        // Push notification if enabled
        if (notifPermission === "granted") {
          try {
            new Notification(`RuneTrader: ${item.name}`, { body: message, icon: "/icons/icon-192.png" });
          } catch {}
        }
        // Save to Supabase if logged in
        if (user) {
          supabase.from("smart_alert_events").insert({
            user_id: user.id, item_id: item.id, item_name: item.name,
            alert_type: type, message, old_value: oldVal, new_value: newVal,
          }).then(() => {});
        }
      }

      // Margin Spike: margin up >threshold% vs previous
      if (smartAlertSettings.marginSpike && canFire("marginSpike") && p.margin > 100) {
        const pct = ((item.margin - p.margin) / Math.abs(p.margin)) * 100;
        if (pct >= thresholds.marginSpike) fire("marginSpike", "📈", "spike", `Margin spiked +${Math.round(pct)}% to ${formatGP(item.margin)} gp`, p.margin, item.margin);
      }

      // Volume Surge: volume >threshold x previous
      if (smartAlertSettings.volumeSurge && canFire("volumeSurge") && p.volume > 10) {
        if (item.volume >= p.volume * thresholds.volumeSurge && item.volume > 50) fire("volumeSurge", "🔥", "surge", `Volume surged to ${item.volume.toLocaleString()}/day (was ${p.volume.toLocaleString()})`, p.volume, item.volume);
      }

      // Dump Detected: sell price dropped >threshold%
      if (smartAlertSettings.dumpDetected && canFire("dumpDetected") && p.high > 100) {
        const drop = ((p.high - item.high) / p.high) * 100;
        if (drop >= thresholds.dumpDetected) fire("dumpDetected", "⚠️", "dump", `Sell price dropped ${Math.round(drop)}% to ${formatGP(item.high)} gp`, p.high, item.high);
      }

      // Price Crash: both buy and sell dropped >threshold%
      if (smartAlertSettings.priceCrash && canFire("priceCrash") && p.high > 100 && p.low > 100) {
        const highDrop = ((p.high - item.high) / p.high) * 100;
        const lowDrop = ((p.low - item.low) / p.low) * 100;
        if (highDrop >= thresholds.priceCrash && lowDrop >= thresholds.priceCrash) fire("priceCrash", "💥", "crash", `Price crashed! Buy ${formatGP(item.low)} (↓${Math.round(lowDrop)}%), Sell ${formatGP(item.high)} (↓${Math.round(highDrop)}%)`, p.high, item.high);
      }
    });

    if (newEvents.length > 0) {
      setSmartEvents(prev => [...newEvents, ...prev].slice(0, 100)); // keep last 100
    }

    // Update baseline
    const updated = {};
    newItems.forEach(i => { updated[i.id] = { margin: i.margin, volume: i.volume, high: i.high, low: i.low }; });
    prevItemsRef.current = updated;
  }

  // ── Push notifications ──
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [notifLoading, setNotifLoading] = useState(false);

  // ── Demo Tour ────────────────────────────────────────────────────
  function measureDemoTarget(selector) {
    if (!selector) { setDemoTourRect(null); return; }
    setTimeout(() => {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        setTimeout(() => {
          const r = el.getBoundingClientRect();
          setDemoTourRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }, 120);
      } else {
        setDemoTourRect(null);
      }
    }, 80);
  }

  function startDemoTour() {
    setDemoTourStep(0);
    setDemoTourRect(null);
  }

  function advanceDemoTour(nextIdx) {
    if (nextIdx >= DEMO_TOUR_STEPS.length) {
      // End — show CTA screen
      setDemoTourStep(-2);
      setDemoTourRect(null);
      return;
    }
    const step = DEMO_TOUR_STEPS[nextIdx];
    setDemoTourStep(nextIdx);

    // Navigate to correct tab — briefly show solid backdrop during transition
    if (step.tab) {
      setDemoTourTransitioning(true);
      setDemoTourRect(null);
      setActiveTab(step.tab);
      setTimeout(() => setDemoTourTransitioning(false), 200);
    }

    // Activate merchant mode if needed
    if (step.activateMerchant) {
      // Show dramatic intro overlay first, then activate
      setDemoMerchantIntro(true);
      setTimeout(() => {
        setMerchantCapital(DEMO_CAPITAL);
        setMerchantMode(true);
        setMerchantView("operations");
        setAutoFlipsLog(DEMO_AUTO_FLIPS);
        setPnlHistory(DEMO_PNL_HISTORY);
        setMerchantPositions(DEMO_LIVE_OPS.map(op => ({
          id: op.id, item_name: op.item_name, buy_price: op.buy_price,
          quantity: op.quantity, status: op.status,
          buy_started_at: op.buy_started_at,
        })));
      }, 2600); // activate behind the overlay
      setTimeout(() => setDemoMerchantIntro("fading"), 3000);
      setTimeout(() => setDemoMerchantIntro(false), 3700);
    }

    // Set merchant sub-view
    if (step.merchantView) setMerchantView(step.merchantView);

    // Measure highlight target
    measureDemoTarget(step.target);
  }

  function endDemoTour() {
    setDemoTourStep(-1);
    setDemoTourRect(null);
    setDemoMerchantIntro(false);
    // Always reset demo-injected merchant data and reload real data
    setMerchantMode(false);
    setMerchantCapital(0);
    setAutoFlipsLog([]);
    setPnlHistory([]);
    setMerchantPositions([]);
    // Reload real data for logged-in users
    if (user) {
      loadMerchantSettings();
      supabase.from("ge_flips_live").select("*").eq("user_id", user.id)
        .then(({ data }) => setAutoFlipsLog(data || []));
      supabase.from("positions").select("*")
        .then(({ data }) => setMerchantPositions(data || []));
    }
  }

  // Auto-start demo tour when demoMode activates
  useEffect(() => {
    if (!demoMode) return; // don’t run on initial mount (default false)
    // Force out of Merchant Mode and back to Market before tour starts
    setMerchantMode(false);
    setMerchantAIOpen(false);
    setActiveTab("market");
    startDemoTour();
  }, [demoMode]); // eslint-disable-line

  async function subscribeToPush() {
    if (!user) { setShowAuth(true); return; }
    setNotifLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      let sub = existing;
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY),
        });
      }
      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), user_id: user.id }),
      });
      setNotifPermission("granted");
      showToast("Notifications enabled! You'll be alerted even when the app is closed.", "success", 5000);
    } catch (err) {
      console.error("Push subscribe error:", err);
      showToast("Could not enable notifications. Please try again.", "error");
    } finally {
      setNotifLoading(false);
    }
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      showToast("Your browser doesn't support notifications.", "error"); return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      await subscribeToPush();
    } else {
      showToast("Notifications blocked. You can enable them in your browser settings.", "info", 5000);
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  }

  // ── Load flips on user change ──
  useEffect(() => {
    if (user) { loadAndMergeFlips(); }
    else { try { setFlipsLog(JSON.parse(localStorage.getItem("runetrader_flips") || "[]")); } catch { setFlipsLog([]); } }
  }, [user]); // eslint-disable-line

  useEffect(() => { // eslint-disable-line
    if (!user) { setAutoFlipsLog([]); return; }
    supabase.from("ge_flips_live").select("*").eq("user_id", user.id)
      .eq("status", "SOLD").order("sell_completed_at", { ascending: false }).limit(200)
      .then(({ data }) => setAutoFlipsLog(data || []));
    const ch = supabase.channel("auto-flips-stats-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "ge_flips_live", filter: `user_id=eq.${user.id}` }, () => {
        supabase.from("ge_flips_live").select("*").eq("user_id", user.id)
          .eq("status", "SOLD").order("sell_completed_at", { ascending: false }).limit(200)
          .then(({ data }) => setAutoFlipsLog(data || []));
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]); // eslint-disable-line

  async function loadAndMergeFlips() {
    setFlipsLoading(true);
    let localFlips = [];
    try { localFlips = JSON.parse(localStorage.getItem("runetrader_flips") || "[]"); } catch {}
    const { data: dbData, error } = await supabase.from("flips").select("*").order("date", { ascending: false });
    if (error) { setFlipsLoading(false); return; }
    if (localFlips.length > 0) {
      const existingKeys = new Set((dbData || []).map(r => `${r.item}|${r.buy_price}|${r.sell_price}|${(r.date || "").slice(0, 16)}`));
      const toInsert = localFlips.filter(f => !existingKeys.has(`${f.item}|${f.buyPrice}|${f.sellPrice}|${(f.date || "").slice(0, 16)}`))
        .map(f => ({ user_id: user.id, item: f.item, buy_price: f.buyPrice, sell_price: f.sellPrice || null, qty: f.qty, tax: f.tax, profit_each: f.profitEach, total_profit: f.totalProfit, roi: f.roi, date: f.date || new Date().toISOString(), status: f.status || "closed" }));
      if (toInsert.length > 0) await supabase.from("flips").insert(toInsert);
      localStorage.removeItem("runetrader_flips");
      const { data: merged } = await supabase.from("flips").select("*").order("date", { ascending: false });
      setFlipsLog((merged || []).map(mapFlipRow));
    } else {
      setFlipsLog((dbData || []).map(mapFlipRow));
    }
    setFlipsLoading(false);
  }

  function mapFlipRow(r) {
    return {
      id: r.id,
      item: r.item,
      buyPrice: r.buy_price,
      sellPrice: r.sell_price,
      qty: r.qty,
      tax: r.tax,
      profitEach: r.profit_each,
      totalProfit: r.total_profit,
      roi: r.roi,
      date: r.date || new Date().toISOString(),
      status: r.status || "closed",
    };
  }

  // ── Fetch market prices ──
  // /mapping is static (item metadata — never changes), cached for the session
  // /volumes updates daily, refreshed every 10 min
  // /latest updates every ~60s on wiki's end — poll every 30s to catch it fast
  const volumeCacheTimeRef = useRef(0);
  useEffect(() => { fetchPrices(); const iv = setInterval(fetchPrices, 30 * 1000); return () => clearInterval(iv); }, []); // eslint-disable-line

  // ── Resolve pending /item/:slug once allItems is populated ──
  useEffect(() => {
    if (!pendingItemSlug || allItems.length === 0) return;
    const match = allItems.find(i => i.name.toLowerCase() === pendingItemSlug)
      || allItems.find(i => i.name.toLowerCase().replace(/\s+/g, "-") === pendingItemSlug.replace(/\s+/g, "-"));
    if (match) { setSelectedItem(match); setPendingItemSlug(null); }
  }, [pendingItemSlug, allItems]); // eslint-disable-line

  async function fetchPrices(isManualRefresh = false) {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Always fetch latest prices — via our server cache (hits Wiki at most once/min)
      const latestRes = await fetch("/api/prices?type=latest");
      const latestData = await latestRes.json();

      // Fetch mapping once per session (cached 24h server-side)
      if (!mappingCacheRef.current) {
        const mappingRes = await fetch("/api/prices?type=mapping");
        const mappingData = await mappingRes.json();
        const mappingMap = {};
        const nameMap = {};
        mappingData.forEach(item => { mappingMap[item.id] = item; nameMap[item.id] = item.name; });
        mappingCacheRef.current = mappingMap;
        setAllItemsMap(nameMap);
      }

      // Fetch volumes at most once every 10 minutes (cached server-side)
      const now = Date.now();
      if (!volumeCacheRef.current || now - volumeCacheTimeRef.current > 10 * 60 * 1000) {
        const volumeRes = await fetch("/api/prices?type=volumes");
        const volumeData = await volumeRes.json();
        volumeCacheRef.current = volumeData.data || {};
        volumeCacheTimeRef.current = now;
      }

      const mappingMap = mappingCacheRef.current;
      const volumeMap = volumeCacheRef.current;
      const TAX_EXEMPT_IDS = [13190, 13191, 13192];

      // Capture nature rune price (ID 561) — used for High Alch profit calc
      const natureRuneData = latestData.data["561"];
      if (natureRuneData && natureRuneData.low) setNatureRunePrice(natureRuneData.low);
      else if (natureRunePrice === 0) setNatureRunePrice(200); // fallback if no live data

      const flips = [];

      // Build from full mapping catalog — show all items, even those with no live price
      for (const [idStr, meta] of Object.entries(mappingMap)) {
        const id = parseInt(idStr);
        const prices = latestData.data[idStr] || {};
        const { high, low, highTime, lowTime } = prices;
        const hasPrice = high && low;
        const rawTax = high ? Math.floor(high * 0.02) : 0;
        const TAX = TAX_EXEMPT_IDS.includes(id) ? 0 : (!high || high < 50 ? 0 : Math.min(rawTax, 5_000_000));
        const margin = hasPrice ? high - low - TAX : 0;
        const roi = hasPrice ? parseFloat(((margin / low) * 100).toFixed(1)) : 0;
        const volume = volumeMap[id] || 0;
        const lastTradeTime = Math.max(highTime || 0, lowTime || 0);
        const score = hasPrice ? getScore(margin, volume, roi, null, null, meta.limit || 0, lastTradeTime) : 0;
        const flip = { id, name: meta.name, category: meta.members ? "Members" : "F2P", buyLimit: meta.limit || 0, high: high || null, low: low || null, margin, roi, volume, score, lastTradeTime, hasPrice, highalch: meta.highalch || 0, itemValue: meta.value || 0 };
        flips.push(flip);
      }
      const validFlips = flips.filter(isValidFlip);
      validFlips.sort((a, b) => b.score - a.score);
      setItems(validFlips);
      setAllItems(flips); // all items including invalid — for search
      itemsRef.current = validFlips;
      runSmartAlerts(flips);
      setLastUpdate(new Date());
      if (isManualRefresh) {
        showToast("Prices refreshed!", "success");
        setRefreshCooldown(15);
        clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
          setRefreshCooldown(prev => {
            if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } catch { setError("Failed to load GE data. Check your connection."); }
    finally { setLoading(false); setRefreshing(false); }
  }

  // ── Sign out ──
  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setFlipsLog([]);
    setAlerts([]);
    localStorage.removeItem("runetrader_alerts");
    setActiveTab("market");
  }

  // ── Check alerts against live prices ──
  useEffect(() => {
    if (!items.length || !alerts.length) return;
    setAlerts(prev => prev.map(alert => {
      const liveItem = items.find(i => i.name.toLowerCase() === alert.item.toLowerCase());
      if (!liveItem) return alert;
      const currentPrice = liveItem.high;
      const triggered = alert.type === "above" ? currentPrice >= alert.price : currentPrice <= alert.price;
      return { ...alert, currentPrice, triggered };
    }));
  }, [items]); // eslint-disable-line

  // ── Autocomplete helpers ──
  const allNames = Object.values(allItemsMap);
  function handleItemInput(val, setForm, setAc, setShowAc) {
    setForm(f => ({ ...f, item: val }));
    if (val.length < 2) { setShowAc(false); return; }
    const matches = allNames.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
    setAc(matches); setShowAc(matches.length > 0);
  }
  function selectAutocomplete(name, setForm, setShowAc, extraFields) {
    setForm(f => ({ ...f, item: name, ...extraFields(name) }));
    setShowAc(false);
  }

  // ── Log a flip (buy-only or full) ──
  // eslint-disable-next-line no-unused-vars
  async function logFlip() { // eslint-disable-line no-unused-vars
    const buy = parseInt(logForm.buyPrice.replace(/,/g, ""));
    const qty = parseInt(logForm.qty) || 1;
    if (!logForm.item || isNaN(buy)) return;

    const hasSell = logForm.sellPrice.trim() !== "";
    const sell = hasSell ? parseInt(logForm.sellPrice.replace(/,/g, "")) : null;
    const isOpen = !hasSell || isNaN(sell);

    let tax = 0, profitEach = 0, totalProfit = 0, roi = 0;
    if (!isOpen) {
      tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
      profitEach = sell - buy - tax;
      totalProfit = profitEach * qty;
      roi = parseFloat(((profitEach / buy) * 100).toFixed(1));
    }

    const itemName = logForm.item;
    setLogForm({ item: "", buyPrice: "", sellPrice: "", qty: "1" });
    setShowAutocomplete(false);

    if (user) {
      const { data, error } = await supabase.from("flips").insert({
        user_id: user.id,
        item: itemName,
        buy_price: buy,
        sell_price: isOpen ? null : sell,
        qty,
        tax: isOpen ? 0 : tax,
        profit_each: isOpen ? null : profitEach,
        total_profit: isOpen ? null : totalProfit,
        roi: isOpen ? null : roi,
        status: isOpen ? "open" : "closed",
      }).select().single();
      if (!error && data) {
        setFlipsLog(prev => [mapFlipRow(data), ...prev]);
        showToast(isOpen ? `${itemName} logged as open flip!` : "Flip logged successfully!", isOpen ? "info" : "success");
      } else if (error) {
        showToast("Failed to save flip. Try again.", "error");
      }
    } else {
      const entry = {
        id: Date.now(),
        item: itemName,
        buyPrice: buy,
        sellPrice: isOpen ? null : sell,
        qty,
        tax: isOpen ? 0 : tax,
        profitEach: isOpen ? null : profitEach,
        totalProfit: isOpen ? null : totalProfit,
        roi: isOpen ? null : roi,
        date: new Date().toISOString(),
        status: isOpen ? "open" : "closed",
      };
      const updated = [entry, ...flipsLog];
      setFlipsLog(updated);
      localStorage.setItem("runetrader_flips", JSON.stringify(updated));
      showToast(isOpen ? `${itemName} logged as open flip! Sign in to sync.` : "Flip logged! Sign in to sync across devices.", "info");
    }
  }

  // ── Close an open flip ──
  function generateFlipCard(itemName, totalProfit, roi) {
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 200;
    const ctx = canvas.getContext("2d");
    // Background
    ctx.fillStyle = "#07090c";
    ctx.fillRect(0, 0, 600, 200);
    // Gold border
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 596, 196);
    // Inner glow
    ctx.fillStyle = "rgba(201,168,76,0.04)";
    ctx.fillRect(2, 2, 596, 196);
    // Sword icon area
    ctx.font = "32px serif";
    ctx.fillText("📈", 28, 80);
    // RuneTrader label
    ctx.fillStyle = "#c9a84c";
    ctx.font = "bold 13px 'Arial'";
    ctx.fillText("RUNETRADER.GG", 28, 110);
    // Item name
    ctx.fillStyle = "#e8e8e8";
    ctx.font = "bold 22px 'Arial'";
    ctx.fillText(itemName, 28, 145);
    // Profit
    const profitText = `${totalProfit >= 0 ? "+" : ""}${totalProfit >= 1_000_000 ? (totalProfit / 1_000_000).toFixed(1) + "M" : totalProfit >= 1_000 ? (totalProfit / 1_000).toFixed(0) + "K" : totalProfit} gp`;
    ctx.fillStyle = totalProfit >= 0 ? "#2ecc71" : "#e74c3c";
    ctx.font = "bold 36px 'Arial'";
    ctx.fillText(profitText, 28, 185);
    // ROI
    ctx.fillStyle = "#c9a84c";
    ctx.font = "14px 'Arial'";
    ctx.fillText(`${roi > 0 ? "+" : ""}${roi}% ROI`, 350, 165);
    // Tagline
    ctx.fillStyle = "#4a5568";
    ctx.font = "12px 'Arial'";
    ctx.fillText("The OSRS flipping terminal", 350, 185);
    return canvas.toDataURL("image/png");
  }

  async function handleCloseFlipSold(flip, sellPriceStr) {
    const sell = parseInt(sellPriceStr.replace(/,/g, ""));
    if (isNaN(sell)) return;
    setCloseFlipLoading(true);
    const tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
    const profitEach = sell - flip.buyPrice - tax;
    const totalProfit = profitEach * (flip.qty || 1);
    const roi = parseFloat(((profitEach / flip.buyPrice) * 100).toFixed(1));

    if (user) {
      const { data, error } = await supabase.from("flips").update({
        sell_price: sell,
        tax,
        profit_each: profitEach,
        total_profit: totalProfit,
        roi,
        status: "closed",
      }).eq("id", flip.id).select().single();
      if (!error && data) {
        setFlipsLog(prev => prev.map(f => f.id === flip.id ? mapFlipRow(data) : f));
        showToast(`Sold! ${totalProfit >= 0 ? "+" : ""}${formatGP(totalProfit)} gp profit`, totalProfit >= 0 ? "success" : "error");
        if (merchantMode && totalProfit > 0) {
          const dataUrl = generateFlipCard(flip.item, totalProfit, roi);
          setFlipCard({ itemName: flip.item, profit: totalProfit, roi, dataUrl });
        }
      } else {
        showToast("Failed to update flip.", "error");
      }
    } else {
      const updated = flipsLog.map(f => f.id === flip.id ? { ...f, sellPrice: sell, tax, profitEach, totalProfit, roi, status: "closed" } : f);
      setFlipsLog(updated);
      localStorage.setItem("runetrader_flips", JSON.stringify(updated));
      showToast(`Sold! ${totalProfit >= 0 ? "+" : ""}${formatGP(totalProfit)} gp profit`, totalProfit >= 0 ? "success" : "error");
    }
    setClosingFlip(null);
    setCloseFlipLoading(false);
  }

  async function handleCloseFlipCancelled(flip) {
    if (user) {
      await supabase.from("flips").delete().eq("id", flip.id);
    } else {
      localStorage.setItem("runetrader_flips", JSON.stringify(flipsLog.filter(f => f.id !== flip.id)));
    }
    setFlipsLog(prev => prev.filter(f => f.id !== flip.id));
    setClosingFlip(null);
    showToast(`${flip.item} removed from open flips.`, "info");
  }

  // ── Merchant Mode close handlers (no tab switching needed) ──
  async function merchantCloseFlip(flip, sellPrice, cancelled = false) {
    if (cancelled) {
      await handleCloseFlipCancelled(flip);
    } else {
      await handleCloseFlipSold(flip, sellPrice);
    }
  }

  async function merchantClosePortfolioPos(pos, sellPrice, cancelled = false) {
    if (!user) return;
    if (cancelled) {
      // Just delete the portfolio position
      await supabase.from("positions").delete().eq("id", pos.id);
      setMerchantPositions(prev => prev.filter(p => p.id !== pos.id));
      showToast(`${pos.name} removed.`, "info");
      return;
    }
    const sell = parseInt(String(sellPrice).replace(/,/g, ""));
    if (isNaN(sell)) return;
    const tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
    const profitEach = sell - pos.buyPrice - tax;
    const totalProfit = profitEach * (pos.qty || 1);
    const roi = parseFloat(((profitEach / pos.buyPrice) * 100).toFixed(1));
    // Write closed flip to history
    const { data: flipData } = await supabase.from("flips").insert({
      user_id: user.id, item: pos.name, buy_price: pos.buyPrice, sell_price: sell,
      qty: pos.qty || 1, tax, profit_each: profitEach, total_profit: totalProfit, roi, status: "closed"
    }).select().single();
    if (flipData) setFlipsLog(prev => [mapFlipRow(flipData), ...prev]);
    // Remove portfolio position
    await supabase.from("positions").delete().eq("id", pos.id);
    setMerchantPositions(prev => prev.filter(p => p.id !== pos.id));
    showToast(`Closed! ${totalProfit >= 0 ? "+" : ""}${formatGP(totalProfit)} gp profit`, totalProfit >= 0 ? "success" : "error");
  }

  // ── "Flip This" from item modal ──
  // eslint-disable-next-line no-unused-vars
  async function deleteFlip(id) { // eslint-disable-line no-unused-vars
    if (user) { await supabase.from("flips").delete().eq("id", id); }
    else { localStorage.setItem("runetrader_flips", JSON.stringify(flipsLog.filter(f => f.id !== id))); }
    setFlipsLog(prev => prev.filter(f => f.id !== id));
  }

  // eslint-disable-next-line no-unused-vars
  async function clearAllFlips() { // eslint-disable-line no-unused-vars
    if (!window.confirm("Clear all logged flips? This cannot be undone.")) return;
    if (user) await supabase.from("flips").delete().eq("user_id", user.id);
    else localStorage.removeItem("runetrader_flips");
    setFlipsLog([]);
  }

  // ── Alerts ──
  function addAlert() {
    if (!alertForm.item || !alertForm.price) return;
    const liveItem = items.find(i => i.name.toLowerCase() === alertForm.item.toLowerCase());
    const currentPrice = liveItem?.high || null;
    const newAlert = { id: Date.now(), item: alertForm.item, price: parseInt(alertForm.price.replace(/,/g, "")), type: alertForm.type, currentPrice, triggered: false };
    setAlerts(prev => {
      const next = [newAlert, ...prev];
      localStorage.setItem("runetrader_alerts", JSON.stringify(next));
      return next;
    });
    setAlertForm({ item: "", price: "", type: "above" });
    setShowAlertAutocomplete(false);
  }
  function deleteAlert(id) {
    setAlerts(prev => {
      const next = prev.filter(a => a.id !== id);
      localStorage.setItem("runetrader_alerts", JSON.stringify(next));
      return next;
    });
  }

  // ── AI sendMessage ──
  async function sendMessage(text) {
    setMessages(prev => [...prev, { role: "user", content: text, time: new Date() }]);
    setInput(""); setAiLoading(true);
    const reliableItems = itemsRef.current
      .filter(i => {
        if (i.margin <= 0) return false;
        if (i.volume < 1000) return false; // must have meaningful daily volume
        if (i.roi > 150) return false; // suspiciously high — likely manipulated or untradeable
        const ageSec = i.lastTradeTime ? Math.floor(Date.now() / 1000 - i.lastTradeTime) : 99999;
        if (ageSec > 10800) return false; // data older than 3hrs = unreliable margin
        return true;
      })
      .sort((a, b) => b.score - a.score);
    const topFlips = reliableItems.slice(0, 60).map(i => {
      const ageSec = i.lastTradeTime ? Math.floor(Date.now() / 1000 - i.lastTradeTime) : null;
      const freshness = !ageSec ? "unknown" : ageSec < 300 ? "fresh" : ageSec < 1800 ? "recent" : "aging";
      const cyclesPerDay = i.buyLimit > 0 ? Math.min(i.volume / i.buyLimit, 6).toFixed(1) : "?";
      return `${i.name}: buy ${formatGP(i.low)}, sell ${formatGP(i.high)}, margin ${formatGP(i.margin)}, ROI ${i.roi}%, vol ${i.volume.toLocaleString()}/day, limit ${i.buyLimit.toLocaleString()}, cycles/day ~${cyclesPerDay}, data ${freshness}, score ${i.score}`;
    }).join("\n");
    const mentionedItems = itemsRef.current.filter(i => text.toLowerCase().includes(i.name.toLowerCase())).map(i => `${i.name}: buy ${formatGP(i.low)}, sell ${formatGP(i.high)}, margin ${formatGP(i.margin)}, ROI ${i.roi}%, volume ${i.volume.toLocaleString()}/day, score ${i.score}`).join("\n");
    const riskMap = { Low: "only high-volume safe items (volume 500+/day, ROI 2-15%)", Med: "balance margin and volume (volume 100+/day, ROI 5-40%)", High: "higher margin items OK (volume 50+/day, ROI up to 100%)" };
    const speedMap = { Fast: "only items with very high daily volume (500+)", Med: "items that fill within 1-2 hours (volume 100+/day)", Slow: "slower filling items with bigger margins acceptable" };

    // ── Build slot context from live GE offers + drift data ──────────────────
    const activeSlots = geOffers.filter(o => ["BUYING", "BOUGHT", "SELLING", "SOLD"].includes(o.status));
    const slotContext = activeSlots.length === 0 ? "No active GE offers right now." : activeSlots.map(o => {
      const itemId    = (items || []).find(i => i.name?.toLowerCase() === o.item_name?.toLowerCase())?.id;
      const wikiNow   = itemId ? liveWikiPrices[itemId] : null;
      const marketPrice = wikiNow ? (o.offer_type === "BUY" ? wikiNow.high : wikiNow.low) : null;
      const drift     = marketPrice && o.offer_price
        ? ((o.offer_type === "BUY"
            ? (marketPrice - o.offer_price)
            : (o.offer_price - marketPrice)) / o.offer_price * 100).toFixed(1)
        : null;
      const fillPct   = o.qty_total > 0 ? Math.round((o.qty_filled / o.qty_total) * 100) : 0;
      const ageMin    = o.buy_started_at
        ? Math.round((Date.now() - new Date(o.buy_started_at).getTime()) / 60000) : null;
      const relistAt  = wikiNow
        ? (o.offer_type === "BUY" ? wikiNow.high + 1 : wikiNow.low - 1) : null;

      let driftNote = "";
      if (drift !== null) {
        const driftNum = parseFloat(drift);
        if (driftNum >= 5)       driftNote = ` ⚠ CANCEL & RELIST — ${drift}% off market, relist at ${relistAt?.toLocaleString()} gp`;
        else if (driftNum >= 2)  driftNote = ` ⚡ Consider adjusting — ${drift}% off market, relist at ${relistAt?.toLocaleString()} gp`;
        else if (driftNum > 0)   driftNote = ` ✓ Slightly off market (${drift}%) — within tolerance`;
        else                     driftNote = ` ✓ Competitive`;
      }

      return `Slot ${o.slot + 1}: ${o.item_name} | ${o.offer_type} @ ${o.offer_price?.toLocaleString()} gp | ${fillPct}% filled${ageMin !== null ? ` | ${ageMin}min old` : ""}${marketPrice ? ` | Market now: ${marketPrice.toLocaleString()} gp` : " | No live price"}${driftNote}`;
    }).join("\n");

    const systemPrompt = `You are the RuneTrader AI assistant — an expert OSRS Grand Exchange flipping advisor with live GE data.
${budget ? `User cash stack: ${parseInt(budget.replace(/,/g,"")).toLocaleString()} gp — only recommend items they can afford (buy price must fit their stack, ideally with room for 5+ flips)` : "Cash stack not set — ask before recommending specific items."}
${prefs.risk ? `Risk tolerance: ${prefs.risk} — ${riskMap[prefs.risk]}` : "Risk not set."}
${prefs.speed ? `Flip speed: ${prefs.speed} — ${speedMap[prefs.speed]}` : "Speed not set."}

PLAYER'S ACTIVE GE SLOTS (synced live from RuneTrader plugin):
${slotContext}
CRITICAL: You DO have access to the player's GE slots via the RuneTrader plugin — NEVER say you don't have access to their slots. The data above is real and current. If it says 'No active GE offers right now' it means they have nothing in the GE at this moment OR they are not currently logged in-game — tell them that directly. If slots are listed, use them to give specific advice. If a slot shows ⚠ CANCEL & RELIST, mention it proactively even if they didn't ask. Never invent slot data beyond what is shown above.

SCORING SYSTEM (explain if asked):
- Score 0–100. Three components multiplied by a freshness multiplier.
- Liquidity ratio (40pts): daily_volume ÷ buy_limit. Ratio ≥ 20 = excellent (market supports 20 full buy cycles/day). Ratio < 1 = market can't even fill one cycle — score 0.
- GP/hr (35pts): margin × (volume/24 × 0.03 fill_share, capped at buy limit). Log-scaled. 2M+/hr = top tier.
- ROI (15pts): sweet spot 2–5% (real high-volume OSRS flips). >40% = suspicious. >80% = likely dead market or manipulation — score 0.
- Freshness multiplier: applied after scoring. <5min = ×1.0, <15min = ×0.9, <30min = ×0.75, <1hr = ×0.5, <2hr = ×0.2, 2hr+ = ×0.05.
- Score 70+ = strong. 50–69 = decent. Under 50 = risky or marginal.
- Items with ratio < 1 (market can't fill a full buy cycle/day), margin ≤ 0, or data 2hr+ old score near zero.

LIVE DATA (pre-filtered: margin > 0, volume ≥ 1,000/day, data < 3hrs old, ROI ≤ 150%):
${topFlips}${mentionedItems ? `\nMentioned items (from user query):\n${mentionedItems}` : ""}

RULES:
- Only recommend items from the live data above. Never invent or assume prices.
- Always state the buy limit when recommending — it defines the max you can buy per 4hrs.
- CRITICAL — COMPETITION & FILLS: OSRS has 100k–200k+ concurrent players with thousands of active flippers. Fill rates are volume-dependent: extremely high volume items (500k+/day) like runes fill reliably because the market is deep enough to absorb all flippers — these are solid low-risk fast flips worth 25–100k GP per fill. High volume (100k–500k/day) items likely fill but face competition. Mid volume (20k–100k/day) is competitive — expect partial fills. Low volume (<5k/day) is uncertain — fills are slow and unreliable. Never tell a user high volume guarantees a fast fill without acknowledging this scale. The GP/Fill number shown already accounts for realistic fill rates at each volume tier.
- "cycles/day" = how many 4hr windows the market supports being fully bought. Lower = slower flip.
- Warn explicitly if data freshness is "aging" — the margin shown may not be real anymore.
- Write all GP as full numbers with commas (1,220,000 not 1.22M).
- GE tax: 2% of sell price, capped at 5,000,000. Under 50gp = no tax. Bonds exempt. All margins shown are already after tax.
- High ROI (>40%) on a GE flip is a red flag, not a green one. It usually means thin market, slow fill, or a one-sided margin snapshot. Say so.
- Be concise, honest, and specific. If something looks sketchy, say it.`;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, system: systemPrompt, messages: [...messages.filter(m => m.role !== "system").slice(-6).map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }] }) });
      const data = await res.json();
      const reply = data.error ? `API Error: ${data.error.message || data.error.type}` : (data.content?.[0]?.text || "Sorry, no response.");
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Connection error: ${e.message}`, time: new Date() }]);
    } finally { setAiLoading(false); }
  }

  const sourceItems = allItems.length ? allItems : items;
  const filtered = sourceItems.filter(item => {
    if (search.trim()) return item.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "favourites") return favourites.includes(item.id);
    if (filter === "f2p") return item.category === "F2P";
    if (filter === "members") return item.category === "Members";
    if (filter === "highvol") return item.volume > 500;
    // Advanced filters
    if (advFilters.priceDataOnly && !item.hasPrice) return false;
    if (advFilters.positiveOnly && item.margin <= 0) return false;
    if (advFilters.minMargin !== "" && item.margin < parseFloat(advFilters.minMargin)) return false;
    if (advFilters.maxMargin !== "" && item.margin > parseFloat(advFilters.maxMargin)) return false;
    if (advFilters.minRoi !== "" && item.roi < parseFloat(advFilters.minRoi)) return false;
    if (advFilters.maxRoi !== "" && item.roi > parseFloat(advFilters.maxRoi)) return false;
    if (advFilters.minVolume !== "" && item.volume < parseFloat(advFilters.minVolume)) return false;
    if (advFilters.maxVolume !== "" && item.volume > parseFloat(advFilters.maxVolume)) return false;
    if (advFilters.minPrice !== "" && (item.low || 0) < parseFloat(advFilters.minPrice)) return false;
    if (advFilters.maxPrice !== "" && (item.low || 0) > parseFloat(advFilters.maxPrice)) return false;
    if (advFilters.minGpFill !== "") {
      const lim = item.buyLimit > 0 ? item.buyLimit : 500;
      const mkt4hr = item.volume / 6;
      let expFill;
      if      (item.volume >= 500_000) expFill = Math.min(lim, mkt4hr);
      else if (item.volume >= 100_000) expFill = Math.min(lim, mkt4hr * 0.6);
      else if (item.volume >= 20_000)  expFill = Math.min(lim, mkt4hr * 0.2);
      else if (item.volume >= 5_000)   expFill = Math.min(lim, mkt4hr * 0.08);
      else                             expFill = Math.min(lim, mkt4hr * 0.03);
      const gpPerFill = item.margin * Math.max(expFill, 1);
      if (gpPerFill < parseFloat(advFilters.minGpFill)) return false;
    }
    if (advFilters.maxLastTrade !== "") {
      const cutoff = Date.now() / 1000 - parseFloat(advFilters.maxLastTrade) * 3600;
      if (!item.lastTradeTime || item.lastTradeTime < cutoff) return false;
    }
    return true;
  }).sort((a, b) => {
    // Always push no-price items to the bottom
    if (!a.hasPrice && b.hasPrice) return 1;
    if (a.hasPrice && !b.hasPrice) return -1;
    if (sortCol === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sortCol === "volume") return sortDir === "asc" ? a.volume - b.volume : b.volume - a.volume;
    if (sortCol === "buylimit") return sortDir === "asc" ? a.buyLimit - b.buyLimit : b.buyLimit - a.buyLimit;
    if (sortCol === "margin") return sortDir === "asc" ? a.margin - b.margin : b.margin - a.margin;
    if (sortCol === "gpPerFill") {
      const calc = i => { const lim = i.buyLimit > 0 ? i.buyLimit : 500; return i.margin * Math.min(lim, i.volume / 6); };
      return sortDir === "asc" ? calc(a) - calc(b) : calc(b) - calc(a);
    }
    if (sortCol === "lastTradeTime") return sortDir === "asc" ? (a.lastTradeTime || 0) - (b.lastTradeTime || 0) : (b.lastTradeTime || 0) - (a.lastTradeTime || 0);
    return sortDir === "asc" ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol];
  });

  // ── Tracker stats (manual + auto-tracked flips combined) ──
  const closedFlips = flipsLog.filter(f => f.status !== "open");
  const openFlips = flipsLog.filter(f => f.status === "open");
  const autoClosedFlips = autoFlipsLog.map(f => ({ item: f.item_name, totalProfit: f.profit || 0, date: f.sell_completed_at }));
  const allClosedFlips = [...closedFlips, ...autoClosedFlips];
  const totalProfit = allClosedFlips.reduce((s, f) => s + (f.totalProfit || 0), 0);
  const totalFlips = allClosedFlips.length;
  const avgProfit = totalFlips ? Math.round(totalProfit / totalFlips) : 0;
  const bestItem = allClosedFlips.length ? allClosedFlips.reduce((best, f) => (f.totalProfit || 0) > (best.totalProfit || 0) ? f : best, allClosedFlips[0]) : null;

  if (!showApp) return <LandingPage onEnterApp={(mode) => { setShowApp(true); if (mode === "demo") setDemoMode(true); }} />;

  return (
    <>
      <style>{STYLES}</style>

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "⚡"} {t.msg}
          </div>
        ))}
      </div>

      {/* AUTH MODAL */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={u => setUser(u)} />}

      {showCapitalSetup && (
        <div className="capital-setup" onClick={e => e.target === e.currentTarget && setShowCapitalSetup(false)}>
          <div className="capital-setup-inner">
            <div className="capital-setup-title">📈 Activate Merchant Mode</div>
            <div className="capital-setup-sub">Enter your total GP stack. This helps track capital efficiency, idle GP, and expected returns. You can update it any time.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Capital (GP)</label>
              <input className="capital-setup-input" placeholder="e.g. 500000000" value={merchantCapitalInput}
                onChange={e => setMerchantCapitalInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveMerchantCapital(merchantCapitalInput); }}
                autoFocus />
              {merchantCapitalInput && !isNaN(parseInt(merchantCapitalInput.replace(/[^0-9]/g, ""))) && (
                <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>= {formatGP(parseInt(merchantCapitalInput.replace(/[^0-9]/g, "")))} gp</div>
              )}
            </div>
            <button className="capital-setup-btn" disabled={!merchantCapitalInput || merchantLoading}
              onClick={() => saveMerchantCapital(merchantCapitalInput)}>
              {merchantLoading ? "Activating..." : "Activate Merchant Mode →"}
            </button>
          </div>
        </div>
      )}

      {/* MERCHANT TRANSITION BACKDROP - prevents any flash between states */}
      {merchantTransitioning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: '#0a0a0a', pointerEvents: 'all' }} />
      )}

      {/* MERCHANT SHUTDOWN ANIMATION */}
      <div className={`merchant-shutdown-overlay${showMerchantShutdown === 'fading' ? ' merchant-shutdown-exit' : ''}`} style={{ display: showMerchantShutdown && showMerchantShutdown !== 'done' ? 'flex' : 'none' }}>
          <div className="merchant-shutdown-title">Merchant Mode</div>
          <div className="merchant-shutdown-sub">Closing trading terminal</div>
          <div className="merchant-shutdown-bars">
            {[1,1.6,0.7,1.3,0.5,1.8,1,0.9,1.5,0.6].map((h,i) => (
              <div key={i} className="merchant-shutdown-bar" style={{ height: `${h * 20}px`, animationDelay: `${0.8 + i * 0.05}s` }} />
            ))}
          </div>
          <div className="merchant-shutdown-status">● Terminal Offline</div>
        </div>

      {/* MERCHANT ACTIVATION ANIMATION */}
      <div className={`merchant-anim-overlay${showMerchantAnim === 'fading' ? ' merchant-anim-exit' : ''}`} style={{ display: showMerchantAnim && showMerchantAnim !== 'done' ? 'flex' : 'none' }}>
          <div className="merchant-anim-scan" />
          <div className="merchant-anim-logo">RuneTrader.gg</div>
          <div className="merchant-anim-title">Merchant Mode</div>
          <div className="merchant-anim-subtitle">Initialising trading terminal</div>
          <div className="merchant-anim-bars">
            {[1,1.6,0.7,1.3,0.5,1.8,1,0.9,1.5,0.6].map((h,i) => (
              <div key={i} className="merchant-anim-bar" style={{ height: `${h * 20}px`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <div className="merchant-anim-status">● System Ready</div>
        </div>

      {/* MERCHANT TOUR */}
      {merchantTourStep >= 0 && (() => {
        const step = MERCHANT_TOUR_STEPS[merchantTourStep];
        const isCenter = step.placement === "center" || !merchantTourRect;
        const pad = 10;
        const hl = merchantTourRect || {};
        const ttHeight = 300;
        const ttWidth = 320;
        const vp = window.innerHeight;
        const leftPos = Math.max(8, Math.min((hl.left || 0), window.innerWidth - ttWidth - 8));
        // Helper: clamp top so tooltip is always fully on screen
        const clampTop = (t) => Math.max(8, Math.min(t, vp - ttHeight - 90));
        let ttStyle = {};
        if (isCenter) {
          ttStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
        } else if (step.placement === "bottom") {
          const belowTop = hl.top + (hl.height || 0) + pad + 12;
          const wouldOverflow = belowTop + ttHeight > vp;
          ttStyle = wouldOverflow
            ? { top: clampTop(hl.top - ttHeight - pad - 12), left: leftPos }
            : { top: clampTop(belowTop), left: leftPos };
        } else if (step.placement === "top") {
          const aboveTop = hl.top - pad - ttHeight;
          ttStyle = aboveTop < 8
            ? { top: clampTop(hl.top + (hl.height || 0) + pad + 12), left: leftPos }
            : { top: clampTop(aboveTop), left: leftPos };
        } else if (step.placement === "left") {
          const rightOfCenter = (hl.left || 0) > window.innerWidth * 0.5;
          const topPos = clampTop(hl.top || 0);
          ttStyle = rightOfCenter
            ? { top: topPos, right: window.innerWidth - (hl.left || 0) + pad + 8, left: "auto" }
            : { top: topPos, left: leftPos };
        }
        return (
          <>
            <div className="tour-backdrop" onClick={endMerchantTour} />
            {!isCenter && merchantTourRect && <div className="tour-highlight" style={{ top: hl.top - pad, left: hl.left - pad, width: hl.width + pad * 2, height: hl.height + pad * 2, zIndex: step.target === ".merchant-ai-bubble" ? 10001 : undefined }} />}
            <div className="tour-tooltip" style={ttStyle}>
              <div className="tour-step-label">Step {merchantTourStep + 1} of {MERCHANT_TOUR_STEPS.length}</div>
              <div className="tour-title">{step.title}</div>
              <div className="tour-desc">{step.desc}</div>
              <div className="tour-actions">
                <div className="tour-dots">{MERCHANT_TOUR_STEPS.map((_, i) => <div key={i} className={"tour-dot" + (i === merchantTourStep ? " active" : "")} />)}</div>
                <div className="tour-btn-row">
                  <button className="tour-skip" onClick={endMerchantTour}>Skip</button>
                  <button className="tour-next" onClick={() => advanceMerchantTour(merchantTourStep + 1)}>
                    {merchantTourStep === MERCHANT_TOUR_STEPS.length - 1 ? "Let's go!" : "Next →"}
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* FLIP CARD MODAL */}
      {flipCard && (
        <div className="flip-card-overlay" onClick={() => setFlipCard(null)}>
          <div className="flip-card-modal" onClick={e => e.stopPropagation()}>
            <div className="flip-card-title">🎉 Nice flip! Share it?</div>
            <img src={flipCard.dataUrl} alt="Flip card" className="flip-card-image" />
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Share your {formatGP(flipCard.profit)} gp profit on {flipCard.itemName} with your clan.
            </div>
            <div className="flip-card-actions">
              <button className="flip-card-btn" onClick={() => setFlipCard(null)}>Skip</button>
              <button className="flip-card-btn" onClick={() => {
                const link = document.createElement("a");
                link.download = `runetrader-${flipCard.itemName.replace(/\s+/g, "-").toLowerCase()}.png`;
                link.href = flipCard.dataUrl;
                link.click();
              }}>↓ Download</button>
              <button className="flip-card-btn primary" onClick={() => {
                const slug = flipCard.itemName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                const text = `I just made ${formatGP(flipCard.profit)} gp flipping ${flipCard.itemName} on RuneTrader.gg 📈\nrunetrader.gg/item/${slug}`;
                navigator.clipboard.writeText(text).then(() => { showToast("Copied to clipboard! Paste in Discord 🔗", "success"); setFlipCard(null); });
              }}>📋 Copy for Discord</button>
            </div>
          </div>
        </div>
      )}

      {/* WHAT'S NEW MODAL */}
      {showWhatsNew && (
        <div className="whats-new-overlay" onClick={() => setShowWhatsNew(false)}>
          <div className="whats-new-modal" onClick={e => e.stopPropagation()}>
            <div className="whats-new-header">
              <div className="whats-new-title">📈 What's New in RuneTrader</div>
              <button onClick={() => setShowWhatsNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", fontSize: "18px", lineHeight: 1 }}>✕</button>
            </div>
            <div className="whats-new-body">
              {CHANGELOG.slice(0, 1).map((release, ri) => (
                <div key={ri} className="changelog-version">
                  <div className="changelog-version-header">
                    <span className="changelog-version-name">{release.version}</span>
                    <span className="changelog-version-date">{release.date}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {release.items.map((item, ii) => (
                      <div key={ii} className="changelog-item">
                        <span className={`changelog-badge-${item.type}`}>{item.type}</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="whats-new-footer">
              <button className="refresh-btn" onClick={() => { setShowWhatsNew(false); setActiveTab("changelog"); }}>View full changelog</button>
              <button className="upgrade-cta" style={{ width: "auto", padding: "9px 24px", fontSize: "13px", letterSpacing: "0.5px" }} onClick={() => setShowWhatsNew(false)}>Got it ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {upgradeModal && (
        <div className="upgrade-overlay" onClick={() => setUpgradeModal(null)}>
          <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
            <div className="upgrade-icon">📈</div>
            <div className="upgrade-title">Merchant Mode</div>
            <div className="upgrade-desc">
              <strong style={{ color: "var(--text)" }}>{upgradeModal.feature}</strong> is a Merchant Mode feature.
              {upgradeModal.description && <><br /><br />{upgradeModal.description}</>}
            </div>
            {upgradeModal.bullets && (
              <div className="upgrade-features">
                {upgradeModal.bullets.map((b, i) => (
                  <div key={i} className="upgrade-feature-row">
                    <span className="check">◆</span>{b}
                  </div>
                ))}
              </div>
            )}
            <button className="upgrade-cta" onClick={async () => {
              if (!user) { setUpgradeModal(null); setShowAuth(true); return; }
              setUpgradeModal(null);
              setActiveTab("pricing");
            }}>
              See Pro Plans →
            </button>
            <button className="upgrade-dismiss" onClick={() => setUpgradeModal(null)}>Maybe later</button>
          </div>
        </div>
      )}

      {/* ITEM CHART MODAL */}
      {selectedItem && (
        <ItemChart
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAskAI={msg => { setInput(msg); sendMessage(msg); }}
          onRefresh={() => fetchPrices(true)}
          refreshing={refreshing}
          refreshCooldown={refreshCooldown}
          onShare={() => {
            const slug = selectedItem.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            const url = `${window.location.origin}/item/${slug}`;
            navigator.clipboard.writeText(url).then(() => showToast("Link copied! Share it on Discord or Reddit 🔗", "success"));
          }}
          isWatchlisted={watchlist.includes(selectedItem?.id)}
          onToggleWatchlist={() => toggleWatchlist(selectedItem?.id)}
        />
      )}

      {/* CLOSE FLIP MODAL */}
      {closingFlip && (
        <CloseFlipModal
          flip={closingFlip}
          items={items}
          onSold={handleCloseFlipSold}
          onCancelled={handleCloseFlipCancelled}
          onDismiss={() => setClosingFlip(null)}
          loading={closeFlipLoading}
        />
      )}

      {/* ONBOARDING TOUR */}
      {tourStep >= 0 && (() => {
        const step = TOUR_STEPS[tourStep];
        const isCenter = step.placement === "center" || !step.target;
        const pad = 8, hl = tourRects;
        let ttStyle = {};
        if (isCenter) ttStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
        else if (step.placement === "left") ttStyle = { top: Math.max(8, (hl.top + hl.height / 2) - 100), right: window.innerWidth - hl.left + 16 };
        else if (step.placement === "bottom") ttStyle = { top: hl.top + hl.height + 16, left: Math.min(hl.left, window.innerWidth - 320) };
        else ttStyle = { bottom: window.innerHeight - hl.top + 16, left: Math.min(hl.left, window.innerWidth - 320) };
        return (
          <>
            <div className="tour-backdrop" onClick={endTour} />
            {!isCenter && <div className="tour-highlight" style={{ top: hl.top - pad, left: hl.left - pad, width: hl.width + pad * 2, height: hl.height + pad * 2 }} />}
            <div className="tour-tooltip" style={ttStyle}>
              <div className="tour-step-label">Step {tourStep + 1} of {TOUR_STEPS.length}</div>
              <div className="tour-title">{step.title}</div>
              <div className="tour-desc">{step.desc}</div>
              <div className="tour-actions">
                <div className="tour-dots">{TOUR_STEPS.map((_, i) => <div key={i} className={"tour-dot" + (i === tourStep ? " active" : "")} />)}</div>
                <div className="tour-btn-row">
                  <button className="tour-skip" onClick={endTour}>Skip tour</button>
                  <button className="tour-next" onClick={() => advanceTour(tourStep + 1)}>{tourStep === TOUR_STEPS.length - 1 ? "Let's go!" : "Next →"}</button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      <div className="app">
        {/* ALPHA BANNER */}
        <div className="alpha-banner">
          <span className="alpha-badge">Alpha</span>
          <span>RuneTrader is in early access — features are actively being built.</span>
          <a className="feedback-btn" href="mailto:feedback@runetrader.gg">💬 Send Feedback</a>
        </div>

        {/* DEMO BANNER */}
        {demoMode && (
          <div className="demo-banner">
            <div className="demo-banner-text">
              <span style={{ fontSize: "14px", flexShrink: 0 }}>&#128065;</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <strong>Demo mode</strong> &mdash; live prices, simulated positions.
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              {!user && (
                <button className="demo-cta-btn" onClick={() => { setDemoMode(false); setShowAuth(true); }}>
                  Sign Up Free &rarr;
                </button>
              )}
              <button onClick={() => { setDemoMode(false); endDemoTour(); }} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", color: "var(--gold)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="header">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 120 120" fill="none">
              <defs>
                <linearGradient id="logo_bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#080c1c"/>
                  <stop offset="55%" stopColor="#050810"/>
                  <stop offset="100%" stopColor="#020308"/>
                </linearGradient>
                <linearGradient id="logo_ring" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f0d898"/>
                  <stop offset="50%" stopColor="#c8a96e"/>
                  <stop offset="100%" stopColor="#8a6030"/>
                </linearGradient>
                <linearGradient id="logo_arrow" x1="28" y1="80" x2="84" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c8a96e"/>
                  <stop offset="55%" stopColor="#e8d898"/>
                  <stop offset="100%" stopColor="#60b8ff"/>
                </linearGradient>
                <radialGradient id="logo_tipglow" cx="80" cy="43" r="26" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#60b8ff55"/>
                  <stop offset="100%" stopColor="transparent"/>
                </radialGradient>
              </defs>
              <rect width="120" height="120" rx="26" fill="url(#logo_bg)"/>
              <circle cx="60" cy="60" r="40" stroke="url(#logo_ring)" strokeWidth="2.5"/>
              <circle cx="60" cy="60" r="33" stroke="#c8a96e" strokeWidth="0.75" opacity="0.15"/>
              <line x1="60" y1="17" x2="60" y2="24" stroke="#f0d898" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="98" y1="60" x2="103" y2="60" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
              <line x1="17" y1="60" x2="22" y2="60" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
              <line x1="60" y1="97" x2="60" y2="103" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
              <ellipse cx="80" cy="43" rx="22" ry="18" fill="url(#logo_tipglow)"/>
              <path d="M32 78 L45 63 L55 71 L80 43" stroke="url(#logo_arrow)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M73 40 L80 43 L77 51" stroke="#a0d8ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="80" cy="43" r="5.5" fill="#80ccff" opacity="0.98"/>
              <circle cx="80" cy="43" r="9.5" fill="#4da6ff" opacity="0.28"/>
            </svg>
            <span className="logo-text">RuneTrader<span className="logo-dot">.gg</span></span>
          </div>
          <div className="nav-tabs">
            {!merchantMode && [["market","GE Tracker"],["watchlist","Watchlist"],["tracker","Tracker"],["alerts","Alerts"],...(user ? [["portfolio","Portfolio"],["settings","Settings"],["referral","Refer & Earn 🔗"]] : [])].map(([t,label]) => (
              <button key={t} className={`nav-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {label}
                {t === "tracker" && (openFlips.length + (autoFlipsLog.filter(f => !["SOLD","CANCELLED"].includes(f.status)).length)) > 0 && (
                  <span style={{ marginLeft: "6px", background: "var(--gold)", color: "#000", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>
                    {openFlips.length + autoFlipsLog.filter(f => !["SOLD","CANCELLED"].includes(f.status)).length}
                  </span>
                )}
                {t === "alerts" && (alerts.filter(a => a.triggered).length + smartEvents.length) > 0 && (
                  <span style={{ marginLeft: "6px", background: "var(--gold)", color: "#000", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>
                    {alerts.filter(a => a.triggered).length + smartEvents.length}
                  </span>
                )}
                {t === "watchlist" && watchlist.length > 0 && (
                  <span style={{ marginLeft: "6px", background: "var(--bg4)", color: "var(--text-dim)", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700, border: "1px solid var(--border)" }}>
                    {watchlist.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="header-right">
            <button onClick={() => setActiveTab("pricing")} style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid rgba(201,168,76,0.4)", background: activeTab === "pricing" ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.06)", color: "var(--gold)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
              {isPro ? "✓ Pro" : "Pro ✨"}
            </button>
            <button onClick={() => setActiveTab("changelog")} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid transparent", background: "transparent", color: activeTab === "changelog" ? "var(--gold)" : "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
              What's New 🆕
            </button>
            {lastUpdate && <div className="live-badge"><div className="live-dot" />Live · {formatTime(lastUpdate)}</div>}
            {user && merchantMode && (
              <button onClick={startMerchantTour}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s", letterSpacing: "0.3px" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: "13px" }}>📖</span> Tutorial
              </button>
            )}
            {user && (
              <button onClick={toggleMerchantMode}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 16px", borderRadius: "8px", border: `1px solid ${merchantMode ? "var(--gold)" : "var(--border)"}`, background: merchantMode ? "rgba(201,168,76,0.12)" : "transparent", color: merchantMode ? "var(--gold)" : "var(--text-dim)", fontSize: "12px", fontWeight: merchantMode ? "600" : "400", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s", letterSpacing: "0.3px" }}
                onMouseOver={e => { if (!merchantMode) { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}}
                onMouseOut={e => { if (!merchantMode) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; }}}>
                {merchantMode && <div className="merchant-dot" style={{ background: "var(--green)" }} />}
                <span style={{ fontSize: "13px" }}>📈</span>
                {merchantMode ? "Exit Merchant" : "Merchant Mode"}
              </button>
            )}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{user.user_metadata?.username || user.email?.split("@")[0]}</span>
                <button onClick={handleSignOut} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                  onMouseOver={e => e.target.style.color = "var(--red)"} onMouseOut={e => e.target.style.color = "var(--text-dim)"}>Sign Out</button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ padding: "7px 18px", borderRadius: "8px", border: "1px solid var(--gold-dim)", background: "rgba(201,168,76,0.08)", color: "var(--gold)", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                onMouseOver={e => e.target.style.background = "rgba(201,168,76,0.15)"} onMouseOut={e => e.target.style.background = "rgba(201,168,76,0.08)"}>Log In</button>
            )}
          </div>
        </header>

        <div className="main">
          {merchantMode && (user || demoMode) ? (
            <>
            <MerchantMode
              items={items}
              allItems={allItems}
              flipsLog={flipsLog}
              autoFlipsLog={autoFlipsLog}
              manualPositions={demoMode ? DEMO_LIVE_OPS : merchantPositions}
              geOffers={geOffers}
              merchantCapital={merchantCapital}
              setMerchantCapital={setMerchantCapital}
              pnlHistory={pnlHistory}
              pnlCanvasRef={pnlCanvasRef}
              formatGP={formatGP}
              setSelectedItem={setSelectedItem}
              showToast={showToast}
              supabase={demoMode ? DEMO_SUPABASE_STUB : supabase}
              user={demoMode ? null : user}
              onUpdateCapital={() => setShowCapitalSetup(true)}
              onAddPosition={addPositionFromMerchant}
              smartAlertSettings={smartAlertSettings}
              saveSmartAlertSettings={saveSmartAlertSettings}
              thresholds={thresholds}
              saveThreshold={saveThreshold}
              openPopover={openPopover}
              setOpenPopover={setOpenPopover}
              smartEvents={smartEvents}
              setSmartEvents={setSmartEvents}
              onRefresh={() => fetchPrices(true)}
              refreshing={refreshing}
              refreshCooldown={refreshCooldown}
              onCloseFlip={merchantCloseFlip}
              onClosePortfolioPos={merchantClosePortfolioPos}
              activeView={merchantView}
              setActiveView={setMerchantView}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              favourites={favourites}
              toggleFavourite={toggleFavourite}
              sortCol={sortCol}
              sortDir={sortDir}
              handleSort={handleSort}
              filtered={filtered}
              marketRowsShown={marketRowsShown}
              setMarketRowsShown={setMarketRowsShown}
              showAdvFilters={showAdvFilters}
              setShowAdvFilters={setShowAdvFilters}
              advFilters={advFilters}
              advFilterCount={advFilterCount}
              setAdv={setAdv}
              resetAdvFilters={resetAdvFilters}
              loading={loading}
            />

          </>) : (
          <>
          <div className="left-panel">

            {/* ── WATCHLIST TAB ── */}
            {activeTab === "watchlist" && (
              <WatchlistPage
                user={user}
                items={items}
                watchlist={watchlist}
                watchlistAlerts={watchlistAlerts}
                toggleWatchlist={toggleWatchlist}
                setWatchlistAlert={setWatchlistAlert}
                clearWatchlistAlert={clearWatchlistAlert}
                watchlistAlertOpen={watchlistAlertOpen}
                setWatchlistAlertOpen={setWatchlistAlertOpen}
                watchlistAlertInputs={watchlistAlertInputs}
                setWatchlistAlertInputs={setWatchlistAlertInputs}
                watchlistAddSearch={watchlistAddSearch}
                setWatchlistAddSearch={setWatchlistAddSearch}
                watchlistAddAutocomplete={watchlistAddAutocomplete}
                setWatchlistAddAutocomplete={setWatchlistAddAutocomplete}
                setSelectedItem={setSelectedItem}
                onSignIn={() => setShowAuth(true)}
                setUpgradeModal={setUpgradeModal}
                demoMode={demoMode}
                formatGP={formatGP}
              />
            )}

            {/* ── PRICING TAB ── */}
            {activeTab === "pricing" && (
              <PricingPage
                user={user}
                isPro={isPro}
                onSignIn={() => setShowAuth(true)}
                onGoToReferral={() => setActiveTab("referral")}
              />
            )}

            {/* ── REFERRAL TAB ── */}
            {activeTab === "referral" && (
              <ReferralPage
                user={user}
                supabase={supabase}
                showToast={showToast}
              />
            )}

            {/* ── TRACKER TAB ── */}
            {activeTab === "tracker" && (
              <div className="tracker-wrap">
                <div className="tracker-summary">
                  {[
                    { label: "Total Profit", value: formatGP(totalProfit), color: totalProfit >= 0 ? "var(--green)" : "var(--red)", sub: "Closed flips only" },
                    { label: "Flips Logged", value: totalFlips.toLocaleString(), color: "var(--gold)", sub: `${openFlips.length + autoFlipsLog.filter(f => !["SOLD","CANCELLED"].includes(f.status)).length} open` },
                    { label: "Avg Profit/Flip", value: formatGP(avgProfit), color: "var(--text)", sub: "Per closed flip" },
                    { label: "Best Item", value: bestItem?.item || "—", color: "var(--gold)", sub: bestItem ? formatGP(bestItem.totalProfit) + " profit" : "Log a flip first" },
                    { label: "Login Streak", value: loginStreak > 0 ? `${loginStreak} 🔥` : "—", color: loginStreak >= 7 ? "var(--green)" : "var(--gold)", sub: loginStreak >= 7 ? "On fire!" : loginStreak > 1 ? "Keep it up!" : "Day 1" },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <span className="stat-label">{s.label}</span>
                      <span className="stat-value" style={{ color: s.color, fontSize: s.label === "Best Item" ? "14px" : "22px" }}>{s.value}</span>
                      <span className="stat-sub">{s.sub}</span>
                    </div>
                  ))}
                </div>

                <ProfitChart flipsLog={flipsLog} autoFlipsLog={autoFlipsLog} />

                <LiveGESlots user={user} supabase={supabase} items={items} onLiveWiki={setLiveWikiPrices} />

                <AutoFlipHistory user={user} supabase={supabase} formatGP={formatGP} />
              </div>
            )}

            {activeTab === "settings" && (
              <SettingsPage user={user} supabase={supabase} showToast={showToast} />
            )}

            {activeTab === "changelog" && (
              <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "28px", padding: "8px 0" }}>
                <div>
                  <div className="section-title">What's New</div>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "4px" }}>The latest updates and improvements to RuneTrader.</p>
                </div>
                {CHANGELOG.map((release, ri) => (
                  <div key={ri} className="changelog-version">
                    <div className="changelog-version-header">
                      <span className="changelog-version-name">{release.version}</span>
                      <span className="changelog-version-date">{release.date}</span>
                    </div>
                    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {release.items.map((item, ii) => (
                        <div key={ii} className="changelog-item">
                          <span className={`changelog-badge-${item.type}`}>{item.type}</span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="alerts-wrap">
                {notifPermission !== "granted" && (
                  <div className="notif-banner">
                    <div className="notif-banner-left">
                      <span className="notif-banner-icon">🔔</span>
                      <div>
                        <div className="notif-banner-title">Get notified on your phone</div>
                        <div className="notif-banner-sub">Alerts will fire even when the app is closed — on iPhone, Android, and desktop.</div>
                      </div>
                    </div>
                    {!user ? (
                      <button className="notif-enable-btn" onClick={() => setShowAuth(true)}>Sign in to enable</button>
                    ) : notifPermission === "denied" ? (
                      <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Blocked in browser settings</span>
                    ) : (
                      <button className="notif-enable-btn" disabled={notifLoading} onClick={requestNotificationPermission}>
                        {notifLoading ? "Enabling..." : "Enable notifications"}
                      </button>
                    )}
                  </div>
                )}

                {notifPermission === "granted" && (
                  <div className="notif-active-banner">
                    <span>✅ Push notifications active — you&apos;ll be alerted even when RuneTrader is closed.</span>
                  </div>
                )}

                {/* ── SMART ALERT TOGGLES ── */}
                <div className="smart-alert-toggles">
                  <div className="smart-alert-toggle-title">⚡ Smart Market Alerts</div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "-6px" }}>
                    Automatically fires when market conditions shift. Monitors all items every 5 minutes.
                  </div>
                  {[
                    { key: "marginSpike",  icon: "📈", label: "Margin Spike",  desc: "Margin jumps 50%+ vs last poll — sudden profit opportunity", unit: "%",  min: 5,   max: 200, step: 5   },
                    { key: "volumeSurge",  icon: "🔥", label: "Volume Surge",  desc: "Daily volume triples — item getting heavily traded",           unit: "x",  min: 1.5, max: 10,  step: 0.5 },
                    { key: "dumpDetected", icon: "⚠️", label: "Dump Detected", desc: "Sell price drops 10%+ — someone offloading stock",             unit: "%",  min: 2,   max: 50,  step: 1   },
                    { key: "priceCrash",   icon: "💥", label: "Price Crash",   desc: "Both buy & sell drop 15%+ — avoid or buy the dip",             unit: "%",  min: 2,   max: 50,  step: 1   },
                  ].map(({ key, icon, label, desc, unit, min, max, step }) => (
                    <div key={key} className="smart-alert-toggle-row">
                      <div className="smart-alert-toggle-info">
                        <div className="smart-alert-toggle-name">{icon} {label}</div>
                        <div className="smart-alert-toggle-desc">{desc}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {merchantMode
                          ? <ThresholdPopover alertKey={key} label={label} unit={unit} min={min} max={max} step={step} thresholds={thresholds} openPopover={openPopover} setOpenPopover={setOpenPopover} saveThreshold={saveThreshold} />
                          : <button title="Custom thresholds — Merchant Mode feature" onClick={() => setUpgradeModal({ feature: "Custom Alert Thresholds", description: "Fine-tune exactly when each alert fires — set your own percentage triggers per alert type.", bullets: ["Adjust margin spike sensitivity (5–200%)", "Set dump & crash detection thresholds", "Tune volume surge multiplier", "Per-alert granular control"] })} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 8px", cursor: "pointer", fontSize: "12px", color: "var(--text-dim)", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "4px" }}>🔒 ⚙</button>
                        }
                        <label className="toggle-switch">
                          <input type="checkbox" checked={smartAlertSettings[key]} onChange={e => saveSmartAlertSettings(key, e.target.checked)} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── AUTOPILOT ALERT SETTINGS — Merchant Mode only ── */}
                {merchantMode && (
                <div className="smart-alert-toggles">
                  <div className="smart-alert-toggle-title">🤖 Autopilot Alerts</div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "-6px" }}>
                    Fires when your per-position rules are triggered in Active Operations.
                  </div>
                  <div className="smart-alert-toggle-row">
                    <div className="smart-alert-toggle-info">
                      <div className="smart-alert-toggle-name">🔊 Sound Alert</div>
                      <div className="smart-alert-toggle-desc">Play a chime in-browser when an autopilot rule fires</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={smartAlertSettings.autopilotSound ?? true} onChange={e => saveSmartAlertSettings("autopilotSound", e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="smart-alert-toggle-row">
                    <div className="smart-alert-toggle-info">
                      <div className="smart-alert-toggle-name">🔔 Push Notification</div>
                      <div className="smart-alert-toggle-desc">Fire a browser push notification — works even if RuneTrader is in the background</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={smartAlertSettings.autopilotPush ?? true} onChange={e => saveSmartAlertSettings("autopilotPush", e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                )} {/* end merchantMode autopilot alerts */}

                {/* ── PRICE ALERT FORM ── */}
                <div className="alert-info">ℹ️ Price alerts check every 5 minutes. Triggered alerts won&apos;t fire again — delete and re-add to reset.</div>
                <div className="alert-form">
                  <div className="alert-form-title">🔔 Set a Price Alert</div>
                  <div className="alert-form-row">
                    <div className="alert-field">
                      <label className="alert-label">Item Name</label>
                      <input className="alert-input" placeholder="e.g. Abyssal whip" value={alertForm.item}
                        onChange={e => handleItemInput(e.target.value, setAlertForm, setAlertAutocomplete, setShowAlertAutocomplete)}
                        onKeyDown={e => { if (e.key === "Escape") setShowAlertAutocomplete(false); }}
                        onBlur={() => setTimeout(() => setShowAlertAutocomplete(false), 150)}
                        autoComplete="off" />
                      {showAlertAutocomplete && (
                        <div className="autocomplete-list">
                          {alertAutocomplete.map(name => (
                            <div key={name} className="autocomplete-item" onMouseDown={() => selectAutocomplete(name, setAlertForm, setShowAlertAutocomplete, () => ({}))}>{name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="alert-field">
                      <label className="alert-label">Type</label>
                      <select className="alert-select" value={alertForm.type} onChange={e => setAlertForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="above">Price goes above</option>
                        <option value="below">Price goes below</option>
                      </select>
                    </div>
                    <div className="alert-field">
                      <label className="alert-label">Target Price (gp)</label>
                      <input className="alert-input" placeholder="e.g. 2000000" value={alertForm.price} onChange={e => setAlertForm(f => ({ ...f, price: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addAlert(); }} />
                    </div>
                    <button className="add-alert-btn" disabled={!alertForm.item || !alertForm.price} onClick={addAlert}>+ Alert</button>
                  </div>
                </div>

                {/* ── ACTIVE PRICE ALERTS ── */}
                <div>
                  <div className="section-title">Active Price Alerts</div>
                  <div className="alerts-list">
                    <div className="alert-header-row"><span>Item</span><span>Condition</span><span>Target</span><span>Current</span><span></span></div>
                    {alerts.length === 0 ? (
                      <div className="alerts-empty"><div className="icon">🔔</div><p>No alerts set</p><small>Add an alert above to get notified when prices move</small></div>
                    ) : alerts.map(a => (
                      <div key={a.id} className={"alert-row" + (a.triggered ? " alert-triggered" : "")}>
                        <div><div className="alert-item-name">{a.item}</div>{a.triggered && <div className="alert-triggered-badge">⚡ Triggered!</div>}</div>
                        <span className={"alert-badge " + a.type}>{a.type === "above" ? "↑ Above" : "↓ Below"}</span>
                        <span style={{ color: "var(--gold)", fontWeight: 600 }}>{formatGP(a.price)}</span>
                        <span style={{ color: a.currentPrice ? "var(--text)" : "var(--text-dim)" }}>{a.currentPrice ? formatGP(a.currentPrice) : "—"}</span>
                        <button className="delete-btn" onClick={() => deleteAlert(a.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── RECENT SMART ALERTS FEED (bottom, grows down) ── */}
                <div>
                  <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Recent Smart Alerts</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button className="smart-refresh-btn" disabled={refreshing || refreshCooldown > 0}
                        onClick={() => fetchPrices(true)}
                        title={refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : "Refresh prices"}>
                        <span className={refreshing ? "refresh-spin" : ""}>↻</span>
                        {refreshing ? "Refreshing..." : refreshCooldown > 0 ? `${refreshCooldown}s` : "Refresh"}
                      </button>
                      {smartEvents.length > 0 && (
                        <button className="clear-btn" onClick={() => setSmartEvents([])}>Clear</button>
                      )}
                    </div>
                  </div>

                  {smartEvents.length > 0 && (
                    <div className="smart-feed-controls" style={{ marginBottom: "10px", gap: "10px" }}>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {[["all","All"],["spike","📈 Margin"],["surge","🔥 Volume"],["dump","⚠️ Dump"],["crash","💥 Crash"]].map(([v,l]) => (
                          <button key={v} onClick={() => setSmartFeedFilter(v)}
                            style={{ padding: "4px 11px", borderRadius: "12px", border: "1px solid var(--border)", background: smartFeedFilter === v ? "rgba(201,168,76,0.15)" : "transparent", color: smartFeedFilter === v ? "var(--gold)" : "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}>
                            {l}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "5px", marginLeft: "auto", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Sort:</span>
                        {[["recent","Recent"],["change","% Change"],["margin","Margin"]].map(([v,l]) => (
                          <button key={v} onClick={() => { if (smartFeedSort === v) { setSmartFeedSortDir(d => d === "desc" ? "asc" : "desc"); } else { setSmartFeedSort(v); setSmartFeedSortDir("desc"); } }}
                            style={{ padding: "4px 11px", borderRadius: "12px", border: "1px solid var(--border)", background: smartFeedSort === v ? "rgba(201,168,76,0.15)" : "transparent", color: smartFeedSort === v ? "var(--gold)" : "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "4px" }}>
                            {l}{smartFeedSort === v && <span style={{ fontSize: "9px" }}>{smartFeedSortDir === "desc" ? "▼" : "▲"}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="smart-events-list">
                    {(() => {
                      let feed = [...smartEvents];
                      // Filter
                      if (smartFeedFilter !== "all") feed = feed.filter(e => e.badge === smartFeedFilter);
                      // Sort
                      const dir = smartFeedSortDir === "asc" ? 1 : -1;
                      if (smartFeedSort === "change") {
                        feed.sort((a, b) => {
                          const pctA = a.oldVal ? Math.abs((a.newVal - a.oldVal) / Math.abs(a.oldVal)) : 0;
                          const pctB = b.oldVal ? Math.abs((b.newVal - b.oldVal) / Math.abs(b.oldVal)) : 0;
                          return dir * (pctA - pctB);
                        });
                      } else if (smartFeedSort === "margin") {
                        feed.sort((a, b) => {
                          const mA = allItems.find(i => i.id === a.itemId)?.margin || 0;
                          const mB = allItems.find(i => i.id === b.itemId)?.margin || 0;
                          return dir * (mA - mB);
                        });
                      } else {
                        // recent — sort by time
                        feed.sort((a, b) => dir * (new Date(a.time) - new Date(b.time)));
                      }
                      if (feed.length === 0) return (
                        <div className="smart-empty">
                          {smartEvents.length > 0 ? "No alerts match this filter." : "No smart alerts yet — they'll appear here when market conditions shift."}
                        </div>
                      );
                      return feed.map(e => {
                        const liveItem = allItems.find(i => i.id === e.itemId) || allItems.find(i => i.name === e.itemName);
                        return (
                          <div key={e.id} className="smart-event-row"
                            style={{ cursor: liveItem ? "pointer" : "default" }}
                            onClick={() => { if (liveItem) setSelectedItem(liveItem); }}
                            title={liveItem ? `View ${e.itemName} details` : ""}>
                            <span className="smart-event-icon">{e.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="smart-event-name" style={{ color: liveItem ? "var(--gold)" : "var(--text)" }}>{e.itemName}</span>
                                <span className={`smart-badge-${e.badge}`}>{e.badge.toUpperCase()}</span>
                                {liveItem && <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>· click to view →</span>}
                              </div>
                              <div className="smart-event-msg">{e.message}</div>
                              {liveItem && (
                                <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "11px" }}>
                                  <span style={{ color: "var(--text-dim)" }}>Buy: <span style={{ color: "var(--text)" }}>{formatGP(liveItem.low)}</span></span>
                                  <span style={{ color: "var(--text-dim)" }}>Sell: <span style={{ color: "var(--text)" }}>{formatGP(liveItem.high)}</span></span>
                                  <span style={{ color: "var(--text-dim)" }}>Margin: <span style={{ color: liveItem.margin > 0 ? "var(--green)" : "var(--red)" }}>{formatGP(liveItem.margin)}</span></span>
                                  <span style={{ color: "var(--text-dim)" }}>ROI: <span style={{ color: liveItem.roi > 4 ? "var(--gold)" : liveItem.roi >= 1 ? "var(--green)" : "#f39c12" }}>{liveItem.roi}%</span></span>
                                </div>
                              )}
                            </div>
                            <span className="smart-event-time">{formatTime(e.time)}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ── PORTFOLIO TAB ── */}
            {activeTab === "portfolio" && (
              <PortfolioPage
                user={user}
                flipsLog={flipsLog}
                autoFlipsLog={autoFlipsLog}
                items={items}
                onSignIn={() => setShowAuth(true)}
              />
            )}

            {/* ── FLIPS TAB ── */}
            {activeTab === "market" && (
              <>
                {error && <div className="error-banner">⚠️ {error}</div>}

                {/* Market sub-tabs row */}
                <div style={{ display: "flex", gap: "4px", paddingBottom: "4px" }}>
                  {[["flips","📈 Flips"],["alch","🔥 High Alch"],["coffer","💀 Death's Coffer"],["tradeboard","🤝 Trade Board"],["picks","⭐ Picks"]].map(([v,l]) => (
                    <button key={v}
                      className={`market-sub-tab${marketSubTab === v ? " active" : ""}`}
                      onClick={() => setMarketSubTab(v)}
                    >
                      {l}{(v === "tradeboard") && <span className="sub-tab-badge">new</span>}{(v === "picks") && <span className="sub-tab-badge">new</span>}
                    </button>
                  ))}
                </div>


                {/* ── HIGH ALCH TAB ── */}
                {marketSubTab === "alch" && (() => {
                  const alchSortCol = alchSortState.col;
                  const alchSortDir = alchSortState.dir;
                  const handleAlchSort = col => setAlchSortState(s => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));
                  const effectiveNaturePrice = customNatureRunePrice !== "" ? (parseInt(customNatureRunePrice) || 0) : natureRunePrice;
                  const isCustomPrice = customNatureRunePrice !== "";
                  const alchItems = (allItems || [])
                    .filter(item => item.highalch > 0 && item.hasPrice && item.low > 0)
                    .map(item => ({
                      ...item,
                      alchProfit: item.highalch - item.low - effectiveNaturePrice,
                      maxProfit4hr: (item.highalch - item.low - effectiveNaturePrice) * (item.buyLimit || 0),
                    }))
                    .filter(item => alchShowLosses || item.alchProfit > 0)
                    .filter(item => !alchSearch || item.name.toLowerCase().includes(alchSearch.toLowerCase()))
                    .sort((a, b) => {
                      const dir = alchSortDir === "asc" ? 1 : -1;
                      if (alchSortCol === "name") return dir * a.name.localeCompare(b.name);
                      if (alchSortCol === "low") return dir * (a.low - b.low);
                      if (alchSortCol === "highalch") return dir * (a.highalch - b.highalch);
                      if (alchSortCol === "alchProfit") return dir * (a.alchProfit - b.alchProfit);
                      if (alchSortCol === "buyLimit") return dir * (a.buyLimit - b.buyLimit);
                      if (alchSortCol === "maxProfit4hr") return dir * (a.maxProfit4hr - b.maxProfit4hr);
                      if (alchSortCol === "lastTradeTime") return dir * ((a.lastTradeTime || 0) - (b.lastTradeTime || 0));
                      return dir * (a.maxProfit4hr - b.maxProfit4hr);
                    });
                  const ALCH_COLS = [
                    ["name",          "Item",             "The tradeable item name."],
                    ["low",           "GE Buy Price",     "Current cheapest buy price on the Grand Exchange."],
                    ["highalch",      "Alch Value",       "GP received when casting High Alchemy on this item."],
                    ["alchProfit",    "Profit / Cast",    "Alch Value minus GE Buy Price minus your nature rune cost. Adjust the nature rune price in the filter bar to match what you actually paid."],
                    ["buyLimit",      "Buy Limit",        "Max quantity you can buy in a 4-hour GE window."],
                    ["maxProfit4hr",  "Max Profit / 4hr", "Profit per cast × Buy Limit. Maximum GP you can make in one 4-hour GE window buying at the limit."],
                    ["lastTradeTime", "Last Updated",     "How recently this item's GE price was recorded. Stale data may not reflect current market."],
                  ];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div className="filter-bar">
                        <input className="filter-input" placeholder="Search items..." value={alchSearch} onChange={e => setAlchSearch(e.target.value)} />
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-dim)", cursor: "pointer", userSelect: "none" }}>
                          <input type="checkbox" checked={alchShowLosses} onChange={e => setAlchShowLosses(e.target.checked)} style={{ accentColor: "var(--gold)", cursor: "pointer" }} />
                          Show unprofitable
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px", background: "var(--bg3)", border: `1px solid ${isCustomPrice ? "var(--gold-dim)" : "var(--border)"}`, borderRadius: "8px", padding: "4px 10px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>🌿 Nature rune:</span>
                          <input
                            type="number"
                            min="0"
                            value={customNatureRunePrice !== "" ? customNatureRunePrice : natureRunePrice}
                            onChange={e => setCustomNatureRunePrice(e.target.value)}
                            onFocus={e => { if (customNatureRunePrice === "") setCustomNatureRunePrice(String(natureRunePrice)); }}
                            style={{ background: "transparent", border: "none", outline: "none", color: isCustomPrice ? "var(--gold)" : "var(--gold)", fontWeight: 600, fontSize: "12px", width: "60px", fontFamily: "Inter, sans-serif" }}
                          />
                          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>gp</span>
                          {isCustomPrice && (
                            <button
                              onClick={() => setCustomNatureRunePrice("")}
                              title="Reset to live market price"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", fontSize: "11px", padding: "0 2px", fontFamily: "Inter, sans-serif", transition: "color 0.15s" }}
                              onMouseOver={e => e.currentTarget.style.color = "var(--gold)"}
                              onMouseOut={e => e.currentTarget.style.color = "var(--text-dim)"}
                            >↺ live</button>
                          )}
                          {!isCustomPrice && natureRunePrice === 200 && (
                            <span style={{ color: "var(--red)", fontSize: "10px" }}>(fallback)</span>
                          )}
                        </div>
                        {isCustomPrice && (
                          <span style={{ fontSize: "11px", color: "var(--gold-dim)" }}>
                            Using custom price · Live: {natureRunePrice.toLocaleString()}gp
                          </span>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-dim)" }}>{alchItems.length.toLocaleString()} items</span>
                      </div>
                      <div className="alch-table">
                        <div className="alch-header" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", display: "grid" }}>
                          {ALCH_COLS.map(([col, label, tip]) => (
                            <button key={col} className={`sort-btn ${alchSortCol === col ? "active" : ""}`} onClick={() => handleAlchSort(col)}>
                              {label} {alchSortCol === col && <span className="sort-arrow">{alchSortDir === "desc" ? "▼" : "▲"}</span>}
                              <span className="stat-tooltip-wrap" onClick={e => e.stopPropagation()}>
                                <span className="stat-help">?</span>
                                <span className="stat-tooltip">{tip}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                        {alchItems.length === 0 ? (
                          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)", fontSize: "13px" }}>
                            No profitable alch items found
                          </div>
                        ) : alchItems.slice(0, alchRowsShown).map(item => (
                          <div key={item.id} className="alch-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr" }} onClick={() => setSelectedItem(item)}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                              <div>
                                <div className="item-name">{item.name}</div>
                                <div className="item-category">{item.category}</div>
                              </div>
                            </div>
                            <span className="price">{formatGP(item.low)}</span>
                            <span className="price">{formatGP(item.highalch)}</span>
                            <span className={item.alchProfit >= 0 ? "profit-positive" : "profit-negative"}>
                              {item.alchProfit >= 0 ? "+" : ""}{formatGP(item.alchProfit)}
                            </span>
                            <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit ? item.buyLimit.toLocaleString() : "?"}</span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: item.maxProfit4hr >= 0 ? "var(--green)" : "var(--red)" }}>
                              {item.buyLimit ? formatGP(item.maxProfit4hr) : "—"}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{item.lastTradeTime ? timeAgo(item.lastTradeTime) : "—"}</span>
                          </div>
                        ))}
                      </div>
                      {alchItems.length > alchRowsShown && (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                          <button
                            onClick={() => setAlchRowsShown(n => n + 200)}
                            style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: "8px", padding: "8px 24px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
                          >
                            Load more ({alchItems.length - alchRowsShown} remaining)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── DEATH'S COFFER TAB ── */}
                {marketSubTab === "coffer" && (() => {
                  const handleCofferSort = col => setCofferSortState(s => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));
                  const cofferSortCol = cofferSortState.col;
                  const cofferSortDir = cofferSortState.dir;
                  // Robust target parser: handles 2.5m, 500k, 1,000,000, plain numbers
                  const rawTarget = (cofferTarget || "").trim().toLowerCase().replace(/,/g, "");
                  const targetMult = rawTarget.endsWith("m") ? 1_000_000 : rawTarget.endsWith("k") ? 1_000 : 1;
                  const targetGP = parseFloat(rawTarget) * targetMult || 0;
                  const cofferItems = (allItems || [])
                    .filter(item => item.hasPrice && item.itemValue > 0 && item.low > 0 && item.volume > 100 && (item.buyLimit || 0) > 0)
                    .map(item => {
                      const savings = item.itemValue - item.low;
                      const potentialSavings = savings * (item.buyLimit || 0);
                      const qtyNeeded = targetGP > 0 ? Math.ceil(targetGP / item.itemValue) : null;
                      const totalCost = qtyNeeded ? qtyNeeded * item.low : null;
                      return { ...item, savings, potentialSavings, qtyNeeded, totalCost };
                    })
                    .filter(item => cofferShowLosses || item.savings > 0)
                    .filter(item => !cofferSearch || item.name.toLowerCase().includes(cofferSearch.toLowerCase()))
                    .sort((a, b) => {
                      const dir = cofferSortDir === "asc" ? 1 : -1;
                      if (cofferSortCol === "name") return dir * a.name.localeCompare(b.name);
                      if (cofferSortCol === "low") return dir * (a.low - b.low);
                      if (cofferSortCol === "high") return dir * (a.itemValue - b.itemValue);
                      if (cofferSortCol === "savings") return dir * (a.savings - b.savings);
                      if (cofferSortCol === "buyLimit") return dir * (a.buyLimit - b.buyLimit);
                      if (cofferSortCol === "potentialSavings") return dir * (a.potentialSavings - b.potentialSavings);
                      return dir * (a.potentialSavings - b.potentialSavings);
                    });
                  const COFFER_COLS = [
                    ["name",             "Item",              "The tradeable item you sacrifice to Death's Coffer."],
                    ["low",              "GE Buy Price",      "What you pay on the Grand Exchange to acquire this item."],
                    ["high",             "Coffer Value",      "The fixed base value Jagex credits to your Death's Coffer when you sacrifice this item. This is the game's internal item value, not the GE price."],
                    ["savings",          "Savings",           "Coffer Value minus GE Buy Price. Positive means you're funding your coffer for less than face value."],
                    ["buyLimit",         "Buy Limit",         "Max quantity you can buy in a 4-hour GE window."],
                    ["potentialSavings", "Potential Savings", "Savings per item × Buy Limit. Maximum GP saved in one 4-hour buying window."],
                  ];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div className="coffer-target-bar">
                        <span className="coffer-target-label">💀 Target coffer amount:</span>
                        <input
                          className="coffer-target-input"
                          placeholder="e.g. 5m, 2.5m, 500k"
                          value={cofferTarget}
                          onChange={e => setCofferTarget(e.target.value)}
                        />
                        {targetGP > 0 && <span className="coffer-target-summary">Qty + cost to reach {formatGP(targetGP)}</span>}
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-dim)", cursor: "pointer", userSelect: "none", marginLeft: "8px" }}>
                          <input type="checkbox" checked={cofferShowLosses} onChange={e => setCofferShowLosses(e.target.checked)} style={{ accentColor: "var(--gold)", cursor: "pointer" }} />
                          Show negative savings
                        </label>
                        <input className="filter-input" placeholder="Search items..." value={cofferSearch} onChange={e => setCofferSearch(e.target.value)} style={{ marginLeft: "auto", width: "200px" }} />
                        <span style={{ fontSize: "11px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>{cofferItems.length.toLocaleString()} items</span>
                      </div>
                      <div className="alch-table">
                        <div className="alch-header" style={{ gridTemplateColumns: targetGP > 0 ? "2fr 1fr 1fr 1fr 1fr 1fr 1fr" : "2fr 1fr 1fr 1fr 1fr 1fr", display: "grid" }}>
                          {COFFER_COLS.map(([col, label, tip]) => (
                            <button key={col} className={`sort-btn ${cofferSortCol === col ? "active" : ""}`} onClick={() => handleCofferSort(col)}>
                              {label} {cofferSortCol === col && <span className="sort-arrow">{cofferSortDir === "desc" ? "▼" : "▲"}</span>}
                              <span className="stat-tooltip-wrap" onClick={e => e.stopPropagation()}>
                                <span className="stat-help">?</span>
                                <span className="stat-tooltip">{tip}</span>
                              </span>
                            </button>
                          ))}
                          {targetGP > 0 && <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>To Reach Target</span>}
                        </div>
                        {cofferItems.length === 0 ? (
                          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)", fontSize: "13px" }}>No items found</div>
                        ) : cofferItems.slice(0, cofferRowsShown).map(item => (
                          <div key={item.id} className="alch-row" style={{ gridTemplateColumns: targetGP > 0 ? "2fr 1fr 1fr 1fr 1fr 1fr 1fr" : "2fr 1fr 1fr 1fr 1fr 1fr" }} onClick={() => setSelectedItem(item)}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                              <div>
                                <div className="item-name">{item.name}</div>
                                <div className="item-category">{item.category}</div>
                              </div>
                            </div>
                            <span className="price">{formatGP(item.low)}</span>
                            <span className="price">{formatGP(item.itemValue)}</span>
                            <span className={item.savings >= 0 ? "profit-positive" : "profit-negative"}>
                              {item.savings >= 0 ? "+" : ""}{formatGP(item.savings)}
                            </span>
                            <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit.toLocaleString()}</span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: item.potentialSavings >= 1_000_000 ? "var(--green)" : item.potentialSavings >= 100_000 ? "var(--gold)" : "var(--text-dim)" }}>
                              {formatGP(item.potentialSavings)}
                            </span>
                            {targetGP > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>×{item.qtyNeeded?.toLocaleString()}</span>
                                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Cost: {formatGP(item.totalCost)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {cofferItems.length > cofferRowsShown && (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                          <button
                            onClick={() => setCofferRowsShown(n => n + 200)}
                            style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: "8px", padding: "8px 24px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
                          >
                            Load more ({cofferItems.length - cofferRowsShown} remaining)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── FLIPS TAB (existing content) ── */}
                {marketSubTab === "tradeboard" && (
                  <TradeBoard
                    user={user}
                    supabase={supabase}
                    showToast={showToast}
                  />
                )}

                {/* ── PICKS TAB ── */}
                {marketSubTab === "picks" && (
                  <RecommendedFlips
                    user={user}
                    items={items}
                    flipsLog={flipsLog}
                    onSignIn={() => setShowAuth(true)}
                    onOpenChart={setSelectedItem}
                  />
                )}

                {marketSubTab === "flips" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="filter-bar">
                  <span className="filter-label">Filter:</span>
                  {["all", "f2p", "members", "highvol", "favourites"].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                      {f === "all" ? "All Items" : f === "f2p" ? "F2P" : f === "members" ? "Members" : f === "highvol" ? "High Volume" : `🔖 Watchlist${favourites.length > 0 ? ` (${favourites.length})` : ""}`}
                    </button>
                  ))}
                  <input className="filter-input" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: "auto" }} />
                  <button
                    className={`adv-filters-btn${showAdvFilters || advFilterCount > 0 ? " active" : ""}`}
                    onClick={() => merchantMode ? setShowAdvFilters(v => !v) : setUpgradeModal({ feature: "Advanced Filters", description: "Filter by margin range, ROI, GP/fill, buy limit and more to find exactly the flips you want.", bullets: ["Min/max margin & ROI filters", "GP/fill threshold filtering", "Price data freshness filter", "Stacks with all other filters"] })}
                  >
                    {!merchantMode && <span style={{ fontSize: "11px", marginRight: "2px" }}>🔒</span>}
                    ⚙ Filters {advFilterCount > 0 && merchantMode && <span className="adv-filter-badge">{advFilterCount}</span>}
                  </button>
                  <button
                    className="refresh-btn"
                    onClick={() => fetchPrices(true)}
                    disabled={refreshing || loading || refreshCooldown > 0}
                    title={refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : "Refresh all prices"}
                  >
                    <span className={refreshing ? "refresh-spin" : ""}>↻</span>
                    {refreshing ? "Refreshing..." : refreshCooldown > 0 ? `${refreshCooldown}s` : "Refresh"}
                  </button>
                  <button
                    className="refresh-btn"
                    title={merchantMode ? "Export current view to CSV" : "Merchant Mode feature"}
                    onClick={() => {
                      if (!merchantMode) { setUpgradeModal({ feature: "CSV Export", description: "Export your filtered market view to a spreadsheet for offline analysis.", bullets: ["Export all 4,525 items or filtered view", "Includes margin, ROI, volume, GP/fill", "Works with Excel & Google Sheets"] }); return; }
                      const rows = filtered.slice(0, marketRowsShown);
                      const headers = ["Name", "Category", "Buy Price", "Sell Price", "Margin", "ROI %", "Vol/Day", "Buy Limit", "GP/Fill", "Last Trade"];
                      const csvRows = rows.map(item => {
                        const lim = item.buyLimit > 0 ? item.buyLimit : 500;
                        const mkt4hr = item.volume / 6;
                        let expFill;
                        if      (item.volume >= 500_000) expFill = Math.min(lim, mkt4hr);
                        else if (item.volume >= 100_000) expFill = Math.min(lim, mkt4hr * 0.6);
                        else if (item.volume >= 20_000)  expFill = Math.min(lim, mkt4hr * 0.2);
                        else if (item.volume >= 5_000)   expFill = Math.min(lim, mkt4hr * 0.08);
                        else                             expFill = Math.min(lim, mkt4hr * 0.03);
                        const gpPerFill = item.hasPrice ? Math.round(item.margin * Math.max(expFill, 1)) : "";
                        const lastTrade = item.lastTradeTime ? new Date(item.lastTradeTime * 1000).toISOString() : "";
                        return [
                          `"${item.name}"`,
                          item.category,
                          item.hasPrice ? item.low : "",
                          item.hasPrice ? item.high : "",
                          item.hasPrice ? item.margin : "",
                          item.hasPrice ? item.roi : "",
                          item.volume,
                          item.buyLimit || "",
                          gpPerFill,
                          lastTrade,
                        ].join(",");
                      });
                      const csv = [headers.join(","), ...csvRows].join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `runetrader-market-${new Date().toISOString().slice(0,10)}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    {!merchantMode ? "🔒 Export" : "↓ Export"}
                  </button>
                </div>

                {showAdvFilters && (
                  <div className="adv-filter-panel">
                    <div className="adv-filter-group">
                      <div className="adv-filter-label">Margin (gp)</div>
                      <div className="adv-filter-row">
                        <input className="adv-filter-input" placeholder="Min" value={advFilters.minMargin} onChange={e => setAdv("minMargin", e.target.value)} type="number" />
                        <span className="adv-filter-sep">–</span>
                        <input className="adv-filter-input" placeholder="Max" value={advFilters.maxMargin} onChange={e => setAdv("maxMargin", e.target.value)} type="number" />
                      </div>
                    </div>
                    <div className="adv-filter-group">
                      <div className="adv-filter-label">ROI (%)</div>
                      <div className="adv-filter-row">
                        <input className="adv-filter-input" placeholder="Min" value={advFilters.minRoi} onChange={e => setAdv("minRoi", e.target.value)} type="number" step="0.1" />
                        <span className="adv-filter-sep">–</span>
                        <input className="adv-filter-input" placeholder="Max" value={advFilters.maxRoi} onChange={e => setAdv("maxRoi", e.target.value)} type="number" step="0.1" />
                      </div>
                    </div>
                    <div className="adv-filter-group">
                      <div className="adv-filter-label">Vol/Day</div>
                      <div className="adv-filter-row">
                        <input className="adv-filter-input" placeholder="Min" value={advFilters.minVolume} onChange={e => setAdv("minVolume", e.target.value)} type="number" />
                        <span className="adv-filter-sep">–</span>
                        <input className="adv-filter-input" placeholder="Max" value={advFilters.maxVolume} onChange={e => setAdv("maxVolume", e.target.value)} type="number" />
                      </div>
                    </div>
                    <div className="adv-filter-group">
                      <div className="adv-filter-label">Buy Price (gp)</div>
                      <div className="adv-filter-row">
                        <input className="adv-filter-input" placeholder="Min" value={advFilters.minPrice} onChange={e => setAdv("minPrice", e.target.value)} type="number" />
                        <span className="adv-filter-sep">–</span>
                        <input className="adv-filter-input" placeholder="Max" value={advFilters.maxPrice} onChange={e => setAdv("maxPrice", e.target.value)} type="number" />
                      </div>
                    </div>
                    <div className="adv-filter-group">
                      <div className="adv-filter-label">Min GP/Fill</div>
                      <input className="adv-filter-input" placeholder="e.g. 500000" value={advFilters.minGpFill} onChange={e => setAdv("minGpFill", e.target.value)} type="number" />
                    </div>
                    <div className="adv-filter-group">
                      <div className="adv-filter-label">Last Traded Within</div>
                      <div className="adv-filter-row" style={{ flexWrap: "wrap", gap: "6px" }}>
                        {[["1", "1hr"], ["6", "6hr"], ["24", "24hr"], ["168", "7d"]].map(([val, label]) => (
                          <button key={val}
                            className={`filter-btn${advFilters.maxLastTrade === val ? " active" : ""}`}
                            style={{ fontSize: "11px", padding: "4px 10px" }}
                            onClick={() => setAdv("maxLastTrade", advFilters.maxLastTrade === val ? "" : val)}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="adv-filter-group" style={{ justifyContent: "center", gap: "8px" }}>
                      <label className={`adv-filter-toggle${advFilters.positiveOnly ? " active" : ""}`}>
                        <input type="checkbox" checked={advFilters.positiveOnly} onChange={e => setAdv("positiveOnly", e.target.checked)} />
                        Positive margin only
                      </label>
                      <label className={`adv-filter-toggle${advFilters.priceDataOnly ? " active" : ""}`}>
                        <input type="checkbox" checked={advFilters.priceDataOnly} onChange={e => setAdv("priceDataOnly", e.target.checked)} />
                        Has live price data
                      </label>
                    </div>
                    <div className="adv-filter-footer">
                      <span>{filtered.length.toLocaleString()} items match</span>
                      {advFilterCount > 0 && <button className="adv-filters-btn" onClick={resetAdvFilters}>✕ Clear all filters</button>}
                    </div>
                  </div>
                )}

                <div>
                  <div className="section-title">All Items <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "Inter, sans-serif", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{loading ? "loading…" : `${filtered.length.toLocaleString()} items`}</span></div>
                  <div className="flips-table">
                    <div className="table-header" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px" }}>
                      {[
                        ["name", "Item", null],
                        ["low", "Buy Price", "Lowest current buy offer on the GE"],
                        ["high", "Sell Price", "Highest current sell offer on the GE"],
                        ["margin", "Margin", "Sell price minus buy price minus GE tax. Your profit per item."],
                        ["roi", "ROI", "Margin ÷ buy price. Return on investment per flip."],
                        ["volume", "Vol/Day", "Total items traded per day. Higher = easier fills."],
                        ["buylimit", "Limit", "Max items you can buy every 4 hours"],
                        ["gpPerFill", "GP/Fill", "Realistic GP profit per 4hr window, scaled by market volume"],
                        ["lastTradeTime", "Last Trade", "When this item last traded. Stale = low activity."],
                        ["sparkline", "24hr Trend", null],
                      ].map(([col, label, tip]) => (
                        <button key={col} className={`sort-btn ${sortCol === col ? "active" : ""}`} onClick={() => handleSort(col)}>
                          {label} {sortCol === col && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                          {tip && (
                            <span className="stat-tooltip-wrap" onClick={e => e.stopPropagation()}>
                              <span className="stat-help">?</span>
                              <span className="stat-tooltip">{tip}</span>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flip-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px" }}>{Array.from({ length: 10 }).map((_, j) => <div key={j} className="skeleton" style={{ width: j === 0 ? "80%" : "60%", animationDelay: `${i * 0.1}s` }} />)}</div>
                      ))
                    ) : filtered.length === 0 ? (
                      <div className="empty-state"><div className="icon">🔍</div><p>No items match your filters</p></div>
                    ) : (
                      filtered.slice(0, marketRowsShown).map(item => {
                        const ageSec = item.lastTradeTime ? Math.floor(Date.now() / 1000 - item.lastTradeTime) : null;
                        const tradeColor = !ageSec ? "var(--text-dim)" : ageSec < 300 ? "var(--green)" : ageSec < 3600 ? "var(--text)" : "var(--text-dim)";
                        const lim = item.buyLimit > 0 ? item.buyLimit : 500;
                        const mkt4hr = item.volume / 6;
                        let expFill;
                        if      (item.volume >= 500_000) expFill = Math.min(lim, mkt4hr);
                        else if (item.volume >= 100_000) expFill = Math.min(lim, mkt4hr * 0.6);
                        else if (item.volume >= 20_000)  expFill = Math.min(lim, mkt4hr * 0.2);
                        else if (item.volume >= 5_000)   expFill = Math.min(lim, mkt4hr * 0.08);
                        else                             expFill = Math.min(lim, mkt4hr * 0.03);
                        const gpPerFill = Math.round(item.margin * Math.max(expFill, 1));
                        const gpPerFillMax = Math.round(item.margin * Math.min(lim, mkt4hr));

                        return (
                          <div key={item.id} className="flip-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px" }} onClick={() => setSelectedItem(item)}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button onClick={e => { e.stopPropagation(); toggleWatchlist(item.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", opacity: watchlist.includes(item.id) ? 1 : 0.25, transition: "opacity 0.15s", padding: "0", flexShrink: 0 }} title={watchlist.includes(item.id) ? "Remove from Watchlist" : "Add to Watchlist"}>🔖</button>
                              <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                              <div className="item-name">{item.name}</div>
                            </div>
                            <span className="price">{item.hasPrice ? formatGP(item.low) : "—"}</span>
                            <span className="price">{item.hasPrice ? formatGP(item.high) : "—"}</span>
                            <span className={`margin ${item.margin < 0 ? "neg" : ""}`}>{item.hasPrice ? formatGP(item.margin) : "—"}</span>
                            <span className="roi" style={{ color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12" }}>{item.hasPrice ? `${item.roi}%` : "—"}</span>
                            <span className="price" style={{ color: item.volume >= 500 ? "var(--green)" : item.volume >= 100 ? "var(--text)" : "var(--text-dim)" }}>
                              {item.volume >= 1000 ? (item.volume/1000).toFixed(1)+"k" : item.volume.toLocaleString()}
                              {item.buyLimit > 0 && item.volume < item.buyLimit && <span style={{ color: "var(--red)", fontSize: "10px", marginLeft: "3px" }} title="Volume lower than buy limit — hard to fill">⚠</span>}
                            </span>
                            <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit ? item.buyLimit.toLocaleString() : "?"}</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              {item.hasPrice ? (
                                <span style={{ fontSize: "12px", fontWeight: 600, color: gpPerFill >= 1000000 ? "var(--green)" : gpPerFill >= 200000 ? "var(--gold)" : "var(--text-dim)" }}
                                  title={`Realistic: ${formatGP(gpPerFill)} GP/fill\nBest case (full limit): ${formatGP(gpPerFillMax)} GP`}>
                                  {formatGP(gpPerFill)}
                                </span>
                              ) : <span style={{ color: "var(--text-dim)" }}>—</span>}
                            </div>
                            <span style={{ fontSize: "11px", color: tradeColor }}>{item.lastTradeTime ? timeAgo(item.lastTradeTime) : "—"}</span>
                            <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center" }}>
                              <Sparkline itemId={item.id} width={78} height={30} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {!loading && filtered.length > marketRowsShown && (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                      <button
                        onClick={() => setMarketRowsShown(n => n + 200)}
                        style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: "8px", padding: "8px 24px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
                      >
                        Load more ({filtered.length - marketRowsShown} remaining)
                      </button>
                    </div>
                  )}
                </div>
                </div>
                )} {/* end flips sub-tab */}
              </>
            )}
          </div>
          </>
          )}
        </div>

        {/* ── DEMO MERCHANT INTRO OVERLAY ── */}
        {demoMerchantIntro && (
          <div className={`demo-merchant-intro${demoMerchantIntro === "fading" ? " demo-merchant-intro-exit" : ""}`}>
            <div className="demo-merchant-scan" />
            <div className="demo-merchant-grid" />
            <div className="demo-merchant-eyebrow">RuneTrader.gg — Flagship Feature</div>
            <div className="demo-merchant-title">Merchant Mode</div>
            <div className="demo-merchant-sub">Initialising trading terminal</div>
            <div className="demo-merchant-bars">
              {[1,1.6,0.7,1.3,0.5,1.8,1,0.9,1.5,0.6,1.2,0.4,1.7,0.8].map((h,i) => (
                <div key={i} className="demo-merchant-bar" style={{ height: `${h * 28}px`, animationDelay: `${1.6 + i * 0.06}s` }} />
              ))}
            </div>
            <div className="demo-merchant-status">● System Ready</div>
          </div>
        )}

        {/* ── DEMO TOUR ── */}
        {demoMode && demoTourStep >= 0 && (() => {
          const step = DEMO_TOUR_STEPS[demoTourStep];
          const isCenter = step.placement === "center" || !step.target || !demoTourRect;
          const hl = demoTourRect || {};
          const PAD = 10;
          const TW = 400; // tooltip width
          const TH = 280; // tooltip approx height
          const VW = window.innerWidth;
          const VH = window.innerHeight;

          function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

          let ttStyle = {};
          if (isCenter) {
            ttStyle = {}; // handled by .center class
          } else {
            const spaceBelow = VH - (hl.top + hl.height);
            const spaceAbove = hl.top;
            const spaceRight = VW - (hl.left + hl.width);

            if (step.placement === "top" || (step.placement === "bottom" && spaceBelow < TH + PAD * 2)) {
              // prefer above
              if (spaceAbove >= TH + PAD * 2) {
                ttStyle = {
                  top: clamp(hl.top - TH - PAD * 2, 70, VH - TH - 16),
                  left: clamp(hl.left, 16, VW - TW - 16),
                };
              } else {
                ttStyle = {
                  top: clamp(hl.top + hl.height + PAD, 70, VH - TH - 16),
                  left: clamp(hl.left, 16, VW - TW - 16),
                };
              }
            } else if (step.placement === "bottom") {
              ttStyle = {
                top: clamp(hl.top + hl.height + PAD, 70, VH - TH - 16),
                left: clamp(hl.left, 16, VW - TW - 16),
              };
            } else if (step.placement === "left") {
              if (spaceRight >= TW + PAD * 2) {
                ttStyle = {
                  top: clamp(hl.top, 70, VH - TH - 16),
                  left: clamp(hl.left + hl.width + PAD, 16, VW - TW - 16),
                };
              } else {
                ttStyle = {
                  top: clamp(hl.top, 70, VH - TH - 16),
                  left: clamp(hl.left - TW - PAD, 16, VW - TW - 16),
                };
              }
            }
          }

          return (
            <>
              {/* Backdrop */}
              {!isCenter && <div className="demo-tour-backdrop" onClick={() => advanceDemoTour(demoTourStep + 1)} />}
              {isCenter && <div className="demo-tour-backdrop" />}

              {/* Highlight ring */}
              {!isCenter && demoTourRect && !demoTourTransitioning && (
                <div className="demo-tour-highlight" style={{
                  top: hl.top - PAD, left: hl.left - PAD,
                  width: hl.width + PAD * 2, height: hl.height + PAD * 2,
                }} />
              )}

              {/* Tooltip */}
              <div className={`demo-tour-tooltip${isCenter ? " center" : ""}`} style={isCenter ? {} : ttStyle}>
                <div className="demo-tour-label">
                  RuneTrader Demo · Step {demoTourStep + 1} of {DEMO_TOUR_STEPS.length}
                </div>
                <div className="demo-tour-title">{step.title}</div>
                <div className="demo-tour-desc">{step.desc}</div>
                <div className="demo-tour-actions">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button className="demo-tour-skip" onClick={endDemoTour}>Skip tour</button>
                    <div className="demo-tour-dots">
                      {DEMO_TOUR_STEPS.map((_, i) => (
                        <div key={i} className={"demo-tour-dot" + (i === demoTourStep ? " active" : "")} />
                      ))}
                    </div>
                  </div>
                  <button className="demo-tour-next" onClick={() => advanceDemoTour(demoTourStep + 1)}>
                    {demoTourStep === DEMO_TOUR_STEPS.length - 1 ? "Finish →" : "Next →"}
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* DEMO TOUR END SCREEN */}
        {demoMode && demoTourStep === -2 && (
          <div className="demo-tour-end-overlay">
            <div style={{ fontSize: "48px" }}>📈</div>
            <div className="demo-tour-end-title">Ready to flip smarter?</div>
            <div className="demo-tour-end-sub">
              You’ve seen what RuneTrader can do. Free to start — install the RuneLite plugin and you’re live in 2 minutes.
            </div>
            <button className="demo-tour-end-cta" onClick={() => { setDemoTourStep(-1); setDemoMode(false); setShowAuth(true); }}>
              Create Free Account →
            </button>
            <button className="demo-tour-end-dismiss" onClick={() => { setDemoTourStep(-1); }}>
              Keep exploring the demo
            </button>
          </div>
        )}

        {/* ── GLOBAL AI BUBBLE (all pages) ── */}
        {!merchantAIOpen && (
          <div className="merchant-ai-bubble" onClick={() => setMerchantAIOpen(true)} title="AI Advisor">
            <div className="bubble-ping" />
            <span>📈</span>
          </div>
        )}
        {merchantAIOpen && (
          <div className="merchant-ai-modal">
            <div className="merchant-ai-modal-header">
              <span style={{ fontSize: 20 }}>📈</span>
              <div><h4>AI Advisor</h4><p>Live GE data · Powered by Claude</p></div>
              <button className="merchant-ai-close" onClick={() => setMerchantAIOpen(false)}>✕</button>
            </div>
            <div className="merchant-ai-modal-body">
              {messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  <div className="msg-bubble">
                    {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                  </div>
                  <span className="msg-time">{formatTime(msg.time)}</span>
                </div>
              ))}
              {aiLoading && (
                <div className="msg assistant"><div className="msg-bubble"><div className="typing"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div></div>
              )}
              <div ref={merchantAIMessagesEndRef} />
            </div>
            <div className="merchant-ai-modal-input">
              <textarea
                placeholder={merchantMode ? "Ask about your positions..." : "Ask anything about flipping..."}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = "36px"; e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) sendMessage(input.trim()); } }}
              />
              <button className="send-btn" disabled={!input.trim() || aiLoading} onClick={() => sendMessage(input.trim())}>➤</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
