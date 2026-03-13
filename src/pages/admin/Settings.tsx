import { useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAppSettings } from "@/hooks/useAppSettings";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user } = useAdmin();
  const { settings, loading: settingsLoading, updateSetting } = useAppSettings();
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-lg">
        <h1 className="netflix-title text-3xl text-foreground">SETTINGS</h1>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">ACCOUNT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Email</Label>
              <Input value={user?.email || ""} disabled className="bg-secondary border-border text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Role</Label>
              <Input value="Admin" disabled className="bg-secondary border-border text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">CHANGE PASSWORD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {saving ? "Saving..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">PRICING</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Base Price (ZMW)</Label>
              <Input
                type="number"
                value={priceInput || settings.base_price_zmw || "49"}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="49"
                className="bg-secondary border-border text-foreground"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                This is the base price in Zambian Kwacha. It will be converted to local currencies for other countries.
              </p>
            </div>
            <Button
              onClick={async () => {
                const val = priceInput || settings.base_price_zmw || "49";
                if (parseFloat(val) <= 0) {
                  toast.error("Price must be greater than 0");
                  return;
                }
                setPriceSaving(true);
                const { error } = await updateSetting("base_price_zmw", val);
                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success("Price updated successfully");
                }
                setPriceSaving(false);
              }}
              disabled={priceSaving || settingsLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {priceSaving ? "Saving..." : "Update Price"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
