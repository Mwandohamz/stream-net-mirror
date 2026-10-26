import { motion } from "framer-motion";
import { Globe, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApkDownloadButton from "@/components/ApkDownloadButton";

const AppDownload = () => {
  return (
    <section id="download" className="py-8 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="font-display text-2xl md:text-5xl text-foreground mb-2 md:mb-4">
              DOWNLOAD THE APP
            </h2>
            <p className="text-xs md:text-lg text-muted-foreground mb-4 md:mb-6">
              Get StreamNetMirror on your favourite device. Free app for Android phones and TVs — no account needed to download.
            </p>

            <div className="space-y-3 md:space-y-4 mb-5 md:mb-8">
              {[
                { Icon: Smartphone, title: "Android APK", desc: "Download directly from our website" },
                { Icon: Monitor, title: "iOS (WebView)", desc: "Use DODO or iOSMirror for app-like experience" },
                { Icon: Globe, title: "Web Browser", desc: "Stream directly at streamnetmirror.app from any browser" },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-2 md:gap-3">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-medium text-xs md:text-sm">{title}</p>
                    <p className="text-[9px] md:text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3">
              <ApkDownloadButton className="gap-1.5 text-xs md:text-sm h-9 md:h-10" />
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary gap-1.5 text-xs md:text-sm h-9 md:h-10 active:scale-95 transition-transform" onClick={() => { window.location.href = "/signin"; }}>
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> Stream on Web
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
              className="rounded-2xl max-w-[200px] md:max-w-sm w-full shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
