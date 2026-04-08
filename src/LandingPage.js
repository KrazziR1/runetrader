import { useState, useEffect, useRef } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --gold: #c9a84c;
    --gold-light: #e8c96a;
    --gold-dim: #8a6f2e;
    --gold-glow: rgba(201,168,76,0.12);
    --bg: #070a0d;
    --bg2: #0c1018;
    --bg3: #111620;
    --text: #e8e8e8;
    --text-dim: #8fa0b0;
    --green: #2ecc71;
    --red: #e74c3c;
    --border: rgba(201,168,76,0.12);
    --border-solid: #1c2a3a;
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow-x: hidden; }

  body::before {
    content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  /* NAV */
  nav {
    position: fixed; top: 37px; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 48px;
    background: #070a0d;
    border-bottom: 1px solid var(--border-solid);
  }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-icon { width: 36px; height: 36px; border-radius: 8px; }
  .nav-logo-text { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 900; background: linear-gradient(135deg,#b8922e,#e8c96a,#c9a84c); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; letter-spacing: 3px; text-transform: uppercase; }
  .nav-logo-tld { font-size: 16px; -webkit-text-fill-color: transparent; background: linear-gradient(135deg,#b8922e,#e8c96a,#c9a84c); -webkit-background-clip:text; background-clip:text; }
  .nav-links { display: flex; align-items: center; gap: 28px; }
  .nav-link { color: var(--text-dim); font-size: 16px; text-decoration: none; transition: color 0.2s; letter-spacing: 0.4px; font-family: 'Inter', sans-serif; font-weight: 600; }
  .nav-link:hover { color: var(--gold); }
  .nav-cta {
    padding: 10px 26px; border-radius: 7px; font-size: 15px; letter-spacing: 1px;
    font-family: 'Cinzel', serif; font-weight: 800; cursor: pointer; text-decoration: none;
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.3); color: var(--gold);
    transition: all 0.2s;
  }
  .nav-cta:hover { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.5); }

  /* URGENCY BANNER */
  .urgency-banner {
    background: #1a1200;
    border-bottom: 1px solid rgba(201,168,76,0.35);
    text-align: center; padding: 9px 24px; font-size: 13px;
    color: var(--gold); font-family: 'Inter', sans-serif; font-weight: 500;
    letter-spacing: 0.3px; position: fixed; top: 0; left: 0; right: 0; z-index: 101;
  }
  .urgency-banner a { color: var(--gold-light); text-decoration: underline; text-underline-offset: 3px; }
  .urgency-banner .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--green); margin-right: 8px; animation: pulse 2s infinite; vertical-align: middle; }

  /* HERO */
  .hero {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 120px 24px 80px; position: relative; overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background: 
      radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 20% 80%, rgba(76,175,125,0.04) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 80% 20%, rgba(201,168,76,0.04) 0%, transparent 60%);
  }
  .hero-grid {
    position: absolute; inset: 0; z-index: 0; opacity: 0.03;
    background-image: linear-gradient(var(--gold) 1px, transparent 1px), linear-gradient(90deg, var(--gold) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
  }
  /* Animated gold orb behind hero title */
  .hero-orb {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -55%);
    width: 600px; height: 600px; border-radius: 50%; z-index: 0; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.03) 40%, transparent 70%);
    animation: orbPulse 6s ease-in-out infinite;
  }
  @keyframes orbPulse {
    0%, 100% { transform: translate(-50%, -55%) scale(1); opacity: 0.8; }
    50% { transform: translate(-50%, -55%) scale(1.15); opacity: 1; }
  }

  .hero-content { position: relative; z-index: 1; max-width: 900px; }
  
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    border: 1px solid var(--border); border-radius: 20px;
    padding: 6px 16px; margin-bottom: 40px;
    font-size: 15px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,76,0.05);
    animation: fadeInDown 0.8s ease both;
  }
  .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

  .hero-title {
    font-family: 'Cinzel', serif; font-size: clamp(52px, 8vw, 100px);
    font-weight: 900; line-height: 1.05; letter-spacing: -1px;
    color: var(--text);
    animation: fadeInUp 0.8s ease 0.1s both;
  }
  .hero-title .gold { color: var(--gold); }

  .hero-sub {
    font-size: clamp(15px, 2vw, 18px); color: var(--text-dim); max-width: 580px; margin: 28px auto 0;
    line-height: 1.75; font-weight: 400; font-family: 'Inter', sans-serif;
    animation: fadeInUp 0.8s ease 0.2s both;
  }

  .hero-actions {
    display: flex; gap: 16px; justify-content: center; margin-top: 44px; flex-wrap: wrap;
    animation: fadeInUp 0.8s ease 0.3s both;
  }
  .btn-primary {
    padding: 17px 40px; border-radius: 8px; font-family: 'Cinzel', serif;
    font-size: 17px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;
    background: linear-gradient(135deg, #c9940a, #f0c030, #e8b820);
    color: #07090c; border: none; cursor: pointer; text-decoration: none;
    transition: all 0.25s; display: inline-flex; align-items: center; gap: 8px; font-weight: 900;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(201,168,76,0.25); opacity: 0.95; }
  .btn-secondary {
    padding: 17px 40px; border-radius: 8px; font-family: 'Cinzel', serif;
    font-size: 17px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    background: rgba(255,255,255,0.04); color: var(--text); border: 1px solid rgba(255,255,255,0.18);
    cursor: pointer; text-decoration: none; transition: all 0.25s;
  }
  .btn-secondary:hover { border-color: rgba(201,168,76,0.4); color: var(--gold); }

  .hero-stats {
    display: flex; gap: 48px; justify-content: center; margin-top: 64px;
    padding-top: 40px; border-top: 1px solid var(--border-solid);
    animation: fadeInUp 0.8s ease 0.4s both;
  }
  .hero-stat { text-align: center; }
  .hero-stat-value { font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700; color: var(--gold); }
  .hero-stat-label { font-size: 12px; color: var(--text-dim); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; font-weight: 500; }

  /* PRODUCT MOCKUP */
  .mockup-section {
    padding: 0 48px 100px; position: relative; display: flex; justify-content: center;
  }
  .mockup-frame {
    width: 100%; max-width: 1100px; border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(201,168,76,0.2);
    box-shadow: 0 0 0 1px rgba(201,168,76,0.05), 0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(201,168,76,0.06);
    background: var(--bg2); position: relative;
    animation: fadeInUp 0.9s ease 0.5s both;
  }
  .mockup-topbar {
    display: flex; align-items: center; gap: 8px; padding: 12px 16px;
    background: var(--bg3); border-bottom: 1px solid var(--border-solid);
  }
  .mockup-dot { width: 12px; height: 12px; border-radius: 50%; }
  .mockup-url { flex: 1; background: var(--bg2); border-radius: 6px; padding: 5px 12px; font-size: 12px; color: var(--text-dim); font-family: 'Inter', sans-serif; margin: 0 12px; text-align: center; border: 1px solid var(--border-solid); }
  .mockup-nav {
    display: flex; align-items: center; gap: 2px; padding: 8px 16px;
    background: var(--bg2); border-bottom: 1px solid var(--border-solid);
  }
  .mockup-tab { padding: 6px 16px; border-radius: 6px 6px 0 0; font-size: 12px; font-family: 'Inter', sans-serif; font-weight: 600; color: var(--text-dim); }
  .mockup-tab.active { background: var(--bg3); color: var(--gold); border: 1px solid var(--border-solid); border-bottom: 1px solid var(--bg3); }
  .mockup-body { padding: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .mockup-card {
    background: var(--bg3); border-radius: 8px; padding: 14px 16px;
    border: 1px solid var(--border-solid);
  }
  .mockup-card-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 6px; }
  .mockup-card-value { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: var(--gold); }
  .mockup-card-sub { font-size: 11px; color: var(--green); margin-top: 3px; font-weight: 600; }
  .mockup-table { padding: 0 16px 16px; }
  .mockup-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px;
    padding: 9px 12px; border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif;
    border-bottom: 1px solid var(--border-solid); align-items: center;
  }
  .mockup-row.header { color: var(--text-dim); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
  .mockup-row:not(.header):hover { background: rgba(201,168,76,0.04); }
  .mockup-item-name { font-weight: 600; color: var(--text); }
  .mockup-profit { color: var(--green); font-weight: 700; }
  .mockup-dim { color: var(--text-dim); }
  .mockup-pill { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(46,204,113,0.12); color: var(--green); border: 1px solid rgba(46,204,113,0.2); }

  /* FEATURES */
  .section { padding: 120px 48px; position: relative; }
  .section-label {
    font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold);
    margin-bottom: 16px; display: flex; align-items: center; gap: 12px; font-weight: 800;
  }
  .section-label::before { content: ''; width: 32px; height: 1px; background: var(--gold); }
  .section-title { font-family: 'Cinzel', serif; font-size: clamp(32px, 4vw, 52px); font-weight: 700; color: var(--text); line-height: 1.2; }
  .section-sub { font-size: 17px; color: var(--text-dim); margin-top: 16px; max-width: 560px; line-height: 1.7; }

  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 64px; }
  .feature-card {
    background: var(--bg2); padding: 36px 28px;
    border: 1px solid var(--border-solid); position: relative; overflow: hidden;
    transition: all 0.25s;
  }
  .feature-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--gold-glow), transparent);
    opacity: 0; transition: opacity 0.25s;
  }
  .feature-card:hover::before { opacity: 1; }
  .feature-card:hover { border-color: rgba(201,168,76,0.3); transform: translateY(-2px); }
  .feature-icon { font-size: 28px; margin-bottom: 16px; display: block; }
  .feature-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .feature-desc { font-size: 15px; color: #9ab0c0; line-height: 1.75; }
  .feature-tag {
    display: inline-block; margin-top: 14px; padding: 3px 10px; border-radius: 4px;
    font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;
    background: rgba(201,168,76,0.08); color: var(--gold); border: 1px solid rgba(201,168,76,0.2);
  }

  /* TRADING TERMINAL HIGHLIGHT */
  .terminal-highlight {
    padding: 100px 48px; background: var(--bg2);
    border-top: 1px solid var(--border-solid); border-bottom: 1px solid var(--border-solid);
    position: relative; overflow: hidden;
  }
  .terminal-highlight::before {
    content: ''; position: absolute; top: -200px; right: -200px;
    width: 700px; height: 700px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 65%);
    animation: orbPulse 7s ease-in-out infinite;
  }
  .terminal-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 5fr 7fr; gap: 72px; align-items: start; }
  .terminal-tabs { display: flex; gap: 0; margin-top: 36px; border-bottom: 1px solid var(--border-solid); }
  .terminal-tab {
    padding: 10px 20px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
    color: var(--text-dim); cursor: pointer; border-bottom: 2px solid transparent;
    transition: all 0.2s; letter-spacing: 0.3px;
  }
  .terminal-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
  .terminal-feature-list { margin-top: 32px; display: flex; flex-direction: column; gap: 18px; }
  .terminal-feature-item { display: flex; align-items: flex-start; gap: 14px; }
  .terminal-feature-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.15); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .terminal-feature-text { font-size: 15px; color: var(--text-dim); line-height: 1.6; }
  .terminal-feature-text strong { color: var(--text); display: block; margin-bottom: 2px; font-size: 16px; }

  /* GE SLOT TERMINAL WIDGET */
  .tv {
    background: #070a0d; border-radius: 14px;
    border: 1px solid rgba(201,168,76,0.25);
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(201,168,76,0.06), 0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(201,168,76,0.1);
  }
  .tv-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: linear-gradient(135deg, #0c1018, #0f1520);
    border-bottom: 1px solid rgba(201,168,76,0.18);
  }
  .tv-title { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 800; color: var(--gold); letter-spacing: 2px; }
  .tv-live { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--green); font-weight: 700; letter-spacing: 1px; }
  .tv-live::before { content:''; width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow: 0 0 6px var(--green); animation: pulse 1.5s infinite; }
  .tv-stats { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--border-solid); }
  .tv-stat { padding: 12px 14px; border-right: 1px solid var(--border-solid); background: rgba(201,168,76,0.02); }
  .tv-stat:last-child { border-right: none; }
  .tv-stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
  .tv-stat-val { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: var(--gold); margin-top: 3px; transition: all 0.4s; }
  .tv-stat-delta { font-size: 12px; color: var(--green); font-weight: 600; margin-top: 1px; }
  .tv-slots { padding: 10px; display: flex; flex-direction: column; gap: 6px; }
  .tv-slot {
    border-radius: 8px; border: 1px solid var(--border-solid);
    background: #0c1018; overflow: hidden; transition: border-color 0.4s, box-shadow 0.4s;
  }
  .tv-slot.drift { background: rgba(231,76,60,0.03); animation: driftGlow 2s ease-in-out infinite; }
  .tv-slot.filled { border-color: rgba(46,204,113,0.4); background: rgba(46,204,113,0.03); }
  .tv-slot.buying { border-color: rgba(52,152,219,0.35); }
  .tv-slot-top { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; }
  .tv-slot-name { font-size: 14px; font-weight: 700; color: var(--text); }
  .tv-slot-badge { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.5px; }
  .tv-badge-buying { background: rgba(52,152,219,0.15); color: #5dade2; border: 1px solid rgba(52,152,219,0.3); }
  .tv-badge-selling { background: rgba(201,168,76,0.12); color: var(--gold); border: 1px solid rgba(201,168,76,0.25); }
  .tv-badge-filled { background: rgba(46,204,113,0.12); color: var(--green); border: 1px solid rgba(46,204,113,0.25); }
  .tv-badge-drift { background: rgba(231,76,60,0.15); color: #e74c3c; border: 1px solid rgba(231,76,60,0.4); animation: badgePulse 1.8s ease-in-out infinite; }
  .tv-slot-bar { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; padding: 0 12px 8px; font-size: 11px; }
  .tv-slot-kv { display: flex; flex-direction: column; gap: 1px; }
  .tv-kv-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
  .tv-kv-val { font-size: 14px; font-weight: 700; color: var(--text); transition: color 0.3s; }
  .tv-kv-val.green { color: var(--green); }
  .tv-kv-val.red { color: #e74c3c; }
  .tv-kv-val.gold { color: var(--gold); }
  .tv-alert {
    margin: 0 10px 8px; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;
    display: flex; align-items: center; gap: 8px; animation: fadeInUp 0.3s ease both;
  }
  .tv-alert.warn { background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.25); color: #e74c3c; }
  .tv-alert.tip { background: rgba(52,152,219,0.08); border: 1px solid rgba(52,152,219,0.2); color: #5dade2; }
  .tv-alert.good { background: rgba(46,204,113,0.08); border: 1px solid rgba(46,204,113,0.2); color: var(--green); }
  .tv-progress { height: 3px; background: var(--border-solid); margin: 0 12px 8px; border-radius: 2px; overflow: hidden; }
  .tv-progress-fill { height: 100%; border-radius: 2px; transition: width 1s linear; }
  .tv-ai {
    margin: 8px 10px 10px; padding: 10px 12px; border-radius: 8px;
    background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(52,152,219,0.06));
    border: 1px solid rgba(201,168,76,0.15);
  }
  .tv-ai-label { font-size: 11px; color: var(--gold); text-transform: uppercase; letter-spacing: 2px; font-weight: 800; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .tv-ai-label::before { content:'🤖'; font-size: 11px; }
  .tv-ai-text { font-size: 14px; color: var(--text-dim); line-height: 1.6; transition: opacity 0.5s; }
  .tv-ai-text span { color: var(--gold); font-weight: 700; }

  /* COMPARISON */
  .comparison { padding: 120px 48px; background: var(--bg); position: relative; overflow: hidden; }
  .comparison::before {
    content: ''; position: absolute; bottom: -100px; right: -100px;
    width: 500px; height: 500px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.04) 0%, transparent 65%);
  }
  .comparison-wrap { max-width: 1100px; margin: 0 auto; }
  .comparison-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 60px; }
  .comparison-header-text { max-width: 480px; }
  .comparison-vs { display: flex; align-items: center; gap: 12px; }
  .comparison-vs-pill {
    padding: 8px 22px; border-radius: 8px; font-family: 'Cinzel', serif;
    font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
  }
  .comparison-vs-pill.us { background: linear-gradient(135deg, #c9940a, #f0c030); color: #07090c; }
  .comparison-vs-pill.them { background: var(--bg3); color: var(--text-dim); border: 1px solid var(--border-solid); }
  .comparison-vs-divider { color: var(--text-dim); font-size: 13px; font-weight: 600; }
  .cmp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .cmp-card {
    background: var(--bg2); border: 1px solid var(--border-solid); border-radius: 12px;
    padding: 22px 20px; position: relative; overflow: hidden; transition: all 0.25s;
  }
  .cmp-card:hover { border-color: rgba(201,168,76,0.25); transform: translateY(-2px); }
  .cmp-card.exclusive {
    background: linear-gradient(145deg, rgba(201,168,76,0.07), rgba(201,168,76,0.02), var(--bg2));
    border-color: rgba(201,168,76,0.22);
  }
  .cmp-card.exclusive::after {
    content: 'ONLY US'; position: absolute; top: 12px; right: 12px;
    font-size: 9px; font-weight: 800; letter-spacing: 1.5px; color: var(--gold);
    background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.2);
    padding: 2px 7px; border-radius: 4px;
  }
  .cmp-icon { font-size: 22px; margin-bottom: 10px; display: block; }
  .cmp-title { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .cmp-desc { font-size: 13px; color: var(--text-dim); line-height: 1.6; }
  .cmp-status { display: flex; align-items: center; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-solid); }
  .cmp-check { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; }
  .cmp-check.yes { color: var(--green); }
  .cmp-check.no { color: rgba(231,76,60,0.7); }
  .cmp-check.partial { color: var(--text-dim); }

  /* PRICING */
  .pricing { padding: 120px 48px; background: var(--bg2); position: relative; overflow: hidden; }
  .pricing::before {
    content: ''; position: absolute; top: -150px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 400px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 65%);
  }
  .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 680px; margin: 48px auto 0; position: relative; }
  .pricing-card {
    background: var(--bg3); border: 1px solid var(--border-solid); border-radius: 16px;
    padding: 36px 32px; text-align: left; position: relative; transition: all 0.3s;
  }
  .pricing-card:hover { transform: translateY(-3px); border-color: rgba(201,168,76,0.2); }
  .pricing-card.featured {
    border-color: rgba(201,168,76,0.45);
    background: linear-gradient(160deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02), var(--bg3));
    box-shadow: 0 0 0 1px rgba(201,168,76,0.08), 0 20px 60px rgba(0,0,0,0.4), 0 0 60px rgba(201,168,76,0.08);
  }
  .pricing-badge {
    position: absolute; top: -13px; left: 24px;
    background: linear-gradient(135deg, #7a5a1a, var(--gold)); color: #070a0d; font-family: 'Cinzel', serif;
    font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 4px 14px; border-radius: 20px;
  }
  .pricing-name { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
  .pricing-price { font-family: 'Cinzel', serif; font-size: 56px; font-weight: 900; color: var(--gold); line-height: 1; }
  .pricing-price-free { font-family: 'Cinzel', serif; font-size: 56px; font-weight: 900; color: var(--text); line-height: 1; }
  .pricing-period { font-size: 15px; color: var(--text-dim); margin-top: 6px; margin-bottom: 24px; }
  .pricing-divider { height: 1px; background: var(--border-solid); margin: 0 0 20px; }
  .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 11px; margin-bottom: 28px; }
  .pricing-features li { font-size: 16px; color: var(--text-dim); display: flex; align-items: center; gap: 10px; }
  .pricing-features li.active { color: var(--text); }
  .pricing-features li.active::before { content: '✓'; color: var(--green); font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .pricing-features li:not(.active)::before { content: '✓'; color: var(--text-dim); opacity: 0.3; font-size: 13px; flex-shrink: 0; }
  .pricing-btn {
    width: 100%; padding: 16px; border-radius: 10px; font-family: 'Cinzel', serif;
    font-size: 15px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.05); color: var(--text);
  }
  .pricing-btn:hover { border-color: rgba(201,168,76,0.4); color: var(--gold); background: rgba(201,168,76,0.1); }
  .pricing-btn.featured-btn {
    background: linear-gradient(135deg, #c9940a, #f0c030, #e8b820); color: #07090c; border: none;
    font-size: 15px; font-weight: 900; box-shadow: 0 4px 24px rgba(240,192,48,0.4);
  }
  .pricing-btn.featured-btn:hover { opacity: 0.9; box-shadow: 0 8px 32px rgba(201,168,76,0.35); transform: translateY(-1px); }

  /* CTA */
  .cta-section {
    padding: 120px 48px; text-align: center; position: relative; overflow: hidden;
    border-top: 1px solid var(--border-solid);
  }
  .cta-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%);
    animation: orbPulse 8s ease-in-out infinite;
  }
  .cta-title { font-family: 'Cinzel', serif; font-size: clamp(36px, 6vw, 64px); font-weight: 900; color: var(--text); position: relative; z-index: 1; }
  .cta-sub { font-size: 17px; color: var(--text-dim); margin: 20px auto; max-width: 500px; line-height: 1.75; position: relative; z-index: 1; }
  .cta-actions { display: flex; gap: 16px; justify-content: center; margin-top: 40px; position: relative; z-index: 1; }

  /* FOOTER */
  footer {
    padding: 32px 48px; border-top: 1px solid var(--border-solid);
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; color: var(--text-dim); background: var(--bg2);
  }
  .footer-logo { font-family: 'Cinzel', serif; color: var(--gold); font-size: 16px; letter-spacing: 2px; font-weight: 700; }
  .footer-links { display: flex; gap: 24px; }
  .footer-link { color: var(--text-dim); text-decoration: none; transition: color 0.2s; font-size: 13px; }
  .footer-link:hover { color: var(--gold); }

  /* ANIMATIONS */
  @keyframes fadeInDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes driftGlow {
    0%,100% { box-shadow: 0 0 0px rgba(231,76,60,0); border-color: rgba(231,76,60,0.4); }
    50%      { box-shadow: 0 0 14px rgba(231,76,60,0.35), inset 0 0 8px rgba(231,76,60,0.06); border-color: rgba(231,76,60,0.8); }
  }
  @keyframes badgePulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.55; }
  }

  /* LIVE TICKER */
  @keyframes ticker { 0%{transform:translateX(-25%)} 100%{transform:translateX(-75%)} }

  @media (max-width: 768px) {
    nav { padding: 16px 24px; }
    .nav-links { display: none; }
    .section, .comparison, .pricing, .cta-section { padding: 80px 24px; }
    .features-grid { grid-template-columns: 1fr; }
    .pricing-card.featured { transform: none; }
    .hero-stats { gap: 24px; }
    .comparison-header, .comparison-row { grid-template-columns: 1.5fr 1fr 1fr; }
    footer { flex-direction: column; gap: 16px; text-align: center; }
    .terminal-inner { grid-template-columns: 1fr; gap: 40px; }
    .mockup-section { padding: 0 16px 60px; }
  }
