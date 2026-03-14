import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { validateAdminEmail } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAdmin();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSubmitting(true);

    try {
      const normalizedEmail = loginEmail.trim().toLowerCase();

      const isValidAdmin = await validateAdminEmail(normalizedEmail);
      if (!isValidAdmin) {
        setLoginError("This email is not authorized for admin access.");
        setLoginSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
        setLoginSubmitting(false);
        return;
      }

      toast({ title: "Welcome back!", description: "Redirecting to dashboard..." });
      navigate("/admin", { replace: true });
    } catch {
      setLoginError("An unexpected error occurred.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }

    setRegSubmitting(true);

    try {
      const normalizedEmail = regEmail.trim().toLowerCase();

      const isValidAdmin = await validateAdminEmail(normalizedEmail);
      if (!isValidAdmin) {
        setRegError("This email is not authorized for admin access.");
        setRegSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: regPassword,
        options: { data: { full_name: regName } },
      });

      if (error) {
        setRegError(error.message);
        setRegSubmitting(false);
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account, then sign in.",
      });
    } catch {
      setRegError("An unexpected error occurred.");
    } finally {
      setRegSubmitting(false);
    }
  };

  // Show form immediately once loading resolves (don't block on admin check for the login page itself)
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-card border-border">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="netflix-title text-2xl text-foreground">ADMIN PORTAL</CardTitle>
          <CardDescription className="text-muted-foreground">Authorized personnel only</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Email</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@example.com" className="bg-secondary border-border text-foreground" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Password</Label>
                  <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="bg-secondary border-border text-foreground" required />
                </div>
                {loginError && <p className="text-destructive text-sm">{loginError}</p>}
                <Button type="submit" disabled={loginSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                  {loginSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Full Name</Label>
                  <Input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your name" className="bg-secondary border-border text-foreground" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Email</Label>
                  <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="admin@example.com" className="bg-secondary border-border text-foreground" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Password</Label>
                  <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min 6 characters" className="bg-secondary border-border text-foreground" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Confirm Password</Label>
                  <Input type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Repeat password" className="bg-secondary border-border text-foreground" required />
                </div>
                {regError && <p className="text-destructive text-sm">{regError}</p>}
                <Button type="submit" disabled={regSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                  {regSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create Account</span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
