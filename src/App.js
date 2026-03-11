import { useState, useEffect, useRef } from "react";
import LandingPage from "./LandingPage";
import AuthModal from "./AuthModal";
import { supabase } from "./supabaseClient";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --gold: #c9a84c;
    --gold-light: #e8c96a;
    --gold-dim: #8a6f2e;
    --bg: #0a0c0f;
    --bg2: #0f1218;
    --bg3: #161b24;
    --bg4: #1e2530;
    --border: #2a3340;
    --text: #e8e8e8;
    --text-dim: #7a8a9a;
    --green: #2ecc71;
    --green-dim: #1a7a44;
    --red: #e74c3c;
    --red-dim: #7a1f1a;
    --blue: #3498db;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }

  .app { display: flex; flex-direction: column; min-height: 100vh; }

  /* HEADER */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 64px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 100;
  }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 32px; height: 32px; }
  .logo-text { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--gold); letter-spacing: 1px; }
  .logo-dot { color: var(--text-dim); font-size: 14px; margin-left: 2px; }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .live-badge {
    display: flex; align-items: center; gap: 6px;
    background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3);
    border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--green);
  }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .nav-tabs { display: flex; gap: 4px; }
  .nav-tab {
    padding: 6px 16px; border-radius: 6px; border: none; cursor: pointer;
    font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;
    background: transparent; color: var(--text-dim); transition: all 0.2s;
  }
  .nav-tab:hover { color: var(--text); background: var(--bg3); }
  .nav-tab.active { background: var(--bg3); color: var(--gold); border: 1px solid var(--border); }

  /* MAIN LAYOUT */
  .main { display: flex; flex: 1; overflow: hidden; height: calc(100vh - 64px); }
  .left-panel { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .right-panel {
    width: 380px; border-left: 1px solid var(--border);
    display: flex; flex-direction: column; background: var(--bg2);
  }

  /* STATS BAR */
  .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-card {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 10px;
    padding: 16px; display: flex; flex-direction: column; gap: 4px;
  }
  .stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-value { font-size: 22px; font-weight: 600; color: var(--gold); font-family: 'Cinzel', serif; }
  .stat-sub { font-size: 11px; color: var(--text-dim); }

  /* FILTER BAR */
  .filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .filter-label { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .filter-input {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 14px; color: var(--text); font-size: 13px; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 0.2s;
  }
  .filter-input:focus { border-color: var(--gold-dim); }
  .filter-input::placeholder { color: var(--text-dim); }
  .filter-btn {
    padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg3); color: var(--text-dim); font-size: 12px; cursor: pointer;
    transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .filter-btn:hover, .filter-btn.active { background: var(--bg4); color: var(--gold); border-color: var(--gold-dim); }

  /* FLIPS TABLE */
  .section-title {
    font-family: 'Cinzel', serif; font-size: 14px; color: var(--gold);
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .flips-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .table-header {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 80px;
    padding: 10px 16px; background: var(--bg4);
    font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border);
  }
  .sort-btn {
    background: none; border: none; cursor: pointer; color: inherit;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
    font-family: "Inter", sans-serif; padding: 0; display: flex; align-items: center; gap: 4px;
    transition: color 0.15s;
  }
  .sort-btn:hover { color: var(--gold); }
  .sort-btn.active { color: var(--gold); }
  .sort-arrow { font-size: 9px; opacity: 0.7; }
  .flip-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 80px;
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    transition: background 0.15s; cursor: pointer; align-items: center;
  }
  .flip-row:last-child { border-bottom: none; }
  .flip-row:hover { background: var(--bg4); }
  .item-name { font-weight: 500; font-size: 13px; color: var(--text); }
  .item-category { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .price { font-size: 13px; color: var(--text); }
  .margin { font-size: 13px; font-weight: 600; color: var(--green); }
  .margin.neg { color: var(--red); }
  .roi { font-size: 12px; color: var(--text-dim); }
  .volume { font-size: 12px; color: var(--text-dim); }
  .score-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 24px; border-radius: 6px; font-size: 12px; font-weight: 700;
  }
  .score-high { background: rgba(46,204,113,0.15); color: var(--green); }
  .score-med { background: rgba(201,168,76,0.15); color: var(--gold); }
  .score-low { background: rgba(231,76,60,0.15); color: var(--red); }
  .loading-row { padding: 40px; text-align: center; color: var(--text-dim); font-size: 14px; }
  .skeleton { background: linear-gradient(90deg, var(--bg4) 25%, var(--bg3) 50%, var(--bg4) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; height: 14px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* AI CHAT PANEL */
  .chat-header {
    padding: 16px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .chat-header-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, var(--gold-dim), var(--gold));
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .chat-header-text h3 { font-size: 14px; font-weight: 600; color: var(--text); }
  .chat-header-text p { font-size: 11px; color: var(--text-dim); }
  .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .msg { display: flex; flex-direction: column; gap: 4px; max-width: 90%; }
  .msg.user { align-self: flex-end; }
  .msg.assistant { align-self: flex-start; }
  .msg-bubble {
    padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5;
  }
  .msg.user .msg-bubble { background: linear-gradient(135deg, var(--gold-dim), #6b4f1a); color: #fff; border-radius: 12px 12px 2px 12px; }
  .msg.assistant .msg-bubble { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 12px 12px 12px 2px; }
  .msg-time { font-size: 10px; color: var(--text-dim); padding: 0 4px; }
  .msg.user .msg-time { text-align: right; }
  .typing { display: flex; gap: 4px; align-items: center; padding: 12px 14px; }
  .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); animation: typing 1.2s infinite; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  .chat-input-area { padding: 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
  .quick-prompts { display: flex; gap: 6px; flex-wrap: wrap; }
  .quick-prompt {
    padding: 5px 10px; border-radius: 20px; font-size: 11px; cursor: pointer;
    background: var(--bg3); border: 1px solid var(--border); color: var(--text-dim);
    transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .quick-prompt:hover { border-color: var(--gold-dim); color: var(--gold); }
  .chat-input-row { display: flex; gap: 8px; }
  .chat-input {
    flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 14px; color: var(--text); font-size: 13px; font-family: 'Inter', sans-serif;
    outline: none; resize: none; transition: border-color 0.2s; height: 40px;
  }
  .chat-input:focus { border-color: var(--gold-dim); }
  .chat-input::placeholder { color: var(--text-dim); }
  .send-btn {
    width: 40px; height: 40px; border-radius: 8px; border: none; cursor: pointer;
    background: linear-gradient(135deg, var(--gold-dim), var(--gold));
    color: #000; font-size: 16px; display: flex; align-items: center; justify-content: center;
    transition: opacity 0.2s; flex-shrink: 0;
  }
  .send-btn:hover { opacity: 0.85; }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* BUDGET MODAL */
  .budget-row { display: flex; align-items: center; gap: 8px; }
  .budget-input {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 14px; color: var(--gold); font-size: 14px; font-family: 'Cinzel', serif;
    outline: none; width: 140px; transition: border-color 0.2s;
  }
  .budget-input:focus { border-color: var(--gold-dim); }
  .budget-label { font-size: 12px; color: var(--text-dim); }


  /* CHART MODAL */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 16px; width: 100%; max-width: 860px;
    max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 28px; border-bottom: 1px solid var(--border);
  }
  .modal-title { font-family: 'Cinzel', serif; font-size: 20px; color: var(--gold); }
  .modal-meta { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
  .modal-close {
    width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg3); color: var(--text-dim); cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .modal-close:hover { border-color: var(--red); color: var(--red); }
  .modal-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); }
  .modal-stat { background: var(--bg3); padding: 16px 20px; }
  .modal-stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .modal-stat-value { font-size: 20px; font-weight: 600; margin-top: 4px; font-family: 'Cinzel', serif; }
  .chart-section { padding: 24px 28px; }
  .time-tabs { display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap; }
  .time-tab {
    padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer;
    transition: all 0.2s; font-family: 'Inter', sans-serif; font-weight: 500;
  }
  .time-tab:hover { color: var(--text); border-color: var(--text-dim); }
  .time-tab.active { background: var(--bg4); color: var(--gold); border-color: var(--gold-dim); }
  .chart-container { width: 100%; height: 280px; position: relative; }
  .chart-loading { display: flex; align-items: center; justify-content: center; height: 280px; color: var(--text-dim); font-size: 14px; }
  .modal-body { padding: 0 28px 24px; display: flex; flex-direction: column; gap: 16px; }
  .modal-ask-btn {
    padding: 10px 20px; border-radius: 8px; border: 1px solid var(--gold-dim);
    background: rgba(201,168,76,0.08); color: var(--gold); font-size: 13px;
    cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; gap: 8px;
  }
  .modal-ask-btn:hover { background: rgba(201,168,76,0.15); }


  /* PREFERENCES BAR */
  .prefs-bar {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }
  .pref-card {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 10px;
    padding: 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .pref-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .pref-input {
    background: var(--bg4); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 12px; color: var(--gold); font-size: 14px; font-family: "Cinzel", serif;
    outline: none; width: 100%; transition: border-color 0.2s;
  }
  .pref-input:focus { border-color: var(--gold-dim); }
  .pref-input::placeholder { color: var(--text-dim); font-family: "Inter", sans-serif; font-size: 13px; }
  .pref-sub { font-size: 11px; color: var(--text-dim); }
  .toggle-group { display: flex; gap: 4px; }
  .toggle-btn {
    flex: 1; padding: 7px 4px; border-radius: 6px; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim); font-size: 11px; cursor: pointer;
    transition: all 0.2s; font-family: "Inter", sans-serif; font-weight: 500; text-align: center;
  }
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
  .tracker-form {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 10px;
    padding: 20px; display: flex; flex-direction: column; gap: 16px;
  }
  .tracker-form-title { font-family: "Cinzel", serif; font-size: 13px; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .tracker-form-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; align-items: end; }
  .tracker-field { display: flex; flex-direction: column; gap: 6px; }
  .tracker-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .tracker-input {
    background: var(--bg4); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 12px; color: var(--text); font-size: 13px; font-family: "Inter", sans-serif;
    outline: none; transition: border-color 0.2s; width: 100%;
  }
  .tracker-input:focus { border-color: var(--gold-dim); }
  .tracker-input::placeholder { color: var(--text-dim); }
  .log-btn {
    padding: 9px 20px; border-radius: 8px; border: none; cursor: pointer;
    background: linear-gradient(135deg, var(--gold-dim), var(--gold));
    color: #000; font-size: 13px; font-weight: 600; font-family: "Inter", sans-serif;
    white-space: nowrap; transition: opacity 0.2s; height: 38px;
  }
  .log-btn:hover { opacity: 0.85; }
  .log-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .flips-log { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .log-header {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 40px;
    padding: 10px 16px; background: var(--bg4);
    font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border);
  }
  .log-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 40px;
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    align-items: center; font-size: 13px; transition: background 0.15s;
  }
  .log-row:last-child { border-bottom: none; }
  .log-row:hover { background: var(--bg4); }
  .log-item-name { font-weight: 500; color: var(--text); }
  .log-date { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .delete-btn {
    width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim); cursor: pointer; font-size: 14px;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .delete-btn:hover { border-color: var(--red); color: var(--red); background: rgba(231,76,60,0.1); }
  .profit-pos { color: var(--green); font-weight: 600; }
  .profit-neg { color: var(--red); font-weight: 600; }
  .best-item-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3);
    border-radius: 20px; padding: 4px 12px; font-size: 11px; color: var(--gold);
  }
  .clear-btn {
    padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim); font-size: 12px; cursor: pointer;
    transition: all 0.2s; font-family: "Inter", sans-serif;
  }
  .clear-btn:hover { border-color: var(--red); color: var(--red); }
  .tracker-empty { padding: 60px 20px; text-align: center; color: var(--text-dim); }
  .tracker-empty .icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .tracker-empty p { font-size: 14px; margin-bottom: 4px; }
  .tracker-empty small { font-size: 12px; opacity: 0.6; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

  /* EMPTY STATE */
  .empty-state { padding: 60px 20px; text-align: center; color: var(--text-dim); }
  .empty-state .icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 14px; }

  /* ERROR */
  .error-banner {
    background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3);
    border-radius: 8px; padding: 12px 16px; font-size: 13px; color: var(--red);
    display: flex; align-items: center; gap: 8px;
  }
