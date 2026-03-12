import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, user, isAdmin, loading } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already admin
  if (!loading && user && isAdmin) {
    navigate("/admin", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    // Check will happen via useAdmin hook redirect
    setTimeout(() => {
      setSubmitting(false);
      navigate("/admin");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-card border-border">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="netflix-title text-2xl text-foreground">ADMIN LOGIN</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
