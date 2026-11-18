
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Info,
  Star,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMembership } from "@/hooks/useMembership";
import { useCatalog } from "@/hooks/useCatalog";
import {
  getTMDBImage,
  getTMDBTitle,
  getTMDBYear,
  type TMDBMediaType,
  type TMDBTitle,
} from "@/lib/tmdb";
import { useDisplayCurrency } from "@/context/CurrencyContext";
import { useTMDBProviders } from "@/hooks/useTMDBProviders";

interface Props {
  title: string;
  subtitle: string;
  mediaType: "movie" | "tv";
}

const GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

const getGenres = (item: TMDBTitle) =>
  (item.genre_ids || [])
    .map((id) => GENRES[id])
    .filter(Boolean);

const Poster = ({
  item,
  mediaType,
  onOpen,
  onWatch,
}: {
  item: TMDBTitle;
  mediaType: TMDBMediaType;
  onOpen: () => void;
  onWatch: () => void;
}) => {
  const title = getTMDBTitle(item);
  const genres = getGenres(item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden rounded-xl bg-secondary shadow-lg"
    >
      <button
        onClick={onOpen}
        className="relative block w-full text-left"
        aria-label={`More information about ${title}`}
      >
        <img
          src={getTMDBImage(item.poster_path, "w342")}
          alt={title}
          loading="lazy"
          decoding="async"
          className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent px-2 pb-2 pt-6 md:px-3">
          <p className="truncate text-xs font-semibold text-foreground md:text-sm">
            {title}
          </p>

          <div className="mt-0.5 flex items-center gap-1">
            <Star size={10} className="fill-primary text-primary" />
            <span className="text-[10px] font-bold text-primary">
              {item.vote_average?.toFixed(1) || "N/A"}
            </span>
            <span className="text-[9px] text-muted-foreground">
              · {getTMDBYear(item)}
            </span>
          </div>
        </div>
      </button>

      <div className="flex gap-1.5 p-2">
        <Button
          size="sm"
          className="h-8 flex-1 gap-1 bg-primary text-[11px] text-primary-foreground"
          onClick={onWatch}
        >
          <Play size={12} className="fill-current" />
          Watch now
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 border-border px-2 text-[11px] text-foreground"
          onClick={onOpen}
          aria-label={`More information about ${title}`}
        >
          <Info size={12} />
        </Button>
      </div>
    </motion.div>
  );
};

