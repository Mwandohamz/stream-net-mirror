import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Trophy, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePricing } from "@/hooks/usePricing";
import { usePlans, planIntervalLabel, type Plan } from "@/hooks/usePlans";
import { useMembership } from "@/hooks/useMembership";
import { useContent } from "@/hooks/useContent";
import CurrencySelector from "@/components/CurrencySelector";
import { motion } from "framer-motion";

import netflixLogo from "@/assets/ott/netflix.jpg";
import disneyLogo from "@/assets/ott/disney-plus.jpg";
import hboLogo from "@/assets/ott/hbo-max.jpg";
import hotstarLogo from "@/assets/ott/jiohotstar.jpg";
import appleTvLogo from "@/assets/ott/apple-tv.jpg";
import paramountLogo from "@/assets/ott/paramount.jpg";

const ottPlatforms = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney+", logo: disneyLogo },
  { name: "HBO Max", logo: hboLogo },
  { name: "JioHotstar", logo: hotstarLogo },
  { name: "Apple TV+", logo: appleTvLogo },
  { name: "Paramount+", logo: paramountLogo },
];

const baseFeatures = [
  "Full HD (1080p) streaming quality",
  "Watch on 2 devices at the same time",
  "Ad-free streaming experience",
  "Access to 50+ OTT platforms",
  "Verified links, refreshed whenever they change",
  "Email support & WhatsApp assistance",
];

const CATEGORY_LABEL: Record<string, string> = {
  netmirror: "NetMirror streaming",
  "live-sports": "Live football streams",
  downloads: "Movie download links & tools",
};

const PricingTier = () => {
  const navigate = useNavigate();
  const { formatPrice, formatUsd, loading } = usePricing();
  const { plans } = usePlans();
  const { isMember, state, ctaHref } = useMembership();
  const { categoryBySlug, linksFor } = useContent();

  const sportsCategory = categoryBySlug("live-sports");
  const sportsLogos = (sportsCategory ? linksFor(sportsCategory.id) : []).filter((l) => l.logo_url).slice(0, 5);

  const goTo = (plan: Plan) => {
    if (isMember) return navigate(ctaHref);
    if (state === "guest") return navigate(`/signup?next=${encodeURIComponent(`/payment?plan=${plan.id}`)}`);
    return navigate(`/payment?plan=${plan.id}`);
  };

  const ctaText = (plan: Plan) => {
    if (isMember) return "Manage membership";
    if (state === "guest") return `Create free account — ${loading ? "..." : formatPrice(Number(plan.price_usd))}`;
    return `Unlock now — ${loading ? "..." : formatPrice(Number(plan.price_usd))}`;
  };

  return (
    <section className="py-8 md:py-16" id="plans">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="netflix-title text-2xl md:text-5xl text-foreground mb-1 md:mb-2">CHOOSE YOUR PLAN</h2>
          <p className="text-xs md:text-base text-muted-foreground font-medium">
            Prices are set in USD. Pick your country to see what you would pay locally.
          </p>
          <div className="mt-3 flex justify-center">
            <CurrencySelector />
          </div>
        </div>

        <div className={`mx-auto grid gap-5 ${plans.length > 1 ? "max-w-4xl md:grid-cols-2" : "max-w-md"}`}>
          {plans.map((plan, i) => {
            const priceUsd = Number(plan.price_usd);
            const slugs = plan.category_slugs?.length ? plan.category_slugs : ["netmirror"];
            const isBundle = slugs.length > 1;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`relative h-full overflow-hidden bg-card ${isBundle ? "border-2 border-primary" : "border-2 border-primary/30"}`}>
                  <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    <Sparkles size={12} /> {isBundle ? "ALL ACCESS" : "SAVE 70%"}
                  </div>

                  <CardContent className="space-y-5 p-5 md:p-7">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{plan.name}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-muted-foreground line-through md:text-xl">
                          {loading ? "..." : formatPrice(priceUsd / 0.3)}
                        </span>
                        <span className="netflix-title text-4xl text-primary md:text-5xl">
                          {loading ? "..." : formatPrice(priceUsd)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {planIntervalLabel(plan)} · <span className="font-semibold text-foreground">{formatUsd(priceUsd)}</span> base price
                      </p>
                      {plan.description && <p className="mt-2 text-xs text-muted-foreground">{plan.description}</p>}
                    </div>

                    {/* What's included */}
                    <div className="space-y-2 rounded-lg bg-secondary/60 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Included in this plan</p>
                      <div className="flex flex-wrap gap-1.5">
                        {slugs.map((s) => (
                          <Badge key={s} variant="outline" className="border-primary/30 text-[10px] text-foreground">
                            {CATEGORY_LABEL[s] ?? s}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Visual: OTT logos */}
                    {slugs.includes("netmirror") && (
                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Streaming platforms</p>
                        <div className="flex flex-wrap gap-2">
                          {ottPlatforms.map((p) => (
                            <div key={p.name} className="h-9 w-9 overflow-hidden rounded-lg bg-secondary">
                              <img src={p.logo} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                            </div>
                          ))}
                          <div className="flex h-9 items-center rounded-lg bg-secondary px-2 text-[10px] text-muted-foreground">+44</div>
                        </div>
                      </div>
                    )}

                    {/* Visual: league logos */}
                    {slugs.includes("live-sports") && sportsLogos.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <Trophy size={11} className="text-primary" /> Live football
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sportsLogos.map((l) => (
                            <div key={l.id} className="h-9 w-9 overflow-hidden rounded-lg bg-secondary">
                              <img src={l.logo_url!} alt={l.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {slugs.includes("downloads") && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Download size={13} className="text-primary" /> Movie download links plus the software tools that make them work
                      </p>
                    )}

                    <ul className="space-y-2">
                      {baseFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs md:text-sm">
                          <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => goTo(plan)}
                      className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/80 active:scale-95"
                    >
                      {ctaText(plan)}
                    </Button>

                    <p className="text-center text-[9px] text-muted-foreground md:text-[10px]">
                      Create your free account first — payment happens inside your dashboard.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingTier;
