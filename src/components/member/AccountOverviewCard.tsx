import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, CalendarClock, RefreshCw, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useSubscriber, subscriptionAccessEnd, isSubscriptionActive } from "@/hooks/useSubscriber";
import { usePricing } from "@/hooks/usePricing";
import { useToast } from "@/hooks/use-toast";

function daysBetween(target: Date): number {
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const AccountOverviewCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading, reload, updateProfile } = useProfile();
  const { subscription } = useSubscriber();
  const { plan, priceUsd, formatPrice, intervalLabel } = usePricing();

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile?.full_name, profile?.phone]);

  const countdown = useMemo(() => {
    if (!subscription) return null;
    const end = new Date(subscription.current_period_end);
    const accessEnd = subscriptionAccessEnd(subscription);
    const active = isSubscriptionActive(subscription);
    const days = daysBetween(end);
    return { end, accessEnd, active, days, inGrace: active && days <= 0 };
  }, [subscription, now]);

  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Not an image", description: "Please choose a JPG or PNG file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please choose an image under 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUploading(false);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `avatars/${session.user.id}/profile-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("app-files").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("app-files").getPublicUrl(path);
    const { error } = await updateProfile({ avatar_url: pub.publicUrl } as any);
    setUploading(false);
    if (error) {
      toast({ title: "Could not save picture", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile picture updated" });
      void reload();
    }
  };

  const saveDetails = async () => {
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName.trim(), phone: phone.trim() || null });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    } else {
      setEditing(false);
      toast({ title: "Details updated" });
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5 md:p-6 space-y-5">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary/40">
              <AvatarImage src={(profile as any)?.avatar_url || undefined} alt={profile?.full_name || "Profile picture"} />
              <AvatarFallback className="bg-secondary text-foreground text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Upload profile picture"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleAvatar(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex-1 min-w-[200px] space-y-1">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Full name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveDetails} disabled={saving} className="bg-primary text-primary-foreground gap-1">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1">
                    <X size={14} /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="netflix-title break-words text-lg md:text-xl text-foreground">
                    {profileLoading ? "…" : profile?.full_name || "Your account"}
                  </h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil size={12} /> Edit
                  </Button>
                </div>
                <p className="break-all text-sm text-muted-foreground">{profile?.email}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                  {profile?.phone && <span>{profile.phone}</span>}
                  {profile?.country_name && <span>{profile.country_name}</span>}
                  {profile?.currency && <span>Currency: {profile.currency}</span>}
                  {profile?.created_at && <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>}
                </div>
              </>
            )}
          </div>
        </div>


        {/* Subscription status */}
        <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock size={18} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">{plan?.name ?? "Membership"}</span>
              {countdown ? (
                <Badge className={countdown.active ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"}>
                  {countdown.active ? (countdown.inGrace ? "Grace period" : "Active") : "Expired"}
                </Badge>
              ) : (
                <Badge className="bg-primary/20 text-primary">Lifetime access</Badge>
              )}
            </div>
            {priceUsd !== null && (
              <span className="text-sm text-muted-foreground">
                {formatPrice(priceUsd)} <span className="text-xs">{intervalLabel}</span>
              </span>
            )}
          </div>

          {countdown ? (
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                {countdown.active && !countdown.inGrace
                  ? `Renews in ${countdown.days} day${countdown.days === 1 ? "" : "s"} — ${countdown.end.toLocaleDateString()}`
                  : countdown.inGrace
                  ? `Payment overdue. Access ends ${countdown.accessEnd.toLocaleDateString()}`
                  : `Ended on ${countdown.end.toLocaleDateString()}`}
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.max(4, Math.min(100, (countdown.days / 30) * 100))}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Your access does not expire.</p>
          )}

          <Button
            onClick={() => navigate(plan ? `/payment?plan=${plan.id}` : "/payment")}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/80 gap-2"
          >
            <RefreshCw size={15} /> {countdown && !countdown.active ? "Reactivate" : "Renew now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountOverviewCard;
