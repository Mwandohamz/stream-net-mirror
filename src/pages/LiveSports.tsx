import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ShieldCheck, Globe, RefreshCw, Play, Radio } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useMembership } from "@/hooks/useMembership";

import ucl from "@/assets/sports/uefa-champions-league.jpg.asset.json";
import epl from "@/assets/sports/premier-league.jpg.asset.json";
import laliga from "@/assets/sports/laliga.jpg.asset.json";
import bundesliga from "@/assets/sports/bundesliga.jpg.asset.json";
import sky from "@/assets/sports/sky-sports-football.jpg.asset.json";

/** Fallback league line-up shown even before the admin adds links. */
const LEAGUES = [
  {
    name: "UEFA Champions League",
    logo: ucl.url,
    tag: "Tuesdays & Wednesdays",
    blurb: "Europe's biggest nights — Real Madrid, Bayern, City and PSG. Miss one goal and the whole group is talking about it tomorrow.",
  },
  {
    name: "Premier League",
    logo: epl.url,
    tag: "Every weekend",
    blurb: "All 380 matches, from the Manchester derby to a relegation six-pointer. No blackouts, no cable bill, no waiting for highlights.",
  },
  {
    name: "LaLiga",
    logo: laliga.url,
    tag: "Spanish football",
    blurb: "El Clásico, the Madrid derby and the finest technical football on earth — live, in your language, on any device.",
  },
  {
    name: "Bundesliga",
    logo: bundesliga.url,
    tag: "Goals guaranteed",
    blurb: "The highest-scoring league in Europe and the loudest stands in the world. Der Klassiker is unmissable.",
  },
  {
    name: "Sky Sports Football",
    logo: sky.url,
    tag: "Round-the-clock",
    blurb: "Match build-up, EFL action, transfer news and analysis running all day — the channel fans keep on in the background.",
  },
];

const LiveSports = () => {
  const navigate = useNavigate();
  const { categoryBySlug, linksFor } = useContent();
  const { ctaHref, isMember } = useMembership();
  const category = categoryBySlug("live-sports");
  const adminLinks = category ? linksFor(category.id) : [];

  // Prefer what the admin has published; fall back to the built-in line-up.
  const cards = adminLinks.length
    ? adminLinks.map((l) => ({
        name: l.title,
        logo: l.logo_url || "",
        tag: "Live stream",
        blurb: l.description || "Verified stream link, tested before kickoff and replaced the moment it stops working.",
      }))
    : LEAGUES;

  const go = () => navigate(isMember ? "/dashboard?tab=sports" : "/signup");

  return (
    <div className="theme-sports min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pb-16 pt-24 md:pt-28">
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Radio size={14} /> Live football, wherever you are
          </div>
          <h1 className="netflix-title text-3xl text-foreground md:text-6xl">STREAM LIVE FOOTBALL</h1>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Champions League, Premier League, LaLiga, Bundesliga and Sky Sports Football. We find, test and refresh the
            streams so you never spend kickoff hunting for a working link. The sites belong to third parties — enjoy the
            football, but never share your personal details on them.
          </p>
          <Button size="lg" className="h-12 gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground" onClick={go}>
            <Play size={16} className="fill-current" /> {isMember ? "Open live sports" : "Create free account to watch"}
          </Button>
        </header>

        <section className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="h-full overflow-hidden border-border bg-card transition-shadow hover:shadow-[var(--shadow-glow)]">
                <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary/25 via-card to-accent/20">
                  <Trophy size={40} className="absolute text-primary/70" />
                  {l.logo && (
                    <img
                      src={l.logo}
                      alt={l.name}
                      loading="lazy"
                      decoding="async"
                      className="relative h-20 w-20 rounded-xl bg-background/60 object-contain p-2"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <Badge className="absolute right-2 top-2 bg-background/80 text-[10px] text-foreground">{l.tag}</Badge>
                </div>
                <CardContent className="space-y-3 p-4">
                  <h2 className="text-base font-semibold text-foreground">{l.name}</h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">{l.blurb}</p>
                  <Button className="w-full gap-1.5 rounded-full bg-primary font-semibold text-primary-foreground" onClick={go}>
                    <Play size={14} className="fill-current" /> Watch now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Checked before kickoff", text: "We test each stream so you are not hunting for a working link at kickoff." },
            { icon: Globe, title: "Works worldwide", text: "No regional blackouts — open the link from any country." },
            { icon: RefreshCw, title: "Always refreshed", text: "When a link dies, we replace it and your dashboard updates." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-4 text-center">
              <f.icon size={20} className="mx-auto mb-2 text-primary" />
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LiveSports;
