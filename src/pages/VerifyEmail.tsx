import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthShell from "@/components/AuthShell";
import { emailVerificationUrl, verificationDestination } from "@/lib/emailVerification";

// Landing page for email verification links. Supabase appends error details to
// the redirect URL when a one-time token is missing/expired/already used (for
// example after a resend invalidated the earlier link). Instead of leaving the
// user on a dead error page, explain what happened and offer a fresh link.
const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destination = verificationDestination(searchParams.get("next"));
  const signInUrl = destination === "/dashboard" ? "/signin" : `/signin?next=${encodeURIComponent(destination)}`;
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Supabase puts errors in the hash (#error=...&error_description=...) or query.
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode =
    searchParams.get("error_code") || hashParams.get("error_code") || searchParams.get("error") || hashParams.get("error");
  const errorDescription =
    searchParams.get("error_description") || hashParams.get("error_description") || "";

  useEffect(() => {
    // If the link actually worked, a session exists — go straight in.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !errorCode) navigate(destination, { replace: true });
    });
  }, [navigate, destination, errorCode]);

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
    <AuthShell onBack={() => navigate(signInUrl)} title="Verification link problem" description="This link is no longer valid">
      <div className="space-y-5">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
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
        </div>

        {resent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              We sent a new verification link to <span className="text-foreground">{email}</span>. Open the newest
              email and click its link.
            </p>
            <Button onClick={() => navigate(signInUrl)} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
              Go to Sign In
            </Button>
          </div>
        ) : (
          <>
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
                  enterKeyHint="go"
                  onKeyDown={(e) => e.key === "Enter" && handleResend()}
                />
              </div>
            </div>
            <Button
              onClick={handleResend}
              disabled={!email.trim() || resending}
              className="h-12 w-full rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/80"
            >
              {resending ? "Sending..." : "Send me a new link"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already verified?{" "}
              <button onClick={() => navigate(signInUrl)} className="text-primary hover:underline">Sign In</button>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default VerifyEmail;
