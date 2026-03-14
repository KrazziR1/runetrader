// api/og.js — Vercel serverless function
// Serves OG meta tags for /item/:slug URLs so Discord/Reddit/Twitter
// show rich previews with live price data from the OSRS Wiki API.

const WIKI_LATEST = "https://prices.runescape.wiki/api/v1/osrs/latest";
const WIKI_MAPPING = "https://prices.runescape.wiki/api/v1/osrs/mapping";
const USER_AGENT = "RuneTrader.gg OG / contact@runetrader.gg";

function formatGP(n) {
  if (!n || isNaN(n)) return "—";
  return Math.round(n).toLocaleString("en-GB");
}

function slugToName(slug) {
  return slug.replace(/-/g, " ");
}

function nameToWikiImage(name) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(name.replace(/ /g, "_"))}_detail.png`;
}

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(req, res) {
  // Only handle GET requests from bots / crawlers
  // Real users hitting /item/:slug get routed to the React app by vercel.json
  const { item: slug } = req.query;

  if (!slug) {
    return res.status(400).send("Missing item slug");
  }

  const itemName = slugToName(decodeURIComponent(slug));
  const canonicalUrl = `https://www.runetrader.gg/item/${encodeURIComponent(slug)}`;
  const siteImage = "https://www.runetrader.gg/icons/icon-512.png"; // fallback

  let title = `${itemName} — RuneTrader.gg`;
  let description = `Track ${itemName} live on the Grand Exchange. View price history, margin, and flip recommendations on RuneTrader.gg`;
  let image = nameToWikiImage(itemName);

  try {
    // Fetch item mapping to get ID
    const [mappingRes, latestRes] = await Promise.all([
      fetch(WIKI_MAPPING, { headers: { "User-Agent": USER_AGENT } }),
      fetch(WIKI_LATEST, { headers: { "User-Agent": USER_AGENT } }),
    ]);

    const mapping = await mappingRes.json();
    const latest = await latestRes.json();

    // Find item by name (case-insensitive)
    const found = mapping.find(
      (m) => m.name.toLowerCase() === itemName.toLowerCase()
    );

    if (found && latest.data[found.id]) {
      const prices = latest.data[found.id];
      const high = prices.high || 0;
      const low = prices.low || 0;
      const tax = Math.min(Math.floor(high * 0.02), 5_000_000);
      const margin = high - low - tax;
      const roi = low > 0 ? ((margin / low) * 100).toFixed(1) : 0;

      title = `${found.name} — RuneTrader.gg`;

      if (high && low) {
        description = [
          `Buy: ${formatGP(low)}gp`,
          `Sell: ${formatGP(high)}gp`,
          `Margin: ${formatGP(margin)}gp`,
          `ROI: ${roi}%`,
          `· Track it live on RuneTrader.gg`,
        ].join(" · ");
      }

      // Use wiki image
      image = nameToWikiImage(found.name);
    }
  } catch (err) {
    // Fail gracefully — still serve the page with fallback data
    console.error("OG fetch error:", err.message);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escape(title)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="RuneTrader.gg" />
  <meta property="og:url" content="${escape(canonicalUrl)}" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:image" content="${escape(image)}" />
  <meta property="og:image:width" content="128" />
  <meta property="og:image:height" content="128" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@RuneTraderGG" />
  <meta name="twitter:title" content="${escape(title)}" />
  <meta name="twitter:description" content="${escape(description)}" />
  <meta name="twitter:image" content="${escape(image)}" />

  <!-- SEO -->
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${escape(canonicalUrl)}" />

  <!-- Redirect real users to the React app -->
  <meta http-equiv="refresh" content="0; url=${escape(canonicalUrl)}" />
  <script>window.location.replace("${escape(canonicalUrl)}");</script>
</head>
<body>
  <p>Redirecting to <a href="${escape(canonicalUrl)}">${escape(title)}</a>…</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache for 5 minutes — prices update frequently
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  res.status(200).send(html);
}
