import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Lock, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import StatCard from "@/components/admin/StatCard";

interface Payment {
  name: string;
  email: string;
  amount: number;
  currency: string;
  created_at: string;
  status: string;
}

const InfluencerDashboard = () => {
  const { promoCode } = useParams<{ promoCode: string }>();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [influencer, setInfluencer] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [influencerShare, setInfluencerShare] = useState(0);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    // Match against influencers table (no Supabase auth)
    const { data, error: fetchError } = await supabase
      .from("influencers" as any)
      .select("*")
      .eq("promo_code", promoCode || "")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    const inf = data as any;

    if (fetchError || !inf) {
      setError("Invalid credentials. Check your email and promo code.");
      setLoading(false);
      return;
    }

    // Verify phone matches
    if (inf.phone && inf.phone !== phone.trim()) {
      setError("Phone number doesn't match our records.");
      setLoading(false);
      return;
    }

    setInfluencer(inf);

    // Fetch payments with this promo code
    const { data: paymentData } = await supabase
      .from("payments")
      .select("name, email, amount, currency, created_at, status, promo_code")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    const pList = ((paymentData || []) as any[]).filter((p: any) => p.promo_code === (promoCode || "")) as unknown as Payment[];
    setPayments(pList);
    const rev = pList.reduce((s, p) => s + Number(p.amount), 0);
    setTotalRevenue(rev);
    setInfluencerShare(rev * (inf.revenue_share_percent / 100));
    setAuthenticated(true);
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <Lock className="mx-auto text-primary mb-2" size={32} />
              <CardTitle className="netflix-title text-xl text-foreground">INFLUENCER DASHBOARD</CardTitle>
              <p className="text-xs text-muted-foreground">Code: <code className="text-primary">{promoCode}</code></p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">{error}</p>}
              <div className="space-y-1">
                <Label className="text-foreground text-sm">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-secondary border-border text-foreground" type="email" />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground text-sm">Phone Number (password)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260..." className="bg-secondary border-border text-foreground" />
              </div>
              <Button onClick={handleLogin} disabled={!email || loading} className="w-full bg-primary text-primary-foreground">
                {loading ? "Verifying..." : "View Dashboard"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div>
          <h1 className="netflix-title text-2xl md:text-4xl text-foreground">{influencer?.full_name}</h1>
          <p className="text-sm text-muted-foreground">Promo Code: <code className="text-primary">{promoCode}</code> · Discount: {influencer?.discount_percent}% · Revenue Share: {influencer?.revenue_share_percent}%</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard title="Total Payments" value={payments.length} icon={CreditCard} description="Using your code" />
          <StatCard title="Total Revenue" value={`ZMW ${Math.round(totalRevenue)}`} icon={TrendingUp} description="From your referrals" />
          <StatCard title="Your Earnings" value={`ZMW ${Math.round(influencerShare)}`} icon={DollarSign} description={`${influencer?.revenue_share_percent}% share`} />
        </div>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-foreground text-lg netflix-title">PAYMENT HISTORY</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No payments yet</TableCell></TableRow>
                ) : payments.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="text-foreground text-sm">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.email}</p>
                    </TableCell>
                    <TableCell className="text-foreground">{p.currency || "ZMW"} {p.amount}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center">This is a read-only dashboard. Contact admin for any changes.</p>
      </div>
    </div>
  );
};

export default InfluencerDashboard;
