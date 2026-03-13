# RuneTrader.gg — Product Roadmap

> Last updated: March 2026  
> Stack: React CRA · Vercel · Supabase  
> Plugin Hub PR: https://github.com/runelite/plugin-hub/pull/11028

---

## 🔑 Key Context

- **You are currently the only plugin user.** Features that depend on real trade data need ~25+ users before they're meaningful.
- **Merchant Mode** is the flagship Pro feature — a self-contained trading terminal.
- **The AI Advisor** already has live slot context. It will get smarter as the user base grows.
- **Price truth architecture** is designed and ready — just waiting on user growth to activate.

---

## ✅ Already Shipped

- Live GE slot tracking via RuneLite plugin
- Slot drift alerts (warns when your offer price drifts from market)
- AI Advisor with live slot context (knows your active offers)
- Merchant Mode with activation/shutdown animations
- Merchant Mode AI bubble (floating ⚔️ button)
- Merchant Mode tutorial tour (includes AI bubble step)
- Market Value column rename (was "Sell Now")
- Larger GE slot card icons + status labels

---

## 🟢 Build Now (No Dependencies)

### Nav & Naming
- [ ] Rename **"Flips" → "Market"** in nav — more accurate, less confusing
- [ ] Add subtitle to Market page: *"Recommended flips based on your settings"*

### Market / Flips Page
- [ ] **Price alert from Market page** — bell icon on each row, sets alert without leaving page, stored in Alerts tab
- [ ] **"You've flipped this" badge** on rows where user has personal history
- [ ] **Category filters** — runes, food, armour, weapons, etc.
- [ ] **Sparkline charts** — small 24hr margin trend inline in each row

### Shareable Item URLs
- [ ] `/item/:name` routes — e.g. `/item/abyssal-whip`
- [ ] Opens site with item chart modal pre-loaded
- [ ] Shareable in Discord/Reddit for community discussion
- [ ] **Does NOT require Market page rebuild** — modal already exists

### Tracker Page
- [ ] **Streak tracking** — days logged in, flips completed, displayed in stats bar
- [ ] Fold **Portfolio performance chart** into Tracker (merge pages, remove Portfolio from nav)

### Changelog
- [ ] Dedicated `/changelog` page in nav
- [ ] "What's New" modal on first login after a deploy
- [ ] Entries written manually in code or Supabase (no redeploy needed)

### Landing Page (Pre-login)
- [ ] Current landing drops users into a login wall — no product context
- [ ] Add hero section: what RuneTrader does, key features, screenshots
- [ ] CTA: "Try it free" → sign up flow
- [ ] Plugin install instructions prominently shown
- [ ] Conversion funnel: cold traffic → sign up → install plugin → first flip

### Onboarding / Empty States
- [ ] New users see zeros and blank tables — feels broken
- [ ] Empty state cards with tips: *"Log your first flip to see stats"*
- [ ] "Get started" guided flow: install plugin → set budget → make first flip
- [ ] Demo mode — non-logged-in users can explore with fake/sample data

### Merchant Mode — Self-Contained Terminal
- [ ] **Market tab inside Merchant Mode** — 4th tab alongside Operations/Analytics/Alerts
- [ ] Plugs existing flip recommendation engine in directly
- [ ] Goal: never need to leave Merchant Mode while actively trading

### Monetization Infrastructure
- [ ] Define what's free vs Pro/Platinum tier (currently unclear)
- [ ] **Pricing page** — show tiers, features, CTA to upgrade
- [ ] Upgrade flow — payment integration (Stripe?)
- [ ] Merchant Mode likely the core Pro feature gate
- [ ] Daily Goal currently only in Merchant Mode — decide if free users get it

### Referral System
- [ ] Referral links — trackable, shareable
- [ ] Offer: *"Refer a friend → both get 30 days Merchant Mode free"*
- [ ] Tier option: refer 3 friends → permanent Pro badge on profile
- [ ] Key distribution channel: Discord, Reddit r/2007scape

### Social — Shareable Flip Cards
- [ ] Image card: *"I made 500K on Abyssal whip in 2hrs — RuneTrader.gg"*
- [ ] Auto-generated on flip close
- [ ] Shareable to Discord/Reddit/Twitter
- [ ] Free marketing — every shared card is an ad

### Daily Digest AI Prompts
- [ ] If user has favourited items: *"Here's how your favourite flips are trending"*
- [ ] If no favourites: *"Market Pulse — here's what's trending up and down today"*
- [ ] Push notification or in-app prompt on login

---

## 🟡 Build at ~25 Plugin Users

