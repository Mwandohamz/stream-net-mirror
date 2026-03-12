import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pt-12 pb-6">
      <div className="container mx-auto px-4">
        {/* Top Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="font-display text-lg text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="hover:text-foreground transition-colors">DMCA</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Account</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg text-foreground mb-4">Stream</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Movies</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">TV Series</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Originals</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">New Releases</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg text-foreground mb-4">Download</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#download" className="hover:text-foreground transition-colors">Android APK</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">iOS (WebView)</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Smart TV</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Web Browser</a></li>
            </ul>
          </div>
        </div>

        <Separator className="bg-border mb-8" />

        {/* Disclaimer */}
        <div className="mb-8">
          <h5 className="font-display text-sm text-muted-foreground mb-3 tracking-wide">DISCLAIMER</h5>
          <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-4xl">
            The website https://www.netmirrorc.com/ is intended strictly for educational and informational purposes. 
            We do not own, manage, or have any affiliation with any streaming platforms, services, or the NetMirror app itself. 
            NetMirror is a third-party application that is publicly available on the internet. Our only purpose is to share guides, 
            tutorials, and general information to help users understand how it works. We do not encourage or promote piracy or 
            the use of illegal services in any form. We fully respect and comply with all applicable copyright laws and DMCA regulations. 
            This website does not host, upload, store, or stream any movies, TV shows, or web series on our servers. 
            We are not associated with NetMirror or any similar streaming platform in any way. The content on this website is published 
            only for educational, informational, and awareness purposes.
          </p>
        </div>

        {/* Terms fine print */}
        <div className="mb-8">
          <h5 className="font-display text-sm text-muted-foreground mb-3 tracking-wide">TERMS & CONDITIONS</h5>
          <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-4xl">
            By using Stream Net Mirror, you agree to our terms of service. All payments are processed securely via Mobile Money (Airtel Money / MTN MoMo). 
            Chargebacks may result in account suspension. We reserve the right to modify pricing and services at any time.
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-2 max-w-4xl">
            Refunds are available within 7 days of purchase. To request a refund, contact onlineplagiarismremover@gmail.com with your transaction details.
          </p>
        </div>

        {/* Privacy */}
        <div className="mb-8">
          <h5 className="font-display text-sm text-muted-foreground mb-3 tracking-wide">PRIVACY POLICY</h5>
          <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-4xl">
            We collect minimal personal data required to process your payment and provide access to the service. 
            Your phone number and name are used solely for payment processing. We do not sell or share your personal information with third parties. 
            Cookies may be used for analytics purposes. By using this website, you consent to our data practices as described herein.
          </p>
        </div>

        {/* DMCA */}
        <div className="mb-8">
          <h5 className="font-display text-sm text-muted-foreground mb-3 tracking-wide">DMCA NOTICE</h5>
          <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-4xl">
            We respect copyright laws and DMCA regulations. If you believe that any content on this website violates copyright policies, 
            please contact us at <a href="mailto:onlineplagiarismremover@gmail.com" className="text-primary hover:underline">onlineplagiarismremover@gmail.com</a> and 
            we will review and remove the content if necessary.
          </p>
        </div>

        <Separator className="bg-border mb-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-hexagon.png" alt="Stream Net Mirror" className="h-6 w-6" />
            <span className="text-xs text-muted-foreground">© 2024 Stream Net Mirror. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
