import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--foreground))", "hsl(var(--secondary-foreground))"];

/** Shows "Welcome" (first visit) or "Welcome back" once per app session, with a short confetti burst. */
const WelcomeGreeting = ({ userId, name }: { userId?: string; name?: string | null }) => {
  const [msg, setMsg] = useState<{ title: string; first: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    const sessionKey = `snm_welcomed_${userId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");
    const seenKey = `snm_seen_${userId}`;
    const first = !localStorage.getItem(seenKey);
    localStorage.setItem(seenKey, "1");
    const firstName = name?.trim().split(" ")[0] || "there";
    setMsg({ title: first ? `Welcome to StreamNetMirror, ${firstName}!` : `Welcome back, ${firstName}!`, first });
    const t = setTimeout(() => setMsg(null), 4500);
    return () => clearTimeout(t);
  }, [userId, name]);

  const pieces = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 2.2 + Math.random() * 1.5,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
    })),
    [msg],
  );

  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-live="polite">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="welcome-confetti"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }}
        />
      ))}
      <div className="pointer-events-auto absolute left-1/2 top-20 w-[min(92vw,380px)] -translate-x-1/2 animate-in fade-in slide-in-from-top-4 rounded-2xl border border-border bg-card/95 p-4 text-center shadow-2xl backdrop-blur-md">
        <button onClick={() => setMsg(null)} className="absolute right-2 top-2 p-1 text-muted-foreground" aria-label="Close">
          <X size={16} />
        </button>
        <p className="text-2xl">🎉</p>
        <p className="dashboard-heading mt-1 text-lg font-bold text-foreground">{msg.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{msg.first ? "Your account is ready. Enjoy movies, series and live football." : "Good to see you again. Pick up where you left off."}</p>
      </div>
    </div>
  );
};

export default WelcomeGreeting;
