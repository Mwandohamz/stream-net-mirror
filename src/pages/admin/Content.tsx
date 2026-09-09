import { useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, RefreshCw, Upload, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContent, type ContentCategory, type ContentLink } from "@/hooks/useContent";

const PLATFORMS = ["web", "android", "ios", "tv", "software"];

const emptyCategory = { id: "", slug: "", name: "", description: "", icon: "", sort_order: 0, is_active: true };
const emptyLink = {
  id: "",
  category_id: "",
  title: "",
  description: "",
  url: "",
  logo_url: "",
  platform: "web",
  sort_order: 0,
  is_active: true,
};

const AdminContent = () => {
  const { toast } = useToast();
  const { categories, linksFor, loading, reload } = useContent(true);

  const [catForm, setCatForm] = useState(emptyCategory);
  const [catOpen, setCatOpen] = useState(false);
  const [catEditing, setCatEditing] = useState(false);

  const [linkForm, setLinkForm] = useState(emptyLink);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEditing, setLinkEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveCategory = async () => {
    if (!catForm.name.trim() || !catForm.slug.trim()) return;
    setSaving(true);
    const payload = {
      slug: catForm.slug.trim().toLowerCase(),
      name: catForm.name.trim(),
      description: catForm.description.trim() || null,
      icon: catForm.icon.trim() || null,
      sort_order: Number(catForm.sort_order) || 0,
      is_active: catForm.is_active,
    };
    const { error } = catEditing
      ? await supabase.from("content_categories" as any).update(payload as any).eq("id", catForm.id)
      : await supabase.from("content_categories" as any).insert(payload as any);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save category", description: error.message, variant: "destructive" });
      return;
    }
    setCatOpen(false);
    toast({ title: catEditing ? "Category updated" : "Category created" });
    void reload();
  };

  const deleteCategory = async (c: ContentCategory) => {
    if (!confirm(`Delete "${c.name}" and all of its links?`)) return;
    const { error } = await supabase.from("content_categories" as any).delete().eq("id", c.id);
    if (error) toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    else void reload();
  };

  /** Saves the form. `andAnother` keeps the dialog open so several links can be added in a row. */
  const saveLink = async (andAnother = false) => {
    if (!linkForm.title.trim() || !linkForm.url.trim() || !linkForm.category_id) return;
    setSaving(true);
    const payload = {
      category_id: linkForm.category_id,
      title: linkForm.title.trim(),
      description: linkForm.description.trim() || null,
      url: linkForm.url.trim(),
      logo_url: linkForm.logo_url.trim() || null,
      platform: linkForm.platform,
      sort_order: Number(linkForm.sort_order) || 0,
      is_active: linkForm.is_active,
    };
    const { error } = linkEditing
      ? await supabase.from("content_links" as any).update(payload as any).eq("id", linkForm.id)
      : await supabase.from("content_links" as any).insert(payload as any);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save link", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: linkEditing ? "Link updated" : "Link added" });
    if (andAnother && !linkEditing) {
      setLinkForm((f) => ({
        ...emptyLink,
        category_id: f.category_id,
        platform: f.platform,
        sort_order: Number(f.sort_order) + 1,
      }));
    } else {
      setLinkOpen(false);
    }
    void reload();
  };

  /** Bulk add: one link per line, "Title | URL | optional logo URL | optional description". */
  const saveBulk = async () => {
    const rows = bulk
      .split("\n")
      .map((line) => line.split("|").map((p) => p.trim()))
      .filter((p) => p[0] && p[1]);
    if (rows.length === 0 || !linkForm.category_id) {
      toast({ title: "Nothing to add", description: "Use one line per link: Title | URL", variant: "destructive" });
      return;
    }
    setSaving(true);
    const base = Number(linkForm.sort_order) || 0;
    const payload = rows.map((p, i) => ({
      category_id: linkForm.category_id,
      title: p[0],
      url: p[1],
      logo_url: p[2] || null,
      description: p[3] || null,
      platform: linkForm.platform,
      sort_order: base + i,
      is_active: true,
    }));
    const { error } = await supabase.from("content_links" as any).insert(payload as any);
    setSaving(false);
    if (error) {
      toast({ title: "Could not add links", description: error.message, variant: "destructive" });
      return;
    }
    setBulk("");
    setLinkOpen(false);
    toast({ title: `${rows.length} links added` });
    void reload();
  };

  const deleteLink = async (l: ContentLink) => {
    if (!confirm(`Delete "${l.title}"?`)) return;
    const { error } = await supabase.from("content_links" as any).delete().eq("id", l.id);
    if (error) toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    else void reload();
  };

  const uploadLogo = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Unsupported image", description: "Use a JPG, PNG, WEBP, GIF or SVG file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Maximum size is 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `content-logos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("content-media")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("content-media").getPublicUrl(path);
    setLinkForm((f) => ({ ...f, logo_url: data.publicUrl }));
    setUploading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="netflix-title text-2xl text-foreground">CONTENT & LINKS</h1>
            <p className="text-sm text-muted-foreground">
              Everything members see in Streaming, Live Sports and Downloads is managed here.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void reload()} className="gap-1">
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-primary text-primary-foreground"
              onClick={() => { setCatForm(emptyCategory); setCatEditing(false); setCatOpen(true); }}
            >
              <Plus size={14} /> New category
            </Button>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {categories.map((c) => (
          <Card key={c.id} className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="netflix-title text-lg text-foreground">{c.name}</h2>
                    <Badge variant="outline" className="text-[10px]">{c.slug}</Badge>
                    {!c.is_active && <Badge className="bg-destructive/20 text-destructive text-[10px]">Hidden</Badge>}
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{c.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setLinkForm({ ...emptyLink, category_id: c.id, sort_order: linksFor(c.id).length + 1 });
                      setLinkEditing(false);
                      setLinkOpen(true);
                    }}
                  >
                    <Plus size={14} /> Add link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCatForm({
                        id: c.id,
                        slug: c.slug,
                        name: c.name,
                        description: c.description ?? "",
                        icon: c.icon ?? "",
                        sort_order: c.sort_order,
                        is_active: c.is_active,
                      });
                      setCatEditing(true);
                      setCatOpen(true);
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void deleteCategory(c)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {linksFor(c.id).map((l) => (
                  <div key={l.id} className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-background">
                      {l.logo_url && <img src={l.logo_url} alt={l.title} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                        <Badge variant="outline" className="text-[9px]">{l.platform}</Badge>
                        {!l.is_active && <Badge className="bg-destructive/20 text-destructive text-[9px]">Hidden</Badge>}
                      </div>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary inline-flex items-center gap-1 truncate">
                        <ExternalLink size={10} /> {l.url}
                      </a>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          setLinkForm({
                            id: l.id,
                            category_id: l.category_id,
                            title: l.title,
                            description: l.description ?? "",
                            url: l.url,
                            logo_url: l.logo_url ?? "",
                            platform: l.platform,
                            sort_order: l.sort_order,
                            is_active: l.is_active,
                          });
                          setLinkEditing(true);
                          setLinkOpen(true);
                        }}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => void deleteLink(l)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
                {linksFor(c.id).length === 0 && (
                  <p className="text-xs text-muted-foreground">No links yet in this category.</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{catEditing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>Categories are the tabs members switch between in their dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Slug (used in links, lowercase)</Label>
              <Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="live-sports" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} rows={4} />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label>Order</Label>
                <Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) })} className="w-24" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={catForm.is_active} onCheckedChange={(v) => setCatForm({ ...catForm, is_active: v })} />
                <Label>Visible</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCatOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="bg-card max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{linkEditing ? "Edit link" : "Add link"}</DialogTitle>
            <DialogDescription>Members see the title, the description and the logo you set here.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                value={linkForm.category_id}
                onChange={(e) => setLinkForm({ ...linkForm, category_id: e.target.value })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>What this link does</Label>
              <Textarea value={linkForm.description} onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>URL</Label>
              <Input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://" />
            </div>
            <div className="space-y-1">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded bg-secondary">
                  {linkForm.logo_url && <img src={linkForm.logo_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadLogo(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <Input
                value={linkForm.logo_url}
                onChange={(e) => setLinkForm({ ...linkForm, logo_url: e.target.value })}
                placeholder="or paste an image URL"
                className="mt-2"
              />
            </div>
            <div className="flex items-end gap-4 flex-wrap">
              <div className="space-y-1">
                <Label>Device</Label>
                <select
                  value={linkForm.platform}
                  onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Order</Label>
                <Input type="number" value={linkForm.sort_order} onChange={(e) => setLinkForm({ ...linkForm, sort_order: Number(e.target.value) })} className="w-24" />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={linkForm.is_active} onCheckedChange={(v) => setLinkForm({ ...linkForm, is_active: v })} />
                <Label>Visible</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button onClick={saveLink} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminContent;
