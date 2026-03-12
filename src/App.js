import { useState, useEffect, useRef } from "react";
import LandingPage from "./LandingPage";
import AuthModal from "./AuthModal";
import { supabase } from "./supabaseClient";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --gold: #c9a84c; --gold-light: #e8c96a; --gold-dim: #8a6f2e;
    --bg: #0a0c0f; --bg2: #0f1218; --bg3: #161b24; --bg4: #1e2530;
    --border: #2a3340; --text: #e8e8e8; --text-dim: #7a8a9a;
    --green: #2ecc71; --green-dim: #1a7a44; --red: #e74c3c; --red-dim: #7a1f1a; --blue: #3498db;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
  .app { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

  /* HEADER */
  .header { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 64px; background: var(--bg2); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 32px; height: 32px; }
  .logo-text { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--gold); letter-spacing: 1px; }
  .logo-dot { color: var(--text-dim); font-size: 14px; margin-left: 2px; }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .live-badge { display: flex; align-items: center; gap: 6px; background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--green); }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .nav-tabs { display: flex; gap: 4px; }
  .nav-tab { padding: 6px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; background: transparent; color: var(--text-dim); transition: all 0.2s; }
  .nav-tab:hover { color: var(--text); background: var(--bg3); }
  .nav-tab.active { background: var(--bg3); color: var(--gold); border: 1px solid var(--border); }

  /* LAYOUT */
  .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .main { display: flex; flex: 1; min-height: 0; overflow: hidden; }
  .left-panel { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .right-panel { width: 380px; border-left: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg2); overflow: hidden; flex-shrink: 0; }

  /* STAT CARDS */
  .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
  .stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-value { font-size: 22px; font-weight: 600; color: var(--gold); font-family: 'Cinzel', serif; }
  .stat-sub { font-size: 11px; color: var(--text-dim); }

  /* FILTER BAR */
  .filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .filter-label { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .filter-input { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; color: var(--text); font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
  .filter-input:focus { border-color: var(--gold-dim); }
  .filter-input::placeholder { color: var(--text-dim); }
  .filter-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text-dim); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .filter-btn:hover, .filter-btn.active { background: var(--bg4); color: var(--gold); border-color: var(--gold-dim); }

  /* FLIPS TABLE */
  .section-title { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .flips-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .sort-btn { background: none; border: none; cursor: pointer; color: inherit; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: "Inter", sans-serif; padding: 0; display: flex; align-items: center; gap: 4px; transition: color 0.15s; }
  .sort-btn:hover { color: var(--gold); }
  .sort-btn.active { color: var(--gold); }
  .sort-arrow { font-size: 9px; opacity: 0.7; }
  .flip-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; cursor: pointer; align-items: center; }
  .flip-row:last-child { border-bottom: none; }
  .flip-row:hover { background: var(--bg4); }
  .item-icon { width: 24px; height: 24px; object-fit: contain; flex-shrink: 0; image-rendering: pixelated; }
  .item-icon-placeholder { width: 24px; height: 24px; flex-shrink: 0; }
  .item-name { font-weight: 500; font-size: 13px; color: var(--text); }
  .item-category { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .price { font-size: 13px; color: var(--text); }
  .margin { font-size: 13px; font-weight: 600; color: var(--green); }
  .margin.neg { color: var(--red); }
  .roi { font-size: 12px; color: var(--text-dim); }
  .score-badge { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 24px; border-radius: 6px; font-size: 12px; font-weight: 700; }
  .score-high { background: rgba(46,204,113,0.15); color: var(--green); }
  .score-med { background: rgba(201,168,76,0.15); color: var(--gold); }
  .score-low { background: rgba(231,76,60,0.15); color: var(--red); }
  .skeleton { background: linear-gradient(90deg, var(--bg4) 25%, var(--bg3) 50%, var(--bg4) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; height: 14px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

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
  .stat-tooltip { opacity: 0; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: var(--bg1); border: 1px solid var(--gold-dim); border-radius: 8px; padding: 10px 13px; width: 220px; font-size: 12px; color: var(--text); line-height: 1.5; z-index: 999; pointer-events: none; transition: opacity 0.15s; box-shadow: 0 8px 24px rgba(0,0,0,0.5); white-space: normal; font-family: 'Inter', sans-serif; font-weight: 400; text-transform: none; letter-spacing: 0; }
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
  .pref-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--gold); font-size: 14px; font-family: "Cinzel", serif; outline: none; width: 100%; transition: border-color 0.2s; }
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
  .tracker-form-title { font-family: "Cinzel", serif; font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
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
  .close-flip-title { font-family: "Cinzel", serif; font-size: 16px; font-weight: 700; color: var(--gold); }
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
  .profit-chart-title { font-family: "Cinzel", serif; font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .profit-canvas-wrap { width: 100%; height: 160px; position: relative; }

  /* SMART ALERTS */
  .smart-alerts-wrap { display: flex; flex-direction: column; gap: 12px; }
  .smart-alert-toggles { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .smart-alert-toggle-title { font-family: "Cinzel", serif; font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
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
  .merchant-left { overflow-y: auto; overflow-x: visible; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
  .merchant-right { border-left: 1px solid var(--border); background: var(--bg2); overflow-y: auto; display: flex; flex-direction: column; min-height: 0; }
  .merchant-section { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: visible; }
  .merchant-section-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .merchant-section-title { font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1.5px; }
  .merchant-empty { padding: 32px 20px; text-align: center; }
  .capital-bar { display: grid; grid-template-columns: repeat(5,1fr); background: var(--bg3); border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .cap-cell { padding: 14px 16px 16px; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 3px; min-height: 76px; }
  .cap-cell:last-child { border-right: none; }
  .cap-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.8px; }
  .cap-value { font-size: 17px; font-weight: 600; font-family: 'Cinzel', serif; line-height: 1.3; }
  .cap-sub { font-size: 11px; color: var(--text-dim); }
  .slots-grid { display: grid; grid-template-columns: repeat(8,1fr); gap: 8px; padding: 12px 16px; }
  .ge-slot { aspect-ratio: 1; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; position: relative; transition: all 0.2s; overflow: hidden; background: var(--bg2); }
  .ge-slot.active:hover { border-color: var(--gold-dim); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.4); }
  .ge-slot.empty { border-style: dashed; opacity: 0.3; cursor: pointer; }
  .ge-slot.empty:hover { opacity: 0.6; border-color: var(--gold-dim); }
  .slot-name { font-size: 9px; color: var(--text-dim); text-align: center; line-height: 1.2; padding: 0 3px; }
  .slot-pnl { font-size: 10px; font-weight: 600; }
  .slot-dot { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; }
  .ops-table { overflow: visible; }
  .ops-header { display: grid; grid-template-columns: 2fr 100px 1fr 0.7fr 1fr 1fr 1fr 110px 80px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid var(--border); border-radius: 0; }
  .op-row { display: grid; grid-template-columns: 2fr 100px 1fr 0.7fr 1fr 1fr 1fr 110px 80px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; transition: background 0.15s; cursor: pointer; position: relative; }
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
  .m-panel-title { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; }
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
  .analytics-val { font-size: 15px; font-weight: 600; font-family: 'Cinzel', serif; }
  .capital-setup { position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .capital-setup-inner { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 420px; padding: 32px; display: flex; flex-direction: column; gap: 20px; }
  .capital-setup-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--gold); }
  .capital-setup-sub { font-size: 13px; color: var(--text-dim); line-height: 1.6; margin-top: -8px; }
  .capital-setup-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; color: var(--text); font-size: 16px; font-family: 'Inter', sans-serif; outline: none; width: 100%; transition: border-color 0.2s; }
  .capital-setup-input:focus { border-color: var(--gold-dim); }
  .capital-setup-btn { padding: 12px; border-radius: 8px; border: none; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Cinzel', serif; letter-spacing: 0.5px; transition: opacity 0.2s; }
  .capital-setup-btn:hover { opacity: 0.85; }
  .capital-setup-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .merchant-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }


  .alerts-wrap { display: flex; flex-direction: column; gap: 20px; }
  .alert-form { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .alert-form-title { font-family: "Cinzel", serif; font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
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

  /* PORTFOLIO */
  .portfolio-wrap { display: flex; flex-direction: column; gap: 24px; }
  .perf-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .perf-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
  .perf-card-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .perf-card-value { font-size: 20px; font-weight: 700; font-family: "Cinzel", serif; }
  .perf-card-sub { font-size: 11px; color: var(--text-dim); }
  .portfolio-chart-wrap { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
  .portfolio-chart-title { font-family: "Cinzel", serif; font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
  .portfolio-canvas-wrap { width: 100%; height: 200px; position: relative; }
  .portfolio-range-tabs { display: flex; gap: 4px; }
  .portfolio-range-tab { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-dim); font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; }
  .portfolio-range-tab:hover { color: var(--text); }
  .portfolio-range-tab.active { background: var(--bg4); color: var(--gold); border-color: var(--gold-dim); }
  .positions-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .positions-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .position-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; transition: background 0.15s; }
  .position-row:last-child { border-bottom: none; }
  .position-row:hover { background: var(--bg4); }
  .close-pos-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--green-dim); background: rgba(46,204,113,0.08); color: var(--green); font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; }
  .close-pos-btn:hover { background: rgba(46,204,113,0.18); }
  .open-pos-form { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .open-pos-title { font-family: "Cinzel", serif; font-size: 13px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .open-pos-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; }
  .portfolio-login-prompt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px 20px; text-align: center; color: var(--text-dim); }
  .portfolio-login-prompt .icon { font-size: 48px; opacity: 0.4; }
  .portfolio-login-prompt p { font-size: 15px; }
  .portfolio-login-prompt small { font-size: 13px; opacity: 0.7; }
  .portfolio-signin-btn { padding: 10px 28px; border-radius: 8px; border: 1px solid var(--gold-dim); background: rgba(201,168,76,0.1); color: var(--gold); font-size: 14px; font-weight: 600; cursor: pointer; font-family: "Inter", sans-serif; transition: all 0.2s; }
  .portfolio-signin-btn:hover { background: rgba(201,168,76,0.2); }
  .close-pos-modal { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .close-pos-inner { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 420px; padding: 28px; display: flex; flex-direction: column; gap: 16px; }
  .close-pos-title { font-family: "Cinzel", serif; font-size: 16px; font-weight: 700; color: var(--gold); }
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
  .tour-tooltip { position: fixed; z-index: 302; pointer-events: all; background: var(--bg3); border: 1px solid var(--gold-dim); border-radius: 14px; padding: 26px 28px; width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); animation: tooltipIn 0.25s cubic-bezier(0.4,0,0.2,1); }
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
  .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 400; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
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
    .right-panel { width: 100%; border-left: none; border-top: 1px solid var(--border); height: 420px; }
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

function applyOffset(low, high, speed) {
  const factor = speed === "Fast" ? 0.012 : speed === "Med" ? 0.006 : 0;
  return { adjLow: Math.round(low * (1 + factor)), adjHigh: Math.round(high * (1 - factor)) };
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

const QUICK_PROMPTS = ["Best flips under 1M gp?", "High volume items?", "Explain margins to me", "What's trending now?"];

const TIME_RANGES = [
  { label: "24H", seconds: 86400 }, { label: "3D", seconds: 259200 },
  { label: "7D", seconds: 604800 }, { label: "1M", seconds: 2592000 },
  { label: "6M", seconds: 15552000 }, { label: "1Y", seconds: 31536000 },
];

const TOUR_STEPS = [
  { id: "flips-table", title: "Live Flip Scanner", desc: "Every tradeable OSRS item ranked by score. Score factors in margin, volume, and ROI — higher is safer and more profitable. Click any item to see its price history.", target: ".flips-table", placement: "top" },
  { id: "prefs-bar", title: "Set Your Preferences", desc: "Enter your cash stack to filter flips you can afford. Set risk tolerance and flip speed to personalise the list for your playstyle.", target: ".prefs-bar", placement: "bottom" },
  { id: "ai-advisor", title: "AI Flip Advisor", desc: "Ask the AI anything — best flips for your budget, what's trending, or whether a specific item is worth flipping. It has live GE data.", target: ".right-panel", placement: "left" },
  { id: "tracker-tab", title: "Track Your Flips", desc: "Log every flip to track total profit, best items, and average returns. Your history syncs across all your devices automatically.", target: ".nav-tabs", placement: "bottom" },
  { id: "done", title: "You're Ready to Flip! ⚔️", desc: "That's everything. Start by setting your cash stack, then check the top flips list. Good luck on the Grand Exchange!", target: null, placement: "center" },
];

const MERCHANT_TOUR_STEPS = [
  // ── Operations tab ──
  { title: "Welcome to Merchant Mode ⚔️", desc: "Your war room for managing multiple GE positions at once. Three tabs cover everything: Operations, Analytics, and Alerts. Let's walk through each one.", target: null, placement: "center", view: "operations" },
  { title: "Capital Overview", desc: "Tracks your full GP stack at a glance. Deployed = GP locked in open positions. Idle = unused GP ready to put to work. Realised = profit closed today. Click 'Update' any time to adjust your stack.", target: ".capital-bar", placement: "bottom", view: "operations" },
  { title: "GE Slots", desc: "Your 8 GE slots, auto-filled from Tracker open flips. Dot colours show each position's status: 🟡 Buying · 🟢 Holding · 🔵 Selling · 🔴 Danger. Click any slot to view that item's price chart.", target: ".slots-grid", placement: "bottom", view: "operations" },
  { title: "Active Operations", desc: "Every open position with live P&L, hold time, and a margin health bar. Use the status dropdown to mark each flip: Buying → Holding → Selling. Red health bar means consider cutting the position.", target: "#active-operations-section", placement: "top", view: "operations" },
  { title: "Capital Efficiency", desc: "The ring gauge shows what % of your stack is actively working. Aim for 70%+ for best returns. Below 50% means too much idle GP sitting unused.", target: ".gauge-ring", placement: "left", view: "operations" },
  { title: "🎯 Daily GP Goal", desc: "Set a daily GP target and track your progress in real time. The bar fills as you close flips, and gives you an ETA based on your current GP/hr rate.", target: "#tour-daily-goal", placement: "left", view: "operations" },
  { title: "⚡ Rotation Picks", desc: "Items suggested to fill your idle GP right now — filtered to fit your budget and ranked by score. Click any card to open the price chart and decide if it's worth a flip.", target: ".rotation-picks-section", placement: "left", view: "operations" },
  { title: "📋 Flip Queue", desc: "A wishlist of items you want to flip next. Add anything here, and the live margin updates automatically. When a slot opens up, your queue tells you exactly what to buy.", target: "#tour-flip-queue", placement: "left", view: "operations" },
  // ── Analytics tab ──
  { title: "📊 Session Intel", desc: "A full breakdown of your current session: duration, GP/hr rate, flips closed, return on capital, and more. All updated live as you trade.", target: "#tour-session-intel", placement: "right", view: "analytics" },
  { title: "⚠️ Risk Exposure", desc: "See how concentrated your capital is across items. Any position above 40% of your stack triggers a warning — over-concentration is one of the biggest risks in GE flipping.", target: "#tour-risk-exposure", placement: "right", view: "analytics" },
  { title: "✅ Closed Today", desc: "A full log of every flip you've closed today with buy price, sell price, and profit per flip. Great for reviewing what's working and what isn't.", target: "#tour-closed-today", placement: "right", view: "analytics" },
  // ── Alerts tab ──
  { title: "⚡ Smart Alerts", desc: "Four automatic alerts that fire when market conditions shift: Margin Spike, Volume Surge, Dump Detected, and Price Crash. Toggle each one on or off, and click the ⚙️ gear to fine-tune the trigger threshold.", target: "#tour-smart-alerts", placement: "right", view: "alerts" },
  { title: "📡 Live Feed", desc: "Every alert that's fired this session lands here in real time. Filter by type, click any alert to jump straight to that item's chart, and clear the feed whenever you like.", target: "#tour-live-feed", placement: "right", view: "alerts" },
  // ── Done ──
  { title: "You're fully set up ⚔️", desc: "Log a buy in the Tracker without a sell price — it opens a position here automatically. Close it from Merchant Mode and it goes straight to your Flip History. Good luck on the GE.", target: null, placement: "center", view: "operations" },
];

// ─── ITEM CHART MODAL ────────────────────────────────────────────────────────

function ItemChart({ item, onClose, onAskAI, onFlipThis, onRefresh, refreshing, refreshCooldown }) {
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
            { label: "ROI", value: item.roi + "%", color: "var(--gold)", tip: "Return on investment — margin ÷ buy price. Higher is better, but balance this against volume and buy limit." },
            { label: "Vol / Day", value: item.volume > 0 ? item.volume.toLocaleString() : "—", color: "var(--text-dim)", tip: "Total items traded across all GE slots per day. Higher volume = easier fills and less competition risk." },
            { label: "GP / Fill", value: item.buyLimit > 0 ? formatGP((item.adjMargin ?? item.margin) * item.buyLimit) : "—", color: "var(--gold)", tip: "Maximum GP profit per 4-hour buy limit window (margin × buy limit). Use this to compare how much a full cycle is worth." },
            { label: "Cycles / Day", value: item.buyLimit > 0 && item.volume > 0 ? (item.volume / item.buyLimit).toFixed(1) + "×" : "—", color: item.buyLimit > 0 && item.volume / item.buyLimit >= 5 ? "var(--green)" : item.buyLimit > 0 && item.volume / item.buyLimit >= 2 ? "var(--gold)" : "var(--red)", tip: "How many times the daily volume could fill your buy limit (vol ÷ limit). Green = 5×+, easy fills. Red = <2×, you may compete for supply." },
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
          <button className="modal-flip-btn" onClick={() => { onFlipThis(item); onClose(); }}>
            📋 Log this flip in Tracker →
          </button>
          <button className="modal-ask-btn" onClick={() => { onAskAI(`Analyse ${item.name} for me. Is now a good time to flip it? Buy at ${formatGP(item.adjLow ?? item.low)}, sell at ${formatGP(item.adjHigh ?? item.high)}, margin ${formatGP(item.adjMargin ?? item.margin)}.`); onClose(); }}>
            ⚔️ Ask AI to analyse this flip →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROFIT CHART ────────────────────────────────────────────────────────────

function ProfitChart({ flipsLog }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || flipsLog.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height, pad = { top: 10, right: 10, bottom: 30, left: 60 };
    ctx.clearRect(0, 0, W, H);
    // Only include closed flips in profit chart
    const closedFlips = flipsLog.filter(f => f.status !== "open");
    if (closedFlips.length < 2) return;
    const sorted = [...closedFlips].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    let cum = 0;
    const points = sorted.map(f => { cum += f.totalProfit; return cum; });
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
  }, [flipsLog]);

  const closedCount = flipsLog.filter(f => f.status !== "open").length;
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
              <span className="opt-sub">Order didn't fill or I changed my mind — remove from open flips</span>
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

const PORT_RANGES = ["24H", "3D", "7D", "1M", "3M", "All"];

function PortfolioPage({ user, flipsLog, setFlipsLog, mapFlipRow, items, onSignIn, showToast, supabase: sb }) {
  const [manualPositions, setManualPositions] = useState([]);
  const [posLoading, setPosLoading] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [range, setRange] = useState("1M");
  const [openForm, setOpenForm] = useState({ item: "", buyPrice: "", qty: "1" });
  const [openAc, setOpenAc] = useState([]);
  const [showOpenAc, setShowOpenAc] = useState(false);
  const [closingPos, setClosingPos] = useState(null);
  const [closeSellPrice, setCloseSellPrice] = useState("");
  const [closingLoading, setClosingLoading] = useState(false);
  const chartRef = useRef(null);
  const flipsLoadedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    loadManualPositions();
    loadSnapshots();
    setTimeout(() => { flipsLoadedRef.current = true; }, 1000);
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!user || !flipsLog.length || !flipsLoadedRef.current) return;
    upsertSnapshot();
  }, [flipsLog, user]); // eslint-disable-line

  async function loadManualPositions() {
    setPosLoading(true);
    const { data } = await sb.from("positions").select("*").order("date_opened", { ascending: false });
    setManualPositions(data || []);
    setPosLoading(false);
  }

  async function loadSnapshots() {
    const { data } = await sb.from("portfolio_snapshots").select("*").order("snapshot_date", { ascending: true });
    setSnapshots(data || []);
  }

  async function upsertSnapshot() {
    const closedFlips = flipsLog.filter(f => f.status !== "open");
    const totalProfit = closedFlips.reduce((s, f) => s + (f.totalProfit || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    await sb.from("portfolio_snapshots").upsert({ user_id: user.id, snapshot_date: today, total_profit: totalProfit, total_flips: closedFlips.length }, { onConflict: "user_id,snapshot_date" });
    loadSnapshots();
  }

  async function openPosition() {
    const buy = parseInt(openForm.buyPrice.replace(/,/g, ""));
    const qty = parseInt(openForm.qty) || 1;
    if (!openForm.item || isNaN(buy)) return;
    const itemMatch = items.find(i => i.name.toLowerCase() === openForm.item.toLowerCase());
    const { data, error } = await sb.from("positions").insert({ user_id: user.id, item_id: itemMatch?.id || 0, item_name: openForm.item, buy_price: buy, qty }).select().single();
    if (error) { showToast("Failed to open position.", "error"); return; }
    setManualPositions(prev => [data, ...prev]);
    setOpenForm({ item: "", buyPrice: "", qty: "1" });
    showToast("Position opened!", "success");
  }

  async function closeManualPosition(pos, sellPrice) {
    const sell = parseInt(sellPrice.replace(/,/g, ""));
    if (isNaN(sell)) return;
    setClosingLoading(true);
    const tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
    const profitEach = sell - pos.buy_price - tax;
    const totalProfit = profitEach * pos.qty;
    const roi = parseFloat(((profitEach / pos.buy_price) * 100).toFixed(1));
    const { data: flipData, error: flipErr } = await sb.from("flips").insert({ user_id: user.id, item: pos.item_name, buy_price: pos.buy_price, sell_price: sell, qty: pos.qty, tax, profit_each: profitEach, total_profit: totalProfit, roi, status: "closed" }).select().single();
    if (flipErr) { showToast("Failed to log flip.", "error"); setClosingLoading(false); return; }
    if (flipData && mapFlipRow) setFlipsLog(prev => [mapFlipRow(flipData), ...prev]);
    await sb.from("positions").delete().eq("id", pos.id);
    setManualPositions(prev => prev.filter(p => p.id !== pos.id));
    setClosingPos(null);
    setCloseSellPrice("");
    setClosingLoading(false);
    showToast(`Closed! ${totalProfit >= 0 ? "+" : ""}${formatGP(totalProfit)} gp profit`, totalProfit >= 0 ? "success" : "error");
  }

  useEffect(() => {
    if (!chartRef.current || snapshots.length < 2) return;
    const canvas = chartRef.current;
    function draw() {
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const W = rect.width, H = rect.height, pad = { top: 10, right: 10, bottom: 30, left: 70 };
      const now = new Date();
      const cutoff = new Date(now);
      if (range === "24H") cutoff.setDate(now.getDate() - 1);
      else if (range === "3D") cutoff.setDate(now.getDate() - 3);
      else if (range === "7D") cutoff.setDate(now.getDate() - 7);
      else if (range === "1M") cutoff.setMonth(now.getMonth() - 1);
      else if (range === "3M") cutoff.setMonth(now.getMonth() - 3);
      else cutoff.setFullYear(2000);
      const filtered = snapshots.filter(s => new Date(s.snapshot_date) >= cutoff);
      ctx.clearRect(0, 0, W, H);
      if (filtered.length < 2) {
        ctx.fillStyle = "#4a5a6a"; ctx.font = "12px Inter"; ctx.textAlign = "center";
        ctx.fillText("Not enough data for this range", W / 2, H / 2);
        return;
      }
      const profits = filtered.map(s => s.total_profit);
      const times = filtered.map(s => new Date(s.snapshot_date).getTime());
      const minV = Math.min(0, ...profits), maxV = Math.max(0, ...profits);
      const minT = times[0], maxT = times[times.length - 1];
      const range2 = maxV - minV || 1;
      const xPos = t => pad.left + ((t - minT) / Math.max(maxT - minT, 1)) * (W - pad.left - pad.right);
      const yPos = v => pad.top + (1 - (v - minV) / range2) * (H - pad.top - pad.bottom);
      ctx.strokeStyle = "rgba(42,51,64,0.6)"; ctx.lineWidth = 1;
      [0, 0.5, 1].forEach(t => {
        const y = pad.top + t * (H - pad.top - pad.bottom);
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        const val = maxV - t * range2;
        ctx.fillStyle = "#4a5a6a"; ctx.font = "10px Inter"; ctx.textAlign = "right";
        ctx.fillText((val >= 0 ? "+" : "") + formatGP(Math.round(val)), pad.left - 4, y + 4);
      });
      const isPos = profits[profits.length - 1] >= profits[0];
      ctx.beginPath(); ctx.moveTo(xPos(times[0]), yPos(profits[0]));
      profits.forEach((p, i) => ctx.lineTo(xPos(times[i]), yPos(p)));
      const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
      grad.addColorStop(0, isPos ? "rgba(46,204,113,0.2)" : "rgba(231,76,60,0.2)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.lineTo(xPos(times[times.length - 1]), H - pad.bottom);
      ctx.lineTo(xPos(times[0]), H - pad.bottom);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(xPos(times[0]), yPos(profits[0]));
      profits.forEach((p, i) => ctx.lineTo(xPos(times[i]), yPos(p)));
      ctx.strokeStyle = isPos ? "#2ecc71" : "#e74c3c"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = "#4a5a6a"; ctx.font = "10px Inter"; ctx.textAlign = "center";
      [0, 0.5, 1].forEach(t => {
        const ts = minT + t * (maxT - minT);
        ctx.fillText(new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" }), xPos(ts), H - pad.bottom + 14);
      });
    }
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    draw();
    return () => ro.disconnect();
  }, [snapshots, range]);

  function getPerfVs(daysAgo) {
    if (snapshots.length < 2) return null;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - daysAgo);
    const past = [...snapshots].reverse().find(s => new Date(s.snapshot_date) <= cutoff);
    const current = snapshots[snapshots.length - 1];
    if (!past || past.id === current.id) return null;
    const diff = current.total_profit - past.total_profit;
    const pct = past.total_profit !== 0 ? ((diff / Math.abs(past.total_profit)) * 100).toFixed(1) : null;
    return { diff, pct };
  }

  const perfCards = [
    { label: "1D Change", data: getPerfVs(1) },
    { label: "1W Change", data: getPerfVs(7) },
    { label: "1M Change", data: getPerfVs(30) },
    { label: "3M Change", data: getPerfVs(90) },
  ];

  const allNames = Object.values(items).map(i => i.name);
  function handleOpenInput(val) {
    setOpenForm(f => ({ ...f, item: val }));
    if (val.length < 2) { setShowOpenAc(false); return; }
    const matches = allNames.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
    setOpenAc(matches); setShowOpenAc(matches.length > 0);
  }

  if (!user) {
    return (
      <div className="portfolio-login-prompt">
        <div className="icon">📊</div>
        <p>Portfolio tracking requires an account</p>
        <small>Sign in to open positions, track holdings, and view your performance over time.</small>
        <button className="portfolio-signin-btn" onClick={onSignIn}>Sign In / Create Account</button>
      </div>
    );
  }

  // Combine: open flips from tracker + manual positions
  const trackerOpenFlips = flipsLog.filter(f => f.status === "open");
  const totalOpenValue =
    trackerOpenFlips.reduce((s, f) => s + (f.buyPrice || 0) * (f.qty || 1), 0) +
    manualPositions.reduce((s, p) => s + p.buy_price * p.qty, 0);

  return (
    <div className="portfolio-wrap">
      <div className="perf-cards">
        {perfCards.map(({ label, data }) => (
          <div key={label} className="perf-card">
            <span className="perf-card-label">{label}</span>
            {data ? (
              <>
                <span className="perf-card-value" style={{ color: data.diff >= 0 ? "var(--green)" : "var(--red)" }}>
                  {data.diff >= 0 ? "+" : ""}{formatGP(data.diff)} gp
                </span>
                {data.pct !== null && <span className="perf-card-sub" style={{ color: data.diff >= 0 ? "var(--green)" : "var(--red)" }}>{data.diff >= 0 ? "+" : ""}{data.pct}%</span>}
              </>
            ) : (
              <span className="perf-card-value" style={{ color: "var(--text-dim)", fontSize: "14px" }}>Not enough data</span>
            )}
          </div>
        ))}
      </div>

      <div className="portfolio-chart-wrap">
        <div className="portfolio-chart-title">
          <span>📈 Portfolio Performance</span>
          <div className="portfolio-range-tabs">
            {PORT_RANGES.map(r => (
              <button key={r} className={"portfolio-range-tab" + (range === r ? " active" : "")} onClick={() => setRange(r)}>{r}</button>
            ))}
          </div>
        </div>
        {snapshots.length < 2 ? (
          <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "60px 0", fontSize: "13px" }}>
            Log more flips to see your portfolio chart
          </div>
        ) : (
          <div className="portfolio-canvas-wrap">
            <canvas ref={chartRef} style={{ width: "100%", height: "100%" }} />
          </div>
        )}
      </div>

      <div className="open-pos-form">
        <div className="open-pos-title">📂 Open a Position</div>
        <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "-6px" }}>
          Tip: Open flips logged in the Tracker automatically appear below.
        </div>
        <div className="open-pos-row">
          <div className="tracker-field">
            <label className="tracker-label">Item Name</label>
            <input className="tracker-input" placeholder="e.g. Abyssal whip" value={openForm.item}
              onChange={e => handleOpenInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowOpenAc(false), 150)}
              autoComplete="off" />
            {showOpenAc && (
              <div className="autocomplete-list">
                {openAc.map(name => {
                  const liveItem = items.find(i => i.name === name);
                  return (
                    <div key={name} className="autocomplete-item" onMouseDown={() => {
                      setOpenForm(f => ({ ...f, item: name, buyPrice: liveItem ? String(liveItem.low) : f.buyPrice }));
                      setShowOpenAc(false);
                    }}>{name}</div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="tracker-field">
            <label className="tracker-label">Buy Price (gp)</label>
            <input className="tracker-input" placeholder="e.g. 1500000" value={openForm.buyPrice} onChange={e => setOpenForm(f => ({ ...f, buyPrice: e.target.value }))} />
          </div>
          <div className="tracker-field">
            <label className="tracker-label">Quantity</label>
            <input className="tracker-input" placeholder="1" value={openForm.qty} onChange={e => setOpenForm(f => ({ ...f, qty: e.target.value }))} />
          </div>
          <button className="log-btn" disabled={!openForm.item || !openForm.buyPrice} onClick={openPosition}>+ Open</button>
        </div>
      </div>

      <div>
        <div className="section-title">
          Open Positions
          {totalOpenValue > 0 && <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "Inter, sans-serif", fontWeight: 400, marginLeft: "8px" }}>· {formatGP(totalOpenValue)} gp invested</span>}
        </div>
        <div className="positions-table">
          <div className="positions-header">
            <span>Item</span><span>Buy Price</span><span>Qty</span><span>Total Cost</span><span>Live Price</span><span>Action</span>
          </div>
          {posLoading ? (
            <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "40px" }}>Loading positions...</div>
          ) : trackerOpenFlips.length === 0 && manualPositions.length === 0 ? (
            <div className="tracker-empty">
              <div className="icon">📂</div>
              <p>No open positions</p>
              <small>Log a buy in the Tracker (without a sell price) or open a position above</small>
            </div>
          ) : (
            <>
              {/* Tracker open flips */}
              {trackerOpenFlips.map(flip => {
                const liveItem = items.find(i => i.name.toLowerCase() === flip.item.toLowerCase());
                const livePrice = liveItem?.high;
                const tax = livePrice ? Math.min(Math.floor(livePrice * 0.02), 5_000_000) : 0;
                const unrealisedEach = livePrice ? livePrice - flip.buyPrice - tax : null;
                const unrealised = unrealisedEach !== null ? unrealisedEach * (flip.qty || 1) : null;
                return (
                  <div key={`tracker-${flip.id}`} className="position-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={itemIconUrl(flip.item)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                      <div>
                        <div className="log-item-name">{flip.item}</div>
                        <div className="from-tracker-badge">⚔️ From Tracker</div>
                      </div>
                    </div>
                    <span>{formatGP(flip.buyPrice)}</span>
                    <span>{(flip.qty || 1).toLocaleString()}</span>
                    <span style={{ color: "var(--text-dim)" }}>{formatGP(flip.buyPrice * (flip.qty || 1))}</span>
                    <div>
                      <div>{livePrice ? formatGP(livePrice) : "—"}</div>
                      {unrealised !== null && (
                        <div className={"unrealised-pnl " + (unrealised >= 0 ? "pos" : "neg")}>
                          {unrealised >= 0 ? "+" : ""}{formatGP(unrealised)} gp
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Close in Tracker</span>
                  </div>
                );
              })}
              {/* Manual positions */}
              {manualPositions.map(pos => {
                const liveItem = items.find(i => i.name.toLowerCase() === pos.item_name.toLowerCase());
                const livePrice = liveItem?.high;
                const tax = livePrice ? Math.min(Math.floor(livePrice * 0.02), 5_000_000) : 0;
                const unrealisedEach = livePrice ? livePrice - pos.buy_price - tax : null;
                const unrealised = unrealisedEach !== null ? unrealisedEach * pos.qty : null;
                return (
                  <div key={pos.id} className="position-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={itemIconUrl(pos.item_name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                      <div>
                        <div className="log-item-name">{pos.item_name}</div>
                        <div className="log-date">{new Date(pos.date_opened).toLocaleDateString([], { month: "short", day: "numeric" })}</div>
                      </div>
                    </div>
                    <span>{formatGP(pos.buy_price)}</span>
                    <span>{pos.qty.toLocaleString()}</span>
                    <span style={{ color: "var(--text-dim)" }}>{formatGP(pos.buy_price * pos.qty)}</span>
                    <div>
                      <div>{livePrice ? formatGP(livePrice) : "—"}</div>
                      {unrealised !== null && (
                        <div className={"unrealised-pnl " + (unrealised >= 0 ? "pos" : "neg")}>
                          {unrealised >= 0 ? "+" : ""}{formatGP(unrealised)} gp
                        </div>
                      )}
                    </div>
                    <button className="close-pos-btn" onClick={() => { setClosingPos(pos); setCloseSellPrice(livePrice ? String(livePrice) : ""); }}>
                      Close Position
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {closingPos && (
        <div className="close-pos-modal" onClick={e => e.target === e.currentTarget && setClosingPos(null)}>
          <div className="close-pos-inner">
            <div className="close-pos-title">Close: {closingPos.item_name}</div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
              Bought {closingPos.qty.toLocaleString()}x at {formatGP(closingPos.buy_price)} gp each
            </div>
            <div className="close-pos-field">
              <label className="close-pos-label">Sell Price (gp)</label>
              <input className="close-pos-input" value={closeSellPrice} onChange={e => setCloseSellPrice(e.target.value)} placeholder="Enter your actual sell price" autoFocus />
            </div>
            {closeSellPrice && !isNaN(parseInt(closeSellPrice.replace(/,/g, ""))) && (() => {
              const sell = parseInt(closeSellPrice.replace(/,/g, ""));
              const tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
              const profit = (sell - closingPos.buy_price - tax) * closingPos.qty;
              return (
                <div style={{ background: "var(--bg4)", borderRadius: "8px", padding: "12px 14px", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-dim)" }}>Estimated profit: </span>
                  <span style={{ fontWeight: 700, color: profit >= 0 ? "var(--green)" : "var(--red)" }}>
                    {profit >= 0 ? "+" : ""}{formatGP(profit)} gp
                  </span>
                </div>
              );
            })()}
            <div className="close-pos-btns">
              <button className="close-pos-cancel" onClick={() => setClosingPos(null)} disabled={closingLoading}>Cancel</button>
              <button className="close-pos-confirm" disabled={!closeSellPrice || closingLoading} onClick={() => closeManualPosition(closingPos, closeSellPrice)}>
                {closingLoading ? "Saving..." : "Confirm & Log Flip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WELCOME MESSAGE ─────────────────────────────────────────────────────────

const WELCOME_MSG = {
  role: "assistant",
  content: "Hey! I'm your RuneTrader AI assistant 👋\n\nI have access to live Grand Exchange data and can help you find the best flips for your budget, explain market trends, and answer any OSRS trading questions.\n\nWhat are you working with today?",
  time: new Date(),
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────

// ── MERCHANT MODE COMPONENT ──
function MerchantMode({ items, flipsLog, manualPositions, merchantCapital, pnlHistory, pnlCanvasRef, formatGP, setSelectedItem, onUpdateCapital, onAddPosition, smartAlertSettings, saveSmartAlertSettings, thresholds, saveThreshold, openPopover, setOpenPopover, smartEvents, setSmartEvents, onRefresh, refreshing, refreshCooldown, onCloseFlip, onClosePortfolioPos, activeView, setActiveView }) {

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
  const allOpenPositions = [...trackerOpen, ...portfolioOnly];

  // ── Core metrics ──
  const totalDeployed = allOpenPositions.reduce((s, p) => s + p.gpIn, 0);
  const idleGP = Math.max(0, merchantCapital - totalDeployed);
  const efficiencyPct = merchantCapital > 0 ? Math.round((totalDeployed / merchantCapital) * 100) : 0;
  const circumference = 2 * Math.PI * 32;
  const dashOffset = circumference - (efficiencyPct / 100) * circumference;
  const todayFlips = flipsLog.filter(f => f.status !== "open" && f.date && new Date(f.date).toDateString() === new Date().toDateString());
  const realisedToday = todayFlips.reduce((s, f) => s + (f.totalProfit || 0), 0);
  const unrealisedTotal = allOpenPositions.reduce((s, pos) => {
    const liveItem = items.find(i => i.name.toLowerCase() === pos.name.toLowerCase());
    if (!liveItem) return s;
    const tax = Math.min(Math.floor(liveItem.high * 0.02), 5_000_000);
    return s + (liveItem.high - pos.buyPrice - tax) * pos.qty;
  }, 0);

  // ── State ──
  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState({ item: "", buyPrice: "", qty: "1" });
  const [addingPos, setAddingPos] = useState(false);
  const [addAc, setAddAc] = useState([]);
  const [showAddAc, setShowAddAc] = useState(false);
  const [addAcIdx, setAddAcIdx] = useState(-1);
  const [merchantFeedFilter, setMerchantFeedFilter] = useState("all");
  const [closingPos, setClosingPos] = useState(null);
  const [posStatuses, setPosStatuses] = useState({});
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
    if (hrs < 0.05 || realisedToday === 0) return null;
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

  function setPosStatus(id, status) {
    setPosStatuses(prev => ({ ...prev, [id]: status }));
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
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", fontWeight: 700, color: "var(--gold)", letterSpacing: "1.5px" }}>MERCHANT MODE</span>
          </div>
          <div className="merchant-header-pills">
            {[["operations", "⚔️ Operations"], ["analytics", "📊 Analytics"], ["alerts", "⚡ Alerts"]].map(([v, l]) => (
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
          { label: "Realised Today", value: `${realisedToday >= 0 ? "+" : ""}${formatGP(realisedToday)}`, color: realisedToday >= 0 ? "var(--green)" : "var(--red)", sub: `${todayFlips.length} flips closed` },
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
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{allOpenPositions.length} / 8 occupied</span>
                </div>
                <div className="slots-grid">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const pos = allOpenPositions[i];
                    if (!pos) return (
                      <div key={i} className="ge-slot empty" onClick={() => setShowAddRow(true)} title="Empty slot — click to add position">
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
                        <img src={itemIconUrl(pos.name)} alt="" style={{ width: 28, height: 28, objectFit: "contain", imageRendering: "pixelated" }}
                          onError={e => { e.target.style.display = "none"; }} />
                        <div className="slot-name">{pos.name.length > 12 ? pos.name.slice(0, 11) + "…" : pos.name}</div>
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
                  <button className="ops-add-btn" onClick={() => setShowAddRow(r => !r)}>+ Add Position</button>
                </div>

                {allOpenPositions.length === 0 && !showAddRow ? (
                  <div className="merchant-empty">
                    <div style={{ fontSize: "36px", opacity: 0.3 }}>⚔️</div>
                    <p style={{ marginTop: "10px", color: "var(--text-dim)", fontSize: "13px" }}>No open positions</p>
                    <small style={{ color: "var(--text-dim)", fontSize: "11px" }}>Log a buy in the Tracker, or add one here.</small>
                    <button className="ops-add-btn" style={{ marginTop: "12px" }} onClick={() => setShowAddRow(true)}>+ Add Position</button>
                  </div>
                ) : (
                  <div className="ops-table">
                    <div className="ops-header">
                      <span>Item</span><span>Status</span><span>Investment</span><span>Qty</span><span>Avg Buy</span><span>Sell Now</span><span>Live P&L</span><span>Health</span><span>Action</span>
                    </div>

                    {allOpenPositions.map(pos => {
                      const liveItem = items.find(i => i.name.toLowerCase() === pos.name.toLowerCase());
                      const tax = liveItem ? Math.min(Math.floor(liveItem.high * 0.02), 5_000_000) : 0;
                      const pnlEach = liveItem ? liveItem.high - pos.buyPrice - tax : 0;
                      const pnlTotal = pnlEach * pos.qty;
                      const pnlPct = pos.buyPrice > 0 ? ((pnlEach / pos.buyPrice) * 100).toFixed(1) : "0.0";
                      const marginGone = liveItem && liveItem.high <= pos.buyPrice;
                      const healthPct = getHealthPct(pos);
                      const healthColor = healthPct >= 60 ? "var(--green)" : healthPct >= 25 ? "#f39c12" : "var(--red)";
                      const healthText = healthPct >= 60 ? "Strong" : healthPct >= 25 ? "Fading" : "Danger";
                      const status = getPosStatus(pos);
                      return (
                        <div key={pos.id} className={`op-row op-row-${healthPct >= 60 ? "healthy" : healthPct >= 25 ? "warn" : "danger"}`}
                          onClick={() => liveItem && setSelectedItem(liveItem)}>
                          <div>
                            <div className="op-item-name">{pos.name}</div>
                            <div className="op-item-sub">{getHoldTime(pos.openedAt)} · {pos.source === "tracker" ? "Tracker" : "Portfolio"}</div>
                          </div>

                          {/* Status selector */}
                          <div onClick={e => e.stopPropagation()}>
                            <select className="pos-status-select"
                              value={status}
                              style={{ color: STATUS_COLORS[status] }}
                              onChange={e => setPosStatus(pos.id, e.target.value)}>
                              <option value="buying">🟡 Buying</option>
                              <option value="holding">🟢 Holding</option>
                              <option value="selling">🔵 Selling</option>
                              <option value="danger">🔴 Danger</option>
                            </select>
                          </div>

                          <span style={{ fontSize: "12px" }}>{formatGP(pos.gpIn)}</span>
                          <span style={{ fontSize: "12px" }}>{pos.qty.toLocaleString()}</span>
                          <span style={{ fontSize: "12px" }}>{formatGP(pos.buyPrice)}</span>
                          <span style={{ fontSize: "12px", color: liveItem ? "var(--text)" : "var(--text-dim)" }}>
                            {liveItem ? formatGP(liveItem.high) : "—"}
                          </span>
                          <div>
                            <div style={{ color: pnlTotal >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600, fontSize: "12px" }}>
                              {pnlTotal >= 0 ? "+" : ""}{formatGP(pnlTotal)}
                            </div>
                            <div style={{ fontSize: "10px", color: marginGone ? "var(--red)" : pnlTotal >= 0 ? "var(--green)" : "var(--red)" }}>
                              {marginGone ? "⚠ inverted" : `${pnlPct}%`}
                            </div>
                          </div>
                          <div className="health-bar-wrap" onClick={e => e.stopPropagation()}>
                            <div className="health-track">
                              <div className="health-fill" style={{ width: `${healthPct}%`, background: healthColor }} />
                            </div>
                            <span className="health-label" style={{ color: healthColor }}>{healthPct}% {healthText}</span>
                          </div>
                          <button className={`op-action-btn${healthPct < 25 ? " danger-btn" : ""}`}
                            onClick={e => { e.stopPropagation(); setClosingPos({ pos, type: pos.source }); }}>
                            {healthPct < 25 ? "Cut Loss" : "Close"}
                          </button>
                        </div>
                      );
                    })}

                    {/* Inline add-position row */}
                    {showAddRow && (() => {
                      const computedQty = parseInt(addForm.qty) || 1;
                      const computedBuy = parseInt(addForm.buyPrice.replace(/[^0-9]/g, "")) || 0;
                      const computedInvestment = computedBuy > 0 && computedQty > 0 ? (computedBuy * computedQty).toLocaleString() : "";
                      return (
                        <div className="add-pos-row">
                          <div className="merchant-ac-wrap" style={{ gridColumn: "span 1" }}>
                            <input className="add-pos-input" placeholder="Item name..." value={addForm.item} autoComplete="off"
                              onChange={e => {
                                const v = e.target.value;
                                setAddForm(f => ({ ...f, item: v }));
                                setAddAcIdx(-1);
                                if (v.length >= 2) {
                                  const matches = items.filter(i => i.name.toLowerCase().includes(v.toLowerCase())).slice(0, 8).map(i => i.name);
                                  setAddAc(matches); setShowAddAc(matches.length > 0);
                                } else setShowAddAc(false);
                              }}
                              onKeyDown={e => {
                                if (!showAddAc || addAc.length === 0) return;
                                if (e.key === "ArrowDown") { e.preventDefault(); setAddAcIdx(i => Math.min(i + 1, addAc.length - 1)); }
                                else if (e.key === "ArrowUp") { e.preventDefault(); setAddAcIdx(i => Math.max(i - 1, 0)); }
                                else if (e.key === "Enter" && addAcIdx >= 0) { e.preventDefault(); setAddForm(f => ({ ...f, item: addAc[addAcIdx] })); setShowAddAc(false); setAddAcIdx(-1); }
                                else if (e.key === "Escape") setShowAddAc(false);
                              }}
                              onBlur={() => setTimeout(() => setShowAddAc(false), 150)} />
                            {showAddAc && (
                              <div className="merchant-ac-list">
                                {addAc.map((name, idx) => (
                                  <div key={name} className={`merchant-ac-item${idx === addAcIdx ? " highlighted" : ""}`}
                                    onMouseDown={() => { setAddForm(f => ({ ...f, item: name })); setShowAddAc(false); setAddAcIdx(-1); }}>
                                    {name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div />
                          <div style={{ paddingRight: "6px" }}>
                            <input className="add-pos-input readonly" readOnly tabIndex={-1}
                              value={computedInvestment || ""} placeholder="Auto" />
                          </div>
                          <div style={{ paddingRight: "6px" }}>
                            <input className="add-pos-input" placeholder="Qty" value={addForm.qty}
                              onChange={e => setAddForm(f => ({ ...f, qty: e.target.value }))} />
                          </div>
                          <div style={{ paddingRight: "6px" }}>
                            <input className="add-pos-input" placeholder="Buy price ea." value={addForm.buyPrice}
                              onChange={e => setAddForm(f => ({ ...f, buyPrice: e.target.value }))} />
                          </div>
                          <div style={{ color: "var(--text-dim)", fontSize: "11px" }}>Live</div>
                          <div style={{ color: "var(--text-dim)", fontSize: "11px" }}>—</div>
                          <div />
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button className="add-pos-confirm" disabled={addingPos}
                              onClick={async e => {
                                e.stopPropagation();
                                if (!addForm.item || !addForm.buyPrice) return;
                                const buy = parseInt(addForm.buyPrice.replace(/[^0-9]/g, ""));
                                const qty = parseInt(addForm.qty) || 1;
                                if (isNaN(buy)) return;
                                setAddingPos(true);
                                await onAddPosition({ item: addForm.item, buyPrice: buy, qty });
                                setAddForm({ item: "", buyPrice: "", qty: "1" });
                                setShowAddRow(false);
                                setAddingPos(false);
                              }}>
                              {addingPos ? "…" : "Add"}
                            </button>
                            <button className="add-pos-cancel" onClick={e => { e.stopPropagation(); setShowAddRow(false); setAddForm({ item: "", buyPrice: "", qty: "1" }); setShowAddAc(false); }}>✕</button>
                          </div>
                        </div>
                      );
                    })()}
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
                    <div><div className="gauge-stat-label">Today's P&L</div><div className="gauge-stat-val" style={{ color: realisedToday >= 0 ? "var(--green)" : "var(--red)" }}>{realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)}</div></div>
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
                  <div className="m-panel-title" style={{ marginBottom: 0 }}>Today's P&L</div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: realisedToday >= 0 ? "var(--green)" : "var(--red)" }}>
                    {realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)}
                  </span>
                </div>
                {pnlHistory.length < 2 ? (
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>P&L timeline builds as you close flips today.</div>
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
                      <div className="rc-stat">ROI <span style={{ color: "var(--gold)" }}>{item.roi}%</span></div>
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
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Started {getSessionTime()} ago</span>
                </div>
                <div className="analytics-grid">
                  {[
                    { label: "Session Duration", val: getSessionTime(), color: "var(--text)" },
                    { label: "GP / Hour", val: gpHr !== null ? `${gpHr >= 0 ? "+" : ""}${formatGP(gpHr)}` : "—", color: gpHr !== null ? (gpHr >= 0 ? "var(--green)" : "var(--red)") : "var(--text-dim)" },
                    { label: "Flips Closed Today", val: todayFlips.length, color: "var(--text)" },
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
                  {topRiskPct > 50 && <span style={{ fontSize: "11px", color: "var(--red)", fontWeight: 600 }}>Concentrated position</span>}
                </div>
                {riskItems.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "12px 16px" }}>No open positions to analyse.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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

              {/* Today's Closed Flips */}
              <div id="tour-closed-today" className="merchant-section" style={{ flex: 1 }}>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{todayFlips.length} flips</span>
                </div>
                {todayFlips.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>No flips closed today yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {todayFlips.slice(0, 10).map(f => (
                      <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--bg3)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>{f.item}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "1px" }}>
                            {f.qty?.toLocaleString()}x · Buy {formatGP(f.buyPrice)} → Sell {formatGP(f.sellPrice)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: (f.totalProfit || 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                            {(f.totalProfit || 0) >= 0 ? "+" : ""}{formatGP(f.totalProfit || 0)}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{f.roi}% ROI</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="merchant-right">
              {/* P&L Chart */}
              <div className="m-panel-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div className="m-panel-title" style={{ marginBottom: 0 }}>Today's P&L</div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: realisedToday >= 0 ? "var(--green)" : "var(--red)" }}>
                    {realisedToday >= 0 ? "+" : ""}{formatGP(realisedToday)}
                  </span>
                </div>
                {pnlHistory.length < 2 ? (
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>P&L timeline builds as you close flips today.</div>
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
                  <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                    {["all","spike","surge","dump","crash"].map(f => (
                      <button key={f} onClick={() => setMerchantFeedFilter(f)}
                        style={{ padding: "3px 9px", borderRadius: "12px", border: "1px solid var(--border)", background: merchantFeedFilter === f ? "rgba(201,168,76,0.15)" : "transparent", color: merchantFeedFilter === f ? "var(--gold)" : "var(--text-dim)", fontSize: "10px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}>
                        {f === "all" ? "All" : f === "spike" ? "📈" : f === "surge" ? "🔥" : f === "dump" ? "⚠️" : "💥"}
                      </button>
                    ))}
                  </div>
                )}
                <div className="smart-events-list" style={{ borderRadius: "8px" }}>
                  {(() => {
                    const feed = (smartEvents || []).filter(e => !merchantFeedFilter || merchantFeedFilter === "all" || e.badge === merchantFeedFilter);
                    if (feed.length === 0) return (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                        <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.4 }}>📡</div>
                        No alerts yet. Monitoring every 30 seconds.
                      </div>
                    );
                    return feed.map(e => {
                      const liveItem = items.find(i => i.id === e.itemId);
                      return (
                        <div key={e.id} className="smart-event-row" style={{ cursor: liveItem ? "pointer" : "default" }}
                          onClick={() => liveItem && setSelectedItem(liveItem)}>
                          <span className="smart-event-icon">{e.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span className="smart-event-name" style={{ color: liveItem ? "var(--gold)" : "var(--text)" }}>{e.itemName}</span>
                              <span className={`smart-badge-${e.badge}`}>{e.badge.toUpperCase()}</span>
                            </div>
                            <div className="smart-event-msg">{e.message}</div>
                            {liveItem && (
                              <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "11px" }}>
                                <span style={{ color: "var(--text-dim)" }}>Margin: <span style={{ color: liveItem.margin > 0 ? "var(--green)" : "var(--red)" }}>{formatGP(liveItem.margin)}</span></span>
                                <span style={{ color: "var(--text-dim)" }}>ROI: <span style={{ color: "var(--gold)" }}>{liveItem.roi}%</span></span>
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

export default function RuneTrader() {
  const [showApp, setShowApp] = useState(false);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        const createdAt = session?.user?.created_at;
        const isNewUser = createdAt && (Date.now() - new Date(createdAt).getTime()) < 10000;
        if (isNewUser) {
          setTimeout(() => {
            const el = document.querySelector(TOUR_STEPS[0].target);
            if (el) { const r = el.getBoundingClientRect(); setTourRects({ top: r.top, left: r.left, width: r.width, height: r.height }); }
            setTourStep(0);
          }, 800);
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
      if (data.mode_enabled) setMerchantMode(true);
    }
  }

  async function saveMerchantCapital(val) {
    const gp = parseInt(val.replace(/[^0-9]/g, ""));
    if (isNaN(gp) || gp <= 0) return;
    setMerchantLoading(true);
    await supabase.from("merchant_settings").upsert({ user_id: user.id, total_capital: gp, mode_enabled: true, updated_at: new Date().toISOString() });
    setMerchantCapital(gp);
    setMerchantMode(true);
    setShowCapitalSetup(false);
    setMerchantLoading(false);
    showToast("Merchant Mode activated!", "success");
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
        if (el) { const r = el.getBoundingClientRect(); setMerchantTourRect({ top: r.top, left: r.left, width: r.width, height: r.height }); }
        else { setMerchantTourRect(null); }
      }, 80);
    } else { setMerchantTourRect(null); }
  }

  async function toggleMerchantMode() {
    if (!user) { setShowAuth(true); return; }
    if (!merchantMode) {
      if (merchantCapital === 0) { setShowCapitalSetup(true); return; }
      setMerchantMode(true);
      await supabase.from("merchant_settings").upsert({ user_id: user.id, mode_enabled: true, updated_at: new Date().toISOString() });
    } else {
      setMerchantMode(false);
      await supabase.from("merchant_settings").upsert({ user_id: user.id, mode_enabled: false, updated_at: new Date().toISOString() });
    }
  }

  useEffect(() => { if (user) loadMerchantSettings(); }, [user]); // eslint-disable-line

  // Load manual positions for Merchant Mode (read-only copy)
  const [merchantPositions, setMerchantPositions] = useState([]);
  useEffect(() => {
    if (!user || !merchantMode) return;
    supabase.from("positions").select("*").then(({ data }) => setMerchantPositions(data || []));
  }, [user, merchantMode]); // eslint-disable-line

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
  const [prefs, setPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem("runetrader_prefs") || "{}"); } catch { return {}; } });
  const [budget, setBudget] = useState(() => { try { return JSON.parse(localStorage.getItem("runetrader_prefs") || "{}").budget || ""; } catch { return ""; } });
  function savePref(key, val) {
    const u = { ...prefs, [key]: val };
    setPrefs(u);
    localStorage.setItem("runetrader_prefs", JSON.stringify(u));
    setSortCol("score");
    setSortDir("desc");
  }

  // ── UI state ──
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("flips");
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortCol, setSortCol] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  function handleSort(col) { if (sortCol === col) { setSortDir(d => d === "desc" ? "asc" : "desc"); } else { setSortCol(col); setSortDir("desc"); } }

  // ── AI Chat ──
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const itemsRef = useRef([]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Tracker ──
  const [flipsLog, setFlipsLog] = useState(() => { try { return JSON.parse(localStorage.getItem("runetrader_flips") || "[]"); } catch { return []; } });
  const [flipsLoading, setFlipsLoading] = useState(false);

  // ── Merchant P&L tracking (after flipsLog is declared) ──
  useEffect(() => {
    if (!merchantMode) return;
    const totalRealised = flipsLog.filter(f => f.status !== "open" && f.date && new Date(f.date).toDateString() === new Date().toDateString()).reduce((s, f) => s + (f.totalProfit || 0), 0);
    const snap = { time: Date.now(), value: totalRealised };
    setPnlHistory(prev => {
      const today = prev.filter(p => new Date(p.time).toDateString() === new Date().toDateString());
      const updated = [...today.slice(-48), snap];
      localStorage.setItem("runetrader_pnl_history", JSON.stringify(updated));
      return updated;
    });
  }, [flipsLog, merchantMode]); // eslint-disable-line

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
  const [autocomplete, setAutocomplete] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // ── Close flip modal ──
  const [closingFlip, setClosingFlip] = useState(null);
  const [closeFlipLoading, setCloseFlipLoading] = useState(false);

  // ── Favourites ──
  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("runetrader_favs") || "[]"); } catch { return []; }
  });

  function toggleFavourite(itemId) {
    setFavourites(prev => {
      const next = prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId];
      localStorage.setItem("runetrader_favs", JSON.stringify(next));
      return next;
    });
  }

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
    try { return JSON.parse(localStorage.getItem("runetrader_smart_alerts") || '{"marginSpike":true,"volumeSurge":true,"dumpDetected":true,"priceCrash":true}'); }
    catch { return { marginSpike: true, volumeSurge: true, dumpDetected: true, priceCrash: true }; }
  });
  const [smartEvents, setSmartEvents] = useState([]);
  const [smartFeedFilter, setSmartFeedFilter] = useState("all"); // all | spike | surge | dump | crash
  const [smartFeedSort, setSmartFeedSort] = useState("recent");  // recent | change | margin
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

  async function fetchPrices(isManualRefresh = false) {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Always fetch latest prices
      const latestRes = await fetch("https://prices.runescape.wiki/api/v1/osrs/latest", { headers: { "User-Agent": "RuneTrader/1.0" } });
      const latestData = await latestRes.json();

      // Fetch mapping once per session (it never changes)
      if (!mappingCacheRef.current) {
        const mappingRes = await fetch("https://prices.runescape.wiki/api/v1/osrs/mapping", { headers: { "User-Agent": "RuneTrader/1.0" } });
        const mappingData = await mappingRes.json();
        const mappingMap = {};
        const nameMap = {};
        mappingData.forEach(item => { mappingMap[item.id] = item; nameMap[item.id] = item.name; });
        mappingCacheRef.current = mappingMap;
        setAllItemsMap(nameMap);
      }

      // Fetch volumes at most once every 10 minutes (updates daily)
      const now = Date.now();
      if (!volumeCacheRef.current || now - volumeCacheTimeRef.current > 10 * 60 * 1000) {
        const volumeRes = await fetch("https://prices.runescape.wiki/api/v1/osrs/volumes", { headers: { "User-Agent": "RuneTrader/1.0" } });
        const volumeData = await volumeRes.json();
        volumeCacheRef.current = volumeData.data || {};
        volumeCacheTimeRef.current = now;
      }

      const mappingMap = mappingCacheRef.current;
      const volumeMap = volumeCacheRef.current;
      const TAX_EXEMPT_IDS = [13190, 13191, 13192];
      const flips = [];
      for (const [idStr, prices] of Object.entries(latestData.data)) {
        const id = parseInt(idStr);
        const meta = mappingMap[id];
        if (!meta) continue;
        const { high, low, highTime, lowTime } = prices;
        if (!high || !low) continue;
        const rawTax = Math.floor(high * 0.02);
        const TAX = TAX_EXEMPT_IDS.includes(id) ? 0 : (high < 50 ? 0 : Math.min(rawTax, 5_000_000));
        const margin = high - low - TAX;
        const roi = parseFloat(((margin / low) * 100).toFixed(1));
        const volume = volumeMap[id] || 0;
        const lastTradeTime = Math.max(highTime || 0, lowTime || 0);
        const score = getScore(margin, volume, roi, null, null, meta.limit || 0, lastTradeTime);
        const flip = { id, name: meta.name, category: meta.members ? "Members" : "F2P", buyLimit: meta.limit || 0, high, low, margin, roi, volume, score, lastTradeTime };
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
    setActiveTab("flips");
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
  async function logFlip() {
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
  function flipThisItem(item) {
    const { adjLow, adjHigh } = applyOffset(item.low, item.high, prefs.speed);
    setLogForm({ item: item.name, buyPrice: String(adjLow), sellPrice: String(adjHigh), qty: "1" });
    setActiveTab("tracker");
  }

  async function deleteFlip(id) {
    if (user) { await supabase.from("flips").delete().eq("id", id); }
    else { localStorage.setItem("runetrader_flips", JSON.stringify(flipsLog.filter(f => f.id !== id))); }
    setFlipsLog(prev => prev.filter(f => f.id !== id));
  }

  async function clearAllFlips() {
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
    const systemPrompt = `You are the RuneTrader AI assistant — an expert OSRS Grand Exchange flipping advisor with live GE data.
${budget ? `User cash stack: ${parseInt(budget.replace(/,/g,"")).toLocaleString()} gp — only recommend items they can afford (buy price must fit their stack, ideally with room for 5+ flips)` : "Cash stack not set — ask before recommending specific items."}
${prefs.risk ? `Risk tolerance: ${prefs.risk} — ${riskMap[prefs.risk]}` : "Risk not set."}
${prefs.speed ? `Flip speed: ${prefs.speed} — ${speedMap[prefs.speed]}` : "Speed not set."}

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
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, system: systemPrompt, messages: [...messages.filter(m => m.role !== "system").slice(-6).map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }] }) });
      const data = await res.json();
      const reply = data.error ? `API Error: ${data.error.message || data.error.type}` : (data.content?.[0]?.text || "Sorry, no response.");
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Connection error: ${e.message}`, time: new Date() }]);
    } finally { setAiLoading(false); }
  }

  const sourceItems = search.trim() ? allItems : items;
  const scoredItems = sourceItems.map(item => ({
    ...item,
    prefScore: getScore(item.margin, item.volume, item.roi, prefs.speed, prefs.risk, item.buyLimit, item.lastTradeTime),
  }));

  const filtered = scoredItems.filter(item => {
    if (search.trim()) {
      const matched = item.name.toLowerCase().includes(search.toLowerCase());
      // When searching, show all matching items but mark invalid ones visually
      return matched;
    }
    const budgetGp = budget ? parseInt(budget.replace(/[^0-9]/g, "")) * (budget.toLowerCase().includes("m") ? 1_000_000 : budget.toLowerCase().includes("k") ? 1_000 : 1) : null;
    const { adjLow, adjHigh } = applyOffset(item.low, item.high, prefs.speed);
    const adjMargin = item.margin - (adjLow - item.low) - (item.high - adjHigh);

    // Speed filter: Fast needs genuinely high volume to fill quickly
    const passesSpeed = !prefs.speed ||
      (prefs.speed === "Fast"  && item.volume >= 50_000) ||
      (prefs.speed === "Med"   && item.volume >= 5_000)  ||
      prefs.speed === "Slow";

    // Risk filter: Low risk = only high-volume, low-ROI items; High = relax everything
    const passesRisk = !prefs.risk ||
      (prefs.risk === "Low"  && item.volume >= 20_000 && item.roi <= 20) ||
      (prefs.risk === "Med"  && item.volume >= 2_000  && item.roi <= 60) ||
      prefs.risk === "High";

    // Always: must have positive adjusted margin, valid price, pass budget & tab filter
    return (!budgetGp || item.low <= budgetGp) &&
      (filter === "all" || (filter === "f2p" && item.category === "F2P") || (filter === "members" && item.category === "Members") || (filter === "highvol" && item.volume > 500)) &&
      passesRisk && passesSpeed &&
      adjMargin > 0 &&
      item.high >= item.low &&
      (filter !== "favourites" || favourites.includes(item.id));
  }).sort((a, b) => {
    if (sortCol === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sortCol === "volume") return sortDir === "asc" ? a.volume - b.volume : b.volume - a.volume;
    if (sortCol === "buylimit") return sortDir === "asc" ? a.buyLimit - b.buyLimit : b.buyLimit - a.buyLimit;
    if (sortCol === "margin") {
      const adj = i => { const { adjLow, adjHigh } = applyOffset(i.low, i.high, prefs.speed); return i.margin - (adjLow - i.low) - (i.high - adjHigh); };
      return sortDir === "asc" ? adj(a) - adj(b) : adj(b) - adj(a);
    }
    if (sortCol === "score") return sortDir === "asc" ? a.prefScore - b.prefScore : b.prefScore - a.prefScore;
    if (sortCol === "gpPerFill") {
      const calc = i => { const lim = i.buyLimit > 0 ? i.buyLimit : 500; return i.margin * Math.min(lim, i.volume / 6); };
      return sortDir === "asc" ? calc(a) - calc(b) : calc(b) - calc(a);
    }
    if (sortCol === "lastTradeTime") return sortDir === "asc" ? (a.lastTradeTime || 0) - (b.lastTradeTime || 0) : (b.lastTradeTime || 0) - (a.lastTradeTime || 0);
    return sortDir === "asc" ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol];
  });

  // ── Tracker stats (closed flips only) ──
  const closedFlips = flipsLog.filter(f => f.status !== "open");
  const openFlips = flipsLog.filter(f => f.status === "open");
  const totalProfit = closedFlips.reduce((s, f) => s + (f.totalProfit || 0), 0);
  const totalFlips = closedFlips.length;
  const avgProfit = totalFlips ? Math.round(totalProfit / totalFlips) : 0;
  const bestItem = closedFlips.length ? closedFlips.reduce((best, f) => (f.totalProfit || 0) > (best.totalProfit || 0) ? f : best, closedFlips[0]) : null;

  if (!showApp) return <LandingPage onEnterApp={() => setShowApp(true)} />;

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
            <div className="capital-setup-title">⚔️ Activate Merchant Mode</div>
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

      {/* MERCHANT TOUR */}
      {merchantTourStep >= 0 && (() => {
        const step = MERCHANT_TOUR_STEPS[merchantTourStep];
        const isCenter = step.placement === "center" || !merchantTourRect;
        const pad = 10;
        const hl = merchantTourRect || {};
        let ttStyle = {};
        if (isCenter) {
          ttStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
        } else if (step.placement === "bottom") {
          ttStyle = { top: hl.top + hl.height + pad + 12, left: Math.max(8, Math.min(hl.left, window.innerWidth - 320)) };
        } else if (step.placement === "top") {
          ttStyle = { top: hl.top - pad - 180, left: Math.max(8, Math.min(hl.left, window.innerWidth - 320)) };
        } else if (step.placement === "left") {
          ttStyle = { top: hl.top, right: window.innerWidth - hl.left + pad + 8, left: "auto" };
        }
        return (
          <>
            <div className="tour-backdrop" onClick={endMerchantTour} />
            {!isCenter && merchantTourRect && <div className="tour-highlight" style={{ top: hl.top - pad, left: hl.left - pad, width: hl.width + pad * 2, height: hl.height + pad * 2 }} />}
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

      {/* ITEM CHART MODAL */}
      {selectedItem && (
        <ItemChart
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAskAI={msg => { setInput(msg); sendMessage(msg); }}
          onFlipThis={flipThisItem}
          onRefresh={() => fetchPrices(true)}
          refreshing={refreshing}
          refreshCooldown={refreshCooldown}
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
            {!merchantMode && ["flips", "tracker", "alerts", ...(user ? ["portfolio"] : [])].map(t => (
              <button key={t} className={`nav-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "tracker" && openFlips.length > 0 && (
                  <span style={{ marginLeft: "6px", background: "var(--gold)", color: "#000", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>
                    {openFlips.length}
                  </span>
                )}
                {t === "alerts" && (alerts.filter(a => a.triggered).length + smartEvents.length) > 0 && (
                  <span style={{ marginLeft: "6px", background: "var(--gold)", color: "#000", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>
                    {alerts.filter(a => a.triggered).length + smartEvents.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="header-right">
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
                <span style={{ fontSize: "13px" }}>⚔️</span>
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
          {merchantMode && user ? (
            <MerchantMode
              items={items}
              flipsLog={flipsLog}
              manualPositions={merchantPositions}
              merchantCapital={merchantCapital}
              setMerchantCapital={setMerchantCapital}
              pnlHistory={pnlHistory}
              pnlCanvasRef={pnlCanvasRef}
              formatGP={formatGP}
              setSelectedItem={setSelectedItem}
              showToast={showToast}
              supabase={supabase}
              user={user}
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
            />
          ) : (
          <>
          <div className="left-panel">

            {/* ── TRACKER TAB ── */}
            {activeTab === "tracker" && (
              <div className="tracker-wrap">
                <div className="tracker-summary">
                  {[
                    { label: "Total Profit", value: formatGP(totalProfit), color: totalProfit >= 0 ? "var(--green)" : "var(--red)", sub: "Closed flips only" },
                    { label: "Flips Logged", value: totalFlips.toLocaleString(), color: "var(--gold)", sub: `${openFlips.length} open` },
                    { label: "Avg Profit/Flip", value: formatGP(avgProfit), color: "var(--text)", sub: "Per closed flip" },
                    { label: "Best Item", value: bestItem?.item || "—", color: "var(--gold)", sub: bestItem ? formatGP(bestItem.totalProfit) + " profit" : "Log a flip first" },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <span className="stat-label">{s.label}</span>
                      <span className="stat-value" style={{ color: s.color, fontSize: s.label === "Best Item" ? "14px" : "22px" }}>{s.value}</span>
                      <span className="stat-sub">{s.sub}</span>
                    </div>
                  ))}
                </div>

                <ProfitChart flipsLog={flipsLog} />

                <div className="tracker-form">
                  <div className="tracker-form-title">⚔️ Log a Flip</div>
                  <div className="tracker-form-row">
                    <div className="tracker-field">
                      <label className="tracker-label">Item Name</label>
                      <input className="tracker-input" placeholder="e.g. Abyssal whip" value={logForm.item}
                        onChange={e => handleItemInput(e.target.value, setLogForm, setAutocomplete, setShowAutocomplete)}
                        onKeyDown={e => { if (e.key === "Enter") logFlip(); if (e.key === "Escape") setShowAutocomplete(false); }}
                        onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                        autoComplete="off" />
                      {showAutocomplete && (
                        <div className="autocomplete-list">
                          {autocomplete.map(name => (
                            <div key={name} className="autocomplete-item" onMouseDown={() => {
                              const liveItem = items.find(i => i.name === name);
                              const extraFields = liveItem ? { buyPrice: String(liveItem.low), sellPrice: String(liveItem.high) } : {};
                              selectAutocomplete(name, setLogForm, setShowAutocomplete, () => extraFields);
                            }}>{name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="tracker-field">
                      <label className="tracker-label">Buy Price (gp)</label>
                      <input className="tracker-input" placeholder="e.g. 1500000" value={logForm.buyPrice} onChange={e => setLogForm(f => ({ ...f, buyPrice: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <div className="tracker-field">
                      <label className="tracker-label">
                        Sell Price (gp)
                        <span style={{ color: "var(--gold-dim)", marginLeft: "4px", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>optional</span>
                      </label>
                      <input
                        className="tracker-input optional-field"
                        placeholder="Leave blank = open flip"
                        value={logForm.sellPrice}
                        onChange={e => setLogForm(f => ({ ...f, sellPrice: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") logFlip(); }}
                      />
                    </div>
                    <div className="tracker-field">
                      <label className="tracker-label">Quantity</label>
                      <input className="tracker-input" placeholder="1" value={logForm.qty} onChange={e => setLogForm(f => ({ ...f, qty: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <button className="log-btn" disabled={!logForm.item || !logForm.buyPrice} onClick={logFlip}>
                      {logForm.sellPrice.trim() ? "+ Log" : "+ Open"}
                    </button>
                  </div>
                  {!logForm.sellPrice.trim() && logForm.buyPrice && (
                    <div style={{ fontSize: "11px", color: "var(--gold-dim)", display: "flex", alignItems: "center", gap: "4px" }}>
                      ℹ️ No sell price — will be logged as an <strong>open flip</strong>. Close it later when you sell.
                    </div>
                  )}
                </div>

                <div>
                  <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Flip History</span>
                    {flipsLog.length > 0 && <button className="clear-btn" onClick={clearAllFlips}>Clear All</button>}
                  </div>
                  <div className="flips-log">
                    <div className="log-header">
                      <span>Item</span><span>Buy</span><span>Sell</span><span>Qty</span><span>Tax</span><span>Profit</span><span>Action</span>
                    </div>
                    {flipsLoading ? <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "40px" }}>Loading flips...</div>
                      : flipsLog.length === 0 ? (
                        <div className="tracker-empty"><div className="icon">📋</div><p>No flips logged yet</p><small>Fill in the form above to start tracking your profits</small></div>
                      ) : flipsLog.map(f => (
                        <div key={f.id} className={`log-row${f.status === "open" ? " open-flip" : ""}`}>
                          <div>
                            <div className="log-item-name">{f.item}</div>
                            <div className="log-date">{new Date(f.date || Date.now()).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                            {f.status === "open" && merchantMode && (
                              <span className="merchant-sync-badge">⚔️ In Merchant Mode</span>
                            )}
                          </div>
                          <span>{formatGP(f.buyPrice)}</span>
                          <span style={{ color: f.status === "open" ? "var(--text-dim)" : "var(--text)" }}>
                            {f.status === "open" ? "—" : formatGP(f.sellPrice)}
                          </span>
                          <span>{(f.qty || 1).toLocaleString()}</span>
                          <span style={{ color: "var(--text-dim)" }}>
                            {f.status === "open" ? "—" : formatGP((f.tax || 0) * (f.qty || 1))}
                          </span>
                          <div>
                            {f.status === "open" ? (
                              <span className="open-badge">OPEN</span>
                            ) : (
                              <>
                                <div className={f.totalProfit >= 0 ? "profit-pos" : "profit-neg"}>{f.totalProfit >= 0 ? "+" : ""}{formatGP(f.totalProfit)}</div>
                                <div className={f.roi >= 5 ? "roi-pos" : f.roi < 0 ? "roi-neg" : "roi-neu"}>{f.roi > 0 ? "+" : ""}{f.roi}% ROI</div>
                              </>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            {f.status === "open" && (
                              <button className="close-flip-btn" onClick={() => setClosingFlip(f)}>Close</button>
                            )}
                            <button className="delete-btn" onClick={() => deleteFlip(f.id)}>✕</button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
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
                    <span>✅ Push notifications active — you'll be alerted even when RuneTrader is closed.</span>
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
                        <ThresholdPopover alertKey={key} label={label} unit={unit} min={min} max={max} step={step} thresholds={thresholds} openPopover={openPopover} setOpenPopover={setOpenPopover} saveThreshold={saveThreshold} />
                        <label className="toggle-switch">
                          <input type="checkbox" checked={smartAlertSettings[key]} onChange={e => saveSmartAlertSettings(key, e.target.checked)} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── PRICE ALERT FORM ── */}
                <div className="alert-info">ℹ️ Price alerts check every 5 minutes. Triggered alerts won't fire again — delete and re-add to reset.</div>
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
                    <div className="smart-feed-controls" style={{ marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Filter:</span>
                      <select className="smart-feed-select" value={smartFeedFilter} onChange={e => setSmartFeedFilter(e.target.value)}>
                        <option value="all">All types</option>
                        <option value="spike">📈 Spike only</option>
                        <option value="surge">🔥 Surge only</option>
                        <option value="dump">⚠️ Dump only</option>
                        <option value="crash">💥 Crash only</option>
                      </select>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)", marginLeft: "8px" }}>Sort:</span>
                      <select className="smart-feed-select" value={smartFeedSort} onChange={e => setSmartFeedSort(e.target.value)}>
                        <option value="recent">Most Recent</option>
                        <option value="change">Largest % Change</option>
                        <option value="margin">Largest Margin</option>
                      </select>
                    </div>
                  )}

                  <div className="smart-events-list">
                    {(() => {
                      let feed = [...smartEvents];
                      // Filter
                      if (smartFeedFilter !== "all") feed = feed.filter(e => e.badge === smartFeedFilter);
                      // Sort
                      if (smartFeedSort === "change") {
                        feed.sort((a, b) => {
                          const pctA = a.oldVal ? Math.abs((a.newVal - a.oldVal) / Math.abs(a.oldVal)) : 0;
                          const pctB = b.oldVal ? Math.abs((b.newVal - b.oldVal) / Math.abs(b.oldVal)) : 0;
                          return pctB - pctA;
                        });
                      } else if (smartFeedSort === "margin") {
                        feed.sort((a, b) => {
                          const mA = items.find(i => i.id === a.itemId)?.margin || 0;
                          const mB = items.find(i => i.id === b.itemId)?.margin || 0;
                          return mB - mA;
                        });
                      }
                      if (feed.length === 0) return (
                        <div className="smart-empty">
                          {smartEvents.length > 0 ? "No alerts match this filter." : "No smart alerts yet — they'll appear here when market conditions shift."}
                        </div>
                      );
                      return feed.map(e => {
                        const liveItem = items.find(i => i.id === e.itemId);
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
                                  <span style={{ color: "var(--text-dim)" }}>ROI: <span style={{ color: "var(--gold)" }}>{liveItem.roi}%</span></span>
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
                setFlipsLog={setFlipsLog}
                mapFlipRow={mapFlipRow}
                items={items}
                onSignIn={() => setShowAuth(true)}
                showToast={showToast}
                supabase={supabase}
              />
            )}

            {/* ── FLIPS TAB ── */}
            {activeTab === "flips" && (
              <>
                <div className="prefs-bar">
                  <div className="pref-card">
                    <span className="pref-label">Cash Stack</span>
                    <input className="pref-input" placeholder="e.g. 50000000" value={budget} onChange={e => { setBudget(e.target.value); savePref("budget", e.target.value); }} />
                    <span className="pref-sub">Filters flips by buy price</span>
                  </div>
                  <div className="pref-card">
                    <span className="pref-label">Risk Tolerance</span>
                    <div className="toggle-group">
                      {["Low", "Med", "High"].map(r => <button key={r} className={`toggle-btn ${prefs.risk === r ? (r === "Low" ? "active-low" : r === "Med" ? "active-med" : "active-high") : ""}`} onClick={() => savePref("risk", r)}>{r}</button>)}
                    </div>
                    <span className="pref-sub">{prefs.risk === "Low" ? "Safe, high-volume only" : prefs.risk === "High" ? "Higher margins, less liquid" : "Balanced risk/reward"}</span>
                  </div>
                  <div className="pref-card">
                    <span className="pref-label">Flip Speed</span>
                    <div className="toggle-group">
                      {[{ label: "Fast", sub: "<30m" }, { label: "Med", sub: "1-2h" }, { label: "Slow", sub: "4h+" }].map(s => <button key={s.label} className={`toggle-btn ${prefs.speed === s.label ? (s.label === "Fast" ? "active-fast" : s.label === "Med" ? "active-med-speed" : "active-slow") : ""}`} onClick={() => savePref("speed", s.label)}>{s.label} <span style={{ opacity: 0.6, fontSize: "10px" }}>{s.sub}</span></button>)}
                    </div>
                    <span className="pref-sub">{prefs.speed === "Fast" ? "High volume, quick fills" : prefs.speed === "Slow" ? "Bigger margins, patient" : "Mix of speed and margin"}</span>
                  </div>
                  <div className="pref-card">
                    <span className="pref-label">Market Right Now</span>
                    <span className="stat-value" style={{ fontSize: "20px", color: "var(--gold)", fontFamily: "Cinzel, serif" }}>
                      {loading ? "—" : items.length.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "Inter, sans-serif", fontWeight: 400 }}>valid flips</span>
                    </span>
                    <span className="pref-sub">{(() => { const best = [...items].sort((a, b) => b.margin - a.margin)[0]; return loading ? "—" : `Best: ${best?.name || "—"} · ${formatGP(best?.margin)} gp`; })()}</span>
                  </div>
                </div>

                {error && <div className="error-banner">⚠️ {error}</div>}

                <div className="filter-bar">
                  <span className="filter-label">Filter:</span>
                  {["all", "f2p", "members", "highvol", "favourites"].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                      {f === "all" ? "All Items" : f === "f2p" ? "F2P" : f === "members" ? "Members" : f === "highvol" ? "High Volume" : `⭐ Favourites${favourites.length > 0 ? ` (${favourites.length})` : ""}`}
                    </button>
                  ))}
                  <input className="filter-input" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: "auto" }} />
                  <button
                    className="refresh-btn"
                    onClick={() => fetchPrices(true)}
                    disabled={refreshing || loading || refreshCooldown > 0}
                    title={refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : "Refresh all prices"}
                  >
                    <span className={refreshing ? "refresh-spin" : ""}>↻</span>
                    {refreshing ? "Refreshing..." : refreshCooldown > 0 ? `${refreshCooldown}s` : "Refresh"}
                  </button>
                </div>

                <div>
                  <div className="section-title">Top Flips</div>
                  <div className="flips-table">
                    <div className="table-header">
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
                        ["score", "Score", "RuneTrader score 0–100. Combines margin, volume, ROI, liquidity, and trade freshness."],
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
                        <div key={i} className="flip-row">{Array.from({ length: 10 }).map((_, j) => <div key={j} className="skeleton" style={{ width: j === 0 ? "80%" : "60%", animationDelay: `${i * 0.1}s` }} />)}</div>
                      ))
                    ) : filtered.length === 0 ? (
                      <div className="empty-state"><div className="icon">🔍</div><p>No items match your filters</p></div>
                    ) : (
                      filtered.slice(0, search.trim() ? 200 : 100).map(item => {
                        const { adjLow, adjHigh } = applyOffset(item.low, item.high, prefs.speed);
                        const adjMargin = item.margin - (adjLow - item.low) - (item.high - adjHigh);
                        const ageSec = item.lastTradeTime ? Math.floor(Date.now() / 1000 - item.lastTradeTime) : null;
                        const tradeColor = !ageSec ? "var(--text-dim)" : ageSec < 300 ? "var(--green)" : ageSec < 3600 ? "var(--text)" : "var(--text-dim)";
                        // GP/Fill: volume-scaled realistic profit per 4hr window
                        const lim = item.buyLimit > 0 ? item.buyLimit : 500;
                        const mkt4hr = item.volume / 6;
                        let expFill;
                        if      (item.volume >= 500_000) expFill = Math.min(lim, mkt4hr);
                        else if (item.volume >= 100_000) expFill = Math.min(lim, mkt4hr * 0.6);
                        else if (item.volume >= 20_000)  expFill = Math.min(lim, mkt4hr * 0.2);
                        else if (item.volume >= 5_000)   expFill = Math.min(lim, mkt4hr * 0.08);
                        else                             expFill = Math.min(lim, mkt4hr * 0.03);
                        const gpPerFill = Math.round(adjMargin * Math.max(expFill, 1));
                        const gpPerFillMax = Math.round(adjMargin * Math.min(lim, mkt4hr));
                        // Confidence label: can the market supply your buy limit in 4hrs?
                        // This is the RIGHT question — 5k/day vol with limit=15 is fine (333/4hr >> 15)
                        // but 5k/day vol with limit=5000 is terrible (333/4hr << 5000)
                        const liqRatio = mkt4hr / Math.max(lim, 1);
                        let fillConf, fillConfColor;
                        if      (liqRatio >= 5)  { fillConf = null;           fillConfColor = "var(--green)"; }  // market supplies 5x limit — fills easily
                        else if (liqRatio >= 2)  { fillConf = "likely fills"; fillConfColor = "var(--green)"; }  // market supplies 2x limit — good odds
                        else if (liqRatio >= 0.8){ fillConf = "~competitive"; fillConfColor = "var(--gold)"; }   // market roughly matches limit — competition matters
                        else if (liqRatio >= 0.3){ fillConf = "~partial";     fillConfColor = "#f39c12"; }       // market can't fully supply limit
                        else                     { fillConf = "low liq";       fillConfColor = "var(--red)"; }   // market way under limit
                        return (
                          <div key={item.id} className="flip-row" onClick={() => setSelectedItem({ ...item, adjLow, adjHigh, adjMargin })}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button onClick={e => { e.stopPropagation(); toggleFavourite(item.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", opacity: favourites.includes(item.id) ? 1 : 0.25, transition: "opacity 0.15s", padding: "0", flexShrink: 0 }} title={favourites.includes(item.id) ? "Remove favourite" : "Add to favourites"}>⭐</button>
                              <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                              <div>
                                <div className="item-name">{item.name}</div>
                                {search.trim() && !isValidFlip(item) && <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>no margin right now</div>}
                              </div>
                            </div>
                            <span className="price">{formatGP(adjLow)}</span>
                            <span className="price">{formatGP(adjHigh)}</span>
                            <span className={`margin ${adjMargin < 0 ? "neg" : ""}`}>{formatGP(adjMargin)}</span>
                            <span className="roi" style={{ color: item.roi >= 20 ? "var(--green)" : item.roi >= 8 ? "var(--gold)" : "var(--text-dim)" }}>{item.roi}%</span>
                            <span className="price" style={{ color: item.volume >= 500 ? "var(--green)" : item.volume >= 100 ? "var(--text)" : "var(--text-dim)" }} title={item.buyLimit > 0 ? `${(item.volume/Math.max(item.buyLimit,1)).toFixed(1)}x daily vol vs limit` : "No buy limit data"}>
                              {item.volume >= 1000 ? (item.volume/1000).toFixed(1)+"k" : item.volume.toLocaleString()}
                              {item.buyLimit > 0 && item.volume < item.buyLimit && <span style={{ color: "var(--red)", fontSize: "10px", marginLeft: "3px" }} title="Volume lower than buy limit — hard to fill">⚠</span>}
                            </span>
                            <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit ? item.buyLimit.toLocaleString() : "?"}</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: gpPerFill >= 1_000_000 ? "var(--green)" : gpPerFill >= 200_000 ? "var(--gold)" : "var(--text-dim)" }}
                                title={`Realistic: ${formatGP(gpPerFill)} GP/fill\nBest case (full limit): ${formatGP(gpPerFillMax)} GP`}>
                                {formatGP(gpPerFill)}
                              </span>
                              {fillConf && <span style={{ fontSize: "10px", color: fillConfColor }}>{fillConf}</span>}
                            </div>
                            <span style={{ fontSize: "11px", color: tradeColor }}>{timeAgo(item.lastTradeTime)}</span>
                            <span className={`score-badge ${item.prefScore >= 70 ? "score-high" : item.prefScore >= 40 ? "score-med" : "score-low"}`}>{item.prefScore}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── AI CHAT PANEL ── */}
          <div className="right-panel">
            <div className="chat-header">
              <div className="chat-header-icon">⚔️</div>
              <div className="chat-header-text"><h3>AI Advisor</h3><p>Live GE data · Powered by Claude</p></div>
            </div>
            <div className="chat-body">
              <div className="chat-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`msg ${msg.role}`}>
                    <div className="msg-bubble">
                      {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                    </div>
                    <span className="msg-time">{formatTime(msg.time)}</span>
                  </div>
                ))}
                {aiLoading && <div className="msg assistant"><div className="msg-bubble"><div className="typing"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div></div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-float-input">
                <div className="quick-prompts-row">
                  {QUICK_PROMPTS.map(p => <button key={p} className="quick-prompt" onClick={() => sendMessage(p)}>{p}</button>)}
                </div>
                <div className="chat-input-row">
                  <textarea className="chat-input" placeholder="Ask anything about flipping..." value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = "24px";
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) sendMessage(input.trim()); } }} />
                  <button className="send-btn" disabled={!input.trim() || aiLoading} onClick={() => sendMessage(input.trim())}>➤</button>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </>
  );
}
