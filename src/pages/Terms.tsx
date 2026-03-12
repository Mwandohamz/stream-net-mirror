import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </Button>
        <h1 className="font-display text-4xl text-foreground mb-6">TERMS & CONDITIONS</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p>By using Stream Net Mirror ("the Service"), you agree to the following terms and conditions.</p>
          <h3 className="font-display text-xl text-foreground">1. Service Description</h3>
          <p>Stream Net Mirror provides users with access credentials to the NetMirror streaming portal upon successful payment. We act as an access gateway and do not host, upload, or store any streaming content on our servers.</p>
          <h3 className="font-display text-xl text-foreground">2. Payment</h3>
          <p>The service requires a one-time payment of ZMW 39 via Mobile Money (Airtel Money or MTN MoMo). Payment is processed instantly and access is granted immediately upon confirmation.</p>
          <h3 className="font-display text-xl text-foreground">3. Chargebacks</h3>
          <p>Filing a chargeback or disputing a legitimate transaction may result in immediate suspension of your account.</p>
          <h3 className="font-display text-xl text-foreground">4. Refund Policy</h3>
          <p>Refunds are available within 7 days of purchase. Contact onlineplagiarismremover@gmail.com with your transaction details.</p>
          <h3 className="font-display text-xl text-foreground">5. Disclaimer</h3>
          <p>This website is intended strictly for educational and informational purposes. We do not encourage or promote piracy.</p>
          <h3 className="font-display text-xl text-foreground">6. Contact</h3>
          <p>For questions, contact <a href="mailto:onlineplagiarismremover@gmail.com" className="text-primary hover:underline">onlineplagiarismremover@gmail.com</a>.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
