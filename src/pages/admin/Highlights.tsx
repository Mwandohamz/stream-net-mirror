import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/lib/functionError";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Highlight {
  id: string; youtube_video_id: string; title: string; channel_title: string | null;
  thumbnail_url: string | null; published_at: string | null; is_published: boolean;
  is_embeddable: boolean; availability_status: string; api_data_expires_at: string;
  source: { source_name: string; is_enabled: boolean } | null;
}
async function request(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-highlights", { body });
  if (error) throw new Error(await functionErrorMessage(error, "Could not load highlights"));
  return data;
}

export default function AdminHighlights() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<Highlight | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-highlights", status, page],
    queryFn: async (): Promise<{ highlights: Highlight[]; total: number }> => request({ action: "list", status, page }),
    staleTime: 60_000,
  });
  const changePublication = async (video: Highlight) => {
    setSaving(video.id);
    try {
      await request({ action: "publish", id: video.id, published: !video.is_published });
      toast.success(video.is_published ? "Highlight hidden from public view" : "Highlight approved and published");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-highlights"] }),
        queryClient.invalidateQueries({ queryKey: ["football-highlights"] }),
      ]);
      setPreview(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update highlight"); }
    finally { setSaving(null); }
  };
  const canApprove = (video: Highlight) => video.is_embeddable && video.availability_status === "available"
    && video.source?.is_enabled === true && Date.parse(video.api_data_expires_at) > Date.now();
  const controls = (video: Highlight) => <div className="flex items-center gap-2">
    <Button size="sm" variant="outline" onClick={() => setPreview(video)} aria-label={`Preview ${video.title}`}><Eye size={14} /> Preview</Button>
    <Button size="sm" variant={video.is_published ? "outline" : "default"} disabled={saving !== null || (!video.is_published && !canApprove(video))}
      onClick={() => void changePublication(video)}>{video.is_published ? <EyeOff size={14} /> : <Check size={14} />}{video.is_published ? "Unpublish" : "Approve"}</Button>
  </div>;
  return <AdminLayout>
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold text-foreground">Football highlights</h1>
        <Button variant="outline" size="icon" aria-label="Refresh review list" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} /></Button></div>
      <p className="text-sm text-muted-foreground">Automatic checks run every five hours. Review a preview before approving videos for public display.</p>
      <Tabs value={status} onValueChange={value => { setStatus(value); setPage(1); }}><TabsList>
        <TabsTrigger value="pending">Pending approval</TabsTrigger><TabsTrigger value="published">Published</TabsTrigger><TabsTrigger value="all">All videos</TabsTrigger>
      </TabsList></Tabs>
      {query.isLoading ? <p role="status" className="text-muted-foreground">Loading highlights…</p> : query.isError ? <p role="alert" className="text-destructive">{query.error.message}</p> : <>
        <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Video</TableHead><TableHead>Channel / Date</TableHead><TableHead>Status</TableHead><TableHead>Review</TableHead></TableRow></TableHeader>
          <TableBody>{query.data?.highlights.map(video => <TableRow key={video.id}>
            <TableCell className="min-w-64 max-w-sm"><div className="flex items-center gap-3">{video.thumbnail_url && <img src={video.thumbnail_url} alt="" className="h-12 w-20 shrink-0 rounded object-cover" loading="lazy" />}<span className="break-words font-medium">{video.title}</span></div></TableCell>
            <TableCell className="min-w-36 text-xs"><div>{video.channel_title ?? video.source?.source_name}</div><div className="text-muted-foreground">{video.published_at ? new Date(video.published_at).toLocaleString() : "—"}</div></TableCell>
            <TableCell><Badge variant={video.is_published ? "default" : "secondary"}>{video.is_published ? "Published" : "Pending"}</Badge>{!canApprove(video) && <p className="mt-1 text-xs text-muted-foreground">Unavailable or awaiting refresh</p>}</TableCell>
            <TableCell>{controls(video)}</TableCell>
          </TableRow>)}{query.data?.highlights.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No videos in this view.</TableCell></TableRow>}</TableBody>
        </Table></div>
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{query.data?.total ?? 0} videos · Page {page} of {Math.max(1, Math.ceil((query.data?.total ?? 0) / 100))}</span><div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></Button>
          <Button variant="outline" size="icon" aria-label="Next page" disabled={page * 100 >= (query.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></Button></div></div>
      </>}
    </div>
    <Dialog open={preview !== null} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="max-w-3xl" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
      {preview && <><iframe title={preview.title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(preview.youtube_video_id)}`} className="aspect-video w-full border-0" allow="encrypted-media; picture-in-picture" allowFullScreen />
        <div className="flex justify-end"><Button disabled={saving !== null || (!preview.is_published && !canApprove(preview))} onClick={() => void changePublication(preview)}>{preview.is_published ? <EyeOff size={14} /> : <Check size={14} />}{preview.is_published ? "Unpublish" : "Approve & publish"}</Button></div></>}
    </DialogContent></Dialog>
  </AdminLayout>;
}