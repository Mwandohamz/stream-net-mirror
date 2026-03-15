import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, ToggleLeft, ToggleRight, DollarSign, Users, TrendingUp } from "lucide-react";
import StatCard from "@/components/admin/StatCard";

interface Influencer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  promo_code: string;
  discount_percent: number;
  revenue_share_percent: number;
  is_active: boolean;
  created_at: string;
}

interface InfluencerStats {
  totalPayments: number;
  totalRevenue: number;
  influencerShare: number;
}

const Influencers = () => {
  const { toast } = useToast();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [stats, setStats] = useState<Record<string, InfluencerStats>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", discount_percent: "10", revenue_share_percent: "20" });
  const [saving, setSaving] = useState(false);

  // Aggregate stats
  const [totalInfluencerRevenue, setTotalInfluencerRevenue] = useState(0);
  const [totalOrganicRevenue, setTotalOrganicRevenue] = useState(0);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: inf } = await supabase.from("influencers" as any).select("*").order("created_at", { ascending: false });
    const influencerList = (inf || []) as unknown as Influencer[];
    setInfluencers(influencerList);

    // Fetch all completed payments
    const { data: payments } = await supabase.from("payments").select("amount, promo_code, discount_applied, status").eq("status", "completed");
    const allPayments = payments || [];

    const statsMap: Record<string, InfluencerStats> = {};
    let infRev = 0;
    let orgRev = 0;

    for (const inf of influencerList) {
      const matching = allPayments.filter((p: any) => p.promo_code === inf.promo_code);
      const revenue = matching.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const share = revenue * (inf.revenue_share_percent / 100);
      statsMap[inf.id] = { totalPayments: matching.length, totalRevenue: revenue, influencerShare: share };
      infRev += revenue;
    }

    orgRev = allPayments.filter((p: any) => !p.promo_code).reduce((s: number, p: any) => s + Number(p.amount), 0);
    setStats(statsMap);
    setTotalInfluencerRevenue(infRev);
    setTotalOrganicRevenue(orgRev);
    setLoading(false);
  };

  const generatePromoCode = (name: string) => {
    return name.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");
  };

  const handleAdd = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setSaving(true);
    const promoCode = generatePromoCode(form.full_name);

    const { error } = await supabase.from("influencers" as any).insert({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      promo_code: promoCode,
      discount_percent: parseFloat(form.discount_percent) || 10,
      revenue_share_percent: parseFloat(form.revenue_share_percent) || 20,
      is_active: true,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Influencer added", description: `Promo code: ${promoCode}` });
      setForm({ full_name: "", email: "", phone: "", discount_percent: "10", revenue_share_percent: "20" });
      setShowForm(false);
      fetchAll();
    }
    setSaving(false);
  };

  const toggleActive = async (inf: Influencer) => {
    await supabase.from("influencers" as any).update({ is_active: !inf.is_active } as any).eq("id", inf.id);
    fetchAll();
  };

  const deleteInfluencer = async (id: string) => {
    await supabase.from("influencers" as any).delete().eq("id", id);
    fetchAll();
    toast({ title: "Influencer removed" });
  };

  const copyLink = (promoCode: string) => {
    const link = `https://streamnetmirror.fantasypromaster.fun/influencer/${promoCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: link });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="netflix-title text-3xl text-foreground">INFLUENCERS</h1>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground gap-1">
            <Plus size={16} /> Add Influencer
          </Button>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard title="Total Influencers" value={influencers.length} icon={Users} description="Active & inactive" />
          <StatCard title="Influencer Revenue" value={`ZMW ${Math.round(totalInfluencerRevenue)}`} icon={TrendingUp} description="From promo codes" />
          <StatCard title="Organic Revenue" value={`ZMW ${Math.round(totalOrganicRevenue)}`} icon={DollarSign} description="No promo code" />
        </div>

        {/* Add form */}
        {showForm && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-foreground text-lg">New Influencer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" className="bg-secondary border-border text-foreground" />
                  {form.full_name && <p className="text-[10px] text-muted-foreground">Code: {generatePromoCode(form.full_name)}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Email *</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="bg-secondary border-border text-foreground" type="email" />
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+260..." className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Discount %</Label>
                  <Input value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="10" className="bg-secondary border-border text-foreground" type="number" />
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Revenue Share %</Label>
                  <Input value={form.revenue_share_percent} onChange={(e) => setForm({ ...form, revenue_share_percent: e.target.value })} placeholder="20" className="bg-secondary border-border text-foreground" type="number" />
                </div>
              </div>
              <Button onClick={handleAdd} disabled={saving || !form.full_name.trim() || !form.email.trim()} className="bg-primary text-primary-foreground">
                {saving ? "Saving..." : "Add Influencer"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Rev Share</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Their Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                ) : influencers.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No influencers yet</TableCell></TableRow>
                ) : influencers.map((inf) => {
                  const s = stats[inf.id] || { totalPayments: 0, totalRevenue: 0, influencerShare: 0 };
                  return (
                    <TableRow key={inf.id}>
                      <TableCell>
                        <div>
                          <p className="text-foreground font-medium text-sm">{inf.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{inf.email}</p>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-primary text-xs">{inf.promo_code}</code></TableCell>
                      <TableCell className="text-foreground">{inf.discount_percent}%</TableCell>
                      <TableCell className="text-foreground">{inf.revenue_share_percent}%</TableCell>
                      <TableCell className="text-foreground">{s.totalPayments}</TableCell>
                      <TableCell className="text-foreground">ZMW {Math.round(s.totalRevenue)}</TableCell>
                      <TableCell className="text-primary font-medium">ZMW {Math.round(s.influencerShare)}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${inf.is_active ? "text-primary" : "text-destructive"}`}>
                          {inf.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => toggleActive(inf)} title={inf.is_active ? "Deactivate" : "Activate"}>
                            {inf.is_active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => copyLink(inf.promo_code)} title="Copy dashboard link">
                            <Copy size={14} className="text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteInfluencer(inf.id)} title="Delete">
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Influencers;
