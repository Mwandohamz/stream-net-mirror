import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePricing } from "@/hooks/usePricing";
import { useMembership } from "@/hooks/useMembership";
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

const planFeatures = [
  "Full HD (1080p) streaming quality",
  "Watch on 2 devices at the same time",
  "Download on 2 devices",
  "Ad-free streaming experience",
  "Access to 50+ OTT platforms",
  "Cancel anytime — no hidden fees",
  "Email support & WhatsApp assistance",
];

const PricingTier = () => {
  const navigate = useNavigate();
  const { plan, priceUsd, formatPrice, formatUsd, showsConversion, intervalLabel, loading } = usePricing();
  const { state, isMember, ctaLabel, ctaHref } = useMembership();
  const priceLabel = priceUsd === null ? "..." : formatPrice(priceUsd);
  const oldPriceLabel = priceUsd === null ? "..." : formatPrice(priceUsd / 0.3);
  const usdLabel = priceUsd === null ? "..." : formatUsd(priceUsd);
  const payHref = plan ? `/payment?plan=${plan.id}` : "/payment";
  const primaryLabel = isMember
    ? "Manage membership"
    : state === "guest"
      ? `Get Started — ${loading ? "..." : priceLabel}`
      : `${ctaLabel} — ${loading ? "..." : priceLabel}`;
  const primaryHref = isMember ? ctaHref : payHref;

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="netflix-title text-2xl md:text-5xl text-foreground mb-1 md:mb-2">
            CHOOSE YOUR PLAN
          </h2>
          <p className="text-xs md:text-base text-muted-foreground font-medium">
            Why pay for each platform separately when you can have them all?
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-card border-2 border-primary/40 relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-xs font-bold flex items-center gap-1">
                <Sparkles size={12} /> SAVE 70%
              </div>

              <CardContent className="p-5 md:p-8 space-y-5 md:space-y-6">
                {/* Plan name & comparison */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{plan?.name ?? "StreamNetMirror Standard"}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground line-through text-lg md:text-xl">
                      {loading ? "..." : oldPriceLabel}
                    </span>
                    <span className="netflix-title text-4xl md:text-5xl text-primary">
                      {loading ? "..." : priceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {loading ? "" : intervalLabel}
                    {showsConversion && !loading && (
                      <> · <span className="text-foreground font-semibold">{usdLabel}</span> converted at today&apos;s rate</>
                    )}
                  </p>
                  <div className="mt-3">
                    <CurrencySelector />
                    <p className="text-[10px] text-muted-foreground mt-1">Pick your country to see what you would pay.</p>
                  </div>
                </div>

                {/* Comparison note */}
                <div className="bg-secondary/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Netflix Standard alone costs <span className="text-foreground font-semibold">$7.99/month</span>. 
                    With StreamNetMirror, get Netflix + 50 more platforms for a single payment.
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs md:text-sm">
                      <Check size={16} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* OTT logos */}
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider">
                    All platforms included
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {ottPlatforms.map((p) => (
                      <div key={p.name} className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                          <img
                            src={p.logo}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[9px] md:text-[10px] text-muted-foreground">{p.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center mt-2">+ 44 more platforms</p>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => navigate(primaryHref)}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-base active:scale-95 transition-transform"
                >
                  {primaryLabel}
                </Button>

                <p className="text-[9px] md:text-[10px] text-muted-foreground text-center">
                  Create your free account first, then pay to unlock the streaming portal instantly.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingTier;