const CatalogBrowser = ({ title, subtitle, mediaType }: Props) => {
  const navigate = useNavigate();
  const { isMember, ctaHref } = useMembership();
  const { country, countries, setCountryIso2 } = useDisplayCurrency();

  const [providerId, setProviderId] = useState<number | undefined>(undefined);

  const providersQuery = useTMDBProviders(mediaType);

  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [selected, setSelected] = useState<TMDBTitle | null>(null);
  const [page, setPage] = useState(1);

  const catalogQuery = useCatalog({
  mediaType,
  query,
  page,
  providerId,
  });

  const items = catalogQuery.data?.results || [];

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(items.flatMap((item) => getGenres(item))),
      ).sort(),
    ],
    [items],
  );

  const filtered = useMemo(
    () =>
      activeGenre === "All"
        ? items
        : items.filter((item) =>
            getGenres(item).includes(activeGenre),
          ),
    [items, activeGenre],
  );

  const watch = () => navigate(isMember ? ctaHref : "/signup");

  const handleSearch = (value: string) => {
  setQuery(value);
  setPage(1);
  setActiveGenre("All");

  if (value.trim()) {
    setProviderId(undefined);
  }
};

  const handleGenre = (genre: string) => {
    setActiveGenre(genre);
  };

  const selectedGenres = selected ? getGenres(selected) : [];

  return (
    <section className="container mx-auto px-4 pb-16 pt-24 md:pt-28">
      <header className="mx-auto max-w-2xl space-y-2 text-center">
        <h1 className="netflix-title text-3xl text-foreground md:text-5xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {subtitle}
        </p>
      </header>

      <div className="mx-auto mt-6 max-w-xl">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search movies and titles..."
            className="h-11 rounded-full border-border bg-secondary/70 pl-9 pr-9 text-sm"
            aria-label="Search the catalogue"
          />

          {query && (
            <button
              onClick={() => handleSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

            <div className="mx-auto mt-4 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">

        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Availability country
          </label>

          <select
            value={country.iso2}
            onChange={(e) => {
              setCountryIso2(e.target.value);
              setProviderId(undefined);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground"
          >
            {countries.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Streaming platform
          </label>

          <select
            value={providerId ? String(providerId) : "all"}
            onChange={(e) => {
              setProviderId(
                e.target.value === "all"
                  ? undefined
                  : Number(e.target.value)
              );
              setPage(1);
              setActiveGenre("All");
            }}
            disabled={providersQuery.isLoading || !!query.trim()}
            className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground disabled:opacity-50"
          >
            <option value="all">All platforms</option>

            {(providersQuery.data?.results || []).map((provider) => (
              <option
                key={provider.provider_id}
                value={provider.provider_id}
              >
                {provider.provider_name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {query.trim() && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Clear your search to filter titles by streaming platform.
        </p>
      )}

      {!catalogQuery.isLoading && categories.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenre(genre)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors ${
                activeGenre === genre
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {catalogQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : catalogQuery.isError ? (
        <div className="mx-auto max-w-lg space-y-3 py-14 text-center">
          <p className="font-semibold text-foreground">
            Catalogue temporarily unavailable
          </p>
          <p className="text-sm text-muted-foreground">
            We couldn't load the titles right now. Please try again.
          </p>
          <Button onClick={() => catalogQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-auto max-w-lg space-y-3 py-14 text-center">
          <p className="font-semibold text-foreground">
            No titles found
          </p>
          <p className="text-sm text-muted-foreground">
            Try another search or choose a different genre.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              handleSearch("");
              setActiveGenre("All");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {filtered.map((item) => (
              <Poster
                key={item.id}
                item={item}
                mediaType={mediaType}
                onOpen={() => setSelected(item)}
                onWatch={watch}
              />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              disabled={page <= 1 || catalogQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {page} of {catalogQuery.data?.total_pages || 1}
            </span>

            <Button
              variant="outline"
              disabled={
                page >= (catalogQuery.data?.total_pages || 1) ||
                catalogQuery.isFetching
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    catalogQuery.data?.total_pages || current,
                    current + 1,
                  ),
                )
              }
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-card p-0">
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <img
                  src={getTMDBImage(selected.backdrop_path || selected.poster_path, "w780")}
                  alt={getTMDBTitle(selected)}
                  className="h-52 w-full object-cover object-top"
                />

                <div className="space-y-3 p-5">
                  <h2 className="netflix-title text-2xl text-foreground">
                    {getTMDBTitle(selected)}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-border text-[10px] text-muted-foreground"
                    >
                      {mediaType === "movie" ? "Movie" : "TV Series"}
                    </Badge>

                    {selectedGenres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-border text-[10px] text-muted-foreground"
                      >
                        {genre}
                      </Badge>
                    ))}

                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                      <Star size={12} className="fill-primary" />
                      {selected.vote_average?.toFixed(1) || "N/A"}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {getTMDBYear(selected)}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selected.overview || "No description is available yet."}
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="h-11 flex-1 gap-1.5 bg-primary font-semibold text-primary-foreground"
                      onClick={watch}
                    >
                      <Play size={15} className="fill-current" />
                      Watch now
                    </Button>

                    <Button
                      variant="outline"
                      className="h-11 border-border text-foreground"
                      onClick={() => setSelected(null)}
                    >
                      Close
                    </Button>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Catalogue information is provided for discovery.
                    Streaming access depends on your membership and the
                    available links in your account.
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
