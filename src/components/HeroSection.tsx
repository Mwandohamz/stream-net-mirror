import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, ChevronRight } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <Play size={14} className="text-primary fill-primary" />
            <span className="text-xs text-primary font-medium">Now Streaming Worldwide</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl text-foreground leading-[0.9] mb-4">
            UNLIMITED MOVIES,
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-orange-500 bg-clip-text text-transparent">
              TV SHOWS & MORE
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-3 max-w-2xl mx-auto">
            Access Netflix, Prime Video, Disney+, HBO Max & 50+ OTT platforms — all in one place.
          </p>

          <p className="text-sm text-muted-foreground mb-8">
            Starting at just <span className="text-primary font-bold">ZMW 39</span> — one-time payment, instant access.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-6">
            <Input
              placeholder="Enter your email to get started"
              className="h-12 bg-secondary/80 border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold gap-1 px-8"
              onClick={() => navigate("/payment")}
            >
              Get Started <ChevronRight size={18} />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60">
            Ready to stream? Pay once and get unlimited access. No recurring fees.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
