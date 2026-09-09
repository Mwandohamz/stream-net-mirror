import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Star, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { CatalogItem } from "@/data/catalog";
import { categoriesOf } from "@/data/catalog";
import { useMembership } from "@/hooks/useMembership";

interface Props {
  title: string;
  subtitle: string;
  items: CatalogItem[];
}

const Poster = ({ item, onOpen, onWatch }: { item: CatalogItem; onOpen: () => void; onWatch: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group relative overflow-hidden rounded-xl bg-secondary shadow-lg"
  >
    <button onClick={onOpen} className="relative block w-full text-left" aria-label={`More info about ${item.title}`}>
      <img
        src={item.poster}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent px-2 pb-2 pt-6 md:px-3">
        <p className="truncate text-xs font-semibold text-foreground md:text-sm">{item.title}</p>
        <div className="mt-0.5 flex items-center gap-1">
          <Star size={10} className="fill-primary text-primary" />
          <span className="text-[10px] font-bold text-primary">{item.rating}</span>
          <span className="text-[9px] text-muted-foreground">· {item.year}</span>
        </div>
      </div>
    </button>
    <div className="flex gap-1.5 p-2">
      <Button size="sm" className="h-8 flex-1 gap-1 bg-primary text-[11px] text-primary-foreground" onClick={onWatch}>
        <Play size={12} className="fill-current" /> Watch now
      </Button>
      <Button size="sm" variant="outline" className="h-8 gap-1 border-border px-2 text-[11px] text-foreground" onClick={onOpen}>
        <Info size={12} />
      </Button>
    </div>
  </motion.div>
);

/** Netflix-style browse experience: search, category rows and a details pop-up. */
const CatalogBrowser = ({ title, subtitle, items }: Props) => {
  const navigate = useNavigate();
  const { isMember, ctaHref } = useMembership();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState<CatalogItem | null>(null);

  const categories = useMemo(() => ["All", ...categoriesOf(items)], [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (active === "All" || i.categories.includes(active)) &&
        (!q || i.title.toLowerCase().includes(q) || i.genre.toLowerCase().includes(q) || i.platform.toLowerCase().includes(q))
    );
  }, [items, query, active]);

  const watch = () => navigate(isMember ? ctaHref : "/signup");

  return (
    <section className="container mx-auto px-4 pb-16 pt-24 md:pt-28">
      <header className="mx-auto max-w-2xl space-y-2 text-center">
        <h1 className="netflix-title text-3xl text-foreground md:text-5xl">{title}</h1>
        <p className="text-sm text-muted-foreground md:text-base">{subtitle}</p>
      </header>

      <div className="mx-auto mt-6 max-w-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, genre or platform…"
            className="h-11 rounded-full border-border bg-secondary/70 pl-9 pr-9 text-sm"
            aria-label="Search the catalogue"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active === c ? "border-primary bg-primary text-primary-foreground font-semibold" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto max-w-lg space-y-3 py-14 text-center">
          <p className="text-sm font-semibold text-foreground">
            “{query}” isn’t in this preview list — but it’s still available to members.
          </p>
          <p className="text-sm text-muted-foreground">
            Once you pay, you get access to every streaming platform we mirror — Netflix, Disney+, HBO Max, Prime, Apple TV+,
            JioHotstar, Paramount+ and live sports. That means every show and movie, including the one you just searched for.
          </p>
          <Button className="h-11 gap-1.5 bg-primary font-semibold text-primary-foreground" onClick={watch}>
            <Play size={15} className="fill-current" /> Unlock everything
          </Button>
        </div>
      ) : (

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
          {filtered.map((item) => (
            <Poster key={item.title} item={item} onOpen={() => setSelected(item)} onWatch={watch} />
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-card p-0">
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <img src={selected.poster} alt={selected.title} className="h-52 w-full object-cover object-top" />
                <div className="space-y-3 p-5">
                  <h2 className="netflix-title text-2xl text-foreground">{selected.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground text-[10px]">{selected.platform}</Badge>
                    {selected.genre.split(" · ").map((g) => (
                      <Badge key={g} variant="outline" className="border-border text-[10px] text-muted-foreground">{g}</Badge>
                    ))}
                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                      <Star size={12} className="fill-primary" /> {selected.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">{selected.year}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{selected.desc}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="h-11 flex-1 gap-1.5 bg-primary font-semibold text-primary-foreground" onClick={watch}>
                      <Play size={15} className="fill-current" /> Watch now
                    </Button>
                    <Button variant="outline" className="h-11 border-border text-foreground" onClick={() => setSelected(null)}>
                      Close
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Create your free account to unlock verified links for this title and everything else in the library.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CatalogBrowser;
