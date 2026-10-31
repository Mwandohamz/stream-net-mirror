import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthShell from "@/components/AuthShell";
import { emailVerificationUrl, verificationDestination } from "@/lib/emailVerification";
import { isNativeApp } from "@/lib/native";
import { startNativeSession } from "@/lib/nativeSession";

// Landing page for email verification links. Supabase appends error details to
// the redirect URL when a one-time token is missing/expired/already used (for
// example after a resend invalidated the earlier link). Instead of leaving the
// user on a dead error page, explain what happened and offer a fresh link.
const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const destination = verificationDestination(searchParams.get("next"));
  const signInUrl = destination === "/dashboard" ? "/signin" : `/signin?next=${encodeURIComponent(destination)}`;
  const { toast } = useToast();
  const [email, setEmail] = useState(typeof location.state?.email === "string" ? location.state.email : "");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Supabase puts errors in the hash (#error=...&error_description=...) or query.
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode =
    searchParams.get("error_code") || hashParams.get("error_code") || searchParams.get("error") || hashParams.get("error");
  const errorDescription =
    searchParams.get("error_description") || hashParams.get("error_description") || "";

  useEffect(() => {
    let active = true;
    const enter = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (active && user?.email_confirmed_at && !errorCode) navigate(destination, { replace: true });
      } catch { /* Leave code/resend available if the link failed. */ }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.setTimeout(() => { if (active) void enter(); }, 0);
    });
    void enter();
    return () => { active = false; subscription.unsubscribe(); };
  }, [navigate, destination, errorCode]);

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !/^\d{6,8}$/.test(code) || verifying) return;
    setVerifying(true);
    setCodeError("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(), token: code, type: "signup",
      });
      if (error) { setCodeError(error.message); return; }
      if (!data.session || !data.user?.email_confirmed_at) {
        setCodeError("Please request a new code and try again.");
        return;
      }
      if (isNativeApp()) startNativeSession(data.user.id);
      navigate(destination, { replace: true });
    } catch {
      setCodeError("Could not verify your email. Please try again.");
    } finally { setVerifying(false); }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: emailVerificationUrl(window.location.origin, destination) },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setResent(true);
        toast({ title: "New link sent", description: "Check your inbox — use the newest email only." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send a new verification link", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell onBack={() => navigate(signInUrl)} title="Verify your email" description="Open the email link or enter your verification code">
      <div className="space-y-5">
        {errorCode && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-destructive">
              {errorDescription
                ? errorDescription
                : "This verification link has expired or was already replaced by a newer one."}
            </p>
            <p className="text-xs text-muted-foreground">
              Every time a new verification email is sent, older links stop working. Request a fresh link below and use
              the newest email in your inbox.
            </p>
            {errorCode && <p className="text-[10px] text-muted-foreground/70">Code: {errorCode}</p>}
          </div>
        </div>}

        {resent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              We sent a new verification email to <span className="text-foreground">{email}</span>. Use its link or code.
            </p>
            <Button onClick={() => navigate(signInUrl)} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
              Go to Sign In
            </Button>
          </div>
        ) : null}
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-email" className="text-foreground text-sm">Email address</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="verify-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-lg bg-secondary pl-10 pr-4 text-foreground"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  enterKeyHint="next"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-code">Verification code</Label>
              <Input id="verify-code" name="verification-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="Code from your email" className="h-12" />
            </div>
            {codeError && <p role="alert" className="text-sm text-destructive">{codeError}</p>}
            <Button type="submit" disabled={!email.trim() || !/^\d{6,8}$/.test(code) || verifying || resending} className="h-12 w-full">{verifying ? "Verifying..." : "Verify email"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={!email.trim() || resending || verifying}
              className="h-12 w-full rounded-lg"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already verified?{" "}
              <Button type="button" variant="link" onClick={() => navigate(signInUrl)}>Sign In</Button>
            </p>
          </form>
      </div>
    </AuthShell>
  );
};

export default VerifyEmail;
