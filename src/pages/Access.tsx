import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Download, Globe, Smartphone, Monitor, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useAppSettings } from "@/hooks/useAppSettings";

const Access = () => {
  const { settings } = useAppSettings();
  const portalUrl = settings.portal_url || "https://net22.cc/home";

  const accessLinks = [
    { name: "StreamNetMirror Portal", url: portalUrl, primary: true },
    { name: "netmirror.vip", url: "https://netmirror.vip" },
    { name: "netmirror.com.in", url: "https://netmirror.com.in" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-500" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">YOUR ACCESS IS READY</h1>
          <p className="text-muted-foreground mb-8">Welcome to Stream Net Mirror! Choose how you'd like to start streaming.</p>

          {/* Access Links */}
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <h3 className="font-display text-xl text-foreground mb-4">STREAMING PORTALS</h3>
              <div className="space-y-3">
                {accessLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:border-primary/50 ${
                      link.primary
                        ? "bg-primary/10 border-primary/30"
                        : "bg-secondary border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-primary" />
                      <span className="text-foreground font-medium">{link.name}</span>
                      {link.primary && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <h3 className="font-display text-xl text-foreground mb-4">DOWNLOAD THE APP</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <Smartphone size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-foreground font-medium text-sm">Android APK</p>
                  <p className="text-xs text-muted-foreground mb-3">Direct download</p>
                  <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                    <Download size={14} /> Download
                  </Button>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <Monitor size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-foreground font-medium text-sm">iOS WebView</p>
                  <p className="text-xs text-muted-foreground mb-3">Via DODO / iOSMirror</p>
                  <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                    <ExternalLink size={14} /> Learn More
                  </Button>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <Globe size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-foreground font-medium text-sm">Smart TV</p>
                  <p className="text-xs text-muted-foreground mb-3">Android TV compatible</p>
                  <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                    <Download size={14} /> Get App
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OTT platforms accessible */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="font-display text-xl text-foreground mb-3">PLATFORMS YOU CAN ACCESS</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Netflix", "Disney+", "Prime Video", "HBO Max", "Hulu", "Peacock", "Paramount+", "Apple TV+", "YouTube Premium"].map((p) => (
                  <span key={p} className="px-3 py-1.5 bg-secondary text-foreground text-xs rounded-full border border-border">
                    {p}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Access;
