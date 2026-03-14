import { useState, useEffect } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --gold: #c9a84c;
    --gold-light: #e8d48a;
    --gold-dim: #7a5f2a;
    --gold-glow: rgba(201,168,76,0.15);
    --bg: #06080b;
    --bg2: #0a0d12;
    --bg3: #0f1318;
    --text: #e8e4dc;
    --text-dim: #7a7060;
    --green: #4caf7d;
    --red: #c94c4c;
    --border: rgba(201,168,76,0.15);
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: 'Crimson Pro', Georgia, serif; overflow-x: hidden; }

  /* GRAIN OVERLAY */
  body::before {
    content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  /* NAV */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 48px;
    background: linear-gradient(to bottom, rgba(6,8,11,0.95), transparent);
    backdrop-filter: blur(8px);
  }
  .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .nav-logo-icon { width: 36px; height: 36px; border-radius: 8px; }
  .nav-logo-text { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--gold); letter-spacing: 2px; }
  .nav-logo-tld { color: var(--text-dim); font-size: 14px; }
  .nav-links { display: flex; align-items: center; gap: 32px; }
  .nav-link { color: var(--text-dim); font-size: 15px; text-decoration: none; transition: color 0.2s; letter-spacing: 0.5px; }
  .nav-link:hover { color: var(--gold); }
  .nav-cta {
    padding: 10px 24px; border-radius: 4px; font-size: 14px; letter-spacing: 1px;
    font-family: 'Cinzel', serif; font-weight: 600; cursor: pointer; text-decoration: none;
    background: transparent; border: 1px solid var(--gold); color: var(--gold);
    transition: all 0.3s; text-transform: uppercase;
  }
  .nav-cta:hover { background: var(--gold); color: var(--bg); }

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
  .hero-content { position: relative; z-index: 1; max-width: 900px; }
  
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    border: 1px solid var(--border); border-radius: 20px;
    padding: 6px 16px; margin-bottom: 40px;
    font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold);
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
  .hero-title .dim { color: var(--text-dim); font-weight: 400; font-size: 0.6em; display: block; letter-spacing: 4px; margin-top: 8px; font-family: 'Cinzel', serif; }

  .hero-sub {
    font-size: clamp(16px, 2vw, 20px); color: var(--text-dim); max-width: 600px; margin: 32px auto 0;
    line-height: 1.7; font-weight: 300; font-style: italic;
    animation: fadeInUp 0.8s ease 0.2s both;
  }

  .hero-actions {
    display: flex; gap: 16px; justify-content: center; margin-top: 48px; flex-wrap: wrap;
    animation: fadeInUp 0.8s ease 0.3s both;
  }
  .btn-primary {
    padding: 16px 40px; border-radius: 4px; font-family: 'Cinzel', serif;
    font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    background: linear-gradient(135deg, var(--gold-dim), var(--gold));
    color: var(--bg); border: none; cursor: pointer; text-decoration: none;
    transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 0 0 40px rgba(201,168,76,0.2);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(201,168,76,0.35); }
  .btn-secondary {
    padding: 16px 40px; border-radius: 4px; font-family: 'Cinzel', serif;
    font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
    background: transparent; color: var(--text-dim); border: 1px solid var(--border);
    cursor: pointer; text-decoration: none; transition: all 0.3s;
  }
  .btn-secondary:hover { border-color: var(--gold); color: var(--gold); }

  .hero-stats {
    display: flex; gap: 48px; justify-content: center; margin-top: 72px;
    padding-top: 48px; border-top: 1px solid var(--border);
    animation: fadeInUp 0.8s ease 0.4s both;
  }
  .hero-stat { text-align: center; }
  .hero-stat-value { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 700; color: var(--gold); }
  .hero-stat-label { font-size: 13px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }

  /* FEATURES */
  .section { padding: 120px 48px; position: relative; }
  .section-label {
    font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--gold);
    margin-bottom: 16px; display: flex; align-items: center; gap: 12px;
  }
  .section-label::before { content: ''; width: 32px; height: 1px; background: var(--gold); }
  .section-title { font-family: 'Cinzel', serif; font-size: clamp(28px, 4vw, 48px); font-weight: 700; color: var(--text); line-height: 1.2; }
  .section-sub { font-size: 18px; color: var(--text-dim); margin-top: 16px; max-width: 560px; line-height: 1.7; font-style: italic; }

  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 64px; }
  .feature-card {
    background: var(--bg2); padding: 40px 32px;
    border: 1px solid var(--border); position: relative; overflow: hidden;
    transition: all 0.3s;
  }
  .feature-card::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--gold-glow), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .feature-card:hover::before { opacity: 1; }
  .feature-card:hover { border-color: rgba(201,168,76,0.4); transform: translateY(-2px); }
  .feature-icon { font-size: 32px; margin-bottom: 20px; display: block; }
  .feature-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
  .feature-desc { font-size: 16px; color: var(--text-dim); line-height: 1.7; font-style: italic; }
  .feature-tag {
    display: inline-block; margin-top: 16px; padding: 4px 10px; border-radius: 3px;
    font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
    background: rgba(201,168,76,0.1); color: var(--gold); border: 1px solid var(--border);
  }

  /* COMPARISON */
  .comparison { padding: 120px 48px; background: var(--bg2); }
  .comparison-table { max-width: 800px; margin: 64px auto 0; }
  .comparison-header { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0; margin-bottom: 2px; }
  .comparison-col-header {
    padding: 16px 24px; text-align: center; font-family: 'Cinzel', serif;
    font-size: 14px; letter-spacing: 1px; text-transform: uppercase;
  }
  .comparison-col-header.us { background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: var(--bg); font-weight: 700; }
  .comparison-col-header.them { background: var(--bg3); color: var(--text-dim); }
  .comparison-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0; border-bottom: 1px solid var(--border); }
  .comparison-row:last-child { border-bottom: none; }
  .comparison-cell { padding: 16px 24px; font-size: 15px; }
  .comparison-cell.feature-name { color: var(--text); font-style: italic; }
  .comparison-cell.check { text-align: center; font-size: 18px; }
  .comparison-cell.us-check { background: rgba(201,168,76,0.05); }
  .comparison-cell.them-check { background: var(--bg3); }

  /* PRICING */
  .pricing { padding: 120px 48px; }
  .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px; margin: 64px auto 0; }
  .pricing-card {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
    padding: 40px 32px; text-align: center; position: relative; transition: all 0.3s;
  }
  .pricing-card.featured {
    border-color: var(--gold); background: linear-gradient(135deg, rgba(201,168,76,0.08), var(--bg2));
    transform: scale(1.05);
  }
  .pricing-badge {
    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: var(--bg); font-family: 'Cinzel', serif;
    font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    padding: 4px 16px; border-radius: 20px;
  }
  .pricing-name { font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: var(--text-dim); }
  .pricing-price { font-family: 'Cinzel', serif; font-size: 58px; font-weight: 700; color: var(--gold); margin: 16px 0 4px; }
  .pricing-period { font-size: 14px; color: var(--text-dim); }
  .pricing-features { list-style: none; margin: 32px 0; text-align: left; display: flex; flex-direction: column; gap: 12px; }
  .pricing-features li { font-size: 15px; color: var(--text-dim); display: flex; align-items: center; gap: 10px; font-style: italic; }
  .pricing-features li::before { content: '◆'; color: var(--gold); font-size: 8px; flex-shrink: 0; }
  .pricing-features li.active { color: var(--text); }
  .pricing-btn {
    width: 100%; padding: 14px; border-radius: 4px; font-family: 'Cinzel', serif;
    font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    cursor: pointer; transition: all 0.3s; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim);
  }
  .pricing-btn:hover { border-color: var(--gold); color: var(--gold); }
  .pricing-btn.featured-btn { background: var(--gold); color: var(--bg); border-color: var(--gold); }
  .pricing-btn.featured-btn:hover { background: var(--gold-light); }

  /* CTA */
  .cta-section {
    padding: 120px 48px; text-align: center; position: relative; overflow: hidden;
    border-top: 1px solid var(--border);
  }
  .cta-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%);
  }
  .cta-title { font-family: 'Cinzel', serif; font-size: clamp(40px, 6vw, 72px); font-weight: 900; color: var(--text); position: relative; z-index: 1; }
  .cta-sub { font-size: 20px; color: var(--text-dim); margin: 24px auto; max-width: 500px; font-style: italic; line-height: 1.7; position: relative; z-index: 1; }
  .cta-actions { display: flex; gap: 16px; justify-content: center; margin-top: 48px; position: relative; z-index: 1; }

  /* FOOTER */
  footer {
    padding: 40px 48px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; color: var(--text-dim);
  }
  .footer-logo { font-family: 'Cinzel', serif; color: var(--gold); font-size: 16px; letter-spacing: 2px; }
  .footer-links { display: flex; gap: 24px; }
  .footer-link { color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
  .footer-link:hover { color: var(--gold); }

  /* ANIMATIONS */
  @keyframes fadeInDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }

  /* LIVE TICKER */
  .ticker-wrap {
    width: 100%; overflow: hidden; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    background: var(--bg2); padding: 12px 0;
  }
  .ticker {
    display: flex; gap: 64px; white-space: nowrap;
    animation: ticker 30s linear infinite;
  }
  .ticker-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-dim); }
  .ticker-item .name { color: var(--text); font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 0.5px; }
  .ticker-item .up { color: var(--green); }
  .ticker-item .down { color: var(--red); }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

  /* DIVIDER */
  .divider { display: flex; align-items: center; gap: 16px; margin: 0 48px; opacity: 0.3; }
  .divider-line { flex: 1; height: 1px; background: var(--gold); }
  .divider-icon { color: var(--gold); font-size: 12px; }

  @media (max-width: 768px) {
    nav { padding: 16px 24px; }
    .nav-links { display: none; }
    .section, .comparison, .pricing, .cta-section { padding: 80px 24px; }
    .features-grid, .pricing-grid { grid-template-columns: 1fr; }
    .pricing-card.featured { transform: none; }
    .hero-stats { gap: 24px; }
    .comparison-header, .comparison-row { grid-template-columns: 1.5fr 1fr 1fr; }
    footer { flex-direction: column; gap: 16px; text-align: center; }
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
  { icon: "📈", title: "Merchant Mode", desc: "A self-contained trading terminal with live operations, analytics, alerts and flip recommendations — all in one screen. Never leave the UI while actively trading.", tag: "Flagship feature" },
  { icon: "📡", title: "Live GE Slot Tracking", desc: "Connect the RuneLite plugin and your active GE offers sync in real time. See live P&L, slot drift alerts, and position status without tabbing out of the game.", tag: "RuneLite plugin" },
  { icon: "🤖", title: "AI Flip Advisor", desc: "Ask in plain English — 'I have 5M gp, what should I flip?' — and get intelligent recommendations backed by your live GE data and current positions.", tag: "Powered by Claude" },
  { icon: "📊", title: "Live Margin Engine", desc: "4,525 items tracked in real time from the OSRS Wiki API. GE tax automatically factored into every margin, ROI and GP/hr calculation.", tag: "Real-time data" },
  { icon: "🔔", title: "Smart Alerts", desc: "Margin spikes, volume surges, dump detection and price crashes — get notified the moment an opportunity appears or a position turns against you.", tag: "Live" },
  { icon: "📈", title: "Profit Tracker", desc: "Log every flip and track your GP/hr over time. See your best items, flip streaks, and capital efficiency — all in the Tracker tab.", tag: "Live" },
];

