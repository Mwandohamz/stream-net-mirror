import { useState } from "react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LogoShowcase from "@/components/LogoShowcase";

const termsContent = [
  { heading: "1. Service Description", text: "Stream Net Mirror provides users with access credentials to the NetMirror streaming portal upon successful payment. We act as an access gateway and do not host, upload, or store any streaming content on our servers." },
  { heading: "2. Payment", text: "The service requires a one-time payment of ZMW 39 (Zambian Kwacha) via Mobile Money (Airtel Money or MTN MoMo). Payment is processed instantly and access is granted immediately upon confirmation." },
  { heading: "3. Chargebacks", text: "Filing a chargeback or disputing a legitimate transaction may result in immediate suspension of your account and access to the streaming portal." },
  { heading: "4. Refund Policy", text: "Refunds are available within 7 days of purchase. Contact onlineplagiarismremover@gmail.com with your transaction details." },
  { heading: "5. Disclaimer", text: "This website is intended strictly for educational and informational purposes. We do not own, manage, or have any affiliation with any streaming platforms." },
];

const privacyContent = [
  { heading: "1. Information We Collect", text: "We collect your name and phone number solely for payment processing via Mobile Money." },
  { heading: "2. How We Use Your Information", text: "Your information is used exclusively to process your payment and provide access. We do not sell or share your data." },
  { heading: "3. Data Security", text: "We implement appropriate security measures. Payment processing is handled by trusted Mobile Money providers." },
  { heading: "4. Cookies", text: "Our website may use cookies for analytics purposes to improve user experience." },
  { heading: "5. Contact", text: "If you have any concerns about your privacy, contact us at onlineplagiarismremover@gmail.com." },
];

const LegalDialog = ({ title, content, fullPageLink }: { title: string; content: typeof termsContent; fullPageLink: string }) => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="hover:text-foreground transition-colors text-left">{title}</button>
    </DialogTrigger>
    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-background border-border">
      <DialogHeader>
        <DialogTitle className="font-display text-xl text-foreground">{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        {content.map((s) => (
          <div key={s.heading}>
            <h4 className="font-display text-sm text-foreground mb-1">{s.heading}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Link to={fullPageLink}>
          <Button variant="outline" size="sm" className="text-xs border-border text-foreground">View Full Page</Button>
        </Link>
      </div>
    </DialogContent>
  </Dialog>
);

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pt-8 md:pt-12 pb-4 md:pb-6">
      <div className="container mx-auto px-4">
        {/* Top Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-10">
          {[
            { title: "Company", items: [
              { label: "About Us", href: "#" },
              { label: "Terms & Conditions", dialog: "terms" },
              { label: "Privacy Policy", dialog: "privacy" },
              { label: "DMCA", href: "#" },
            ]},
            { title: "Support", items: [
              { label: "FAQ", href: "#faq" },
              { label: "Help Center", href: "#" },
              { label: "Contact Us", href: "mailto:onlineplagiarismremover@gmail.com" },
              { label: "Account", href: "#" },
            ]},
            { title: "Stream", items: [
              { label: "Movies", href: "/#trending" },
              { label: "TV Series", href: "/#trending" },
              { label: "Originals", href: "/#trending" },
              { label: "New Releases", href: "/#trending" },
            ]},
            { title: "Download", items: [
              { label: "Android APK", href: "#download" },
              { label: "iOS (WebView)", href: "#" },
              { label: "Smart TV", href: "#" },
              { label: "Web Browser", href: "#" },
            ]},
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm md:text-lg text-foreground mb-2 md:mb-4">{col.title}</h4>
              <ul className="space-y-1.5 md:space-y-2 text-[10px] md:text-sm text-muted-foreground">
                {col.items.map((item: any) => (
                  <li key={item.label}>
                    {item.dialog === "terms" ? (
                      <LegalDialog title="Terms & Conditions" content={termsContent} fullPageLink="/terms" />
                    ) : item.dialog === "privacy" ? (
                      <LegalDialog title="Privacy Policy" content={privacyContent} fullPageLink="/privacy" />
                    ) : (
                      <a href={item.href} className="hover:text-foreground transition-colors">{item.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-border mb-4 md:mb-8" />

        {/* Disclaimer */}
        <div className="mb-4 md:mb-8">
          <h5 className="font-display text-[10px] md:text-sm text-muted-foreground mb-1.5 md:mb-3 tracking-wide">DISCLAIMER</h5>
          <p className="text-[9px] md:text-xs text-muted-foreground/70 leading-relaxed max-w-4xl">
            The website https://www.netmirrorc.com/ is intended strictly for educational and informational purposes. We do not own, manage, or have any affiliation with any streaming platforms, services, or the NetMirror app itself. We do not encourage or promote piracy or the use of illegal services in any form.
          </p>
        </div>

        <Separator className="bg-border mb-4 md:mb-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3">
            <LogoShowcase size="md" />
            <span className="text-[9px] md:text-xs text-muted-foreground">© 2024 Stream Net Mirror. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <a href="mailto:onlineplagiarismremover@gmail.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
