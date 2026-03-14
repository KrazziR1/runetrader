import { useEffect, useRef } from "react";

/**
 * Sparkline — inline 24hr margin trend drawn on canvas.
 * Props:
 *   itemId  {number}  — OSRS wiki item ID
 *   width   {number}  — canvas width (default 80)
 *   height  {number}  — canvas height (default 32)
 *   color   {string}  — stroke color override (auto from trend if omitted)
 */
export default function Sparkline({ itemId, width = 80, height = 32, color }) {
  const canvasRef = useRef(null);
  const cacheRef = useRef({}); // module-level static cache

  useEffect(() => {
    if (!itemId || !canvasRef.current) return;
    let cancelled = false;

    async function draw(data) {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Extract margin (high - low) for each point
      const points = data
        .filter(d => d.avgHighPrice && d.avgLowPrice)
        .map(d => d.avgHighPrice - d.avgLowPrice);

      if (points.length < 2) return;

      const minV = Math.min(...points);
      const maxV = Math.max(...points);
      const range = maxV - minV || 1;
      const padX = 2, padY = 3;
      const W = width - padX * 2, H = height - padY * 2;

      const xPos = i => padX + (i / (points.length - 1)) * W;
      const yPos = v => padY + (1 - (v - minV) / range) * H;

      const trend = points[points.length - 1] - points[0];
      const lineColor = color || (trend >= 0 ? "#2ecc71" : "#e74c3c");

      // Fill
      const grad = ctx.createLinearGradient(0, padY, 0, height - padY);
      grad.addColorStop(0, lineColor.replace(")", ", 0.25)").replace("rgb", "rgba").replace("#2ecc71", "rgba(46,204,113,0.2)").replace("#e74c3c", "rgba(231,76,60,0.15)"));
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(points[0]));
      points.forEach((p, i) => ctx.lineTo(xPos(i), yPos(p)));
      ctx.lineTo(xPos(points.length - 1), height - padY);
      ctx.lineTo(xPos(0), height - padY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(points[0]));
      points.forEach((p, i) => ctx.lineTo(xPos(i), yPos(p)));
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.stroke();

      // End dot
      const lx = xPos(points.length - 1), ly = yPos(points[points.length - 1]);
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
    }

    async function load() {
      if (cacheRef.current[itemId]) {
        draw(cacheRef.current[itemId]);
        return;
      }
      try {
        const res = await fetch(
          `https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id=${itemId}`,
          { headers: { "User-Agent": "RuneTrader/1.0" } }
        );
        const json = await res.json();
        if (!json.data || json.data.length === 0) return;
        // Last 24 points = 24 hours
        const slice = json.data.slice(-24);
        cacheRef.current[itemId] = slice;
        draw(slice);
      } catch {
        // fail silently — sparkline is non-critical
      }
    }

    load();
    return () => { cancelled = true; };
  }, [itemId, width, height, color]); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      title="24hr margin trend"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "block",
        cursor: "default",
        opacity: 0.85,
      }}
    />
  );
}
