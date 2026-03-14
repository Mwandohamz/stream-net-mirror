import { motion } from "framer-motion";
import { Ban, MonitorPlay, Smartphone, Globe } from "lucide-react";

const features = [
  { icon: Ban, title: "Ad-Free Streaming", desc: "Enjoy uninterrupted viewing with zero ads across all content." },
  { icon: MonitorPlay, title: "HD & 4K Quality", desc: "Crystal clear streaming up to 4K resolution on supported devices." },
  { icon: Smartphone, title: "Multi-Device Access", desc: "Stream on your phone, tablet, laptop, or Smart TV — anywhere." },
  { icon: Globe, title: "35+ Languages", desc: "Subtitles and audio in over 35 languages for global content." },
];

const FeaturesGrid = () => {
  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="font-display text-2xl md:text-5xl text-foreground mb-1 md:mb-2">WHY STREAMNETMIRROR?</h2>
          <p className="text-xs md:text-base text-muted-foreground">Premium features, unbeatable price</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-3 md:p-6 hover:border-primary/40 transition-all group hover:shadow-[0_0_30px_hsl(0_85%_50%/0.1)] active:scale-95"
            >
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 md:mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-4 h-4 md:w-6 md:h-6 text-primary" />
              </div>
              <h3 className="font-display text-sm md:text-xl text-foreground mb-1 md:mb-2">{f.title}</h3>
              <p className="text-[10px] md:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
