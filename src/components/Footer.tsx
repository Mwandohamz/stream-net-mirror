import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pt-8 md:pt-12 pb-4 md:pb-6">
      <div className="container mx-auto px-4">
        {/* Top Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-10">
          {[
            { title: "Company", items: [
              { label: "About Us", href: "#" },
              { label: "Terms & Conditions", to: "/terms" },
              { label: "Privacy Policy", to: "/privacy" },
              { label: "DMCA", href: "#" },
            ]},
            { title: "Support", items: [
              { label: "FAQ", href: "#faq" },
              { label: "Help Center", href: "#" },
              { label: "Contact Us", href: "#" },
              { label: "Account", href: "#" },
            ]},
            { title: "Stream", items: [
              { label: "Movies", href: "#" },
              { label: "TV Series", href: "#" },
              { label: "Originals", href: "#" },
              { label: "New Releases", href: "#" },
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
                {col.items.map((item) => (
                  <li key={item.label}>
                    {"to" in item && item.to ? (
                      <Link to={item.to} className="hover:text-foreground transition-colors">{item.label}</Link>
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

        {/* Legal sections - compact on mobile */}
        {[
          { title: "DISCLAIMER", text: "The website https://www.netmirrorc.com/ is intended strictly for educational and informational purposes. We do not own, manage, or have any affiliation with any streaming platforms, services, or the NetMirror app itself. NetMirror is a third-party application that is publicly available on the internet. Our only purpose is to share guides, tutorials, and general information to help users understand how it works. We do not encourage or promote piracy or the use of illegal services in any form. We fully respect and comply with all applicable copyright laws and DMCA regulations. This website does not host, upload, store, or stream any movies, TV shows, or web series on our servers. We are not associated with NetMirror or any similar streaming platform in any way." },
          { title: "TERMS & CONDITIONS", text: "By using Stream Net Mirror, you agree to our terms of service. All payments are processed securely via Mobile Money (Airtel Money / MTN MoMo). Chargebacks may result in account suspension. We reserve the right to modify pricing and services at any time.", extra: "Refunds are available within 7 days of purchase. To request a refund, contact onlineplagiarismremover@gmail.com with your transaction details." },
          { title: "PRIVACY POLICY", text: "We collect minimal personal data required to process your payment and provide access to the service. Your phone number and name are used solely for payment processing. We do not sell or share your personal information with third parties." },
          { title: "DMCA NOTICE", text: "We respect copyright laws and DMCA regulations. If you believe that any content on this website violates copyright policies, please contact us at onlineplagiarismremover@gmail.com and we will review and remove the content if necessary." },
        ].map((section) => (
          <div key={section.title} className="mb-4 md:mb-8">
            <h5 className="font-display text-[10px] md:text-sm text-muted-foreground mb-1.5 md:mb-3 tracking-wide">{section.title}</h5>
            <p className="text-[9px] md:text-xs text-muted-foreground/70 leading-relaxed max-w-4xl">{section.text}</p>
            {section.extra && (
              <p className="text-[8px] md:text-[10px] text-muted-foreground/50 mt-1 md:mt-2 max-w-4xl">{section.extra}</p>
            )}
          </div>
        ))}

        <Separator className="bg-border mb-4 md:mb-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-hexagon.png" alt="Stream Net Mirror" className="h-5 w-5 md:h-6 md:w-6" />
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
