import { useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { downloadApk } from "@/lib/apkDownload";

interface Props {
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

/** Download button with an Android install warning, available to everyone. */
const ApkDownloadButton = ({ label = "Download APK", className, variant = "default", size = "sm" }: Props) => {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const start = async () => {
    setConfirmOpen(false);
    setDownloading(true);
    const ok = await downloadApk();
    setDownloading(false);
    if (!ok) {
      toast({
        title: "Download unavailable",
        description: "The app file isn't available yet. Please try again shortly.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={downloading}
        onClick={() => setConfirmOpen(true)}
      >
        <Download size={14} /> {downloading ? "Preparing…" : label}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-border bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> Android app download
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>This Stream NetMirror APK is for <strong className="text-foreground">Android only</strong>.</p>
                <p>
                  While installing, your phone may warn about apps from "unknown sources". That's normal for apps
                  installed outside the Play Store. Only install the Stream NetMirror file downloaded here and
                  don’t ignore a security warning identifying a specific threat. Download requests record device information and time.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void start()}>Download & install</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ApkDownloadButton;
