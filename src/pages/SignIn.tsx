import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from("subscribers")
          .select("id, status")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .maybeSingle();
        if (data) {
          navigate("/dashboard", { replace: true });
          return;
        }
        try {
          const { data: adminData } = await supabase.functions.invoke("validate-admin-email", {
            body: { email: session.user.email },
          });
          if (adminData?.valid) {
            navigate("/dashboard", { replace: true });
            return;
          }
        } catch {}
      }
    });
  }, [navigate]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Verification email sent", description: "Check your inbox for the verification link." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to resend verification email", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const handleSignIn = async () => {
    setError("");
    setShowResendVerification(false);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
        if (authError.message.toLowerCase().includes("email not confirmed")) {
          setShowResendVerification(true);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: sub } = await supabase
          .from("subscribers")
          .select("id, status")
          .eq("user_id", data.user.id)
          .eq("status", "active")
          .maybeSingle();

        if (sub) {
          navigate("/dashboard", { replace: true });
          return;
        }

        try {
          const { data: adminData } = await supabase.functions.invoke("validate-admin-email", {
            body: { email: data.user.email },
          });
          if (adminData?.valid) {
            navigate("/dashboard", { replace: true });
            return;
          }
        } catch {}

        setError("No active subscription found. Please complete payment first, then create your account.");
        await supabase.auth.signOut();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
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

          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <img src="/logo-hexagon.png" alt="StreamNetMirror" className="h-12 w-12 mx-auto mb-2" />
              <CardTitle className="netflix-title text-2xl text-foreground">SIGN IN</CardTitle>
              <CardDescription className="text-muted-foreground">
                Access your StreamNetMirror account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-destructive">{error}</p>
                    {showResendVerification && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground mb-1">Your email isn't verified yet.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleResendVerification}
                          disabled={resending}
                          className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          {resending ? "Sending..." : "Resend verification email"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-foreground text-sm">Email</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9 bg-secondary border-border text-foreground" type="email" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm">Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="pl-9 bg-secondary border-border text-foreground"
                    type="password"
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  />
                </div>
                <div className="text-right">
                  <button onClick={() => navigate("/forgot-password")} className="text-xs text-primary hover:underline">
                    Forgot your password?
                  </button>
                </div>
              </div>

              <Button onClick={handleSignIn} disabled={!email || !password || loading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="space-y-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={() => navigate("/signup")} className="text-primary hover:underline">Create Account</button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Haven't paid yet?{" "}
                  <button onClick={() => navigate("/payment")} className="text-primary hover:underline">Complete Payment</button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Paid but can't log in?{" "}
                  <button onClick={() => navigate("/support")} className="text-primary hover:underline">Get Help</button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default SignIn;
