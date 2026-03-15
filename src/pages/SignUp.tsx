import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [name, setName] = useState(searchParams.get("name") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = name.trim().length >= 2 && emailValid && password.length >= 6 && password === confirmPassword;

  const handleSignUp = async () => {
    setError("");
    setLoading(true);

    try {
      // Check if this email has a completed payment
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("id, status, email, name, phone")
        .eq("email", email.trim().toLowerCase())
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentError || !payment) {
        setError("No completed payment found for this email. Please complete payment first.");
        setLoading(false);
        return;
      }

      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Insert subscriber record
        await supabase.from("subscribers" as any).insert({
          user_id: authData.user.id,
          email: email.trim().toLowerCase(),
          phone: payment.phone,
          name: name.trim(),
          payment_id: payment.id,
          status: "active",
        } as any);
      }

      setSuccess(true);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account, then sign in.",
      });
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
                <h2 className="netflix-title text-2xl text-foreground">ACCOUNT CREATED!</h2>
                <p className="text-sm text-muted-foreground">
                  Please check your email to verify your account. Once verified, you can sign in to access the streaming portal.
                </p>
                <Button onClick={() => navigate("/signin")} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                  Go to Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <img src="/logo-hexagon.png" alt="StreamNetMirror" className="h-12 w-12 mx-auto mb-2" />
                <CardTitle className="netflix-title text-2xl text-foreground">CREATE ACCOUNT</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Use the email you paid with to create your account
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
                  <Label className="text-foreground text-sm">Full Name</Label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="pl-9 bg-secondary border-border text-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Email (used for payment)</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9 bg-secondary border-border text-foreground" type="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-9 bg-secondary border-border text-foreground" type="password" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="pl-9 bg-secondary border-border text-foreground" type="password" />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords don't match</p>
                  )}
                </div>

                <Button onClick={handleSignUp} disabled={!isValid || loading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Already have an account?{" "}
                  <button onClick={() => navigate("/signin")} className="text-primary hover:underline">Sign In</button>
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Having trouble?{" "}
                  <button onClick={() => navigate("/support")} className="text-primary hover:underline">Contact Support</button>
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

export default SignUp;