const COMPARISON_ROWS = [
  { feature: "Live GE price data — real-time", us: "✅", them: "Varies" },
  { feature: "RuneLite plugin — live slot sync", us: "✅", them: "Some" },
  { feature: "AI advisor with live position context", us: "✅", them: "❌" },
  { feature: "Ask questions in plain English", us: "✅", them: "❌" },
  { feature: "Merchant Mode trading terminal", us: "✅", them: "❌" },
  { feature: "Filter flips by your cash stack", us: "✅", them: "Rarely" },
  { feature: "Smart alerts — dumps, spikes, crashes", us: "✅", them: "Rarely" },
  { feature: "Transparent flip scoring & reasoning", us: "✅", them: "❌" },
  { feature: "Free tier with real value", us: "✅", them: "Limited" },
];

export default function LandingPage({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
      <style>{STYLES}</style>

      {/* NAV */}
      <nav style={{ background: scrolled ? "rgba(6,8,11,0.95)" : undefined }}>
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
          <a href="#compare" className="nav-link">Why Us</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>
        <a href="/#" className="nav-cta" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp(); }}>
          Enter the GE →
        </a>
      </nav>

      {/* TICKER */}
      <div style={{ paddingTop: "64px" }}>
        <div className="ticker-wrap">
          <div className="ticker">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} className="ticker-item">
                <span className="name">{item.name}</span>
                <span className={item.up ? "up" : "down"}>{item.margin}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Live Grand Exchange Data
          </div>
          <h1 className="hero-title">
            <span className="gold">Flip Smarter.</span>
            <br />
            Stack More Gold.
            <span className="dim">The AI-powered OSRS trading advisor</span>
          </h1>
          <p className="hero-sub">
            RuneTrader analyses every tradeable item on the Grand Exchange in real time,
            then tells you exactly what to flip — and why.
          </p>
          <div className="hero-actions">
            <a href="/#" className="btn-primary" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp(); }}>
              Create Free Account →
            </a>
            <a href="/#" className="btn-secondary" onClick={e => { e.preventDefault(); onEnterApp && onEnterApp("demo"); }}>
              Explore Demo ↗
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">4,525</div>
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
              <div className="hero-stat-value">📈</div>
              <div className="hero-stat-label">Merchant Mode</div>
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

      {/* PLUGIN INSTALL STEPS */}
      <section className="section" style={{ background: "var(--bg2)", paddingTop: "80px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>Get Started</div>
          <h2 className="section-title">Up and running in 3 steps</h2>
          <p className="section-sub" style={{ margin: "16px auto 64px" }}>RuneTrader connects to your game via the RuneLite client. It takes about 2 minutes to set up.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
            {[
              { num: "01", title: "Install RuneLite", desc: "Download RuneLite if you don't have it, then search 'RuneTrader' in the Plugin Hub and click install.", icon: "🔌" },
              { num: "02", title: "Create a free account", desc: "Sign up at RuneTrader.gg — no credit card, no commitment. Your account links to the plugin automatically.", icon: "🧑‍💻" },
              { num: "03", title: "Open the GE and flip", desc: "Your GE slots sync in real time. Open Merchant Mode, check the AI advisor, and start stacking gold.", icon: "📈" },
            ].map((step, i) => (
              <div key={i} className="feature-card" style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "3px", color: "var(--gold-dim)", marginBottom: "16px" }}>{step.num}</div>
                <span className="feature-icon">{step.icon}</span>
                <div className="feature-title">{step.title}</div>
                <div className="feature-desc">{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "48px" }}>
            <a href="https://github.com/runelite/plugin-hub" target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: "13px", padding: "12px 28px", display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              View RuneLite Plugin Hub →
            </a>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="comparison" id="compare">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="section-label">Why RuneTrader</div>
          <h2 className="section-title">Everything a serious<br />flipper needs</h2>
          <p className="section-sub">We built RuneTrader because we wanted something better. Here's exactly what that means.</p>
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-col-header" />
              <div className="comparison-col-header us">RuneTrader</div>
              <div className="comparison-col-header them">Other Tools</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div key={i} className="comparison-row">
                <div className="comparison-cell feature-name">{row.feature}</div>
                <div className="comparison-cell check us-check">{row.us}</div>
                <div className="comparison-cell check them-check">{row.them}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREE CTA — replacing speculative pricing tiers */}
      <section className="pricing" id="pricing">
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>Pricing</div>
          <h2 className="section-title">Free to use.<br />Pro features coming soon.</h2>
          <p className="section-sub" style={{ margin: "16px auto 48px" }}>Everything you see today — live GE tracking, AI advisor, Merchant Mode, Smart Alerts — is free while we're in early access. Pro and Platinum tiers are in the works. Early users get priority access.</p>
          <div className="pricing-card featured" style={{ maxWidth: "400px", margin: "0 auto" }}>
            <div className="pricing-badge">Early Access</div>
            <div className="pricing-name">Free</div>
            <div className="pricing-price">$0</div>
            <div className="pricing-period">while in early access</div>
            <ul className="pricing-features" style={{ marginTop: "24px" }}>
              <li className="active">Full market access — 4,525 items</li>
              <li className="active">Live GE slot tracking via RuneLite</li>
              <li className="active">AI advisor — unlimited questions</li>
              <li className="active">Merchant Mode trading terminal</li>
              <li className="active">Smart alerts — dumps, spikes, crashes</li>
              <li className="active">Profit tracker &amp; flip history</li>
            </ul>
            <button className="pricing-btn featured-btn" onClick={() => onEnterApp && onEnterApp()}>Create Free Account</button>
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
        </div>
      </footer>
    </div>
  );
}