`;

function formatGP(n) {
  if (!n && n !== 0) return "—";
  return Math.round(n).toLocaleString();
}

function applyOffset(low, high, speed) {
  // Adjust prices to improve fill rate based on speed preference
  const factor = speed === "Fast" ? 0.012 : speed === "Med" ? 0.006 : 0;
  const adjLow = Math.round(low * (1 + factor));
  const adjHigh = Math.round(high * (1 - factor));
  return { adjLow, adjHigh };
}

function formatTime(d) {
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  return Math.floor(diff / 3600) + "h ago";
}

function getScore(margin, volume, roi, price) {
  // Volume is king - low volume flips are unreliable
  const v = Math.min(volume / 500, 1) * 50;
  // Margin score - sweet spot is 500gp to 50k
  const m = Math.min(margin / 10000, 1) * 30;
  // ROI sweet spot is 5-50%. Above 200% is almost always bad/stale data - penalise hard
  let roiScore;
  if (roi > 200) {
    roiScore = Math.max(0, 20 - (roi - 200) / 50); // rapidly drops toward 0
  } else {
    const cappedRoi = Math.min(roi, 50);
    roiScore = (cappedRoi / 50) * 20;
  }
  return Math.round(v + m + roiScore);
}

function isValidFlip(item) {
  if (item.high < item.low) return false;
  if (item.low < 2) return false;
  return true;
}

const QUICK_PROMPTS = [
  "Best flips under 1M gp?",
  "High volume items?",
  "Explain margins to me",
  "What's trending now?",
];


const TIME_RANGES = [
  { label: "24H", seconds: 86400 },
  { label: "3D", seconds: 259200 },
  { label: "7D", seconds: 604800 },
  { label: "1M", seconds: 2592000 },
  { label: "6M", seconds: 15552000 },
  { label: "1Y", seconds: 31536000 },
  { label: "All", seconds: 99999999 },
];

function ItemChart({ item, onClose, onAskAI }) {
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
      let endpoint;
      if (range === "24H") endpoint = "5m";
      else if (range === "3D") endpoint = "1h";
      else endpoint = "6h";

      const res = await fetch(
        `https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=${endpoint}&id=${item.id}`,
        { headers: { "User-Agent": "RuneTrader/1.0" } }
      );
      const data = await res.json();
      if (!data.data || data.data.length === 0) { setChartLoading(false); return; }

      const now = Date.now() / 1000;
      const filtered = data.data.filter(d => now - d.timestamp <= rangeObj.seconds);
      const points = filtered.length > 0 ? filtered : data.data.slice(-50);
      setChartData(points);
    } catch (e) {
      setChartLoading(false);
    } finally {
      setChartLoading(false);
    }
  }

  function drawChart() {
    const canvas = canvasRef.current;
    if (!canvas || !chartData || chartData.length < 2) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const pad = { top: 20, right: 20, bottom: 40, left: 60 };

    ctx.clearRect(0, 0, W, H);

    const highPrices = chartData.map(d => d.avgHighPrice).filter(Boolean);
    const lowPrices = chartData.map(d => d.avgLowPrice).filter(Boolean);
    const allPrices = [...highPrices, ...lowPrices];
    if (allPrices.length === 0) return;

    const minP = Math.min(...allPrices) * 0.995;
    const maxP = Math.max(...allPrices) * 1.005;
    const minT = chartData[0].timestamp;
    const maxT = chartData[chartData.length - 1].timestamp;

    function xPos(t) { return pad.left + ((t - minT) / (maxT - minT)) * (W - pad.left - pad.right); }
    function yPos(p) { return pad.top + (1 - (p - minP) / (maxP - minP)) * (H - pad.top - pad.bottom); }

    // Grid lines
    ctx.strokeStyle = "rgba(42,51,64,0.8)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (H - pad.top - pad.bottom);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const price = maxP - (i / 4) * (maxP - minP);
      ctx.fillStyle = "#4a5a6a"; ctx.font = "11px Inter"; ctx.textAlign = "right";
      ctx.fillText(formatGP(Math.round(price)), pad.left - 8, y + 4);
    }

    // High price line + fill
    const highPoints = chartData.filter(d => d.avgHighPrice);
    if (highPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(xPos(highPoints[0].timestamp), yPos(highPoints[0].avgHighPrice));
      highPoints.forEach(d => ctx.lineTo(xPos(d.timestamp), yPos(d.avgHighPrice)));
      const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
      grad.addColorStop(0, "rgba(201,168,76,0.15)");
      grad.addColorStop(1, "rgba(201,168,76,0)");
      ctx.lineTo(xPos(highPoints[highPoints.length-1].timestamp), H - pad.bottom);
      ctx.lineTo(xPos(highPoints[0].timestamp), H - pad.bottom);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xPos(highPoints[0].timestamp), yPos(highPoints[0].avgHighPrice));
      highPoints.forEach(d => ctx.lineTo(xPos(d.timestamp), yPos(d.avgHighPrice)));
      ctx.strokeStyle = "#c9a84c"; ctx.lineWidth = 2; ctx.stroke();
    }

    // Low price line
    const lowPoints = chartData.filter(d => d.avgLowPrice);
    if (lowPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(xPos(lowPoints[0].timestamp), yPos(lowPoints[0].avgLowPrice));
      lowPoints.forEach(d => ctx.lineTo(xPos(d.timestamp), yPos(d.avgLowPrice)));
      ctx.strokeStyle = "#4caf7d"; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke();
      ctx.setLineDash([]);
    }

    // X axis labels
    ctx.fillStyle = "#4a5a6a"; ctx.font = "11px Inter"; ctx.textAlign = "center";
    const labelCount = 5;
    for (let i = 0; i <= labelCount; i++) {
      const t = minT + (i / labelCount) * (maxT - minT);
      const x = xPos(t);
      const d = new Date(t * 1000);
      const label = range === "24H"
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString([], { month: "short", day: "numeric" });
      ctx.fillText(label, x, H - pad.bottom + 16);
    }
  }

  const marginColor = item.margin > 0 ? "var(--green)" : "var(--red)";

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{item.name}</div>
            <div className="modal-meta">{item.category} · Buy limit: {item.buyLimit?.toLocaleString() || "Unknown"} · Score: {item.score}/100</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-stats">
          {[
            { label: "Buy Price", value: formatGP(item.adjLow ?? item.low), color: "var(--green)" },
            { label: "Sell Price", value: formatGP(item.adjHigh ?? item.high), color: "var(--text)" },
            { label: "Margin (after tax)", value: formatGP(item.adjMargin ?? item.margin), color: marginColor },
            { label: "ROI", value: item.roi + "%", color: "var(--gold)" },
          ].map((s, i) => (
            <div key={i} className="modal-stat">
              <div className="modal-stat-label">{s.label}</div>
              <div className="modal-stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="chart-section">
          <div className="time-tabs">
            {TIME_RANGES.map(r => (
              <button key={r.label} className={"time-tab" + (range === r.label ? " active" : "")} onClick={() => setRange(r.label)}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="chart-container">
            {chartLoading ? (
              <div className="chart-loading">Loading price history...</div>
            ) : !chartData ? (
              <div className="chart-loading">No price history available</div>
            ) : (
              <canvas ref={canvasRef} className="chart-canvas" style={{ width: "100%", height: "100%" }} />
            )}
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-dim)" }}>
              <div style={{ width: "20px", height: "2px", background: "#c9a84c", borderRadius: "2px" }} />
              Sell Price
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-dim)" }}>
              <div style={{ width: "20px", height: "2px", background: "#4caf7d", borderRadius: "2px", borderTop: "2px dashed #4caf7d" }} />
              Buy Price
            </div>
          </div>
        </div>

        <div className="modal-body">
          <button className="modal-ask-btn" onClick={() => { onAskAI(`Analyse ${item.name} for me. Is now a good time to flip it? Buy at ${formatGP(item.adjLow ?? item.low)}, sell at ${formatGP(item.adjHigh ?? item.high)}, margin ${formatGP(item.adjMargin ?? item.margin)}.`); onClose(); }}>
            ⚔️ Ask AI to analyse this flip →
          </button>
        </div>
      </div>
    </div>
  );
}

const WELCOME_MSG = {
  role: "assistant",
  content: "Hey! I'm your RuneTrader AI assistant 👋\n\nI have access to live Grand Exchange data and can help you find the best flips for your budget, explain market trends, and answer any OSRS trading questions.\n\nWhat are you working with today?",
  time: new Date(),
};

export default function RuneTrader() {
  const [showApp, setShowApp] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [budget, setBudget] = useState("");
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_prefs") || "{}"); } catch { return {}; }
  });

  function savePref(key, val) {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    localStorage.setItem("runetrader_prefs", JSON.stringify(updated));
  }
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("flips");
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortCol, setSortCol] = useState("score");
  const [sortDir, setSortDir] = useState("desc");

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }
  const [flipsLog, setFlipsLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_flips") || "[]"); } catch { return []; }
  });
  const [flipsLoading, setFlipsLoading] = useState(false);
  const [logForm, setLogForm] = useState({ item: "", buyPrice: "", sellPrice: "", qty: "1" });

  useEffect(() => {
    if (user) {
      loadFlipsFromDB();
    } else {
      try { setFlipsLog(JSON.parse(localStorage.getItem("runetrader_flips") || "[]")); } catch { setFlipsLog([]); }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFlipsFromDB() {
    setFlipsLoading(true);
    const { data, error } = await supabase
      .from("flips")
      .select("*")
      .order("date", { ascending: false });
    if (!error && data) {
      const mapped = data.map(r => ({
        id: r.id, item: r.item, buyPrice: r.buy_price, sellPrice: r.sell_price,
        qty: r.qty, tax: r.tax, profitEach: r.profit_each,
        totalProfit: r.total_profit, roi: r.roi, date: r.date
      }));
      setFlipsLog(mapped);
    }
    setFlipsLoading(false);
  }
  const messagesEndRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchPrices() {
    try {
      setLoading(true);
      setError(null);

      const [latestRes, mappingRes, volumeRes] = await Promise.all([
        fetch("https://prices.runescape.wiki/api/v1/osrs/latest", { headers: { "User-Agent": "RuneTrader/1.0" } }),
        fetch("https://prices.runescape.wiki/api/v1/osrs/mapping", { headers: { "User-Agent": "RuneTrader/1.0" } }),
        fetch("https://prices.runescape.wiki/api/v1/osrs/volumes", { headers: { "User-Agent": "RuneTrader/1.0" } }),
      ]);

      const [latestData, mappingData, volumeData] = await Promise.all([
        latestRes.json(),
        mappingRes.json(),
        volumeRes.json(),
      ]);

      const mappingMap = {};
      mappingData.forEach(item => { mappingMap[item.id] = item; });

      const volumeMap = volumeData.data || {};

      const flips = [];
      for (const [idStr, prices] of Object.entries(latestData.data)) {
        const id = parseInt(idStr);
        const meta = mappingMap[id];
        if (!meta) continue;
        const { high, low } = prices;
        if (!high || !low) continue;
        // GE tax: 2% of sell price, capped at 5,000,000gp
        // Items below 50gp have no tax obligation (rounds down to 0)
        // Tax-exempt items: Old school bond (13190, 13191, 13192)
        const TAX_EXEMPT_IDS = [13190, 13191, 13192]; // bonds
        const isTaxExempt = TAX_EXEMPT_IDS.includes(id);
        const rawTax = Math.floor(high * 0.02);
        const TAX = isTaxExempt ? 0 : (high < 50 ? 0 : Math.min(rawTax, 5_000_000));
        const margin = high - low - TAX;
        const roi = ((margin / low) * 100).toFixed(1);
        const volume = volumeMap[id] || 0;
        const score = getScore(margin, volume, parseFloat(roi), low);
        const flip = {
          id, name: meta.name, category: meta.members ? "Members" : "F2P",
          buyLimit: meta.limit || 0, high, low, margin, roi: parseFloat(roi),
          volume, score, examine: meta.examine || "",
        };
        if (!isValidFlip(flip)) continue;
        flips.push(flip);
      }

      flips.sort((a, b) => b.score - a.score);
      setItems(flips);
      itemsRef.current = flips;
      setLastUpdate(new Date());
    } catch (e) {
      setError("Failed to load GE data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(text) {
    const userMsg = { role: "user", content: text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAiLoading(true);

    // Top 50 scored items - filter out junk data (ROI > 200% or volume < 5)
    const reliableItems = itemsRef.current.filter(i => i.roi <= 200 && i.volume >= 5);
    const topFlips = reliableItems.slice(0, 50).map(i =>
      `${i.name}: buy ${formatGP(i.low)}, sell ${formatGP(i.high)}, margin ${formatGP(i.margin)}, ROI ${i.roi}%, volume ${i.volume.toLocaleString()}/day, score ${i.score}`
    ).join("\n");

    // Also find any items the user specifically mentioned by name
    const mentionedItems = itemsRef.current.filter(i =>
      text.toLowerCase().includes(i.name.toLowerCase())
    ).map(i =>
      `${i.name}: buy ${formatGP(i.low)}, sell ${formatGP(i.high)}, margin ${formatGP(i.margin)}, ROI ${i.roi}%, volume ${i.volume.toLocaleString()}/day, score ${i.score}`
    ).join("\n");

    const riskMap = { Low: "only recommend high-volume safe items (volume 500+/day, ROI 2-15%)", Med: "balance margin and volume (volume 100+/day, ROI 5-40%)", High: "higher margin items are OK (volume 50+/day, ROI up to 100%)" };
    const speedMap = { Fast: "only recommend items with very high daily volume (500+) that fill in minutes", Med: "items that fill within 1-2 hours are fine (volume 100+/day)", Slow: "slower filling items with bigger margins are acceptable" };
    const budgetContext = budget ? `User cash stack: ${parseInt(budget.replace(/,/g,"")).toLocaleString()} gp — only recommend items the user can afford to buy at least 5 of` : "Cash stack not specified — ask the user their budget before making specific recommendations";
    const riskContext = prefs.risk ? `Risk tolerance: ${prefs.risk} — ${riskMap[prefs.risk]}` : "Risk tolerance not set";
    const speedContext = prefs.speed ? `Flip speed preference: ${prefs.speed} — ${speedMap[prefs.speed]}` : "Flip speed not set";

    const systemPrompt = `You are the RuneTrader AI assistant — an expert OSRS Grand Exchange flipping advisor. You have access to live GE data for ALL tradeable OSRS items.

