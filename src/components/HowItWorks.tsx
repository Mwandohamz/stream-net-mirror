import { motion } from "framer-motion";
import { UserPlus, CreditCard, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const steps = [
  { icon: UserPlus, title: "Sign Up", desc: "Enter your details to create an account" },
  { icon: CreditCard, title: "Pay ZMW 49", desc: "One-time payment via Airtel Money or MTN MoMo" },
  { icon: Play, title: "Start Streaming", desc: "Get instant access to 50+ OTT platforms" },
];

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="netflix-title text-2xl md:text-5xl text-foreground mb-1 md:mb-2">HOW IT WORKS</h2>
        <p className="text-xs md:text-base text-muted-foreground mb-6 md:mb-12 font-medium">Get started in 3 simple steps</p>

        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-8 max-w-4xl mx-auto mb-6 md:mb-10">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-2 md:mb-4">
                <s.icon className="w-5 h-5 md:w-8 md:h-8 text-primary" />
              </div>
              <span className="font-display text-[10px] md:text-sm text-primary mb-0.5 md:mb-1 block">Step {i + 1}</span>
              <h3 className="netflix-title text-sm md:text-2xl text-foreground mb-0.5 md:mb-2">{s.title}</h3>
              <p className="text-[9px] md:text-sm text-muted-foreground font-medium">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold px-6 md:px-10 text-sm md:text-base active:scale-95 transition-transform"
          onClick={() => navigate("/payment")}
        >
          Get Started Now — ZMW 49
        </Button>
      </div>
    </section>
  );
};

export default HowItWorks;
