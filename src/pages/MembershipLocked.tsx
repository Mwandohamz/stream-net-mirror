import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, LogOut, LifeBuoy, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { planIntervalLabel } from "@/hooks/usePlans";
import { usePricing } from "@/hooks/usePricing";
import { useProfile } from "@/hooks/useProfile";
import CurrencySelector from "@/components/CurrencySelector";
import type { SubscriptionRecord } from "@/hooks/useSubscriber";

const perks = [
  "Netflix, Disney+, HBO Max, Prime, Apple TV+ and more",
  "Android APK download plus web and laptop access",
  "Fresh backup links whenever a link stops working",
  "Support desk inside your dashboard",
];

const MembershipLocked = ({ subscription }: { subscription?: SubscriptionRecord | null }) => {
  const navigate = useNavigate();
  const { plans, currency, formatPrice, formatUsd, loading: pricingLoading } = usePricing();
  const { profile } = useProfile();

  const plansLoading = pricingLoading;
  const fxLoading = pricingLoading;
  const expired = !!subscription;

  const priceLabel = (priceUsd: number) => formatPrice(priceUsd);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center mx-auto">
              {expired ? <AlertTriangle size={26} className="text-primary" /> : <Lock size={24} className="text-primary" />}
            </div>
            <h1 className="netflix-title text-3xl text-foreground">
              {expired ? "YOUR SUBSCRIPTION HAS ENDED" : "CHOOSE YOUR PLAN"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {expired
                ? "Renew below to switch your streaming links back on. Your account and history stay exactly as they were."
                : "Your account is ready. Pick a plan to unlock the streaming portal and app downloads."}
            </p>
            <div className="flex flex-col items-center gap-1">
              <CurrencySelector />
              <p className="text-[11px] text-muted-foreground">
                Prices shown in {currency}
                {profile?.country_name ? ` · your account country is ${profile.country_name}` : ""}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(plansLoading || fxLoading) && (
              <Card className="bg-card border-border sm:col-span-2">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading plans…</CardContent>
              </Card>
            )}

            {!plansLoading && plans.length === 0 && (
              <Card className="bg-card border-border sm:col-span-2">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No plans are available right now. Please contact support.
                </CardContent>
              </Card>
            )}

            {!plansLoading &&
              plans.map((plan) => (
                <Card key={plan.id} className="bg-card border-border flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="netflix-title text-xl text-foreground">{plan.name}</CardTitle>
                      <Badge className="bg-primary/15 text-primary border-primary/30">{planIntervalLabel(plan)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    <div>
                      <p className="text-3xl font-bold text-foreground">{priceLabel(Number(plan.price_usd))}</p>
                      {currency !== "USD" && (
                        <p className="text-xs text-muted-foreground">≈ {formatUsd(Number(plan.price_usd))}</p>
                      )}
                      {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
                    </div>
                    <Button
                      onClick={() => navigate(`/payment?plan=${plan.id}`)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-semibold mt-auto"
                    >
                      {expired ? "Renew Now" : "Get Access"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-2">
              {perks.map((perk) => (
                <div key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 size={15} className="text-primary mt-0.5 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/support")} className="gap-2">
              <LifeBuoy size={15} /> Contact Support
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="gap-2 text-muted-foreground">
              <LogOut size={15} /> Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default MembershipLocked;
