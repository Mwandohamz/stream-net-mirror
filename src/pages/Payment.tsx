import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Phone, User, Shield, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Provider = "airtel" | "mtn" | null;
type Step = "form" | "processing" | "success";

const Payment = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<Provider>(null);
  const [step, setStep] = useState<Step>("form");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = name.trim().length >= 2 && emailValid && phone.trim().length >= 9 && provider;

  const handleSubmit = async () => {
    if (!isValid) return;
    setStep("processing");

    // Store payment in database
    try {
      await supabase.from("payments").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        provider: provider!,
        amount: 49,
        status: "pending",
        transaction_id: `TXN-${Date.now()}`,
      });
    } catch (e) {
      console.error("Payment insert error:", e);
    }

    // Simulate payment processing (replace with real gateway)
    setTimeout(async () => {
      try {
        await supabase
          .from("payments")
          .update({ status: "completed" } as any)
          .eq("phone", phone.trim())
          .eq("status", "pending");
      } catch (e) {
        console.error("Payment update error:", e);
      }
      setStep("success");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 flex items-center justify-center min-h-screen">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <button onClick={() => navigate("/")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Home
              </button>

              <Card className="bg-card border-border">
                <CardHeader className="text-center">
                  <img src="/logo-hexagon.png" alt="Stream Net Mirror" className="h-12 w-12 mx-auto mb-2" />
                  <CardTitle className="netflix-title text-3xl text-foreground">COMPLETE PAYMENT</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    One-time payment for unlimited streaming access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Price display */}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="netflix-title text-4xl text-primary">ZMW 49</p>
                    <p className="text-xs text-muted-foreground mt-1">One-time payment · Instant access</p>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Full Name</Label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-9 bg-secondary border-border text-foreground"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Email Address</Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pl-9 bg-secondary border-border text-foreground"
                        type="email"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Phone Number</Label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 097XXXXXXX"
                        className="pl-9 bg-secondary border-border text-foreground"
                        type="tel"
                      />
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Mobile Money Provider</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setProvider("airtel")}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          provider === "airtel"
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="font-semibold text-foreground text-sm">Airtel Money</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Airtel Zambia</p>
                      </button>
                      <button
                        onClick={() => setProvider("mtn")}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          provider === "mtn"
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="font-semibold text-foreground text-sm">MTN MoMo</p>
                        <p className="text-xs text-muted-foreground mt-0.5">MTN Zambia</p>
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-base"
                  >
                    Pay ZMW 49 Now
                  </Button>

                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/60">
                    <Shield size={12} />
                    <span>Secure payment · Your data is protected</span>
                  </div>

                  <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
                    By completing this payment, you agree to our Terms & Conditions. Refunds are available within 7 days of purchase.
                    Contact onlineplagiarismremover@gmail.com for refund requests. Chargebacks may result in account suspension.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
              <h2 className="netflix-title text-3xl text-foreground mb-2">PROCESSING PAYMENT</h2>
              <p className="text-muted-foreground">
                Please check your phone and approve the {provider === "airtel" ? "Airtel Money" : "MTN MoMo"} payment request...
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-green-500" />
              </div>
              <h2 className="netflix-title text-4xl text-foreground mb-2">PAYMENT SUCCESSFUL!</h2>
              <p className="text-muted-foreground mb-6">
                Your payment of ZMW 49 has been received. You now have unlimited access to Stream Net Mirror.
              </p>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold"
                onClick={() => navigate("/access")}
              >
                Access Streaming Portal
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
