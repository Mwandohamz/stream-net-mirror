interface LogoShowcaseProps {
  size?: "md" | "lg";
}

const LogoShowcase = ({ size = "md" }: LogoShowcaseProps) => {
  const sizeClass = size === "lg" ? "h-16 w-16 md:h-20 md:w-20" : "h-10 w-10 md:h-14 md:w-14";

  return (
    <img
      src="/app-icon-512.png"
      alt="StreamNetMirror"
      width={768}
      height={768}
      className={`${sizeClass} shrink-0 rounded-full object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.35)]`}
    />
  );
};

export default LogoShowcase;
