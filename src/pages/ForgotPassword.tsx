import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
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
          <button onClick={() => navigate("/signin")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Sign In
          </button>

          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <img src="/logo-hexagon.png" alt="StreamNetMirror" className="h-12 w-12 mx-auto mb-2" />
              <CardTitle className="netflix-title text-2xl text-foreground">RESET PASSWORD</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {success ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Check your email for a password reset link. It may take a minute to arrive.
                  </p>
                  <Button onClick={() => navigate("/signin")} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Email</Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pl-9 bg-secondary border-border text-foreground"
                        type="email"
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!email || loading}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
