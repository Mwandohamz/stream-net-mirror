import { useEffect, useState } from "react";
import playNeon from "@/assets/brand/play-neon.png.asset.json";
import { toAbsoluteAssetUrl } from "@/lib/assetUrl";

/** Branded loader: the neon play icon with a filling ring and a 0–100% counter. */
const PlayLoader = ({ label = "Loading", size = 88 }: { label?: string; size?: number }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      // Fast at first, then eases toward 99% until the content is ready; 100% on unmount-ready frames.
      setPct(Math.min(99, Math.round(100 * (1 - Math.exp(-t / 0.9)))));
    }, 60);
    return () => window.clearInterval(id);
  }, []);
  const stroke = 4;
  const ring = size + 16;
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div role="status" aria-label={`${label} ${pct}%`} className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg className="absolute inset-0 -rotate-90" width={ring} height={ring} viewBox={`0 0 ${ring} ${ring}`}>
          <defs>
            <linearGradient id="play-loader-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(205 100% 55%)" />
            </linearGradient>
          </defs>
          <circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted/40" />
          <circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round"
            stroke="url(#play-loader-grad)" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 120ms linear" }} />
        </svg>
        <img src={toAbsoluteAssetUrl(playNeon.url)} alt="" aria-hidden="true"
          className="play-neon-icon absolute rounded-full object-cover animate-pulse"
          style={{ width: size, height: size, top: 8, left: 8 }} />
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{pct}%</span>
    </div>
  );
};

export default PlayLoader;
