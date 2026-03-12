import { motion } from "framer-motion";

const trendingItems = [
  { title: "Stranger Things", genre: "Sci-Fi · Thriller", year: "2022", rating: "8.7", poster: "https://image.tmdb.org/t/p/w300/49WJfeN0moxb9IPfGn8AIqMGskD.jpg" },
  { title: "The Witcher", genre: "Fantasy · Action", year: "2023", rating: "8.2", poster: "https://image.tmdb.org/t/p/w300/7vjaCdMw15FEbXyLQTVa04URsPm.jpg" },
  { title: "Money Heist", genre: "Crime · Drama", year: "2021", rating: "8.3", poster: "https://image.tmdb.org/t/p/w300/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg" },
  { title: "Squid Game", genre: "Thriller · Drama", year: "2024", rating: "8.0", poster: "https://image.tmdb.org/t/p/w300/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg" },
  { title: "Wednesday", genre: "Comedy · Mystery", year: "2022", rating: "8.1", poster: "https://image.tmdb.org/t/p/w300/9PFonBhy4cQy7Jz20NpMygczOkv.jpg" },
  { title: "The Crown", genre: "Drama · History", year: "2023", rating: "8.6", poster: "https://image.tmdb.org/t/p/w300/1M876KPjulVwppEpldhdc8V4o68.jpg" },
  { title: "Bridgerton", genre: "Romance · Drama", year: "2024", rating: "7.3", poster: "https://image.tmdb.org/t/p/w300/luoKpgVwi1E5nQsi7W0UOcFHQrE.jpg" },
  { title: "Dark", genre: "Sci-Fi · Mystery", year: "2020", rating: "8.8", poster: "https://image.tmdb.org/t/p/w300/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg" },
  { title: "Narcos", genre: "Crime · Biography", year: "2017", rating: "8.8", poster: "https://image.tmdb.org/t/p/w300/rTmal9fDbwh5F0waol2hq35U4ah.jpg" },
  { title: "Ozark", genre: "Crime · Thriller", year: "2022", rating: "8.5", poster: "https://image.tmdb.org/t/p/w300/pCGyPVrI9Fzw6RCBxJmEsDOxt3.jpg" },
];

const TrendingSection = () => {
  return (
    <section id="trending" className="py-8 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4 mb-3 md:mb-6">
        <h2 className="font-display text-2xl md:text-5xl text-foreground">TRENDING NOW</h2>
        <p className="text-muted-foreground text-xs md:text-base mt-1">Top 10 most watched this week</p>
      </div>

      <div
        className="flex gap-2 md:gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        {trendingItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
            className="flex-shrink-0 relative group cursor-pointer snap-start active:scale-95 transition-transform"
          >
            <div className="w-28 h-40 md:w-52 md:h-72 rounded-lg relative overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img
                src={item.poster}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Number overlay */}
              <span className="absolute -left-1 bottom-0 font-display text-[60px] md:text-[120px] leading-none text-foreground/15 select-none drop-shadow-lg">
                {i + 1}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-background/95 to-transparent">
                <p className="font-semibold text-foreground text-[10px] md:text-sm">{item.title}</p>
                <p className="text-[8px] md:text-xs text-muted-foreground">{item.genre}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] md:text-[10px] text-primary font-bold">★ {item.rating}</span>
                  <span className="text-[8px] md:text-[10px] text-muted-foreground">· {item.year}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrendingSection;
