import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LogoShowcase from "@/components/LogoShowcase";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/#trending" },
    { label: "TV Series", href: "/#trending" },
    { label: "Download App", href: "/#download" },
    { label: "Need Help?", href: "/support" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-lg"
          : "bg-gradient-to-b from-background/80 to-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-2 md:py-3">
        <Link to="/" className="flex items-center gap-2">
          <LogoShowcase size="md" />
          <span className="netflix-title text-base md:text-2xl text-primary">
            STREAMNETMIRROR
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-sm text-muted-foreground" onClick={() => navigate("/signin")}>
            Sign In
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold"
            onClick={() => navigate("/payment")}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground p-2 -mr-2 active:scale-90 transition-transform" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-md border-t border-border px-4 pb-4 overflow-hidden"
          >
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="block py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border/50 active:bg-secondary/30"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <Button
              variant="ghost"
              className="w-full mt-2 text-muted-foreground justify-start"
              onClick={() => { setMobileOpen(false); navigate("/signin"); }}
            >
              Sign In
            </Button>
            <Button
              className="w-full mt-1 bg-primary text-primary-foreground active:scale-95 transition-transform"
              onClick={() => { setMobileOpen(false); navigate("/payment"); }}
            >
              Get Started
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
