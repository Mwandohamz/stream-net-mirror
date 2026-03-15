import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </Button>
        <h1 className="font-display text-4xl text-foreground mb-6">PRIVACY POLICY</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p>Your privacy is important to us. This policy explains how Stream Net Mirror collects, uses, and protects your personal data.</p>
          <h3 className="font-display text-xl text-foreground">1. Information We Collect</h3>
          <p>We collect your name and phone number solely for payment processing via Mobile Money.</p>
          <h3 className="font-display text-xl text-foreground">2. How We Use Your Information</h3>
          <p>Your information is used exclusively to process your payment and provide access. We do not sell or share your data.</p>
          <h3 className="font-display text-xl text-foreground">3. Data Security</h3>
          <p>We implement appropriate security measures. Payment processing is handled by trusted Mobile Money providers.</p>
          <h3 className="font-display text-xl text-foreground">4. Cookies</h3>
          <p>Our website may use cookies for analytics purposes to improve user experience.</p>
          <h3 className="font-display text-xl text-foreground">5. Third-Party Links</h3>
          <p>Our website may contain links to third-party websites. We are not responsible for their privacy practices.</p>
          <h3 className="font-display text-xl text-foreground">6. Contact</h3>
          <p>Contact us at <a href="mailto:shuvaegonera@gmail.com" className="text-primary hover:underline">shuvaegonera@gmail.com</a>.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
