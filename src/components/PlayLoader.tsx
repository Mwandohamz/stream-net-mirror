import { Play } from "lucide-react";

/** Branded loading indicator: a play button with a circular progress ring. */
const PlayLoader = ({ label = "Loading", size = 64 }: { label?: string; size?: number }) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div role="status" aria-label={label} className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="absolute inset-0 -rotate-90 animate-spin" style={{ animationDuration: "1.4s" }} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.65}
            className="stroke-primary"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <Play size={size * 0.34} className="fill-current text-primary" />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default PlayLoader;
