import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoShowcaseProps {
  size?: "md" | "lg";
}

const LogoShowcase = ({ size = "md" }: LogoShowcaseProps) => {
  const [showFirst, setShowFirst] = useState(true);
  const sizeClass = size === "lg" ? "h-16 w-16 md:h-20 md:w-20" : "h-10 w-10 md:h-14 md:w-14";

  useEffect(() => {
    const interval = setInterval(() => setShowFirst((prev) => !prev), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${sizeClass}`}>
      <AnimatePresence mode="wait">
        {showFirst ? (
          <motion.img
            key="hexagon"
            src="/logo-hexagon.png"
            alt="Stream Net Mirror"
            className={`${sizeClass} object-contain absolute inset-0`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
          />
        ) : (
          <motion.img
            key="logo-n"
            src="/logo-n.png"
            alt="NetMirror"
            className={`${sizeClass} object-contain absolute inset-0`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LogoShowcase;
