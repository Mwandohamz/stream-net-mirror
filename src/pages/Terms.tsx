import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
      <h1 className="font-display text-4xl text-foreground mb-6">TERMS & CONDITIONS</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-muted-foreground text-sm leading-relaxed">
        <p>By using Stream Net Mirror ("the Service"), you agree to the following terms and conditions. Please read them carefully before making any payment or accessing the platform.</p>

        <h3 className="font-display text-xl text-foreground">1. Service Description</h3>
        <p>Stream Net Mirror provides users with access credentials to the NetMirror streaming portal upon successful payment. We act as an access gateway and do not host, upload, or store any streaming content on our servers.</p>

        <h3 className="font-display text-xl text-foreground">2. Payment</h3>
        <p>The service requires a one-time payment of ZMW 39 (Zambian Kwacha) via Mobile Money (Airtel Money or MTN MoMo). Payment is processed instantly and access is granted immediately upon confirmation.</p>

        <h3 className="font-display text-xl text-foreground">3. Chargebacks</h3>
        <p>Filing a chargeback or disputing a legitimate transaction may result in immediate suspension of your account and access to the streaming portal. Repeated chargeback attempts may result in permanent bans.</p>

        <h3 className="font-display text-xl text-foreground">4. Refund Policy</h3>
        <p className="text-xs text-muted-foreground/60">Refunds are available within 7 days of purchase. To request a refund, contact onlineplagiarismremover@gmail.com with your transaction details including your name, phone number, and date of payment. Refunds will be processed within 5-7 business days.</p>

        <h3 className="font-display text-xl text-foreground">5. Disclaimer</h3>
        <p>This website is intended strictly for educational and informational purposes. We do not own, manage, or have any affiliation with any streaming platforms, services, or the NetMirror app itself. We do not encourage or promote piracy or the use of illegal services in any form. We fully respect and comply with all applicable copyright laws and DMCA regulations.</p>

        <h3 className="font-display text-xl text-foreground">6. Contact</h3>
        <p>For any questions or concerns regarding these terms, please contact us at <a href="mailto:onlineplagiarismremover@gmail.com" className="text-primary hover:underline">onlineplagiarismremover@gmail.com</a>.</p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;