`;

const TICKER_ITEMS = [
  { name: "Dragon bones", margin: "+2,847gp", up: true },
  { name: "Twisted bow", margin: "+180K gp", up: true },
  { name: "Shark", margin: "+89gp", up: true },
  { name: "Rune platebody", margin: "+3,200gp", up: true },
  { name: "Abyssal whip", margin: "+12,400gp", up: true },
  { name: "Magic logs", margin: "+340gp", up: true },
  { name: "Bandos chestplate", margin: "+45,000gp", up: true },
  { name: "Zulrah's scales", margin: "+12gp", up: true },
  { name: "Anglerfish", margin: "+120gp", up: true },
  { name: "Armadyl godsword", margin: "+95,000gp", up: true },
];

const FEATURES = [
  { icon: "📡", title: "Live GE Slot Tracking", desc: "Connect the RuneLite plugin and your active GE offers sync in real time. See live P&L, slot drift alerts, and position status without tabbing out of the game.", tag: "RuneLite plugin" },
  { icon: "🤖", title: "AI Flip Advisor", desc: "Ask in plain English — 'I have 5M gp, what should I flip?' — and get intelligent recommendations backed by your live GE data and current positions.", tag: "Powered by Claude" },
  { icon: "📊", title: "Live Margin Engine", desc: "4,525 items tracked in real time from the OSRS Wiki API. GE tax automatically factored into every margin, ROI and GP/hr calculation.", tag: "Real-time data" },
  { icon: "🔔", title: "Smart Alerts", desc: "Margin spikes, volume surges, dump detection and price crashes — get notified the moment an opportunity appears or a position turns against you.", tag: "Live" },
  { icon: "📈", title: "Profit Tracker", desc: "Log every flip and track your GP/hr over time. See your best items, flip streaks, and capital efficiency — all in the Tracker tab.", tag: "Live" },
  { icon: "🧪", title: "Recipes & Arbitrage", desc: "GE set exchange, potion decanting, alching, death's coffer — every conversion arbitrage in one place with live profit, ROI, and volume.", tag: "Free" },
];

const COMPARISON_ROWS = [
  { feature: "Live GE price data — real-time", us: "✅", them: "Varies" },
  { feature: "RuneLite plugin — live slot sync", us: "✅", them: "Some" },
  { feature: "AI advisor with live position context", us: "✅", them: "❌" },
  { feature: "Ask questions in plain English", us: "✅", them: "❌" },
  { feature: "Trading Terminal", us: "✅", them: "❌" },
  { feature: "Filter flips by your cash stack", us: "✅", them: "Rarely" },
  { feature: "Smart alerts — dumps, spikes, crashes", us: "✅", them: "Rarely" },
  { feature: "Transparent flip scoring & reasoning", us: "✅", them: "❌" },
  { feature: "Free tier with real value", us: "✅", them: "Limited" },
];

// Animated counter hook
function useCounter(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

export default function LandingPage({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [terminalTab, setTerminalTab] = useState(0);
  const statsRef = useRef(null);
  const itemCount = useCounter(4525, 1800, statsVisible);

  // ── Live GE slot simulation ──
  const BASE_SLOTS = [
    { id:0, name:"Bandos chestplate", type:"buying",  qty:1,   filled:0,  offerPrice:95_200_000, wikiPrice:95_450_000, margin:45000,  profit:45000,  limitPct:100, driftPct:-0.26, pnlStr:"+45,000gp" },
    { id:1, name:"Dragon bones",      type:"selling", qty:200, filled:134, offerPrice:6_100,     wikiPrice:6_050,      margin:2847,   profit:381_498, limitPct:67,  driftPct:0,     pnlStr:"+381,498gp" },
    { id:2, name:"Abyssal whip",      type:"buying",  qty:3,   filled:1,  offerPrice:2_580_000, wikiPrice:2_592_400,  margin:12400,  profit:12400,  limitPct:33,  driftPct:-0.48, pnlStr:"+12,400gp" },
    { id:3, name:"Twisted bow",       type:"selling", qty:1,   filled:0,  offerPrice:1_387_000_000, wikiPrice:1_387_000_000, margin:95000, profit:0, limitPct:0, driftPct:0, pnlStr:"Waiting..." },
  ];
  const [slots, setSlots] = useState(BASE_SLOTS);
  const [sessionGP, setSessionGP] = useState(438898);
  const [gphr, setGphr] = useState(2.4);
  const [aiTip, setAiTip] = useState({ type:"tip", text: <>"Bandos chestplate drifted <span>-0.26%</span> below Wiki — relist at <span>95,698,000gp</span> to jump the queue."</> });
  const tickRef = useRef(0);

  useEffect(() => {
    const tips = [
      { type:"tip",  text: <>"Bandos chestplate drifted <span>-0.26%</span> below Wiki — relist at <span>95,698,000gp</span> to jump the queue."</> },
      { type:"good", text: <>"Dragon bones filling fast — <span>134/200</span> sold. Margin holding at <span>+2,847gp</span> per bone."</> },
      { type:"warn", text: <>"Abyssal whip offer is <span>-0.48%</span> stale. Competition relisted. Suggest <span>2,594,812gp</span>."</> },
      { type:"tip",  text: <>"Based on your <span>5M budget</span>, Dragon bones ROI of <span>+4.1%</span> is your best active slot today."</> },
      { type:"good", text: <>"Session running <span>2.4M GP/hr</span> — above your 7-day average of 1.9M. Keep it up."</> },
    ];
    let tipIdx = 0;
    const iv = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;
      setSlots(prev => prev.map(s => {
        if (s.id === 1 && t % 4 === 0) {
          const newFilled = Math.min(s.filled + Math.floor(Math.random()*12+3), s.qty);
          const done = newFilled >= s.qty;
          return { ...s, filled: newFilled, type: done ? "filled" : s.type, limitPct: Math.round(newFilled/s.qty*100) };
        }
        if (s.id === 0 && t % 7 === 0) return { ...s, driftPct: -0.26 - Math.random()*0.1 };
        if (s.id === 2 && t % 5 === 0) return { ...s, driftPct: -0.48 - Math.random()*0.15 };
        return s;
      }));
      if (t % 3 === 0) setSessionGP(p => p + Math.floor(Math.random()*8000+2000));
      if (t % 6 === 0) setGphr(+(2.2 + Math.random()*0.5).toFixed(1));
      if (t % 8 === 0) { tipIdx = (tipIdx+1) % tips.length; setAiTip(tips[tipIdx]); }
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const terminalFeatures = [
    [
      { icon: "📊", title: "Live Operations Table", text: "Every active flip with real-time P&L, margin drift alerts, and fill status — all in one view." },
      { icon: "🤖", title: "Autopilot Rules", text: "Set per-slot rules: exit if margin drops below X%, or hold for a minimum time before relisting." },
      { icon: "⚡", title: "Instant Alerts", text: "Margin spikes, volume surges, dump detection — fired the moment the market moves against you." },
    ],
    [
      { icon: "📈", title: "P&L Analytics", text: "Session GP, GP/hr, win rate and capital efficiency tracked automatically across every flip." },
      { icon: "🏆", title: "Best Flip Leaderboard", text: "Your top performers ranked by profit and ROI. Know exactly which items you flip best." },
      { icon: "💡", title: "Flip Recommendations", text: "Personalised picks filtered by your cash stack, risk tolerance, and GE limit preferences." },
    ],
  ];

  return (
    <div style={{ minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
      <style>{STYLES}</style>

      {/* URGENCY BANNER */}
      <div className="urgency-banner">
          <span className="dot" />
          RuneLite Plugin Hub review in progress — plugin not yet publicly listed.{" "}
          <a href="/#" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp(); }}>
            Get early access now →
          </a>
      </div>

      {/* NAV */}
      <nav style={{ background: scrolled ? "rgba(6,8,11,0.97)" : undefined }}>
        <a href="/#" className="nav-logo">
          <svg className="nav-logo-icon" viewBox="0 0 120 120" fill="none">
            <defs>
              <linearGradient id="nav_bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#080c1c"/>
                <stop offset="55%" stopColor="#050810"/>
                <stop offset="100%" stopColor="#020308"/>
              </linearGradient>
              <linearGradient id="nav_ring" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f0d898"/>
                <stop offset="50%" stopColor="#c8a96e"/>
                <stop offset="100%" stopColor="#8a6030"/>
              </linearGradient>
              <linearGradient id="nav_arrow" x1="28" y1="80" x2="84" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c8a96e"/>
                <stop offset="55%" stopColor="#e8d898"/>
                <stop offset="100%" stopColor="#60b8ff"/>
              </linearGradient>
              <radialGradient id="nav_tipglow" cx="80" cy="43" r="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60b8ff55"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>
            <rect width="120" height="120" rx="26" fill="url(#nav_bg)"/>
            <circle cx="60" cy="60" r="40" stroke="url(#nav_ring)" strokeWidth="2.5"/>
            <circle cx="60" cy="60" r="33" stroke="#c8a96e" strokeWidth="0.75" opacity="0.15"/>
            <line x1="60" y1="17" x2="60" y2="24" stroke="#f0d898" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="98" y1="60" x2="103" y2="60" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            <line x1="17" y1="60" x2="22" y2="60" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            <line x1="60" y1="97" x2="60" y2="103" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
            <ellipse cx="80" cy="43" rx="22" ry="18" fill="url(#nav_tipglow)"/>
            <path d="M32 78 L45 63 L55 71 L80 43" stroke="url(#nav_arrow)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M73 40 L80 43 L77 51" stroke="#a0d8ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="80" cy="43" r="5.5" fill="#80ccff" opacity="0.98"/>
            <circle cx="80" cy="43" r="9.5" fill="#4da6ff" opacity="0.28"/>
          </svg>
          <span className="nav-logo-text">RuneTrader<span className="nav-logo-tld">.gg</span></span>
        </a>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#terminal" className="nav-link">Trading Terminal</a>
          <a href="#compare" className="nav-link">Why Us</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>
        <a href="/#" className="nav-cta" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp(); }}>
          Enter the Market →
        </a>
      </nav>

      {/* TICKER */}
      <div style={{ marginTop: "110px", width: "100%", overflow: "hidden", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg2)", height: "44px", display: "flex", alignItems: "center" }}>
        <div style={{ display: "inline-flex", gap: "48px", whiteSpace: "nowrap", animation: "ticker 30s linear infinite", alignItems: "center", flexShrink: 0 }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "Inter, sans-serif" }}>
              <span style={{ color: "var(--text)", fontWeight: 600, fontSize: "13px" }}>{item.name}</span>
              <span style={{ color: item.up ? "var(--green)" : "var(--red)", fontSize: "13px" }}>{item.margin}</span>
              <span style={{ color: "var(--border)", fontSize: "13px" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-orb" />
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Live Grand Exchange Data
          </div>
          <h1 className="hero-title">
            <span className="gold">Trade Smarter.</span>
            <br />
            Profit More.
          </h1>
          <p className="hero-sub">
            Real-time Grand Exchange data, smart alerts, and a built-in AI advisor — everything you need to flip smarter and grow your stack.
          </p>
          <div className="hero-actions">
            <a href="/#" className="btn-primary" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp(); }}>
              Create Free Account →
            </a>
            <a href="/#" className="btn-secondary" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp("demo"); }}>
              Explore Demo ↗
            </a>
          </div>
          <div className="hero-stats" ref={statsRef}>
            <div className="hero-stat">
              <div className="hero-stat-value">{statsVisible ? itemCount.toLocaleString() : "0"}</div>
              <div className="hero-stat-label">Items Tracked</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">Live</div>
              <div className="hero-stat-label">Via RuneLite</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">Free</div>
              <div className="hero-stat-label">To Start</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">Trading<br />Terminal</div>
            </div>
          </div>
        </div>
      </section>



      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-label">What We Offer</div>
        <h2 className="section-title">Everything you need<br />to dominate the GE</h2>
        <p className="section-sub">Built by an OSRS player, for OSRS players. No fluff — every feature below is live and free to use today.</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TRADING TERMINAL HIGHLIGHT */}
      <section className="terminal-highlight" id="terminal">
        <div className="terminal-inner">
          <div>
            <div className="section-label">Pro Feature</div>
            <h2 className="section-title">The Trading<br /><span style={{ color: "var(--gold)" }}>Terminal</span></h2>
            <p className="section-sub">A self-contained trading command centre. Every tool you need to manage active flips — without leaving the screen.</p>
            <div className="terminal-tabs">
              {["Operations", "Analytics"].map((t, i) => (
                <div key={t} className={`terminal-tab${terminalTab === i ? " active" : ""}`} onClick={() => setTerminalTab(i)}>{t}</div>
              ))}
            </div>
            <div className="terminal-feature-list">
              {terminalFeatures[terminalTab].map((f, i) => (
                <div key={i} className="terminal-feature-item">
                  <div className="terminal-feature-icon">{f.icon}</div>
                  <div className="terminal-feature-text">
                    <strong>{f.title}</strong>
                    {f.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ── LIVE GE SLOT WIDGET ── */}
          <div className="tv">
            {/* Header */}
            <div className="tv-bar">
              <span className="tv-title">TRADING TERMINAL</span>
              <span className="tv-live">LIVE</span>
            </div>

            {/* Session stats */}
            <div className="tv-stats">
              <div className="tv-stat">
                <div className="tv-stat-label">Session GP</div>
                <div className="tv-stat-val">{(sessionGP/1000).toFixed(0)}K</div>
                <div className="tv-stat-delta">+{((sessionGP-380000)/1000).toFixed(0)}K this hour</div>
              </div>
              <div className="tv-stat">
                <div className="tv-stat-label">GP / Hour</div>
                <div className="tv-stat-val">{gphr}M</div>
                <div className="tv-stat-delta">↑ above avg</div>
              </div>
              <div className="tv-stat">
                <div className="tv-stat-label">Active Slots</div>
                <div className="tv-stat-val">4 / 8</div>
                <div className="tv-stat-delta">4 slots free</div>
              </div>
            </div>

            {/* GE Slots */}
            <div className="tv-slots">
              {slots.map(slot => {
                const isDrift = slot.driftPct < -0.2;
                const isFilled = slot.type === "filled" || slot.filled >= slot.qty;
                const cls = isFilled ? "filled" : isDrift ? "drift" : slot.type;
                const badge = isFilled ? "FILLED ✓" : isDrift ? "⚠ DRIFT" : slot.type === "buying" ? "BUYING" : "SELLING";
                const badgeCls = isFilled ? "tv-badge-filled" : isDrift ? "tv-badge-drift" : slot.type === "buying" ? "tv-badge-buying" : "tv-badge-selling";
                const fillPct = slot.qty > 0 ? Math.round(slot.filled/slot.qty*100) : slot.limitPct;
                const barColor = isFilled ? "var(--green)" : isDrift ? "#e74c3c" : slot.type === "buying" ? "#5dade2" : "var(--gold)";
                return (
                  <div key={slot.id} className={`tv-slot ${cls}`}>
                    <div className="tv-slot-top">
                      <span className="tv-slot-name">{slot.name}</span>
                      <span className={`tv-slot-badge ${badgeCls}`}>{badge}</span>
                    </div>
                    <div className="tv-progress">
                      <div className="tv-progress-fill" style={{ width: `${fillPct}%`, background: barColor }} />
                    </div>
                    <div className="tv-slot-bar">
                      <div className="tv-slot-kv">
                        <span className="tv-kv-label">Offer</span>
                        <span className="tv-kv-val">{slot.offerPrice >= 1e9 ? (slot.offerPrice/1e9).toFixed(2)+"B" : slot.offerPrice >= 1e6 ? (slot.offerPrice/1e6).toFixed(1)+"M" : slot.offerPrice.toLocaleString()+"gp"}</span>
                      </div>
                      <div className="tv-slot-kv">
                        <span className="tv-kv-label">Margin</span>
                        <span className={`tv-kv-val ${slot.margin > 0 ? "green" : "red"}`}>+{slot.margin >= 1000 ? (slot.margin/1000).toFixed(0)+"K" : slot.margin}gp</span>
                      </div>
                      <div className="tv-slot-kv">
                        <span className="tv-kv-label">Filled</span>
                        <span className="tv-kv-val gold">{slot.filled}/{slot.qty}</span>
                      </div>
                      <div className="tv-slot-kv">
                        <span className="tv-kv-label">P&L</span>
                        <span className={`tv-kv-val ${isFilled || slot.filled > 0 ? "green" : ""}`}>{slot.pnlStr}</span>
                      </div>
                    </div>
                    {isDrift && (
                      <div className="tv-alert warn">
                        ⚠ Offer drifted {slot.driftPct.toFixed(2)}% — relist at {(slot.wikiPrice * 1.002).toLocaleString()}gp to beat queue
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI tip */}
            <div className="tv-ai">
              <div className="tv-ai-label">AI Advisor</div>
              <div className={`tv-ai-text`} key={aiTip.text.toString().slice(0,20)}>
                {aiTip.text}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLUGIN INSTALL STEPS */}
      <section className="section" style={{ background: "var(--bg)", paddingTop: "80px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>Get Started</div>
          <h2 className="section-title">Up and running in 3 steps</h2>
          <p className="section-sub" style={{ margin: "16px auto 64px" }}>RuneTrader connects to your game via the RuneLite client. It takes about 2 minutes to set up.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
            {[
              { num: "01", title: "Install RuneLite", desc: "Download RuneLite if you don't have it, then search 'RuneTrader' in the Plugin Hub and click install.", icon: "🔌" },
              { num: "02", title: "Create a free account", desc: "Sign up at RuneTrader.gg — no credit card, no commitment. Your account links to the plugin automatically.", icon: "🧑‍💻" },
              { num: "03", title: "Open the GE and flip", desc: "Your GE slots sync in real time. Open the Trading Terminal, check the AI advisor, and start stacking gold.", icon: "📈" },
            ].map((step, i) => (
              <div key={i} className="feature-card" style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", letterSpacing: "3px", color: "var(--gold)", marginBottom: "16px", fontWeight: 700 }}>{step.num}</div>
                <span className="feature-icon">{step.icon}</span>
                <div className="feature-title">{step.title}</div>
                <div className="feature-desc">{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "48px" }}>
            <a href="https://github.com/runelite/plugin-hub/pull/11028" target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: "15px", padding: "13px 32px", display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text)", borderColor: "rgba(255,255,255,0.2)" }}>
              View Plugin Hub PR #11114 →
            </a>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="comparison" id="compare">
        <div className="comparison-wrap">
          <div className="comparison-header-row">
            <div className="comparison-header-text">
              <div className="section-label">Why RuneTrader</div>
              <h2 className="section-title">Everything a serious<br />flipper needs</h2>
              <p className="section-sub" style={{ marginTop: "16px" }}>We built RuneTrader because existing tools left too many gaps. Here's what sets us apart.</p>
            </div>
            <div className="comparison-vs">
              <div className="comparison-vs-pill us">RuneTrader</div>
              <span className="comparison-vs-divider">vs</span>
              <div className="comparison-vs-pill them">Other Tools</div>
            </div>
          </div>
          <div className="cmp-grid">
            {[
              { icon:"📡", title:"Live GE Slot Sync",       desc:"Your active offers sync in real time via the RuneLite plugin. P&L, fill status and drift alerts update live.",           us:"✅ Yes", them:"⚠ Some",    exclusive:false },
              { icon:"🤖", title:"AI with Live Context",    desc:"Ask questions in plain English with your current GE positions as context. No other tool does this.",                    us:"✅ Yes", them:"❌ No",     exclusive:true  },
              { icon:"📊", title:"Trading Terminal",        desc:"A self-contained command centre for managing active flips — operations, analytics, alerts and picks in one screen.",    us:"✅ Yes", them:"❌ No",     exclusive:true  },
              { icon:"⚡", title:"Drift Alerts",            desc:"Per-slot warnings when your offer price falls behind the market with exact relist prices to beat the queue.",           us:"✅ Yes", them:"❌ No",     exclusive:true  },
              { icon:"🔔", title:"Smart Alerts",            desc:"Margin spikes, volume surges, dump detection and price crashes fired instantly — not just price crossing a threshold.",us:"✅ Yes", them:"⚠ Rarely", exclusive:false },
              { icon:"📈", title:"Real-Time Margin Engine", desc:"4,525 items with GE tax already factored into every margin, ROI and GP/hr figure. Updated every 60 seconds.",         us:"✅ Yes", them:"⚠ Varies", exclusive:false },
              { icon:"💬", title:"Plain English Questions", desc:"'I have 5M gp, what should I flip right now?' — answered with your live data, not generic advice.",                    us:"✅ Yes", them:"❌ No",     exclusive:true  },
              { icon:"🆓", title:"Free Tier with Real Value",desc:"The free tier includes full market access, AI advisor, flip tracker and smart alerts. Not a trial — genuinely free.", us:"✅ Yes", them:"⚠ Limited", exclusive:false },
              { icon:"🧪", title:"Recipes & Arbitrage",     desc:"GE sets, potion decanting, high alch, death's coffer — every conversion route with live profit and volume.",          us:"✅ Yes", them:"❌ No",     exclusive:true  },
            ].map((c, i) => (
              <div key={i} className={`cmp-card${c.exclusive ? " exclusive" : ""}`}>
                <span className="cmp-icon">{c.icon}</span>
                <div className="cmp-title">{c.title}</div>
                <div className="cmp-desc">{c.desc}</div>
                <div className="cmp-status">
                  <span className="cmp-check yes">✓ {c.us.replace("✅ ","")}</span>
                  <span className={`cmp-check ${c.them.startsWith("❌") ? "no" : "partial"}`}>{c.them.startsWith("❌") ? "✗" : "~"} Others: {c.them.replace("❌ ","").replace("✅ ","").replace("⚠ ","")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ justifyContent: "center" }}>Pricing</div>
          <h2 className="section-title">Free to start.<br /><span style={{ color: "var(--gold)" }}>Pro</span> when you're ready.</h2>
          <p className="section-sub" style={{ margin: "16px auto 0", maxWidth: "520px" }}>Full market access and AI advisor free forever. Upgrade to Pro for the Trading Terminal and live GE slot tracking.</p>
        </div>
        <div className="pricing-grid">
          {/* FREE */}
          <div className="pricing-card">
            <div className="pricing-name">Free</div>
            <div className="pricing-price-free">$0</div>
            <div className="pricing-period">Forever free — no card needed</div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li className="active">Live market data — 4,525 items</li>
              <li className="active">AI Advisor (limited context)</li>
              <li className="active">Watchlist &amp; price alerts</li>
              <li className="active">Flip tracker &amp; profit history</li>
              <li className="active">Smart alerts</li>
            </ul>
            <button className="pricing-btn" onClick={() => onEnterApp && onEnterApp()}>Get started free</button>
          </div>
          {/* PRO */}
          <div className="pricing-card featured">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-name" style={{ color: "var(--gold)" }}>Pro</div>
            <div className="pricing-price">$9.99</div>
            <div className="pricing-period">per month · cancel anytime</div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li className="active">Everything in Free</li>
              <li className="active">Trading Terminal</li>
              <li className="active">Live GE slot tracking</li>
              <li className="active">AI Advisor with full context</li>
              <li className="active">Custom alerts &amp; notifications</li>
            </ul>
            <button className="pricing-btn featured-btn" onClick={() => onEnterApp && onEnterApp()}>Upgrade to Pro →</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-bg" />
        <h2 className="cta-title">Ready to flip smarter?</h2>
        <p className="cta-sub">Built by an OSRS player, for OSRS players. Free to use — install the RuneLite plugin and you're ready to flip.</p>
        <div className="cta-actions">
          <a href="/#" className="btn-primary" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp(); }}>
            Create Free Account →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">RuneTrader.gg</div>
        <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
          Not affiliated with Jagex. OSRS is a trademark of Jagex Ltd.
        </div>
        <div className="footer-links">
          <a href="/#" className="footer-link">Discord</a>
          <a href="/#" className="footer-link">Reddit</a>
          <a href="/#" className="footer-link">Privacy</a>
          <a
            href="https://buymeacoffee.com/runetrader"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--gold)", opacity: 0.8 }}
          >
            ☕ Support Development
          </a>
        </div>
      </footer>
    </div>
  );
}
