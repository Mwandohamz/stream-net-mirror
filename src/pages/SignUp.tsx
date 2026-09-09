import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, User, Lock, AlertCircle, CheckCircle2, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import CountrySelect from "@/components/CountrySelect";
import PhoneNumberField, { buildE164 } from "@/components/PhoneNumberField";
import type { WorldCountry } from "@/data/allCountries";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [name, setName] = useState(searchParams.get("name") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [country, setCountry] = useState<WorldCountry | null>(null);
  const [localPhone, setLocalPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Someone who already has a verified, signed-in account never needs this form.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);



  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneE164 = buildE164(country?.iso3, localPhone);
  const isValid =
    name.trim().length >= 2 &&
    emailValid &&
    !!country &&
    phoneE164.replace(/\D/g, "").length >= 8 &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSignUp = async () => {
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phoneE164,
            country_iso3: country?.iso3,
            country_name: country?.name,
            currency: country?.currency,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // When email confirmation is off, the account is signed in right away —
      // take them straight into their dashboard.
      if (data.session) {
        toast({ title: "Welcome!", description: "Your account is ready." });
        navigate("/dashboard", { replace: true });
        return;
      }

      setSuccess(true);
      toast({
        title: "Account created!",
        description: "Check your email to verify your account, then sign in.",
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
                  We sent a verification link to <span className="text-foreground">{email}</span>. Verify your email,
                  sign in, then choose your plan to unlock streaming.
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
                  Free to join. Choose your plan after signing in.
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
                  <Label htmlFor="su-name" className="text-foreground text-sm">Full Name</Label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="pl-9 bg-secondary border-border text-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-email" className="text-foreground text-sm">Email</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="su-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9 bg-secondary border-border text-foreground" type="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-country" className="text-foreground text-sm flex items-center gap-1.5">
                    <Globe size={14} /> Country
                  </Label>
                  <CountrySelect
                    id="su-country"
                    value={country?.iso3}
                    onChange={(c) => setCountry(c)}
                  />
                  {country && (
                    <p className="text-xs text-muted-foreground">
                      Prices will be shown in {country.currency}.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-phone" className="text-foreground text-sm">Phone Number</Label>
                  <PhoneNumberField
                    id="su-phone"
                    countryIso={country?.iso3}
                    value={localPhone}
                    onChange={setLocalPhone}
                  />
                  {country && localPhone && (
                    <p className="text-xs text-muted-foreground">Saved as {phoneE164}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-password" className="text-foreground text-sm">Password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="su-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" className="pl-9 bg-secondary border-border text-foreground" type="password" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-confirm" className="text-foreground text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="su-confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="pl-9 bg-secondary border-border text-foreground" type="password" />
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
