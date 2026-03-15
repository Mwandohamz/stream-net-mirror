import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/signin"), 2000);
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
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <img src="/logo-hexagon.png" alt="StreamNetMirror" className="h-12 w-12 mx-auto mb-2" />
              <CardTitle className="netflix-title text-2xl text-foreground">SET NEW PASSWORD</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {success ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <p className="text-sm text-foreground font-medium">Password updated successfully!</p>
                  <p className="text-xs text-muted-foreground">Redirecting to sign in...</p>
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
                    <Label className="text-foreground text-sm">New Password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="pl-9 bg-secondary border-border text-foreground"
                        type="password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="pl-9 bg-secondary border-border text-foreground"
                        type="password"
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords don't match</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!password || !confirmPassword || loading}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold"
                  >
                    {loading ? "Updating..." : "Update Password"}
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

export default ResetPassword;
