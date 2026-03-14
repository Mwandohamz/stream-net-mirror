import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, User, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";
import { useAppSettings } from "@/hooks/useAppSettings";

const Payment = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { settings, loading } = useAppSettings();
  const currentPrice = parseFloat(settings.base_price_zmw || "49") || 49;
  const oldPrice = Math.round(currentPrice / 0.30);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = name.trim().length >= 2 && emailValid;

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
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-muted-foreground line-through text-lg">
                    ZMW {loading ? "..." : oldPrice}
                  </span>
                  <span className="netflix-title text-4xl text-primary">
                    ZMW {loading ? "..." : currentPrice}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">One-time payment · Lifetime access · <span className="text-primary font-semibold">Save 70%</span></p>
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
                Contact onlineplagiarismremover@gmail.com for refund requests. Chargebacks may result in account suspension.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(depositId) => {
          setModalOpen(false);
          navigate(`/signup?email=${encodeURIComponent(email.trim())}&name=${encodeURIComponent(name.trim())}`);
        }}
        onFailure={(depositId, reason) => {
          console.error("Payment failed:", reason);
        }}
        userName={name.trim()}
        userEmail={email.trim()}
      />

      <Footer />
    </div>
  );
};

export default Payment;