### Price Truth (Real Trade Data Layer)
- [ ] Create Supabase view:
```sql
CREATE VIEW price_truth AS
SELECT item_name,
  AVG(buy_price) AS real_buy,
  AVG(sell_price) AS real_sell,
  AVG(sell_price - buy_price) AS real_margin,
  COUNT(*) AS trade_count,
  MAX(sell_completed_at) AS last_seen
FROM ge_flips_live
WHERE status = 'SOLD'
  AND sell_completed_at > NOW() - INTERVAL '2 hours'
  AND buy_price > 0 AND sell_price > 0
GROUP BY item_name
HAVING COUNT(*) >= 2;
```
- [ ] Fallback hierarchy: `price_truth` (if ≥2 recent trades) → Wiki `/latest`
- [ ] AI cites *"based on recent player trades"* only when price_truth data exists
- [ ] **Advertising claim unlocked:** *"Powered by real player trade data"*

### Scoring System Overhaul
Current `getScore()` issues:
- GE tax (2%) not penalising items that barely clear threshold
- Liquidity ratio conflates high-volume/low-limit vs low-volume/high-limit
- Fill rate assumptions too optimistic at mid-volume
- Score ceiling is 85 but displayed as /100 — confusing
- ROI contradiction: score gives non-zero up to 100% ROI but AI flags >40% as red flag

**Proposed fix:** Replace single score with 3 signals:
- [ ] **GP/hr** — capital × ROI × cycles/day
- [ ] **Fill Speed** — volume-weighted, accounts for GE limit
- [ ] **Safety** — price stability, dump risk, tax efficiency

### Item Explorer Page
- [ ] Separate from Market page — browse ALL ~4000 tradeable items (not just recommendations)
- [ ] Search, filter by category, sort by any column
- [ ] Click any item → existing detail modal
- [ ] No budget/risk filter required — raw market data
- [ ] *"You've flipped this X times"* badge where applicable

---

## 🔵 Build at Scale (100+ Users)

### GE Oracle
- [ ] Market intelligence layer using aggregated real trade data
- [ ] *"1,247 players checked this item in the last hour"*
- [ ] *"Average real margin: 12,400gp (vs Wiki estimate: 8,200gp)"*
- [ ] *"Fill time based on real data: ~4 minutes"*
- [ ] **Requires critical mass** — misleading without enough data
- [ ] Main differentiator vs GE Tracker and Flipping Copilot

### Leaderboard / Public Profiles
- [ ] Opt-in public profile: total profit, best items, flip count
- [ ] Weekly/monthly leaderboard
- [ ] Major retention driver — people come back to maintain rank

### Live Traders Counter
- [ ] *"847 merchants active right now"*
- [ ] Quick win once user base exists — social proof on landing page

### Community Features
- [ ] *"Most watched items"* — crowdsourced from user favourites
- [ ] User-submitted flip tips per item
- [ ] Community watchlist — items lots of users have starred

### Analytics / Stats Page
- [ ] Profit over time chart (daily/weekly/monthly)
- [ ] Best performing items historically
- [ ] Flip win rate, avg ROI, avg hold time
- [ ] Capital efficiency over time

---

## 🤝 Community & Growth

### Discord
- [ ] Create RuneTrader Discord server
- [ ] **Custom bot** with real-time market alerts (margin spikes, dumps, crashes)
- [ ] Bot posts "Flip of the Day" automatically from site data
- [ ] Bot integrates with price_truth when available
- [ ] Invite link prominent on site

### Plugin Hub (Critical Path)
- [ ] PR #11028 — awaiting human maintainer review ⏳
- [ ] **After merge:** marketing push to OSRS flipping communities
  - Reddit r/2007scape
  - Flipping Discord servers
  - OSRS content creators
- [ ] Track plugin installs — milestone: 25 users → activate price_truth

### SEO
- [ ] Shareable item URLs (`/item/:name`) — every shared link is indexed
- [ ] Blog / guides: *"How to flip Abyssal whip"*, *"Best F2P flips 2026"*
- [ ] These rank on Google and drive organic signups

---

## 💡 Future Ideas (Unscoped)

- **Flip planner** — *"I have 50M and 3 slots, build me an optimal portfolio right now"* (AI-driven)
- **Status page** — Wiki API uptime, plugin sync status, last data refresh
- **History analytics** — best times of day to flip, avg hold time trends
- **Price chart improvements** — volume bars, RSI, support/resistance levels
- **Mobile app** — React Native, push notifications for alerts

---

## 🗂 How to Use This Doc in Future Chats

Paste this file at the start of any new Claude conversation to restore full context. Claude will know:
- What's been built
- What's planned and why
- The user base thresholds for each feature
- The architecture decisions already made

> Repo: https://github.com/KrazziR1/runetrader  
> Plugin: https://github.com/KrazziR1/runetrader-plugin  
> Live: https://www.runetrader.gg  
> User ID: `338ff3a1-1ffa-4b39-9d5a-58d4475536fa`
