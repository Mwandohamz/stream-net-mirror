import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAppSettings } from "@/hooks/useAppSettings";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileDown, Trash2, Download } from "lucide-react";

const AdminSettings = () => {
  const { user } = useAdmin();
  const { settings, loading: settingsLoading, updateSetting } = useAppSettings();
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);
  const [portalInput, setPortalInput] = useState("");
  const [portalSaving, setPortalSaving] = useState(false);
  const [apkUploading, setApkUploading] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [apkFileName, setApkFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current APK info from settings
  useEffect(() => {
    if (settings.apk_file_name) {
      setApkFileName(settings.apk_file_name);
      const { data } = supabase.storage.from("app-files").getPublicUrl(settings.apk_file_name);
      setApkUrl(data.publicUrl);
    }
  }, [settings.apk_file_name]);

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

  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".apk")) {
      toast.error("Please upload an APK file (.apk)");
      return;
    }

    setApkUploading(true);
    const fileName = `streamnetmirror-${Date.now()}.apk`;

    // Delete old file if exists
    if (apkFileName) {
      await supabase.storage.from("app-files").remove([apkFileName]);
    }

    const { error } = await supabase.storage.from("app-files").upload(fileName, file, {
      contentType: "application/vnd.android.package-archive",
      upsert: true,
    });

    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      await updateSetting("apk_file_name", fileName);
      setApkFileName(fileName);
      const { data } = supabase.storage.from("app-files").getPublicUrl(fileName);
      setApkUrl(data.publicUrl);
      toast.success("APK uploaded successfully!");
    }
    setApkUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleApkDelete = async () => {
    if (!apkFileName) return;
    setApkUploading(true);
    await supabase.storage.from("app-files").remove([apkFileName]);
    await updateSetting("apk_file_name", "");
    setApkUrl(null);
    setApkFileName(null);
    toast.success("APK removed");
    setApkUploading(false);
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

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">STREAMING PORTAL URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Portal URL</Label>
              <Input
                type="url"
                value={portalInput || settings.portal_url || "https://net22.cc/home"}
                onChange={(e) => setPortalInput(e.target.value)}
                placeholder="https://net22.cc/home"
                className="bg-secondary border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                This is the official streaming portal link shown to subscribers on their dashboard.
              </p>
            </div>
            <Button
              onClick={async () => {
                const val = portalInput || settings.portal_url || "https://net22.cc/home";
                if (!val.startsWith("http")) {
                  toast.error("Please enter a valid URL");
                  return;
                }
                setPortalSaving(true);
                const { error } = await updateSetting("portal_url", val);
                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success("Portal URL updated successfully");
                }
                setPortalSaving(false);
              }}
              disabled={portalSaving || settingsLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {portalSaving ? "Saving..." : "Update Portal URL"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">OFFICIAL STREAMING LINKS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Set up to 3 official NetMirror website links. These will be shown to subscribers as backup access options.
            </p>
            {[1, 2, 3].map((n) => {
              const key = `streaming_link_${n}`;
              return (
                <div key={key} className="space-y-2">
                  <Label className="text-foreground text-sm">Official Link {n}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      defaultValue={settings[key] || ""}
                      id={`link-input-${n}`}
                      placeholder="https://..."
                      className="bg-secondary border-border text-foreground"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        const input = document.getElementById(`link-input-${n}`) as HTMLInputElement;
                        const val = input?.value || "";
                        if (val && !val.startsWith("http")) {
                          toast.error("Please enter a valid URL");
                          return;
                        }
                        const { error } = await updateSetting(key, val);
                        if (error) toast.error(error.message);
                        else toast.success(`Link ${n} saved`);
                      }}
                      className="bg-primary text-primary-foreground shrink-0"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">ANDROID APK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Upload the StreamNetMirror Android APK file. Subscribers will see a direct download button on their dashboard.
            </p>

            {apkFileName && apkUrl ? (
              <div className="bg-secondary rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileDown size={18} className="text-primary shrink-0" />
                    <span className="text-sm text-foreground truncate">{apkFileName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleApkDelete}
                    disabled={apkUploading}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <a href={apkUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                    <Download size={14} /> Test Download
                  </Button>
                </a>
              </div>
            ) : (
              <div className="bg-secondary/50 border border-dashed border-border rounded-lg p-6 text-center">
                <Upload size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No APK uploaded yet</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".apk"
              onChange={handleApkUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={apkUploading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 gap-2"
            >
              <Upload size={16} />
              {apkUploading ? "Uploading..." : apkFileName ? "Replace APK" : "Upload APK"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
