import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";
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
  "Lifetime access — no recurring fees",
  "Email support & WhatsApp assistance",
];

const PricingTier = () => {
  const navigate = useNavigate();
  const { settings, loading } = useAppSettings();
  const currentPrice = parseFloat(settings.base_price_zmw || "49") || 49;
  const oldPrice = Math.round(currentPrice / 0.30);

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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">StreamNetMirror Standard</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground line-through text-lg md:text-xl">
                      ZMW {loading ? "..." : oldPrice}
                    </span>
                    <span className="netflix-title text-4xl md:text-5xl text-primary">
                      ZMW {loading ? "..." : currentPrice}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    One-time payment · <span className="text-primary font-semibold">Lifetime access</span>
                  </p>
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
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
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
                  onClick={() => navigate("/payment")}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-base active:scale-95 transition-transform"
                >
                  Get Started — ZMW {loading ? "..." : currentPrice}
                </Button>

                <p className="text-[9px] md:text-[10px] text-muted-foreground text-center">
                  After payment, you'll receive login details via email and can create your account to access the streaming portal.
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
