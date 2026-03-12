import { motion } from "framer-motion";
import { UserPlus, CreditCard, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const steps = [
  { icon: UserPlus, title: "Sign Up", desc: "Enter your details to create an account" },
  { icon: CreditCard, title: "Pay ZMW 39", desc: "One-time payment via Airtel Money or MTN MoMo" },
  { icon: Play, title: "Start Streaming", desc: "Get instant access to 50+ OTT platforms" },
];

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-4xl md:text-5xl text-foreground mb-2">HOW IT WORKS</h2>
        <p className="text-muted-foreground mb-12">Get started in 3 simple steps</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
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
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                <s.icon size={32} className="text-primary" />
              </div>
              <span className="font-display text-sm text-primary mb-1 block">Step {i + 1}</span>
              <h3 className="font-display text-2xl text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold px-10"
          onClick={() => navigate("/payment")}
        >
          Get Started Now — ZMW 39
        </Button>
      </div>
    </section>
  );
};

export default HowItWorks;
