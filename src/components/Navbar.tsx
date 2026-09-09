import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LogoShowcase from "@/components/LogoShowcase";
import { useMembership } from "@/hooks/useMembership";
import MembershipBanner from "@/components/MembershipBanner";


const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { state, isMember, daysLeft, ctaLabel, ctaHref } = useMembership();
  const signedIn = state !== "guest" && state !== "loading";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies" },
    { label: "TV Series", href: "/tv-series" },
    { label: "Live Sports", href: "/live-sports" },
    { label: "Download App", href: "/#download" },
    // Support is only offered to people who already have an account.
    ...(signedIn ? [{ label: "Need Help?", href: "/support" }] : []),
  ];

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const memberPill = isMember && (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
      <CheckCircle2 size={13} aria-hidden="true" />
      {daysLeft !== null ? `Member — ${daysLeft}d left` : "Member"}
    </span>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-2 pt-2 md:px-4 md:pt-3">
      <div
        className={`container mx-auto flex items-center justify-between gap-2 rounded-full border px-3 py-2 transition-all duration-300 md:px-5 ${
          scrolled
            ? "border-border bg-background/90 shadow-xl backdrop-blur-md"
            : "border-border/50 bg-background/60 backdrop-blur-sm"
        }`}
      >
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <LogoShowcase size="md" />
          <span className="netflix-title text-base text-primary md:text-xl">STREAMNETMIRROR</span>
        </Link>

        {/* Desktop links — pill group with the current page highlighted */}
        <div className="hidden items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1 lg:flex">
          {links.map((l) =>
            l.href.startsWith("/#") ? (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive(l.href)
                    ? "bg-primary font-semibold text-primary-foreground shadow"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            )
          )}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {memberPill}
          {!signedIn && (
            <Button variant="ghost" className="rounded-full text-sm text-muted-foreground" onClick={() => navigate("/signin")}>
              Sign In
            </Button>
          )}
          {signedIn && !isMember && (
            <Button variant="ghost" className="rounded-full text-sm text-muted-foreground" onClick={() => navigate("/dashboard")}>
              My account
            </Button>
          )}
          <Button
            className="rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/80"
            onClick={() => navigate(ctaHref)}
          >
            {ctaLabel}
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-full p-2 text-foreground transition-transform active:scale-90 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Membership status strip — part of the same fixed stack so it can never overlap */}
      <MembershipBanner />



      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto mt-2 overflow-hidden rounded-3xl border border-border bg-background/95 px-3 pb-3 backdrop-blur-md lg:hidden"
          >
            {isMember && <div className="pt-3">{memberPill}</div>}
            <div className="grid grid-cols-2 gap-2 pt-3">
              {links.map((l) =>
                l.href.startsWith("/#") ? (
                  <a
                    key={l.label}
                    href={l.href}
                    className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm text-muted-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    to={l.href}
                    className={`rounded-xl border px-3 py-2.5 text-sm ${
                      isActive(l.href)
                        ? "border-primary bg-primary/15 font-semibold text-primary"
                        : "border-border/60 bg-secondary/40 text-muted-foreground"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start rounded-xl text-muted-foreground"
              onClick={() => { setMobileOpen(false); navigate(signedIn ? "/dashboard" : "/signin"); }}
            >
              {signedIn ? "My account" : "Sign In"}
            </Button>
            <Button
              className="mt-1 w-full rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
              onClick={() => { setMobileOpen(false); navigate(ctaHref); }}
            >
              {ctaLabel}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
