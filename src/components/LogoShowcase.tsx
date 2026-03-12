import { motion } from "framer-motion";

interface LogoShowcaseProps {
  size?: "md" | "lg";
}

const LogoShowcase = ({ size = "md" }: LogoShowcaseProps) => {
  const sizeClass = size === "lg" ? "h-16 w-16 md:h-20 md:w-20" : "h-10 w-10 md:h-14 md:w-14";

  return (
    <div className="flex items-center gap-3 md:gap-4">
      <motion.img
        src="/logo-hexagon.png"
        alt="Stream Net Mirror"
        className={`${sizeClass} object-contain`}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <motion.img
        src="/logo-n.png"
        alt="NetMirror"
        className={`${sizeClass} object-contain`}
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default LogoShowcase;
