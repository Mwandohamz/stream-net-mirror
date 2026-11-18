import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTMDB, getTMDBImage, getTMDBTitle, getTMDBYear, type TMDBMediaType, type TMDBTitle } from "@/lib/tmdb";

interface Props {
  title: string;
  action: "trending" | "discover";
  mediaType: TMDBMediaType;
  genreId?: number;
  originalLanguage?: string;
  limit?: number;
  onSeeMore?: () => void;
  onSelect: (item: TMDBTitle) => void;
}

/** Horizontal poster row backed by the cached TMDB catalogue (live popularity, not sample data). */
const TMDBRow = ({ title, action, mediaType, genreId, originalLanguage, limit = 20, onSeeMore, onSelect }: Props) => {
  const query = useQuery({
    queryKey: ["tmdb-row", action, mediaType, genreId ?? null, originalLanguage ?? null],
    queryFn: () => fetchTMDB({ action, mediaType, page: 1, ...(genreId ? { genreId } : {}), ...(originalLanguage ? { originalLanguage } : {}) }),
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
  });
  const items = (query.data?.results ?? []).filter(i => i.poster_path).slice(0, limit);
  if (query.isError) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground md:text-xl">{title}</h2>
        {onSeeMore && <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={onSeeMore}>See more <ChevronRight size={14} /></Button>}
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {query.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] w-28 shrink-0 animate-pulse rounded-xl bg-muted md:w-36" />)
          : items.map(item => (
            <button key={`${item.media_type ?? mediaType}-${item.id}`} type="button" onClick={() => onSelect(item)}
              className="group relative w-28 shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card text-left md:w-36">
              <img src={getTMDBImage(item.poster_path, "w342")} alt={getTMDBTitle(item)} loading="lazy" className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent p-2 pt-8">
                <p className="line-clamp-2 text-xs font-semibold text-foreground">{getTMDBTitle(item)}</p>
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Star size={10} className="fill-current text-primary" />{(item.vote_average ?? 0).toFixed(1)} · {getTMDBYear(item)}</p>
              </div>
            </button>
          ))}
      </div>
    </section>
  );
};

export default TMDBRow;
