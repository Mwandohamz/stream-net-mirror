import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, User, Shield, Tag, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";
import { usePricing } from "@/hooks/usePricing";
import { usePlans, planIntervalLabel } from "@/hooks/usePlans";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planIdParam = searchParams.get("plan");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<null | boolean>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoChecking, setPromoChecking] = useState(false);

  const { profile } = useProfile();
  const { plans } = usePlans();
  const { plan: defaultPlan, currency, formatPrice, loading } = usePricing();

  const plan = (planIdParam && plans.find((p) => p.id === planIdParam)) || defaultPlan;
  const priceUsd = plan ? Number(plan.price_usd) : null;
  const discountedUsd = priceUsd !== null && promoValid ? priceUsd * (1 - promoDiscount / 100) : priceUsd;

  useEffect(() => {
    if (profile) {
      setName((prev) => prev || profile.full_name || "");
      setEmail((prev) => prev || profile.email || "");
    }
  }, [profile]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = name.trim().length >= 2 && emailValid && priceUsd !== null;

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoChecking(true);
    const { data } = await supabase.rpc("validate_promo_code" as any, {
      _promo_code: promoCode.trim().toUpperCase(),
    });

    const inf = Array.isArray(data) ? (data[0] as any) : null;
    if (inf) {
      setPromoValid(true);
      setPromoDiscount(inf.discount_percent);
    } else {
      setPromoValid(false);
      setPromoDiscount(0);
    }
    setPromoChecking(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </button>

          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <img src="/logo-hexagon.png" alt="StreamNetMirror" className="h-12 w-12 mx-auto mb-2" />
              <CardTitle className="netflix-title text-3xl text-foreground">GET STARTED</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your details to proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Price display */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">{plan?.name ?? "Plan"} · Total Amount</p>
                <div className="flex items-baseline justify-center gap-2 flex-wrap">
                  {promoValid && priceUsd !== null && (
                    <span className="text-muted-foreground line-through text-base">
                      {formatPrice(priceUsd)}
                    </span>
                  )}
                  <span className="netflix-title text-4xl text-primary">
                    {loading || discountedUsd === null ? "..." : formatPrice(discountedUsd)}
                  </span>
                </div>
                {discountedUsd !== null && currency !== "USD" && (
                  <p className="text-xs text-muted-foreground mt-1">≈ USD {discountedUsd.toFixed(2)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {plan ? planIntervalLabel(plan) : ""}
                  {promoValid ? <span className="text-primary font-semibold"> · {promoDiscount}% promo applied</span> : null}
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Full Name</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="pl-9 bg-secondary border-border text-foreground" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Email Address</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9 bg-secondary border-border text-foreground" type="email" />
                </div>
              </div>

              {/* Promo code - always visible */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Tag size={14} className="text-primary" />
                  <Label className="text-foreground text-sm font-semibold">Have a promo code? Enter it below for a discount!</Label>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoValid(null); }}
                      placeholder="PROMO-CODE"
                      className="pl-9 bg-secondary border-border text-foreground uppercase"
                    />
                  </div>
                  <Button variant="outline" onClick={validatePromo} disabled={promoChecking || !promoCode.trim()} className="border-primary/30 text-foreground hover:bg-primary/10">
                    {promoChecking ? "..." : "Apply"}
                  </Button>
                </div>
                {promoValid === true && (
                  <p className="text-xs text-primary flex items-center gap-1"><Check size={12} /> {promoDiscount}% discount applied!</p>
                )}
                {promoValid === false && (
                  <p className="text-xs text-destructive">Invalid or expired promo code</p>
                )}
              </div>

              <Button
                onClick={() => setModalOpen(true)}
                disabled={!isValid}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-base"
              >
                Proceed to Payment
              </Button>

              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/60">
                <Shield size={12} />
                <span>Secure payment · Your data is protected</span>
              </div>

              <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
                By completing this payment, you agree to our Terms & Conditions. Refunds are available within 7 days of purchase.
                Contact shuvaegonera@gmail.com for refund requests. Chargebacks may result in account suspension.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          if (profile) navigate("/dashboard");
          else navigate(`/signup?email=${encodeURIComponent(email.trim())}&name=${encodeURIComponent(name.trim())}`);
        }}
        onFailure={(depositId, reason) => {
          console.error("Payment failed:", reason);
        }}
        userName={name.trim()}
        userEmail={email.trim()}
        priceUsd={discountedUsd}
        planId={plan?.id}
        promoCode={promoValid ? promoCode.trim().toUpperCase() : undefined}
        discountPercent={promoValid ? promoDiscount : 0}
      />

      <Footer />
    </div>
  );
};

export default Payment;
