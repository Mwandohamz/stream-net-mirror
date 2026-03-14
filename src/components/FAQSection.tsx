import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppSettings } from "@/hooks/useAppSettings";

const FAQSection = () => {
  const { settings } = useAppSettings();
  const price = parseFloat(settings.base_price_zmw || "49") || 49;

  const faqs = [
    { q: "What is StreamNetMirror?", a: `StreamNetMirror is your gateway to accessing premium content from 50+ OTT platforms including Netflix, Disney+, Prime Video, HBO Max and more — all with a single one-time payment of ZMW ${price}.` },
    { q: "How much does it cost?", a: `StreamNetMirror costs a one-time payment of ZMW ${price}. There are no recurring fees or hidden charges. Pay once and get lifetime access.` },
    { q: "What payment methods are accepted?", a: "We accept Mobile Money payments through Airtel Money and MTN MoMo. Simply enter your phone number and provider to complete the payment." },
    { q: "How do I access the streaming service after payment?", a: "After successful payment, you'll be prompted to create an account using your payment email. Once verified, sign in to access the StreamNetMirror member dashboard with the streaming portal link and setup instructions." },
    { q: "Can I download the app?", a: "Yes! The StreamNetMirror APK is available for Android devices through the member dashboard. iOS users can access it via WebView tools. You can also stream directly through any web browser." },
    { q: "What devices are supported?", a: "StreamNetMirror works on Android phones & tablets, iOS devices (via WebView), Smart TVs, web browsers on PC/Mac, and even gaming consoles via web browser." },
    { q: "Is there a refund policy?", a: "Refunds are available within 7 days of purchase. Contact us at onlineplagiarismremover@gmail.com with your transaction details to request a refund." },
    { q: "Is my payment information safe?", a: "Yes, all payments are processed securely through Mobile Money providers (Airtel Money / MTN MoMo). We do not store any sensitive payment information on our servers." },
    { q: "What happens after I pay?", a: "After payment, you'll create an account using your payment email. You'll then receive login details and instructions via email. Sign in anytime to access the streaming portal, download the app, or contact support." },
  ];

  return (
    <section id="faq" className="py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="netflix-title text-2xl md:text-5xl text-foreground text-center mb-1 md:mb-2">
          FREQUENTLY ASKED QUESTIONS
        </h2>
        <p className="text-xs md:text-base text-muted-foreground text-center mb-6 md:mb-10 font-medium">
          Everything you need to know about StreamNetMirror
        </p>

        <Accordion type="single" collapsible className="space-y-1.5 md:space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border rounded-lg px-3 md:px-4 data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="text-foreground hover:no-underline text-left text-xs md:text-sm font-medium py-3 md:py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[11px] md:text-sm pb-3 md:pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
