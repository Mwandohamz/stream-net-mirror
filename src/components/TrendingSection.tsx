import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Star, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const trendingItems = [
  { title: "Stranger Things", genre: "Sci-Fi · Thriller", year: "2022", rating: "8.7", poster: "https://image.tmdb.org/t/p/w300/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", desc: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces." },
  { title: "The Witcher", genre: "Fantasy · Action", year: "2023", rating: "8.2", poster: "https://image.tmdb.org/t/p/w300/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", desc: "Geralt of Rivia, a mutated monster-hunter, struggles to find his place in a world where people often prove more wicked than beasts." },
  { title: "Money Heist", genre: "Crime · Drama", year: "2021", rating: "8.3", poster: "https://image.tmdb.org/t/p/w300/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg", desc: "A criminal mastermind who goes by 'The Professor' recruits a band of eight to carry out the biggest heist in recorded history." },
  { title: "Squid Game", genre: "Thriller · Drama", year: "2024", rating: "8.0", poster: "https://image.tmdb.org/t/p/w300/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", desc: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a tempting prize." },
  { title: "Wednesday", genre: "Comedy · Mystery", year: "2022", rating: "8.1", poster: "https://image.tmdb.org/t/p/w300/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", desc: "Wednesday Addams investigates a murder spree while making new friends and foes at Nevermore Academy." },
  { title: "The Crown", genre: "Drama · History", year: "2023", rating: "8.6", poster: "https://image.tmdb.org/t/p/w300/1M876KPjulVwppEpldhdc8V4o68.jpg", desc: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century." },
  { title: "Bridgerton", genre: "Romance · Drama", year: "2024", rating: "7.3", poster: "https://image.tmdb.org/t/p/w300/luoKpgVwi1E5nQsi7W0UOcFHQrE.jpg", desc: "Wealth, lust, and betrayal set against the backdrop of Regency-era England's competitive social season." },
  { title: "Dark", genre: "Sci-Fi · Mystery", year: "2020", rating: "8.8", poster: "https://image.tmdb.org/t/p/w300/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg", desc: "A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery spanning three generations." },
  { title: "Narcos", genre: "Crime · Biography", year: "2017", rating: "8.8", poster: "https://image.tmdb.org/t/p/w300/rTmal9fDbwh5F0waol2hq35U4ah.jpg", desc: "A chronicled look at the criminal exploits of Colombian drug lord Pablo Escobar and the efforts of law enforcement to bring him down." },
  { title: "Ozark", genre: "Crime · Thriller", year: "2022", rating: "8.5", poster: "https://image.tmdb.org/t/p/w300/pCGyPVrI9Fzw6RCBxJmEsDOxt3.jpg", desc: "A financial adviser drags his family from Chicago to the Missouri Ozarks, where he must launder money for a drug boss." },
];

const TrendingSection = () => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tappedIdx, setTappedIdx] = useState<number | null>(null);

  const handlePlay = () => navigate("/payment");

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
          <div
            key={item.title}
            className="flex-shrink-0 relative snap-start"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => setTappedIdx(tappedIdx === i ? null : i)}
          >
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.08, zIndex: 20 }}
              className="w-28 h-40 md:w-52 md:h-72 rounded-lg relative overflow-hidden cursor-pointer group"
            >
              <img
                src={item.poster}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Number overlay */}
              <span className="absolute -left-1 bottom-0 font-display text-[60px] md:text-[120px] leading-none text-foreground/15 select-none drop-shadow-lg pointer-events-none">
                {i + 1}
              </span>

              {/* Default bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-background/95 to-transparent">
                <p className="font-semibold text-foreground text-[10px] md:text-sm">{item.title}</p>
                <p className="text-[8px] md:text-xs text-muted-foreground">{item.genre}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] md:text-[10px] text-primary font-bold">★ {item.rating}</span>
                  <span className="text-[8px] md:text-[10px] text-muted-foreground">· {item.year}</span>
                </div>
              </div>

              {/* Netflix-style hover/tap overlay */}
              <AnimatePresence>
                {(hoveredIdx === i || tappedIdx === i) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-background/90 flex flex-col justify-end p-2 md:p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="font-display text-xs md:text-base text-foreground mb-0.5">{item.title}</h3>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star size={10} className="text-primary fill-primary" />
                      <span className="text-[9px] md:text-xs text-primary font-bold">{item.rating}</span>
                      <span className="text-[8px] md:text-[10px] text-muted-foreground">{item.year}</span>
                      <span className="text-[8px] md:text-[10px] text-muted-foreground">· {item.genre}</span>
                    </div>
                    <p className="text-[7px] md:text-[10px] text-muted-foreground leading-snug mb-2 line-clamp-3">{item.desc}</p>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-6 md:h-8 text-[9px] md:text-xs bg-primary text-primary-foreground hover:bg-primary/80 gap-1 flex-1 active:scale-95"
                        onClick={handlePlay}
                      >
                        <Play size={10} className="fill-current" /> Play
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 md:h-8 text-[9px] md:text-xs border-border text-foreground hover:bg-secondary gap-1 active:scale-95"
                        onClick={handlePlay}
                      >
                        <Info size={10} /> More
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingSection;
