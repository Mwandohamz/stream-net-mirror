import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthShell from "@/components/AuthShell";

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const safeNext = nextParam && /^\/(?!\/)/.test(nextParam) ? nextParam : null;
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Anyone already signed in goes straight to their dashboard — paid or not.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      if (safeNext) {
        window.location.href = safeNext;
        return;
      }
      navigate("/dashboard", { replace: true });
    });
  }, [navigate, safeNext]);


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
        if (safeNext) {
          window.location.href = safeNext;
          return;
        }
        navigate("/dashboard", { replace: true });
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell onBack={() => navigate("/")} title="Welcome back" description="Sign in to your Stream NetMirror account">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
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
                <Label htmlFor="signin-email" className="text-foreground text-sm">Email address</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="signin-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-lg bg-secondary pl-10 pr-4 text-foreground" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" enterKeyHint="next" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-foreground text-sm">Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="h-12 rounded-lg bg-secondary pl-10 pr-12 text-foreground"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1 h-10 w-10 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
                <div className="text-right">
                  <button onClick={() => navigate("/forgot-password")} className="text-xs text-primary hover:underline">
                    Forgot your password?
                  </button>
                </div>
              </div>

              <Button onClick={handleSignIn} disabled={!email || !password || loading} className="h-12 w-full rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/80">
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
      </motion.div>
    </AuthShell>
  );
};

export default SignIn;
