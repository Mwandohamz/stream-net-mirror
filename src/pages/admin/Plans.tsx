import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlans, planIntervalLabel, type Plan } from "@/hooks/usePlans";
import { useContent } from "@/hooks/useContent";
import { Checkbox } from "@/components/ui/checkbox";
import { useFxRates } from "@/hooks/useFxRates";
import { formatCurrencyAmount } from "@/lib/currency";


const emptyPlan = {
  id: "",
  name: "",
  description: "",
  interval: "month",
  interval_count: 1,
  price_usd: 2,
  is_active: true,
  sort_order: 0,
  category_slugs: ["netmirror"] as string[],
};


const AdminPlans = () => {
  const { toast } = useToast();
  const { plans, loading, reload } = usePlans(true);
  const { convertFromUSD } = useFxRates();
  const { categories } = useContent(true);
  const [form, setForm] = useState(emptyPlan);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (slug: string) =>
    setForm((f) => ({
      ...f,
      category_slugs: f.category_slugs.includes(slug)
        ? f.category_slugs.filter((s) => s !== slug)
        : [...f.category_slugs, slug],
    }));

  const openCreate = () => { setForm(emptyPlan); setEditing(false); setOpen(true); };
  const openEdit = (p: Plan) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      interval: p.interval,
      interval_count: p.interval_count,
      price_usd: Number(p.price_usd),
      is_active: p.is_active,
      sort_order: p.sort_order,
      category_slugs: p.category_slugs?.length ? p.category_slugs : ["netmirror"],
    });
    setEditing(true);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      interval: form.interval,
      interval_count: Number(form.interval_count) || 1,
      price_usd: Number(form.price_usd),
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
      category_slugs: form.category_slugs,
    };


    const { error } = editing
      ? await supabase.from("plans" as any).update(payload as any).eq("id", form.id)
      : await supabase.from("plans" as any).insert(payload as any);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Plan updated" : "Plan created" });
    setOpen(false);
    await reload();
  };

  const remove = async (p: Plan) => {
    const { error } = await supabase.from("plans" as any).delete().eq("id", p.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Plan deleted" });
    await reload();
  };

  const toggleActive = async (p: Plan) => {
    const { error } = await supabase.from("plans" as any).update({ is_active: !p.is_active } as any).eq("id", p.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    await reload();
  };

  const zmw = (usd: number) => {
    const v = convertFromUSD(usd, "ZMW");
    return v === null ? "—" : formatCurrencyAmount(v, "ZMW");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="netflix-title text-2xl text-foreground">PLANS &amp; PRICING</h1>
            <p className="text-sm text-muted-foreground">Prices are set in USD and converted to each customer's currency automatically.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void reload()} className="gap-2"><RefreshCw size={14} /> Refresh</Button>
            <Button size="sm" onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/80"><Plus size={14} /> New Plan</Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>≈ ZMW</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>}
                {!loading && plans.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No plans yet</TableCell></TableRow>}
                {plans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{planIntervalLabel(p)}</TableCell>
                    <TableCell className="text-sm">USD {Number(p.price_usd).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{zmw(Number(p.price_usd))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.is_active} onCheckedChange={() => void toggleActive(p)} />
                        <Badge variant="outline" className={p.is_active ? "text-green-500 border-green-500/40" : "text-muted-foreground"}>
                          {p.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil size={15} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => void remove(p)}><Trash2 size={15} className="text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit plan" : "New plan"}</DialogTitle>
            <DialogDescription>Customers see this price converted into their own currency.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Billing interval</Label>
                <select
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="week">Week</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Every</Label>
                <Input type="number" min={1} value={form.interval_count} onChange={(e) => setForm({ ...form, interval_count: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (USD)</Label>
                <Input type="number" step="0.01" min={0} value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
            <div className="space-y-2 rounded-md border border-border p-3">
              <Label className="mb-0">Included categories</Label>
              <p className="text-xs text-muted-foreground">Tick everything this plan unlocks for the customer.</p>
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${c.id}`}
                    checked={form.category_slugs.includes(c.slug)}
                    onCheckedChange={() => toggleCategory(c.slug)}
                  />
                  <Label htmlFor={`cat-${c.id}`} className="mb-0 text-sm font-normal">{c.name}</Label>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label className="mb-0">Visible to customers</Label>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving || !form.name.trim()} className="bg-primary text-primary-foreground hover:bg-primary/80">
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPlans;
