import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = name.trim().length >= 2 && emailValid && subject.trim().length >= 3 && message.trim().length >= 10;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-support-ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            phone: phone.trim() || undefined,
            paymentRef: paymentRef.trim() || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSuccess(true);
      toast({ title: "Ticket submitted!", description: "Our team will respond as soon as possible." });
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 flex items-center justify-center min-h-screen">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </button>

          {success ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h2 className="netflix-title text-2xl text-foreground">TICKET SUBMITTED!</h2>
                <p className="text-sm text-muted-foreground">
                  We've received your support request. Our team will respond to <strong className="text-foreground">{email}</strong> as soon as possible.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => navigate("/signin")} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                    Go to Sign In
                  </Button>
                  <Button onClick={() => { setSuccess(false); setSubject(""); setMessage(""); }} variant="outline" className="w-full border-border text-foreground">
                    Submit Another Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <HelpCircle size={24} className="text-primary" />
                </div>
                <CardTitle className="netflix-title text-2xl text-foreground">NEED HELP?</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Can't log in or create an account? Made a payment but can't access the dashboard? Submit a ticket and we'll help you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="bg-secondary border-border text-foreground" />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Email (used for payment) *</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-secondary border-border text-foreground" type="email" />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Phone Number (optional)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260..." className="bg-secondary border-border text-foreground" />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Payment Reference / Transaction ID (optional)</Label>
                  <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="e.g. deposit ID or provider ref" className="bg-secondary border-border text-foreground" />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Subject *</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" className="bg-secondary border-border text-foreground" maxLength={100} />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Message *</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue in detail... e.g. I made a payment but cannot create an account" className="bg-secondary border-border text-foreground min-h-[100px]" maxLength={2000} />
                </div>

                <Button onClick={handleSubmit} disabled={!isValid || loading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
                  {loading ? "Submitting..." : "Submit Support Ticket"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Already have an account?{" "}
                  <button onClick={() => navigate("/signin")} className="text-primary hover:underline">Sign In</button>
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Support;
