import { motion } from "framer-motion";

const trendingItems = [
  { title: "Stranger Things", genre: "Sci-Fi · Thriller", color: "from-red-900 to-red-600" },
  { title: "The Witcher", genre: "Fantasy · Action", color: "from-emerald-900 to-emerald-600" },
  { title: "Money Heist", genre: "Crime · Drama", color: "from-rose-900 to-rose-600" },
  { title: "Squid Game", genre: "Thriller · Drama", color: "from-pink-900 to-pink-600" },
  { title: "Wednesday", genre: "Comedy · Mystery", color: "from-violet-900 to-violet-600" },
  { title: "The Crown", genre: "Drama · History", color: "from-amber-900 to-amber-600" },
  { title: "Bridgerton", genre: "Romance · Drama", color: "from-blue-900 to-blue-600" },
  { title: "Dark", genre: "Sci-Fi · Mystery", color: "from-slate-800 to-slate-600" },
  { title: "Narcos", genre: "Crime · Biography", color: "from-lime-900 to-lime-600" },
  { title: "Ozark", genre: "Crime · Thriller", color: "from-cyan-900 to-cyan-600" },
];

const TrendingSection = () => {
  return (
    <section id="trending" className="py-16 overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <h2 className="font-display text-4xl md:text-5xl text-foreground">TRENDING NOW</h2>
        <p className="text-muted-foreground mt-1">Top 10 most watched this week</p>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
        {trendingItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
            className="flex-shrink-0 relative group cursor-pointer"
          >
            <div className={`w-44 md:w-52 h-64 md:h-72 rounded-lg bg-gradient-to-br ${item.color} relative overflow-hidden transition-transform duration-300 group-hover:scale-105`}>
              {/* Number overlay */}
              <span className="absolute -left-2 bottom-0 font-display text-[120px] leading-none text-foreground/10 select-none">
                {i + 1}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.genre}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrendingSection;
