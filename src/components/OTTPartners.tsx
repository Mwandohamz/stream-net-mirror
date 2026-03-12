import { motion } from "framer-motion";
import { Tv, Film, Play, Monitor, Radio, Clapperboard, Popcorn, Headphones, Video } from "lucide-react";

const partners = [
  { name: "Netflix", icon: Film, color: "text-red-500" },
  { name: "Disney+", icon: Clapperboard, color: "text-blue-400" },
  { name: "Prime Video", icon: Play, color: "text-cyan-400" },
  { name: "HBO Max", icon: Tv, color: "text-purple-400" },
  { name: "Hulu", icon: Monitor, color: "text-green-400" },
  { name: "Peacock", icon: Radio, color: "text-yellow-400" },
  { name: "Paramount+", icon: Popcorn, color: "text-blue-500" },
  { name: "Apple TV+", icon: Headphones, color: "text-gray-300" },
  { name: "YouTube", icon: Video, color: "text-red-400" },
];

const OTTPartners = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-4xl md:text-5xl text-foreground mb-2">ALL YOUR FAVORITES</h2>
        <p className="text-muted-foreground mb-10">Access 50+ OTT platforms with a single payment</p>

        <div className="relative mb-8 max-w-3xl mx-auto overflow-hidden rounded-xl">
          <img src="/ott-brands.jpg" alt="OTT Platforms" className="w-full object-cover rounded-xl opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-9 gap-4 max-w-4xl mx-auto">
          {partners.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors cursor-pointer group"
            >
              <p.icon size={28} className={`${p.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{p.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OTTPartners;
