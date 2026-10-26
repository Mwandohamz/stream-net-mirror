import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native";
import { toAbsoluteAssetUrl } from "@/lib/assetUrl";
import logo from "@/assets/brand/streamnetmirror-logo.png.asset.json";
import movies from "@/assets/dashboard-movies.jpg";
import football from "@/assets/dashboard-football.jpg";

export default function NativeLaunch() {
  const [visible, setVisible] = useState(isNativeApp);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 1600);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return <div className="theme-dashboard native-launch fixed inset-0 z-[100] overflow-hidden bg-background" role="status" aria-label="Starting Stream NetMirror">
    <div className="auth-visual" aria-hidden="true">
      <img src={movies} alt="" className="auth-visual-top native-launch-image" />
      <img src={football} alt="" className="auth-visual-bottom native-launch-image" />
      <div className="auth-visual-shade" />
    </div>
    <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6">
      <img src={toAbsoluteAssetUrl(logo.url)} alt="Stream NetMirror" className="native-launch-logo h-36 w-36 object-contain" />
      <h1 className="dashboard-heading text-center text-2xl font-semibold text-foreground">Stream NetMirror</h1>
      <div className="native-launch-progress h-1 w-24 overflow-hidden rounded-full bg-muted"><span className="block h-full w-full streaming-play-surface" /></div>
    </div>
  </div>;
}