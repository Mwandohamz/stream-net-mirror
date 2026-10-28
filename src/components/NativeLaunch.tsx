import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native";
import { toAbsoluteAssetUrl } from "@/lib/assetUrl";
import logo from "@/assets/brand/streamnetmirror-logo.png.asset.json";
import playNeon from "@/assets/brand/play-neon.png.asset.json";
import movies from "@/assets/dashboard-movies.jpg";
import football from "@/assets/dashboard-football.jpg";

const TOTAL_MS = 7000;
const PHASE_MS = 3500;

/** Cold-start cinematic: movies & series scene, then football scene, ~7 seconds. */
export default function NativeLaunch() {
  const [visible, setVisible] = useState(isNativeApp);
  const [phase, setPhase] = useState<0 | 1>(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = window.setInterval(() => setPct(Math.min(100, Math.round(((performance.now() - start) / TOTAL_MS) * 100))), 70);
    const p = window.setTimeout(() => setPhase(1), PHASE_MS);
    const done = window.setTimeout(() => setVisible(false), TOTAL_MS);
    return () => { window.clearInterval(tick); window.clearTimeout(p); window.clearTimeout(done); };
  }, [visible]);
  if (!visible) return null;
  const scenes = [
    { img: movies, eyebrow: "Movies & Series", title: "Every blockbuster. One app." },
    { img: football, eyebrow: "Live Football", title: "Premier League · UCL · La Liga" },
  ];
  return <div className="theme-dashboard native-launch fixed inset-0 z-[100] overflow-hidden bg-background" role="status" aria-label={`Starting Stream NetMirror ${pct}%`}>
    {scenes.map((s, i) => (
      <img key={i} src={s.img} alt="" aria-hidden="true"
        className={`launch-scene absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${phase === i ? "opacity-90 launch-scene-active" : "opacity-0"}`} />
    ))}
    <div className="launch-shade absolute inset-0" aria-hidden="true" />
    <div className="relative flex h-full flex-col items-center justify-between px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))]">
      <img src={toAbsoluteAssetUrl(logo.url)} alt="Stream NetMirror" className="native-launch-logo h-28 w-28 object-contain drop-shadow-2xl" />
      <div key={phase} className="launch-copy text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{scenes[phase].eyebrow}</p>
        <h1 className="dashboard-heading mt-2 text-3xl font-bold leading-tight text-foreground">{scenes[phase].title}</h1>
      </div>
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <img src={toAbsoluteAssetUrl(playNeon.url)} alt="" aria-hidden="true" className="play-neon-icon h-16 w-16 rounded-full object-cover" />
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50"><span className="block h-full streaming-play-surface transition-[width] duration-100" style={{ width: `${pct}%` }} /></div>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{pct}%</span>
      </div>
    </div>
  </div>;
}