${budgetContext}
${riskContext}
${speedContext}

Current top flips by score (live data):
${topFlips}${mentionedItems ? `\n\nItems specifically mentioned by user (live data):\n${mentionedItems}` : ""}

Be concise, friendly, and specific. ALWAYS write GP values as full exact numbers with commas, never abbreviate — write 1,220,000 not 1.22M, write 195,000 not 195K, write 2,400,000 not 2.4M. Never mention or reference any internal price adjustments, offsets, or queue mechanics — just present prices as given. Give actionable advice. If the user asks about flips, recommend specific items from the data above. Keep responses under 150 words unless asked for detail.

IMPORTANT GE tax rules (as of May 2025):
- GE tax is 2% of the sell price, capped at 5,000,000gp per transaction
- Items that sell for under 50gp have no tax (rounds down to 0)
- Old School Bonds are tax-exempt
- All margin figures shown already have tax deducted — they are true profit

STRICT recommendation rules — never break these:
- NEVER recommend any item with ROI above 200% — these are stale or manipulated prices, full stop
- NEVER recommend any item with volume below 50/day — fills will take too long to be practical
- Only recommend items with ROI between 2% and 200% AND volume above 50/day
- If a user asks about a specific item that fails these checks, tell them clearly why it is not a good flip right now (bad data or too illiquid) and suggest better alternatives
- The best flips have ROI 5-50%, volume 200+/day, and a score above 50`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== "system").slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text }
          ],
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `API Error: ${data.error.message || data.error.type}`, time: new Date() }]);
      } else {
        const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response right now.";
        setMessages(prev => [...prev, { role: "assistant", content: reply, time: new Date() }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Connection error: ${e.message}`, time: new Date() }]);
    } finally {
      setAiLoading(false);
    }
  }

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    if (search.trim()) return matchSearch;
    const budgetGp = budget ? parseInt(budget.replace(/[^0-9]/g, "")) * (budget.toLowerCase().includes("m") ? 1_000_000 : budget.toLowerCase().includes("k") ? 1_000 : 1) : null;
    const matchBudget = !budgetGp || item.low <= budgetGp;
    const matchFilter = filter === "all" || (filter === "f2p" && item.category === "F2P") || (filter === "members" && item.category === "Members") || (filter === "highvol" && item.volume > 500);
    // Risk tolerance filtering
    const matchRisk = !prefs.risk ||
      (prefs.risk === "Low" && item.volume >= 500 && item.roi <= 30) ||
      (prefs.risk === "Med" && item.volume >= 100 && item.roi <= 100) ||
      (prefs.risk === "High" && item.roi <= 200);
    // Flip speed filtering
    const matchSpeed = !prefs.speed ||
      (prefs.speed === "Fast" && item.volume >= 500) ||
      (prefs.speed === "Med" && item.volume >= 100) ||
      (prefs.speed === "Slow");
    // Also filter out items where the adjusted margin would be negative
    const {adjLow, adjHigh} = applyOffset(item.low, item.high, prefs.speed);
    const adjMargin = item.margin - (adjLow - item.low) - (item.high - adjHigh);
    const matchPositiveMargin = search.trim() || adjMargin > 0;
    return matchBudget && matchFilter && matchRisk && matchSpeed && matchPositiveMargin;
  }).sort((a, b) => {
    const colMap = { name: "name", low: "low", high: "high", margin: "margin", roi: "roi", score: "score" };
    const key = colMap[sortCol] || "score";
    if (key === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (key === "margin") {
      const getAdj = i => { const {adjLow, adjHigh} = applyOffset(i.low, i.high, prefs.speed); return i.margin - (adjLow - i.low) - (i.high - adjHigh); };
      return sortDir === "asc" ? getAdj(a) - getAdj(b) : getAdj(b) - getAdj(a);
    }
    return sortDir === "asc" ? a[key] - b[key] : b[key] - a[key];
  });

  async function logFlip() {
    const buy = parseInt(logForm.buyPrice.replace(/,/g, ""));
    const sell = parseInt(logForm.sellPrice.replace(/,/g, ""));
    const qty = parseInt(logForm.qty) || 1;
    if (!logForm.item || isNaN(buy) || isNaN(sell)) return;
    const tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
    const profitEach = sell - buy - tax;
    const totalProfit = profitEach * qty;
    const roi = parseFloat(((profitEach / buy) * 100).toFixed(1));
    setLogForm({ item: "", buyPrice: "", sellPrice: "", qty: "1" });
    if (user) {
      const { data, error } = await supabase.from("flips").insert({
        user_id: user.id, item: logForm.item, buy_price: buy, sell_price: sell,
        qty, tax, profit_each: profitEach, total_profit: totalProfit, roi
      }).select().single();
      if (!error && data) {
        const entry = {
          id: data.id, item: data.item, buyPrice: data.buy_price, sellPrice: data.sell_price,
          qty: data.qty, tax: data.tax, profitEach: data.profit_each,
          totalProfit: data.total_profit, roi: data.roi, date: data.date
        };
        setFlipsLog(prev => [entry, ...prev]);
      }
    } else {
      const entry = {
        id: Date.now(), item: logForm.item, buyPrice: buy, sellPrice: sell,
        qty, tax, profitEach, totalProfit, roi, date: new Date().toISOString(),
      };
      const updated = [entry, ...flipsLog];
      setFlipsLog(updated);
      localStorage.setItem("runetrader_flips", JSON.stringify(updated));
    }
  }

  async function deleteFlip(id) {
    if (user) {
      await supabase.from("flips").delete().eq("id", id);
      setFlipsLog(prev => prev.filter(f => f.id !== id));
    } else {
      const updated = flipsLog.filter(f => f.id !== id);
      setFlipsLog(updated);
      localStorage.setItem("runetrader_flips", JSON.stringify(updated));
    }
  }

  async function clearAllFlips() {
    if (window.confirm("Clear all logged flips? This cannot be undone.")) {
      if (user) {
        await supabase.from("flips").delete().eq("user_id", user.id);
      } else {
        localStorage.removeItem("runetrader_flips");
      }
      setFlipsLog([]);
    }
  }

  const totalProfit = flipsLog.reduce((s, f) => s + f.totalProfit, 0);
  const totalFlips = flipsLog.length;
  const avgProfit = totalFlips ? Math.round(totalProfit / totalFlips) : 0;
  const bestItem = flipsLog.length ? flipsLog.reduce((best, f) => f.totalProfit > best.totalProfit ? f : best, flipsLog[0]) : null;

  if (!showApp) return <LandingPage onEnterApp={() => setShowApp(true)} />;

  return (
    <>
      <style>{STYLES}</style>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={u => setUser(u)} />}
      {selectedItem && <ItemChart item={selectedItem} onClose={() => setSelectedItem(null)} onAskAI={(msg) => { setInput(msg); sendMessage(msg); }} />}
      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,28 2,28" fill="none" stroke="#c9a84c" strokeWidth="2"/>
              <polygon points="16,8 26,26 6,26" fill="rgba(201,168,76,0.1)" stroke="#c9a84c" strokeWidth="1"/>
              <circle cx="16" cy="20" r="3" fill="#c9a84c"/>
            </svg>
            <span className="logo-text">RuneTrader<span className="logo-dot">.gg</span></span>
          </div>
          <div className="nav-tabs">
            {["flips", "tracker", "alerts"].map(t => (
              <button key={t} className={`nav-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="header-right">
            {lastUpdate && (
              <div className="live-badge">
                <div className="live-dot" />
                Live · {formatTime(lastUpdate)}
              </div>
            )}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                  {user.user_metadata?.username || user.email?.split("@")[0]}
                </span>
                <button onClick={handleSignOut} style={{
                  padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-dim)", fontSize: "12px",
                  cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s"
                }}
                onMouseOver={e => e.target.style.color = "var(--red)"}
                onMouseOut={e => e.target.style.color = "var(--text-dim)"}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{
                padding: "7px 18px", borderRadius: "8px",
                border: "1px solid var(--gold-dim)", background: "rgba(201,168,76,0.08)",
                color: "var(--gold)", fontSize: "13px", fontWeight: "600",
                cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s"
              }}
              onMouseOver={e => e.target.style.background = "rgba(201,168,76,0.15)"}
              onMouseOut={e => e.target.style.background = "rgba(201,168,76,0.08)"}>
                Log In
              </button>
            )}
          </div>
        </header>

        {/* MAIN */}
        <div className="main">
          <div className="left-panel">
            {activeTab === "tracker" ? (
              <div className="tracker-wrap">
                {/* TRACKER SUMMARY */}
                <div className="tracker-summary">
                  {[
                    { label: "Total Profit", value: formatGP(totalProfit), color: totalProfit >= 0 ? "var(--green)" : "var(--red)", sub: "All logged flips" },
                    { label: "Flips Logged", value: totalFlips.toLocaleString(), color: "var(--gold)", sub: "Transactions" },
                    { label: "Avg Profit/Flip", value: formatGP(avgProfit), color: "var(--text)", sub: "Per transaction" },
                    { label: "Best Item", value: bestItem?.item || "—", color: "var(--gold)", sub: bestItem ? formatGP(bestItem.totalProfit) + " profit" : "Log a flip first" },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <span className="stat-label">{s.label}</span>
                      <span className="stat-value" style={{ color: s.color, fontSize: s.label === "Best Item" ? "14px" : "22px" }}>{s.value}</span>
                      <span className="stat-sub">{s.sub}</span>
                    </div>
                  ))}
                </div>

                {/* LOG FORM */}
                <div className="tracker-form">
                  <div className="tracker-form-title">⚔️ Log a Flip</div>
                  <div className="tracker-form-row">
                    <div className="tracker-field">
                      <label className="tracker-label">Item Name</label>
                      <input className="tracker-input" placeholder="e.g. Abyssal whip" value={logForm.item}
                        onChange={e => setLogForm(f => ({ ...f, item: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <div className="tracker-field">
                      <label className="tracker-label">Buy Price (gp)</label>
                      <input className="tracker-input" placeholder="e.g. 1500000" value={logForm.buyPrice}
                        onChange={e => setLogForm(f => ({ ...f, buyPrice: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <div className="tracker-field">
                      <label className="tracker-label">Sell Price (gp)</label>
                      <input className="tracker-input" placeholder="e.g. 1650000" value={logForm.sellPrice}
                        onChange={e => setLogForm(f => ({ ...f, sellPrice: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <div className="tracker-field">
                      <label className="tracker-label">Quantity</label>
                      <input className="tracker-input" placeholder="1" value={logForm.qty}
                        onChange={e => setLogForm(f => ({ ...f, qty: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <button className="log-btn"
                      disabled={!logForm.item || !logForm.buyPrice || !logForm.sellPrice}
                      onClick={logFlip}>
                      + Log
                    </button>
                  </div>
                </div>

                {/* FLIPS LOG TABLE */}
                <div>
                  <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Flip History</span>
                    {flipsLog.length > 0 && <button className="clear-btn" onClick={clearAllFlips}>Clear All</button>}
                  </div>
                  <div className="flips-log">
                    <div className="log-header">
                      <span>Item</span>
                      <span>Buy Price</span>
                      <span>Sell Price</span>
                      <span>Qty</span>
                      <span>Tax</span>
                      <span>Profit</span>
                      <span></span>
                    </div>
                    {flipsLoading ? (
                      <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "40px" }}>Loading flips...</div>
                    ) : flipsLog.length === 0 ? (
                      <div className="tracker-empty">
                        <div className="icon">📋</div>
                        <p>No flips logged yet</p>
                        <small>Fill in the form above to start tracking your profits</small>
                      </div>
                    ) : (
                      flipsLog.map(f => (
                        <div key={f.id} className="log-row">
                          <div>
                            <div className="log-item-name">{f.item}</div>
                            <div className="log-date">{new Date(f.date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                          <span>{formatGP(f.buyPrice)}</span>
                          <span>{formatGP(f.sellPrice)}</span>
                          <span>{f.qty.toLocaleString()}</span>
                          <span style={{ color: "var(--text-dim)" }}>{formatGP(f.tax * f.qty)}</span>
                          <span className={f.totalProfit >= 0 ? "profit-pos" : "profit-neg"}>
                            {f.totalProfit >= 0 ? "+" : ""}{formatGP(f.totalProfit)}
                          </span>
                          <button className="delete-btn" onClick={() => deleteFlip(f.id)}>✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === "alerts" ? (
              <div className="empty-state">
                <div className="icon">🔔</div>
                <p>Price alerts coming soon</p>
              </div>
            ) : (
            <>
            {/* STATS */}
            <div className="prefs-bar">
              {/* Cash Stack */}
              <div className="pref-card">
                <span className="pref-label">Cash Stack</span>
                <input className="pref-input" placeholder="e.g. 50000000"
                  value={budget}
                  onChange={e => { setBudget(e.target.value); savePref("budget", e.target.value); }}
                />
                <span className="pref-sub">Filters flips by buy price</span>
              </div>

              {/* Risk Tolerance */}
              <div className="pref-card">
                <span className="pref-label">Risk Tolerance</span>
                <div className="toggle-group">
                  {["Low", "Med", "High"].map(r => {
                    const key = r === "Med" ? "active-med" : r === "Low" ? "active-low" : "active-high";
                    return (
                      <button key={r}
                        className={`toggle-btn ${prefs.risk === r ? key : ""}`}
                        onClick={() => savePref("risk", r)}>
                        {r}
                      </button>
                    );
                  })}
                </div>
                <span className="pref-sub">
                  {prefs.risk === "Low" ? "Safe, high-volume items only" :
                   prefs.risk === "High" ? "Higher margins, less liquid" :
                   "Balanced risk/reward"}
                </span>
              </div>

              {/* Flip Speed */}
              <div className="pref-card">
                <span className="pref-label">Flip Speed</span>
                <div className="toggle-group">
                  {[{label:"Fast", sub:"<30m"}, {label:"Med", sub:"1-2h"}, {label:"Slow", sub:"4h+"}].map(s => {
                    const key = s.label === "Fast" ? "active-fast" : s.label === "Med" ? "active-med-speed" : "active-slow";
                    return (
                      <button key={s.label}
                        className={`toggle-btn ${prefs.speed === s.label ? key : ""}`}
                        onClick={() => savePref("speed", s.label)}>
                        {s.label} <span style={{opacity:0.6, fontSize:"10px"}}>{s.sub}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="pref-sub">
                  {prefs.speed === "Fast" ? "High volume, quick fills" :
                   prefs.speed === "Slow" ? "Bigger margins, patient flips" :
                   "Mix of speed and margin"}
                </span>
              </div>

              {/* Live Stats */}
              <div className="pref-card">
                <span className="pref-label">Market Right Now</span>
                <span className="stat-value" style={{fontSize:"20px", color:"var(--gold)", fontFamily:"Cinzel, serif"}}>
                  {loading ? "—" : items.filter(i => i.roi <= 200).length.toLocaleString()} <span style={{fontSize:"12px", color:"var(--text-dim)", fontFamily:"Inter, sans-serif", fontWeight:400}}>valid flips</span>
                </span>
                <span className="pref-sub">
                  {(() => { const best = [...items].filter(i=>i.roi<=200).sort((a,b)=>b.margin-a.margin)[0]; return loading ? "—" : `Best: ${best?.name} · ${formatGP(best?.margin)} gp margin`; })()}
                </span>
              </div>
            </div>

            {error && <div className="error-banner">⚠️ {error}</div>}

            {/* FILTERS */}
            <div className="filter-bar">
              <span className="filter-label">Filter:</span>
              {["all", "f2p", "members", "highvol"].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f === "all" ? "All Items" : f === "f2p" ? "F2P" : f === "members" ? "Members" : "High Volume"}
                </button>
              ))}
              <input className="filter-input" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: "auto" }} />
            </div>

            {/* TABLE */}
            <div>
              <div className="section-title">Top Flips</div>
              <div className="flips-table">
                <div className="table-header">
                  <button className={`sort-btn ${sortCol === "name" ? "active" : ""}`} onClick={() => handleSort("name")}>
                    Item {sortCol === "name" && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                  </button>
                  <button className={`sort-btn ${sortCol === "low" ? "active" : ""}`} onClick={() => handleSort("low")}>
                    Buy Price {sortCol === "low" && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                  </button>
                  <button className={`sort-btn ${sortCol === "high" ? "active" : ""}`} onClick={() => handleSort("high")}>
                    Sell Price {sortCol === "high" && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                  </button>
                  <button className={`sort-btn ${sortCol === "margin" ? "active" : ""}`} onClick={() => handleSort("margin")}>
                    Margin {sortCol === "margin" && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                  </button>
                  <button className={`sort-btn ${sortCol === "roi" ? "active" : ""}`} onClick={() => handleSort("roi")}>
                    ROI {sortCol === "roi" && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                  </button>
                  <button className={`sort-btn ${sortCol === "score" ? "active" : ""}`} onClick={() => handleSort("score")}>
                    Score {sortCol === "score" && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                  </button>
                </div>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flip-row">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="skeleton" style={{ width: j === 0 ? "80%" : "60%", animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="empty-state"><div className="icon">🔍</div><p>No items match your filters</p></div>
                ) : (
                  filtered.slice(0, search.trim() ? 200 : 100).map(item => (
                    <div key={item.id} className="flip-row" onClick={() => { const {adjLow, adjHigh} = applyOffset(item.low, item.high, prefs.speed); const adjMargin = item.margin - (adjLow - item.low) - (item.high - adjHigh); setSelectedItem({...item, adjLow, adjHigh, adjMargin}); }}>
                      <div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-category">{item.category} · Limit: {item.buyLimit?.toLocaleString() || "?"}</div>
                      </div>
                      {(() => { const {adjLow, adjHigh} = applyOffset(item.low, item.high, prefs.speed); const adjMargin = item.margin - (adjLow - item.low) - (item.high - adjHigh); return (<>
                        <span className="price">{formatGP(adjLow)}</span>
                        <span className="price">{formatGP(adjHigh)}</span>
                        <span className={`margin ${adjMargin < 0 ? "neg" : ""}`}>{formatGP(adjMargin)}</span>
                      </>); })()}
                      <span className="roi">{item.roi}%</span>
                      <span className={`score-badge ${item.score >= 70 ? "score-high" : item.score >= 40 ? "score-med" : "score-low"}`}>
                        {item.score}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            </>
            )}
          </div>

          {/* AI CHAT */}
          <div className="right-panel">
            <div className="chat-header">
              <div className="chat-header-icon">⚔️</div>
              <div className="chat-header-text">
                <h3>AI Advisor</h3>
                <p>Live GE data · Powered by Claude</p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  <div className="msg-bubble" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  <span className="msg-time">{formatTime(msg.time)}</span>
                </div>
              ))}
              {aiLoading && (
                <div className="msg assistant">
                  <div className="msg-bubble">
                    <div className="typing">
                      <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="quick-prompts">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} className="quick-prompt" onClick={() => sendMessage(p)}>{p}</button>
                ))}
              </div>
              <div className="chat-input-row">
                <textarea
                  className="chat-input"
                  placeholder="Ask anything about flipping..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) sendMessage(input.trim()); } }}
                />
                <button className="send-btn" disabled={!input.trim() || aiLoading} onClick={() => sendMessage(input.trim())}>
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
