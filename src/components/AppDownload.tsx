import { motion } from "framer-motion";
import { Download, Globe, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppDownload = () => {
  return (
    <section id="download" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              DOWNLOAD THE APP
            </h2>
            <p className="text-muted-foreground mb-6 text-lg">
              Get Stream Net Mirror on your favourite device. Available on Android, iOS via WebView, Smart TVs, and web browsers.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-primary" />
                <div>
                  <p className="text-foreground font-medium text-sm">Android APK</p>
                  <p className="text-xs text-muted-foreground">Download directly from our website or Play Store</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Monitor size={20} className="text-primary" />
                <div>
                  <p className="text-foreground font-medium text-sm">iOS (WebView)</p>
                  <p className="text-xs text-muted-foreground">Use DODO or iOSMirror for app-like experience</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-primary" />
                <div>
                  <p className="text-foreground font-medium text-sm">Web Browser</p>
                  <p className="text-xs text-muted-foreground">Stream directly at netmirror.vip from any browser</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/80 gap-2">
                <Download size={16} /> Download APK
              </Button>
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary gap-2">
                <Globe size={16} /> Stream on Web
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 flex justify-center"
          >
            <img
              src="/download-app.jpg"
              alt="Download Stream Net Mirror"
              className="rounded-2xl max-w-sm w-full shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
