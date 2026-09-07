import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Trash2, ShieldCheck, Ban, CalendarClock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CountrySelect from "@/components/CountrySelect";
import PhoneNumberField, { buildE164, splitLocalDigits } from "@/components/PhoneNumberField";
import { usePlans } from "@/hooks/usePlans";
import { findCountry, type WorldCountry } from "@/data/allCountries";

const PAGE_SIZE = 100;

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  profile: any | null;
  subscription: any | null;
  roles: string[];
  payment_count: number;
  total_paid_usd: number;
  last_payment_at: string | null;
}

const emptyForm = {
  id: "",
  full_name: "",
  email: "",
  password: "",
  localPhone: "",
  country: null as WorldCountry | null,
};

const AdminUsers = () => {
  const { toast } = useToast();
  const { plans } = usePlans(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [subUser, setSubUser] = useState<AdminUser | null>(null);
  const [subPlanId, setSubPlanId] = useState("");
  const [subEnd, setSubEnd] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const call = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body: payload });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list", page, perPage: PAGE_SIZE });
      setUsers(data.users ?? []);
      setTotal(data.total ?? data.users?.length ?? 0);
    } catch (err: any) {
      toast({ title: "Could not load users", description: err.message, variant: "destructive" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.profile?.full_name?.toLowerCase().includes(q) ||
        u.profile?.phone?.includes(q) ||
        u.profile?.country_name?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    const country = findCountry(u.profile?.country_iso3) ?? null;
    setForm({
      id: u.id,
      full_name: u.profile?.full_name ?? "",
      email: u.email ?? "",
      password: "",
      localPhone: splitLocalDigits(country?.iso3, u.profile?.phone),
      country,
    });
    setEditing(true);
    setDialogOpen(true);
  };

  const saveUser = async () => {
    setSaving(true);
    try {
      const phone = buildE164(form.country?.iso3, form.localPhone);
      const base = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: phone || null,
        country_iso3: form.country?.iso3 ?? null,
        country_name: form.country?.name ?? null,
        currency: form.country?.currency ?? null,
      };

      if (editing) {
        await call({ action: "update_user", user_id: form.id, ...base, password: form.password || undefined });
        toast({ title: "User updated" });
      } else {
        if (form.password.length < 8) throw new Error("Password must be at least 8 characters");
        await call({ action: "create_user", ...base, password: form.password });
        toast({ title: "User created" });
      }
      setDialogOpen(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleAdmin = async (u: AdminUser) => {
    try {
      await call({ action: "set_role", user_id: u.id, role: "admin", enabled: !u.roles.includes("admin") });
      toast({ title: u.roles.includes("admin") ? "Admin access removed" : "Admin access granted" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const toggleDisabled = async (u: AdminUser) => {
    const disabled = !!u.banned_until && new Date(u.banned_until) > new Date();
    try {
      await call({ action: "set_disabled", user_id: u.id, disabled: !disabled });
      toast({ title: disabled ? "Account re-enabled" : "Account disabled" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const openSubscription = (u: AdminUser) => {
    setSubUser(u);
    setSubPlanId(u.subscription?.plan_id ?? plans[0]?.id ?? "");
    const end = u.subscription?.current_period_end
      ? new Date(u.subscription.current_period_end)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setSubEnd(end.toISOString().slice(0, 10));
  };

  const saveSubscription = async () => {
    if (!subUser) return;
    try {
      await call({
        action: "set_subscription",
        user_id: subUser.id,
        plan_id: subPlanId || null,
        status: "active",
        current_period_end: new Date(`${subEnd}T23:59:59Z`).toISOString(),
      });
      toast({ title: "Subscription saved" });
      setSubUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const cancelSubscription = async (u: AdminUser) => {
    try {
      await call({ action: "cancel_subscription", user_id: u.id });
      toast({ title: "Subscription cancelled" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await call({ action: "delete_user", user_id: deleteTarget.id });
      toast({ title: "User deleted" });
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const subscriptionBadge = (u: AdminUser) => {
    const sub = u.subscription;
    if (!sub) return <Badge variant="outline" className="text-muted-foreground">No plan</Badge>;
    const end = new Date(sub.current_period_end);
    const active = sub.status !== "cancelled" && end.getTime() + (sub.grace_days ?? 0) * 86400000 > Date.now();
    return (
      <div className="space-y-0.5">
        <Badge className={active ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
          {active ? "Active" : sub.status === "cancelled" ? "Cancelled" : "Expired"}
        </Badge>
        <p className="text-[11px] text-muted-foreground">until {end.toLocaleDateString()}</p>
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="netflix-title text-2xl text-foreground">USERS</h1>
            <p className="text-sm text-muted-foreground">Every account, its profile details and subscription.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void fetchUsers()} className="gap-2">
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/80">
              <Plus size={14} /> New User
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, country" className="pl-9" />
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading users…</TableCell></TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No users found</TableCell></TableRow>
                )}
                {!loading && filtered.map((u) => {
                  const disabled = !!u.banned_until && new Date(u.banned_until) > new Date();
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {u.profile?.full_name || "—"}
                          {u.roles.includes("admin") && <Badge className="bg-primary/15 text-primary border-primary/30">Admin</Badge>}
                          {disabled && <Badge variant="outline" className="text-destructive border-destructive/40">Disabled</Badge>}
                        </div>
                        {!u.email_confirmed_at && <p className="text-[11px] text-yellow-500">Email not verified</p>}
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">
                        {u.profile?.country_name ? (
                          <span>{findCountry(u.profile.country_iso3)?.flag} {u.profile.country_name}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{u.profile?.phone || "—"}</TableCell>
                      <TableCell>{subscriptionBadge(u)}</TableCell>
                      <TableCell className="text-sm">
                        {u.payment_count}
                        {u.total_paid_usd > 0 && (
                          <span className="block text-[11px] text-muted-foreground">USD {u.total_paid_usd.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Edit user" onClick={() => openEdit(u)}><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon" title="Manage subscription" onClick={() => openSubscription(u)}><CalendarClock size={15} /></Button>
                          <Button variant="ghost" size="icon" title="Toggle admin" onClick={() => void toggleAdmin(u)}><ShieldCheck size={15} className={u.roles.includes("admin") ? "text-primary" : ""} /></Button>
                          <Button variant="ghost" size="icon" title={disabled ? "Enable account" : "Disable account"} onClick={() => void toggleDisabled(u)}><Ban size={15} className={disabled ? "text-destructive" : ""} /></Button>
                          <Button variant="ghost" size="icon" title="Delete user" onClick={() => setDeleteTarget(u)}><Trash2 size={15} className="text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages} · {total} accounts</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Previous</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={14} /></Button>
          </div>
        </div>
      </div>

      {/* Create / edit user */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the account details. Leave the password blank to keep it unchanged." : "Creates a verified account straight away."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <CountrySelect value={form.country?.iso3} onChange={(c) => setForm({ ...form, country: c })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <PhoneNumberField countryIso={form.country?.iso3} value={form.localPhone} onChange={(v) => setForm({ ...form, localPhone: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? "New password (optional)" : "Password"}</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveUser()} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/80">
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription editor */}
      <Dialog open={!!subUser} onOpenChange={(open) => !open && setSubUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Subscription</DialogTitle>
            <DialogDescription>{subUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <select
                value={subPlanId}
                onChange={(e) => setSubPlanId(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">No plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — USD {Number(p.price_usd).toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Active until</Label>
              <Input type="date" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {subUser?.subscription && (
              <Button variant="outline" onClick={() => { void cancelSubscription(subUser); setSubUser(null); }}>Cancel plan</Button>
            )}
            <Button onClick={() => void saveSubscription()} className="bg-primary text-primary-foreground hover:bg-primary/80">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.email} will be permanently removed, along with their profile and subscription. Payment records are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
