import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
      <h1 className="font-display text-4xl text-foreground mb-6">PRIVACY POLICY</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-muted-foreground text-sm leading-relaxed">
        <p>Your privacy is important to us. This policy explains how Stream Net Mirror collects, uses, and protects your personal data.</p>

        <h3 className="font-display text-xl text-foreground">1. Information We Collect</h3>
        <p>We collect your name and phone number solely for payment processing via Mobile Money. We do not collect credit card information, browsing history, or any other personal data beyond what is necessary to process your payment.</p>

        <h3 className="font-display text-xl text-foreground">2. How We Use Your Information</h3>
        <p>Your information is used exclusively to process your one-time payment and provide you with access to the streaming portal. We do not sell, share, or distribute your personal information to third parties.</p>

        <h3 className="font-display text-xl text-foreground">3. Data Security</h3>
        <p>We implement appropriate security measures to protect your personal data. Payment processing is handled by trusted Mobile Money providers (Airtel Money and MTN MoMo).</p>

        <h3 className="font-display text-xl text-foreground">4. Cookies</h3>
        <p>Our website may use cookies for analytics purposes to improve user experience. By using our website, you consent to the use of cookies.</p>

        <h3 className="font-display text-xl text-foreground">5. Third-Party Links</h3>
        <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.</p>

        <h3 className="font-display text-xl text-foreground">6. Contact</h3>
        <p>If you have any concerns about your privacy, contact us at <a href="mailto:onlineplagiarismremover@gmail.com" className="text-primary hover:underline">onlineplagiarismremover@gmail.com</a>.</p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Privacy;
