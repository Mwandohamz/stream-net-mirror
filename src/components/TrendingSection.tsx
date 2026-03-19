import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Star, Info, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const trendingItems = [
  { title: "Stranger Things", genre: "Sci-Fi · Thriller", year: "2022", rating: "8.7", poster: "https://image.tmdb.org/t/p/w300/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", desc: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces. A group of kids, along with a mysterious girl with psychic powers, must confront shadowy government agents and monsters from another dimension." },
  { title: "The Witcher", genre: "Fantasy · Action", year: "2023", rating: "8.2", poster: "https://image.tmdb.org/t/p/w300/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", desc: "Geralt of Rivia, a mutated monster-hunter, struggles to find his place in a world where people often prove more wicked than beasts. As war rages and destiny intertwines with magic, he must protect the child of prophecy." },
  { title: "Money Heist", genre: "Crime · Drama", year: "2021", rating: "8.3", poster: "https://image.tmdb.org/t/p/w300/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg", desc: "A criminal mastermind who goes by 'The Professor' recruits a band of eight to carry out the biggest heist in recorded history — printing billions of euros inside the Royal Mint of Spain while keeping hostages as leverage." },
  { title: "Squid Game", genre: "Thriller · Drama", year: "2024", rating: "8.0", poster: "https://image.tmdb.org/t/p/w300/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", desc: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a tempting prize. But the stakes are deadly — each round of elimination is literal, and alliances are fragile." },
  { title: "Wednesday", genre: "Comedy · Mystery", year: "2022", rating: "8.1", poster: "https://image.tmdb.org/t/p/w300/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", desc: "Wednesday Addams investigates a murder spree while making new friends and foes at Nevermore Academy. Her sharp wit and supernatural visions lead her deeper into a mystery connected to her family's dark past." },
  { title: "The Crown", genre: "Drama · History", year: "2023", rating: "8.6", poster: "https://image.tmdb.org/t/p/w300/1M876KPjulVwppEpldhdc8V4o68.jpg", desc: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century. A sweeping drama of power, duty, and personal sacrifice." },
  { title: "Bridgerton", genre: "Romance · Drama", year: "2024", rating: "7.3", poster: "https://image.tmdb.org/t/p/w300/luoKpgVwi1E5nQsi7W0UOcFHQrE.jpg", desc: "Wealth, lust, and betrayal set against the backdrop of Regency-era England's competitive social season. The powerful Bridgerton family navigates love and scandal under the watchful eye of Lady Whistledown." },
  { title: "Dark", genre: "Sci-Fi · Mystery", year: "2020", rating: "8.8", poster: "https://image.tmdb.org/t/p/w300/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg", desc: "A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery spanning three generations. Time travel, paradoxes, and fate collide in this German masterpiece." },
  { title: "Narcos", genre: "Crime · Biography", year: "2017", rating: "8.8", poster: "https://image.tmdb.org/t/p/w300/rTmal9fDbwh5F0waol2hq35U4ah.jpg", desc: "A chronicled look at the criminal exploits of Colombian drug lord Pablo Escobar and the efforts of law enforcement to bring him down. From the jungles of Colombia to the streets of Miami." },
  { title: "Ozark", genre: "Crime · Thriller", year: "2022", rating: "8.5", poster: "https://image.tmdb.org/t/p/w300/pCGyPVrI9Fzw6RCBxJmEsDOxt3.jpg", desc: "A financial adviser drags his family from Chicago to the Missouri Ozarks, where he must launder money for a drug boss. As the stakes rise, the family descends deeper into a world of crime and corruption." },
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
        className="flex gap-3 md:gap-5 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        {trendingItems.map((item, i) => {
          const isActive = hoveredIdx === i || tappedIdx === i;
          const genres = item.genre.split(" · ");

          return (
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
                whileHover={{ scale: 1.06, zIndex: 20 }}
                className="w-36 h-52 md:w-56 md:h-80 rounded-xl relative overflow-hidden cursor-pointer group shadow-lg"
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Number overlay */}
                <span className="absolute -left-1 bottom-0 font-display text-[70px] md:text-[130px] leading-none text-foreground/15 select-none drop-shadow-lg pointer-events-none">
                  {i + 1}
                </span>

                {/* Default bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-4 bg-gradient-to-t from-background/95 via-background/60 to-transparent">
                  <p className="font-semibold text-foreground text-xs md:text-sm">{item.title}</p>
                  <p className="text-[8px] md:text-xs text-muted-foreground">{item.genre}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="text-primary fill-primary" />
                    <span className="text-[9px] md:text-xs text-primary font-bold">{item.rating}</span>
                    <span className="text-[8px] md:text-[10px] text-muted-foreground">· {item.year}</span>
                  </div>
                </div>

                {/* Netflix-style rich overlay */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 flex flex-col justify-end p-3 md:p-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Close button for mobile tap */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setTappedIdx(null); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground md:hidden"
                      >
                        <X size={14} />
                      </button>

                      <h3 className="font-display text-sm md:text-lg text-foreground mb-1">{item.title}</h3>
                      
                      {/* Rating & Year row */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={10}
                              className={s <= Math.round(parseFloat(item.rating) / 2) ? "text-primary fill-primary" : "text-muted-foreground/30"}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] md:text-xs text-primary font-bold">{item.rating}</span>
                        <span className="text-[9px] md:text-[11px] text-muted-foreground">{item.year}</span>
                      </div>

                      {/* Genre badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {genres.map((g) => (
                          <Badge key={g} variant="secondary" className="text-[7px] md:text-[9px] px-1.5 py-0 h-4 bg-secondary text-muted-foreground">
                            {g}
                          </Badge>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-[8px] md:text-[11px] text-muted-foreground leading-relaxed mb-3 line-clamp-4 md:line-clamp-5">{item.desc}</p>
                      
                      {/* Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 md:h-9 text-[10px] md:text-xs bg-primary text-primary-foreground hover:bg-primary/80 gap-1.5 flex-1 active:scale-95 transition-transform font-semibold"
                          onClick={handlePlay}
                        >
                          <Play size={12} className="fill-current" /> Watch Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 md:h-9 text-[10px] md:text-xs border-border text-foreground hover:bg-secondary gap-1 active:scale-95 transition-transform"
                          onClick={handlePlay}
                        >
                          <Info size={12} /> More
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrendingSection;
