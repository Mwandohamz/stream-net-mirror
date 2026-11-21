import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Copy, ToggleLeft, ToggleRight, DollarSign, Users, TrendingUp, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatCard from "@/components/admin/StatCard";
import { getAdminCache, setAdminCache } from "@/lib/adminCache";
import PhoneInput, { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

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

interface CachedInfluencers {
  influencers: Influencer[];
  stats: Record<string, InfluencerStats>;
  influencerRevenue: number;
  organicRevenue: number;
}

const CACHE_KEY = "admin:influencers";

export const normalizePromo = (v: string) => v.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");
export const isValidPromo = (v: string) => /^[A-Z0-9-]{3,30}$/.test(v);

const Influencers = () => {
  const { toast } = useToast();
  const cached = getAdminCache<CachedInfluencers>(CACHE_KEY);
  const [influencers, setInfluencers] = useState<Influencer[]>(cached?.influencers ?? []);
  const [stats, setStats] = useState<Record<string, InfluencerStats>>(cached?.stats ?? {});
  const [loading, setLoading] = useState(!cached);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" as string | undefined, discount_percent: "10", revenue_share_percent: "20", promo_code: "" });
  const [editTarget, setEditTarget] = useState<Influencer | null>(null);
  const [edit, setEdit] = useState({ full_name: "", email: "", phone: "", promo_code: "", discount_percent: "", revenue_share_percent: "", is_active: true });
  const [deleteTarget, setDeleteTarget] = useState<Influencer | null>(null);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [pwTarget, setPwTarget] = useState<Influencer | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [totalInfluencerRevenue, setTotalInfluencerRevenue] = useState(cached?.influencerRevenue ?? 0);
  const [totalOrganicRevenue, setTotalOrganicRevenue] = useState(cached?.organicRevenue ?? 0);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    if (!getAdminCache(CACHE_KEY)) setLoading(true);
    const { data: inf } = await supabase.from("influencers" as any).select("*").order("created_at", { ascending: false });
    const influencerList = (inf || []) as unknown as Influencer[];
    setInfluencers(influencerList);

    const { data: payments } = await supabase.from("payments").select("amount, promo_code, discount_applied, status").eq("status", "completed");
    const allPayments = payments || [];

    const statsMap: Record<string, InfluencerStats> = {};
    let infRev = 0;

    for (const inf of influencerList) {
      const matching = allPayments.filter((p: any) => p.promo_code === inf.promo_code);
      const revenue = matching.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const share = revenue * (inf.revenue_share_percent / 100);
      statsMap[inf.id] = { totalPayments: matching.length, totalRevenue: revenue, influencerShare: share };
      infRev += revenue;
    }

    const orgRev = allPayments.filter((p: any) => !p.promo_code).reduce((s: number, p: any) => s + Number(p.amount), 0);
    setStats(statsMap);
    setTotalInfluencerRevenue(infRev);
    setTotalOrganicRevenue(orgRev);
    setAdminCache<CachedInfluencers>(CACHE_KEY, {
      influencers: influencerList,
      stats: statsMap,
      influencerRevenue: infRev,
      organicRevenue: orgRev,
    });
    setLoading(false);
  };

  const generatePromoCode = (name: string) => {
    return name.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");
  };

  const handleAdd = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setPhoneError("");

    let normalizedPhone: string | null = null;
    if (form.phone) {
      if (!isValidPhoneNumber(form.phone)) {
        setPhoneError("Please enter a valid phone number including country code");
        return;
      }
      normalizedPhone = parsePhoneNumber(form.phone)?.format("E.164") || form.phone;
    }

    setSaving(true);
    const promoCode = normalizePromo(form.promo_code) || generatePromoCode(form.full_name);
    if (!isValidPromo(promoCode)) { toast({ title: "Invalid promo code", description: "Use 3-30 letters, numbers or dashes.", variant: "destructive" }); setSaving(false); return; }
    if (influencers.some((i) => i.promo_code.toUpperCase() === promoCode)) { toast({ title: "Promo code taken", description: "Choose a different code.", variant: "destructive" }); setSaving(false); return; }

    const { error } = await supabase.from("influencers" as any).insert({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: normalizedPhone,
      promo_code: promoCode,
      discount_percent: parseFloat(form.discount_percent) || 10,
      revenue_share_percent: parseFloat(form.revenue_share_percent) || 20,
      is_active: true,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Influencer added", description: `Promo code: ${promoCode}` });
      setForm({ full_name: "", email: "", phone: "", discount_percent: "10", revenue_share_percent: "20", promo_code: "" });
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
    const { error } = await supabase.from("influencers" as any).delete().eq("id", id);
    setDeleteTarget(null);
    if (error) { toast({ title: "Could not delete", description: error.message, variant: "destructive" }); return; }
    fetchAll();
    toast({ title: "Influencer removed" });
  };

  const openEdit = (inf: Influencer) => {
    setEditTarget(inf);
    setEdit({ full_name: inf.full_name, email: inf.email, phone: (inf as any).phone ?? "", promo_code: inf.promo_code, discount_percent: String(inf.discount_percent), revenue_share_percent: String(inf.revenue_share_percent), is_active: inf.is_active });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const code = normalizePromo(edit.promo_code);
    if (!edit.full_name.trim() || !edit.email.trim()) { toast({ title: "Name and email are required", variant: "destructive" }); return; }
    if (!isValidPromo(code)) { toast({ title: "Invalid promo code", description: "Use 3-30 letters, numbers or dashes.", variant: "destructive" }); return; }
    if (influencers.some((i) => i.id !== editTarget.id && i.promo_code.toUpperCase() === code)) { toast({ title: "Promo code taken", description: "Choose a different code.", variant: "destructive" }); return; }
    let phone: string | null = edit.phone?.trim() || null;
    if (phone) {
      if (!isValidPhoneNumber(phone)) { toast({ title: "Invalid phone number", variant: "destructive" }); return; }
      phone = parsePhoneNumber(phone)?.format("E.164") || phone;
    }
    const discount = Number(edit.discount_percent), share = Number(edit.revenue_share_percent);
    if (!(discount >= 0 && discount <= 100) || !(share >= 0 && share <= 100)) { toast({ title: "Percentages must be 0-100", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("influencers" as any).update({
      full_name: edit.full_name.trim(), email: edit.email.trim().toLowerCase(), phone, promo_code: code,
      discount_percent: discount, revenue_share_percent: share, is_active: edit.is_active,
    } as any).eq("id", editTarget.id);
    setSaving(false);
    if (error) { toast({ title: "Could not save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Influencer updated" });
    setEditTarget(null);
    fetchAll();
  };

  const savePassword = async () => {
    if (!pwTarget || newPassword.length < 8) return;
    setSavingPw(true);
    const { error } = await supabase.rpc("set_influencer_password" as any, {
      _influencer_id: pwTarget.id,
      _password: newPassword,
    });
    setSavingPw(false);
    if (error) {
      toast({ title: "Could not set password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password set", description: `Share it privately with ${pwTarget.full_name}.` });
    setPwTarget(null);
    setNewPassword("");
  };

  const copyLink = (promoCode: string) => {
    const link = `https://stream-net-mirror.lovable.app/influencer/${promoCode}`;
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard title="Total Influencers" value={influencers.length} icon={Users} description="Active & inactive" />
          <StatCard title="Influencer Revenue" value={`ZMW ${Math.round(totalInfluencerRevenue)}`} icon={TrendingUp} description="From promo codes" />
          <StatCard title="Organic Revenue" value={`ZMW ${Math.round(totalOrganicRevenue)}`} icon={DollarSign} description="No promo code" />
        </div>

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
                  <PhoneInput
                    international
                    defaultCountry="ZM"
                    value={form.phone}
                    onChange={(val) => { setForm({ ...form, phone: val }); setPhoneError(""); }}
                    className="phone-input-dark"
                  />
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Discount %</Label>
                  <Input value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="10" className="bg-secondary border-border text-foreground" type="number" />
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Promo code</Label>
                  <Input value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} placeholder={generatePromoCode(form.full_name) || "Auto from name"} className="bg-secondary border-border text-foreground" maxLength={30} />
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
                          <Button variant="ghost" size="icon" onClick={() => { setPwTarget(inf); setNewPassword(""); }} title="Set dashboard password">
                            <KeyRound size={14} className="text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => copyLink(inf.promo_code)} title="Copy dashboard link">
                            <Copy size={14} className="text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(inf)} title="Edit">
                            <Pencil size={14} className="text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(inf)} title="Delete">
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

        <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Edit influencer</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label>Full name</Label><Input value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} maxLength={100} /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} maxLength={255} /></div>
              <div className="space-y-1"><Label>Phone</Label><PhoneInput international defaultCountry="ZM" value={edit.phone || undefined} onChange={(v) => setEdit({ ...edit, phone: v || "" })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
              <div className="space-y-1"><Label>Promo code</Label><Input value={edit.promo_code} onChange={(e) => setEdit({ ...edit, promo_code: e.target.value.toUpperCase() })} maxLength={30} /></div>
              <div className="space-y-1"><Label>Discount %</Label><Input type="number" min={0} max={100} value={edit.discount_percent} onChange={(e) => setEdit({ ...edit, discount_percent: e.target.value })} /></div>
              <div className="space-y-1"><Label>Revenue share %</Label><Input type="number" min={0} max={100} value={edit.revenue_share_percent} onChange={(e) => setEdit({ ...edit, revenue_share_percent: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2"><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} /> Active</label>
            </div>
            {editTarget && normalizePromo(edit.promo_code) !== editTarget.promo_code.toUpperCase() && <p className="text-xs text-muted-foreground">Past payments stay credited to the old code; new sales use the new code.</p>}
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button><Button onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Delete {deleteTarget?.full_name}?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Their promo code {deleteTarget?.promo_code} will stop working. Past payments are kept.</p>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteTarget && deleteInfluencer(deleteTarget.id)}>Delete</Button></div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!pwTarget} onOpenChange={(o) => { if (!o) { setPwTarget(null); setNewPassword(""); } }}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Set dashboard password</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {pwTarget?.full_name} will sign in at their link with their email and this password.
              </p>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="bg-secondary border-border text-foreground"
              />
              <Button onClick={savePassword} disabled={savingPw || newPassword.length < 8} className="bg-primary text-primary-foreground">
                {savingPw ? "Saving..." : "Save password"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Influencers;
