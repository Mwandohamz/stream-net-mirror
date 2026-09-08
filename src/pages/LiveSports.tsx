import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ShieldCheck, Globe, RefreshCw } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useMembership } from "@/hooks/useMembership";

const LiveSports = () => {
  const navigate = useNavigate();
  const { categoryBySlug, linksFor } = useContent();
  const { ctaHref, ctaLabel, isMember } = useMembership();
  const category = categoryBySlug("live-sports");
  const links = category ? linksFor(category.id) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pb-16 pt-24">
        <header className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Trophy size={14} /> Live football, wherever you are
          </div>
          <h1 className="netflix-title text-3xl md:text-5xl text-foreground">STREAM LIVE FOOTBALL FREE</h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            UEFA Champions League, Premier League, LaLiga, Bundesliga and Sky Sports Football — we find, test and
            maintain the links so you do not have to. We do the dirty work, keep them refreshed and support you when a
            stream moves. The sites belong to third parties, so never share your details on them.
          </p>
          <Button className="bg-primary text-primary-foreground font-semibold" onClick={() => navigate(isMember ? "/dashboard?tab=sports" : ctaHref)}>
            {isMember ? "Open live sports" : ctaLabel}
          </Button>
        </header>

        <section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Card key={l.id} className="bg-card border-border overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-secondary">
                  {l.logo_url && <img src={l.logo_url} alt={l.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                </div>
                <h2 className="text-base font-semibold text-foreground">{l.title}</h2>
                {l.description && <p className="text-xs text-muted-foreground leading-relaxed">{l.description}</p>}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-border text-foreground"
                  onClick={() => navigate(isMember ? "/dashboard?tab=sports" : ctaHref)}
                >
                  {isMember ? "Open link" : "Unlock access"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Checked before kickoff", text: "We test each stream so you are not hunting for a working link at kickoff." },
            { icon: Globe, title: "Works worldwide", text: "No regional blackouts — open the link from any country." },
            { icon: RefreshCw, title: "Always refreshed", text: "When a link dies, we replace it and your dashboard updates." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-4 text-center">
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
