import { useState, useEffect, useRef } from "react";
import LandingPage from "./LandingPage";
import AuthModal from "./AuthModal";
import { supabase } from "./supabaseClient";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
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
  .section-title { font-family: 'Cinzel', serif; font-size: 14px; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .flips-table { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .sort-btn { background: none; border: none; cursor: pointer; color: inherit; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: "Inter", sans-serif; padding: 0; display: flex; align-items: center; gap: 4px; transition: color 0.15s; }
  .sort-btn:hover { color: var(--gold); }
  .sort-btn.active { color: var(--gold); }
  .sort-arrow { font-size: 9px; opacity: 0.7; }
  .flip-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 80px; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; cursor: pointer; align-items: center; }
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
  .msg-bubble { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
  .msg.user .msg-bubble { background: linear-gradient(135deg, var(--gold-dim), #6b4f1a); color: #fff; border-radius: 12px 12px 2px 12px; }
  .msg.assistant .msg-bubble { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 12px 12px 12px 2px; }
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

  /* Quick prompts — wrap so chips never clip */
  .quick-prompts-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .quick-prompt { padding: 4px 10px; border-radius: 20px; font-size: 11px; cursor: pointer; background: var(--bg2); border: 1px solid var(--border); color: var(--text-dim); transition: all 0.2s; font-family: 'Inter', sans-serif; white-space: nowrap; }
  .quick-prompt:hover { border-color: var(--gold-dim); color: var(--gold); background: var(--bg3); }

  /* CHART MODAL */
  .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 860px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.25s ease; }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 28px; border-bottom: 1px solid var(--border); }
  .modal-title { font-family: 'Cinzel', serif; font-size: 20px; color: var(--gold); }
  .modal-meta { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
  .modal-close { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text-dim); cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .modal-close:hover { border-color: var(--red); color: var(--red); }
  .modal-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); }
  .modal-stat { background: var(--bg3); padding: 16px 20px; }
  .modal-stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .modal-stat-value { font-size: 20px; font-weight: 600; margin-top: 4px; font-family: 'Cinzel', serif; }
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
  .tracker-form-title { font-family: "Cinzel", serif; font-size: 13px; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .tracker-form-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; align-items: end; }
  .tracker-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .tracker-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
  .tracker-input { background: var(--bg4); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; font-family: "Inter", sans-serif; outline: none; transition: border-color 0.2s; width: 100%; }
  .tracker-input:focus { border-color: var(--gold-dim); }
  .tracker-input::placeholder { color: var(--text-dim); }
  .log-btn { padding: 9px 20px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 13px; font-weight: 600; font-family: "Inter", sans-serif; white-space: nowrap; transition: opacity 0.2s; height: 38px; }
  .log-btn:hover { opacity: 0.85; }
  .log-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* AUTOCOMPLETE */
  .autocomplete-list { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 8px; margin-top: 4px; max-height: 200px; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
  .autocomplete-item { padding: 9px 12px; font-size: 13px; color: var(--text); cursor: pointer; transition: background 0.15s; }
  .autocomplete-item:hover { background: var(--bg3); color: var(--gold); }

  /* FLIPS LOG */
  .flips-log { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .log-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 40px; padding: 10px 16px; background: var(--bg4); font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  .log-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 40px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; font-size: 13px; transition: background 0.15s; }
  .log-row:last-child { border-bottom: none; }
  .log-row:hover { background: var(--bg4); }
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

  /* PROFIT CHART */
  .profit-chart-wrap { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
  .profit-chart-title { font-family: "Cinzel", serif; font-size: 13px; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .profit-canvas-wrap { width: 100%; height: 160px; position: relative; }

  /* PRICE ALERTS */
  .alerts-wrap { display: flex; flex-direction: column; gap: 20px; }
  .alert-form { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .alert-form-title { font-family: "Cinzel", serif; font-size: 13px; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
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
  .portfolio-chart-title { font-family: "Cinzel", serif; font-size: 13px; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
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
  .open-pos-title { font-family: "Cinzel", serif; font-size: 13px; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
  .open-pos-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; }
  .portfolio-login-prompt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px 20px; text-align: center; color: var(--text-dim); }
  .portfolio-login-prompt .icon { font-size: 48px; opacity: 0.4; }
  .portfolio-login-prompt p { font-size: 15px; }
  .portfolio-login-prompt small { font-size: 13px; opacity: 0.7; }
  .portfolio-signin-btn { padding: 10px 28px; border-radius: 8px; border: 1px solid var(--gold-dim); background: rgba(201,168,76,0.1); color: var(--gold); font-size: 14px; font-weight: 600; cursor: pointer; font-family: "Inter", sans-serif; transition: all 0.2s; }
  .portfolio-signin-btn:hover { background: rgba(201,168,76,0.2); }
  .close-pos-modal { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .close-pos-inner { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 420px; padding: 28px; display: flex; flex-direction: column; gap: 16px; }
  .close-pos-title { font-family: "Cinzel", serif; font-size: 16px; color: var(--gold); }
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
  .tour-tooltip { position: fixed; z-index: 302; pointer-events: all; background: var(--bg2); border: 1px solid var(--gold-dim); border-radius: 14px; padding: 20px 22px; width: 300px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); animation: tooltipIn 0.25s cubic-bezier(0.4,0,0.2,1); }
  @keyframes tooltipIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .tour-step-label { font-size: 10px; color: var(--gold-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .tour-title { font-family: "Cinzel", serif; font-size: 15px; color: var(--gold); margin-bottom: 8px; }
  .tour-desc { font-size: 13px; color: var(--text-dim); line-height: 1.6; margin-bottom: 16px; }
  .tour-actions { display: flex; align-items: center; justify-content: space-between; }
  .tour-dots { display: flex; gap: 5px; }
  .tour-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); transition: background 0.2s; }
  .tour-dot.active { background: var(--gold); }
  .tour-btn-row { display: flex; gap: 8px; }
  .tour-skip { background: none; border: none; color: var(--text-dim); font-size: 12px; cursor: pointer; font-family: "Inter", sans-serif; padding: 0; transition: color 0.2s; }
  .tour-skip:hover { color: var(--text); }
  .tour-next { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #000; font-size: 13px; font-weight: 600; font-family: "Inter", sans-serif; transition: opacity 0.2s; }
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
    .log-header, .log-row { grid-template-columns: 2fr 1fr 1fr 1fr 40px; }
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

function getScore(margin, volume, roi, speed, risk, buyLimit) {
  const vWeight   = speed === "Fast" ? 55 : speed === "Slow" ? 15 : 35;
  const mWeight   = speed === "Slow" ? 50 : speed === "Fast" ? 15 : 30;
  const roiWeight = 100 - vWeight - mWeight;
  const volCap = speed === "Fast" ? 500 : speed === "Slow" ? 100 : 300;
  const v = Math.min(volume / volCap, 1) * vWeight;
  const marginCap = risk === "Low" ? 5000 : risk === "High" ? 50000 : 15000;
  const m = Math.min(margin / marginCap, 1) * mWeight;
  let roiScore = 0;
  if (roi > 0) {
    if (risk === "Low") {
      if (roi <= 20)       roiScore = (roi / 20) * roiWeight;
      else if (roi <= 60)  roiScore = roiWeight * (1 - ((roi - 20) / 40) * 0.6);
      else                 roiScore = Math.max(0, roiWeight * 0.4 - (roi - 60) / 20);
    } else if (risk === "High") {
      if (roi <= 150)      roiScore = (roi / 150) * roiWeight;
      else if (roi <= 400) roiScore = roiWeight * (1 - ((roi - 150) / 250) * 0.5);
      else                 roiScore = Math.max(0, roiWeight * 0.5 - (roi - 400) / 100);
    } else {
      if (roi <= 60)       roiScore = (roi / 60) * roiWeight;
      else if (roi <= 200) roiScore = roiWeight * (1 - ((roi - 60) / 140) * 0.5);
      else                 roiScore = Math.max(0, roiWeight * 0.5 - (roi - 200) / 100);
    }
  }
  const liquidityRatio = buyLimit > 0 ? volume / buyLimit : 1;
  let liquidityMultiplier;
  if (risk === "Low") {
    liquidityMultiplier = liquidityRatio >= 2 ? 1 : liquidityRatio >= 1 ? 0.7 : liquidityRatio >= 0.5 ? 0.4 : 0.15;
  } else if (risk === "High") {
    liquidityMultiplier = liquidityRatio >= 1 ? 1 : liquidityRatio >= 0.3 ? 0.85 : 0.6;
  } else {
    liquidityMultiplier = liquidityRatio >= 2 ? 1 : liquidityRatio >= 1 ? 0.85 : liquidityRatio >= 0.5 ? 0.65 : 0.4;
  }
  return Math.round((v + m + roiScore) * liquidityMultiplier);
}

function itemIconUrl(name) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(name.replace(/ /g, "_"))}_detail.png`;
}

function isValidFlip(item) {
  return item.high >= item.low && item.low >= 2;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const QUICK_PROMPTS = ["Best flips under 1M gp?", "High volume items?", "Explain margins to me", "What's trending now?"];

const TIME_RANGES = [
  { label: "24H", seconds: 86400 }, { label: "3D", seconds: 259200 },
  { label: "7D", seconds: 604800 }, { label: "1M", seconds: 2592000 },
  { label: "6M", seconds: 15552000 }, { label: "1Y", seconds: 31536000 },
  { label: "All", seconds: 99999999 },
];

const TOUR_STEPS = [
  { id: "flips-table", title: "Live Flip Scanner", desc: "Every tradeable OSRS item ranked by score. Score factors in margin, volume, and ROI — higher is safer and more profitable. Click any item to see its price history.", target: ".flips-table", placement: "top" },
  { id: "prefs-bar", title: "Set Your Preferences", desc: "Enter your cash stack to filter flips you can afford. Set risk tolerance and flip speed to personalise the list for your playstyle.", target: ".prefs-bar", placement: "bottom" },
  { id: "ai-advisor", title: "AI Flip Advisor", desc: "Ask the AI anything — best flips for your budget, what's trending, or whether a specific item is worth flipping. It has live GE data.", target: ".right-panel", placement: "left" },
  { id: "tracker-tab", title: "Track Your Flips", desc: "Log every flip to track total profit, best items, and average returns. Your history syncs across all your devices automatically.", target: ".nav-tabs", placement: "bottom" },
  { id: "done", title: "You're Ready to Flip! ⚔️", desc: "That's everything. Start by setting your cash stack, then check the top flips list. Good luck on the Grand Exchange!", target: null, placement: "center" },
];

// ─── ITEM CHART MODAL ────────────────────────────────────────────────────────

function ItemChart({ item, onClose, onAskAI, onFlipThis }) {
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
      const endpoint = range === "24H" ? "5m" : range === "3D" ? "1h" : "6h";
      const res = await fetch(`https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=${endpoint}&id=${item.id}`, { headers: { "User-Agent": "RuneTrader/1.0" } });
      const data = await res.json();
      if (!data.data || data.data.length === 0) { setChartLoading(false); return; }
      const now = Date.now() / 1000;
      const filtered = data.data.filter(d => now - d.timestamp <= rangeObj.seconds);
      setChartData(filtered.length > 0 ? filtered : data.data.slice(-50));
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
    const W = rect.width, H = rect.height, pad = { top: 20, right: 20, bottom: 40, left: 60 };
    ctx.clearRect(0, 0, W, H);
    const allPrices = [...chartData.map(d => d.avgHighPrice), ...chartData.map(d => d.avgLowPrice)].filter(Boolean);
    if (!allPrices.length) return;
    const minP = Math.min(...allPrices) * 0.995, maxP = Math.max(...allPrices) * 1.005;
    const minT = chartData[0].timestamp, maxT = chartData[chartData.length - 1].timestamp;
    const xPos = t => pad.left + ((t - minT) / (maxT - minT)) * (W - pad.left - pad.right);
    const yPos = p => pad.top + (1 - (p - minP) / (maxP - minP)) * (H - pad.top - pad.bottom);
    ctx.strokeStyle = "rgba(42,51,64,0.8)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (H - pad.top - pad.bottom);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = "#4a5a6a"; ctx.font = "11px Inter"; ctx.textAlign = "right";
      ctx.fillText(formatGP(Math.round(maxP - (i / 4) * (maxP - minP))), pad.left - 8, y + 4);
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
            <div className="modal-meta">{item.category} · Buy limit: {item.buyLimit?.toLocaleString() || "Unknown"} · Score: {item.score}/100</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-stats">
          {[
            { label: "Buy Price", value: formatGP(item.adjLow ?? item.low), color: "var(--green)" },
            { label: "Sell Price", value: formatGP(item.adjHigh ?? item.high), color: "var(--text)" },
            { label: "Margin (after tax)", value: formatGP(item.adjMargin ?? item.margin), color: item.margin > 0 ? "var(--green)" : "var(--red)" },
            { label: "ROI", value: item.roi + "%", color: "var(--gold)" },
          ].map((s, i) => (
            <div key={i} className="modal-stat">
              <div className="modal-stat-label">{s.label}</div>
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
    const sorted = [...flipsLog].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
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

  if (flipsLog.length < 2) return null;
  return (
    <div className="profit-chart-wrap">
      <div className="profit-chart-title">📈 Cumulative Profit</div>
      <div className="profit-canvas-wrap">
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────────────────

const PORT_RANGES = ["24H", "3D", "7D", "1M", "3M", "All"];

function PortfolioPage({ user, flipsLog, setFlipsLog, mapFlipRow, items, onSignIn, showToast, supabase: sb }) {
  const [positions, setPositions] = useState([]);
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
    loadPositions();
    loadSnapshots();
    setTimeout(() => { flipsLoadedRef.current = true; }, 1000);
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!user || !flipsLog.length || !flipsLoadedRef.current) return;
    upsertSnapshot();
  }, [flipsLog, user]); // eslint-disable-line

  async function loadPositions() {
    setPosLoading(true);
    const { data } = await sb.from("positions").select("*").order("date_opened", { ascending: false });
    setPositions(data || []);
    setPosLoading(false);
  }

  async function loadSnapshots() {
    const { data } = await sb.from("portfolio_snapshots").select("*").order("snapshot_date", { ascending: true });
    setSnapshots(data || []);
  }

  async function upsertSnapshot() {
    const totalProfit = flipsLog.reduce((s, f) => s + (f.totalProfit || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    await sb.from("portfolio_snapshots").upsert({ user_id: user.id, snapshot_date: today, total_profit: totalProfit, total_flips: flipsLog.length }, { onConflict: "user_id,snapshot_date" });
    loadSnapshots();
  }

  async function openPosition() {
    const buy = parseInt(openForm.buyPrice.replace(/,/g, ""));
    const qty = parseInt(openForm.qty) || 1;
    if (!openForm.item || isNaN(buy)) return;
    const itemMatch = items.find(i => i.name.toLowerCase() === openForm.item.toLowerCase());
    const { data, error } = await sb.from("positions").insert({ user_id: user.id, item_id: itemMatch?.id || 0, item_name: openForm.item, buy_price: buy, qty }).select().single();
    if (error) { showToast("Failed to open position.", "error"); return; }
    setPositions(prev => [data, ...prev]);
    setOpenForm({ item: "", buyPrice: "", qty: "1" });
    showToast("Position opened!", "success");
  }

  async function closePosition(pos, sellPrice) {
    const sell = parseInt(sellPrice.replace(/,/g, ""));
    if (isNaN(sell)) return;
    setClosingLoading(true);
    const tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
    const profitEach = sell - pos.buy_price - tax;
    const totalProfit = profitEach * pos.qty;
    const roi = parseFloat(((profitEach / pos.buy_price) * 100).toFixed(1));
    const { data: flipData, error: flipErr } = await sb.from("flips").insert({ user_id: user.id, item: pos.item_name, buy_price: pos.buy_price, sell_price: sell, qty: pos.qty, tax, profit_each: profitEach, total_profit: totalProfit, roi }).select().single();
    if (flipErr) { showToast("Failed to log flip.", "error"); setClosingLoading(false); return; }
    if (flipData && mapFlipRow) setFlipsLog(prev => [mapFlipRow(flipData), ...prev]);
    await sb.from("positions").delete().eq("id", pos.id);
    setPositions(prev => prev.filter(p => p.id !== pos.id));
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

  const totalOpenValue = positions.reduce((s, p) => s + p.buy_price * p.qty, 0);

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
        <div className="section-title">Open Positions{totalOpenValue > 0 && <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "Inter, sans-serif", fontWeight: 400, marginLeft: "8px" }}>· {formatGP(totalOpenValue)} gp invested</span>}</div>
        <div className="positions-table">
          <div className="positions-header">
            <span>Item</span><span>Buy Price</span><span>Qty</span><span>Total Cost</span><span>Live Price</span><span>Action</span>
          </div>
          {posLoading ? (
            <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "40px" }}>Loading positions...</div>
          ) : positions.length === 0 ? (
            <div className="tracker-empty"><div className="icon">📂</div><p>No open positions</p><small>Open a position above when you buy at the GE</small></div>
          ) : positions.map(pos => {
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
              <button className="close-pos-confirm" disabled={!closeSellPrice || closingLoading} onClick={() => closePosition(closingPos, closeSellPrice)}>
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

export default function RuneTrader() {
  const [showApp, setShowApp] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [tourRects, setTourRects] = useState({});
  const [toasts, setToasts] = useState([]);

  // ── FIX: control body scroll based on whether landing page or app is showing ──
  useEffect(() => {
    document.body.style.overflow = showApp ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showApp]);

  // Fix: unlock body scroll on landing page, lock it inside the app
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [allItemsMap, setAllItemsMap] = useState({});

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
  const [logForm, setLogForm] = useState({ item: "", buyPrice: "", sellPrice: "", qty: "1" });
  const [autocomplete, setAutocomplete] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

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
        .map(f => ({ user_id: user.id, item: f.item, buy_price: f.buyPrice, sell_price: f.sellPrice, qty: f.qty, tax: f.tax, profit_each: f.profitEach, total_profit: f.totalProfit, roi: f.roi, date: f.date || new Date().toISOString() }));
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
    return { id: r.id, item: r.item, buyPrice: r.buy_price, sellPrice: r.sell_price, qty: r.qty, tax: r.tax, profitEach: r.profit_each, totalProfit: r.total_profit, roi: r.roi, date: r.date || new Date().toISOString() };
  }

  // ── Fetch market prices ──
  useEffect(() => { fetchPrices(); const iv = setInterval(fetchPrices, 5 * 60 * 1000); return () => clearInterval(iv); }, []); // eslint-disable-line

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

  async function fetchPrices() {
    try {
      setLoading(true); setError(null);
      const [latestRes, mappingRes, volumeRes] = await Promise.all([
        fetch("https://prices.runescape.wiki/api/v1/osrs/latest", { headers: { "User-Agent": "RuneTrader/1.0" } }),
        fetch("https://prices.runescape.wiki/api/v1/osrs/mapping", { headers: { "User-Agent": "RuneTrader/1.0" } }),
        fetch("https://prices.runescape.wiki/api/v1/osrs/volumes", { headers: { "User-Agent": "RuneTrader/1.0" } }),
      ]);
      const [latestData, mappingData, volumeData] = await Promise.all([latestRes.json(), mappingRes.json(), volumeRes.json()]);
      const mappingMap = {};
      mappingData.forEach(item => { mappingMap[item.id] = item; });
      const nameMap = {};
      mappingData.forEach(item => { nameMap[item.id] = item.name; });
      setAllItemsMap(nameMap);
      const volumeMap = volumeData.data || {};
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
        const score = getScore(margin, volume, roi, null, null, meta.limit || 0);
        const lastTradeTime = Math.max(highTime || 0, lowTime || 0);
        const flip = { id, name: meta.name, category: meta.members ? "Members" : "F2P", buyLimit: meta.limit || 0, high, low, margin, roi, volume, score, lastTradeTime };
        if (!isValidFlip(flip)) continue;
        flips.push(flip);
      }
      flips.sort((a, b) => b.score - a.score);
      setItems(flips);
      itemsRef.current = flips;
      setLastUpdate(new Date());
    } catch { setError("Failed to load GE data. Check your connection."); }
    finally { setLoading(false); }
  }

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

  // ── Log a flip ──
  async function logFlip() {
    const buy = parseInt(logForm.buyPrice.replace(/,/g, ""));
    const sell = parseInt(logForm.sellPrice.replace(/,/g, ""));
    const qty = parseInt(logForm.qty) || 1;
    if (!logForm.item || isNaN(buy) || isNaN(sell)) return;
    const tax = Math.min(Math.floor(sell * 0.02), 5_000_000);
    const profitEach = sell - buy - tax;
    const totalProfit = profitEach * qty;
    const roi = parseFloat(((profitEach / buy) * 100).toFixed(1));
    const itemName = logForm.item;
    setLogForm({ item: "", buyPrice: "", sellPrice: "", qty: "1" });
    setShowAutocomplete(false);
    if (user) {
      const { data, error } = await supabase.from("flips").insert({ user_id: user.id, item: itemName, buy_price: buy, sell_price: sell, qty, tax, profit_each: profitEach, total_profit: totalProfit, roi }).select().single();
      if (!error && data) {
        setFlipsLog(prev => [mapFlipRow(data), ...prev]);
        showToast("Flip logged successfully!", "success");
      } else if (error) {
        showToast("Failed to save flip. Try again.", "error");
      }
    } else {
      const entry = { id: Date.now(), item: itemName, buyPrice: buy, sellPrice: sell, qty, tax, profitEach, totalProfit, roi, date: new Date().toISOString() };
      const updated = [entry, ...flipsLog];
      setFlipsLog(updated);
      localStorage.setItem("runetrader_flips", JSON.stringify(updated));
      showToast("Flip logged! Sign in to sync across devices.", "info");
    }
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
    const reliableItems = itemsRef.current.filter(i => i.roi <= 200 && i.volume >= 5);
    const topFlips = reliableItems.slice(0, 50).map(i => `${i.name}: buy ${formatGP(i.low)}, sell ${formatGP(i.high)}, margin ${formatGP(i.margin)}, ROI ${i.roi}%, volume ${i.volume.toLocaleString()}/day, score ${i.score}`).join("\n");
    const mentionedItems = itemsRef.current.filter(i => text.toLowerCase().includes(i.name.toLowerCase())).map(i => `${i.name}: buy ${formatGP(i.low)}, sell ${formatGP(i.high)}, margin ${formatGP(i.margin)}, ROI ${i.roi}%, volume ${i.volume.toLocaleString()}/day, score ${i.score}`).join("\n");
    const riskMap = { Low: "only high-volume safe items (volume 500+/day, ROI 2-15%)", Med: "balance margin and volume (volume 100+/day, ROI 5-40%)", High: "higher margin items OK (volume 50+/day, ROI up to 100%)" };
    const speedMap = { Fast: "only items with very high daily volume (500+)", Med: "items that fill within 1-2 hours (volume 100+/day)", Slow: "slower filling items with bigger margins acceptable" };
    const systemPrompt = `You are the RuneTrader AI assistant — an expert OSRS Grand Exchange flipping advisor with live GE data.
${budget ? `User cash stack: ${parseInt(budget.replace(/,/g,"")).toLocaleString()} gp — only recommend affordable items (at least 5x)` : "Cash stack not specified — ask before recommending."}
${prefs.risk ? `Risk tolerance: ${prefs.risk} — ${riskMap[prefs.risk]}` : "Risk not set."}
${prefs.speed ? `Flip speed: ${prefs.speed} — ${speedMap[prefs.speed]}` : "Speed not set."}
Top flips (live): ${topFlips}${mentionedItems ? `\nMentioned items: ${mentionedItems}` : ""}
Be concise and specific. Write GP as full numbers with commas (1,220,000 not 1.22M). Never mention internal mechanics.
GE tax: 2% of sell price capped at 5M. Under 50gp = no tax. Bonds exempt. Margins shown are after tax.
NEVER recommend ROI >200% or volume <50/day. Best flips: ROI 5-50%, volume 200+/day, score >50.`;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, system: systemPrompt, messages: [...messages.filter(m => m.role !== "system").slice(-6).map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }] }) });
      const data = await res.json();
      const reply = data.error ? `API Error: ${data.error.message || data.error.type}` : (data.content?.[0]?.text || "Sorry, no response.");
      setMessages(prev => [...prev, { role: "assistant", content: reply, time: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Connection error: ${e.message}`, time: new Date() }]);
    } finally { setAiLoading(false); }
  }

  // ── Filtered items ──
  const scoredItems = items.map(item => ({
    ...item,
    prefScore: getScore(item.margin, item.volume, item.roi, prefs.speed, prefs.risk, item.buyLimit),
  }));

  const filtered = scoredItems.filter(item => {
    if (search.trim()) return item.name.toLowerCase().includes(search.toLowerCase());
    const budgetGp = budget ? parseInt(budget.replace(/[^0-9]/g, "")) * (budget.toLowerCase().includes("m") ? 1_000_000 : budget.toLowerCase().includes("k") ? 1_000 : 1) : null;
    const { adjLow, adjHigh } = applyOffset(item.low, item.high, prefs.speed);
    const adjMargin = item.margin - (adjLow - item.low) - (item.high - adjHigh);
    const passesRisk = !prefs.risk ||
      (prefs.risk === "Low" && item.volume >= 200) ||
      (prefs.risk === "Med" && item.volume >= 50) ||
      prefs.risk === "High";
    const passesSpeed = !prefs.speed ||
      (prefs.speed === "Fast" && item.volume >= 300) ||
      (prefs.speed === "Med" && item.volume >= 30) ||
      prefs.speed === "Slow";
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
    if (sortCol === "lastTradeTime") return sortDir === "asc" ? (a.lastTradeTime || 0) - (b.lastTradeTime || 0) : (b.lastTradeTime || 0) - (a.lastTradeTime || 0);
    return sortDir === "asc" ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol];
  });

  // ── Tracker stats ──
  const totalProfit = flipsLog.reduce((s, f) => s + (f.totalProfit || 0), 0);
  const totalFlips = flipsLog.length;
  const avgProfit = totalFlips ? Math.round(totalProfit / totalFlips) : 0;
  const bestItem = flipsLog.length ? flipsLog.reduce((best, f) => (f.totalProfit || 0) > (best.totalProfit || 0) ? f : best, flipsLog[0]) : null;

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

      {/* ITEM CHART MODAL */}
      {selectedItem && <ItemChart item={selectedItem} onClose={() => setSelectedItem(null)} onAskAI={msg => { setInput(msg); sendMessage(msg); }} onFlipThis={flipThisItem} />}

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
            {["flips", "tracker", "alerts", ...(user ? ["portfolio"] : [])].map(t => (
              <button key={t} className={`nav-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "alerts" && alerts.filter(a => a.triggered).length > 0 && (
                  <span style={{ marginLeft: "6px", background: "var(--gold)", color: "#000", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>
                    {alerts.filter(a => a.triggered).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="header-right">
            {lastUpdate && <div className="live-badge"><div className="live-dot" />Live · {formatTime(lastUpdate)}</div>}
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
          <div className="left-panel">

            {/* ── TRACKER TAB ── */}
            {activeTab === "tracker" && (
              <div className="tracker-wrap">
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
                      <label className="tracker-label">Sell Price (gp)</label>
                      <input className="tracker-input" placeholder="e.g. 1650000" value={logForm.sellPrice} onChange={e => setLogForm(f => ({ ...f, sellPrice: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <div className="tracker-field">
                      <label className="tracker-label">Quantity</label>
                      <input className="tracker-input" placeholder="1" value={logForm.qty} onChange={e => setLogForm(f => ({ ...f, qty: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") logFlip(); }} />
                    </div>
                    <button className="log-btn" disabled={!logForm.item || !logForm.buyPrice || !logForm.sellPrice} onClick={logFlip}>+ Log</button>
                  </div>
                </div>

                <div>
                  <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Flip History</span>
                    {flipsLog.length > 0 && <button className="clear-btn" onClick={clearAllFlips}>Clear All</button>}
                  </div>
                  <div className="flips-log">
                    <div className="log-header"><span>Item</span><span>Buy</span><span>Sell</span><span>Qty</span><span>Tax</span><span>Profit</span><span></span></div>
                    {flipsLoading ? <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "40px" }}>Loading flips...</div>
                      : flipsLog.length === 0 ? (
                        <div className="tracker-empty"><div className="icon">📋</div><p>No flips logged yet</p><small>Fill in the form above to start tracking your profits</small></div>
                      ) : flipsLog.map(f => (
                        <div key={f.id} className="log-row">
                          <div><div className="log-item-name">{f.item}</div><div className="log-date">{new Date(f.date || Date.now()).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div></div>
                          <span>{formatGP(f.buyPrice)}</span>
                          <span>{formatGP(f.sellPrice)}</span>
                          <span>{(f.qty || 1).toLocaleString()}</span>
                          <span style={{ color: "var(--text-dim)" }}>{formatGP((f.tax || 0) * (f.qty || 1))}</span>
                          <div>
                            <div className={f.totalProfit >= 0 ? "profit-pos" : "profit-neg"}>{f.totalProfit >= 0 ? "+" : ""}{formatGP(f.totalProfit)}</div>
                            <div className={f.roi >= 5 ? "roi-pos" : f.roi < 0 ? "roi-neg" : "roi-neu"}>{f.roi > 0 ? "+" : ""}{f.roi}% ROI</div>
                          </div>
                          <button className="delete-btn" onClick={() => deleteFlip(f.id)}>✕</button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ALERTS TAB ── */}
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

                <div className="alert-info">ℹ️ Prices are checked every 5 minutes. Triggered alerts won't fire again — delete and re-add to reset.</div>
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

                <div>
                  <div className="section-title">Active Alerts</div>
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
                </div>

                <div>
                  <div className="section-title">Top Flips</div>
                  <div className="flips-table">
                    <div className="table-header">
                      {[["name", "Item"], ["low", "Buy Price"], ["high", "Sell Price"], ["margin", "Margin"], ["roi", "ROI"], ["volume", "Vol/Day"], ["buylimit", "Limit"], ["lastTradeTime", "Last Trade"], ["score", "Score"]].map(([col, label]) => (
                        <button key={col} className={`sort-btn ${sortCol === col ? "active" : ""}`} onClick={() => handleSort(col)}>
                          {label} {sortCol === col && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
                        </button>
                      ))}
                    </div>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flip-row">{Array.from({ length: 9 }).map((_, j) => <div key={j} className="skeleton" style={{ width: j === 0 ? "80%" : "60%", animationDelay: `${i * 0.1}s` }} />)}</div>
                      ))
                    ) : filtered.length === 0 ? (
                      <div className="empty-state"><div className="icon">🔍</div><p>No items match your filters</p></div>
                    ) : (
                      filtered.slice(0, search.trim() ? 200 : 100).map(item => {
                        const { adjLow, adjHigh } = applyOffset(item.low, item.high, prefs.speed);
                        const adjMargin = item.margin - (adjLow - item.low) - (item.high - adjHigh);
                        const ageSec = item.lastTradeTime ? Math.floor(Date.now() / 1000 - item.lastTradeTime) : null;
                        const tradeColor = !ageSec ? "var(--text-dim)" : ageSec < 300 ? "var(--green)" : ageSec < 3600 ? "var(--text)" : "var(--text-dim)";
                        return (
                          <div key={item.id} className="flip-row" onClick={() => setSelectedItem({ ...item, adjLow, adjHigh, adjMargin })}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button onClick={e => { e.stopPropagation(); toggleFavourite(item.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", opacity: favourites.includes(item.id) ? 1 : 0.25, transition: "opacity 0.15s", padding: "0", flexShrink: 0 }} title={favourites.includes(item.id) ? "Remove favourite" : "Add to favourites"}>⭐</button>
                              <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                              <div><div className="item-name">{item.name}</div><div className="item-category">{item.category} · Limit: {item.buyLimit?.toLocaleString() || "?"}</div></div>
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
                    <div className="msg-bubble" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
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
        </div>
      </div>
    </>
  );
}
