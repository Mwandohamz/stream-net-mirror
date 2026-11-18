import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import TMDBRow from "@/components/TMDBRow";
import FootballHighlights from "@/components/FootballHighlights";
import { useMembership } from "@/hooks/useMembership";
import { publicWatchDestination } from "@/lib/watchIntent";

/** Public-site discovery rows; every tap follows account → payment → watch. */
const DiscoverRows = () => {
  const navigate = useNavigate();
  const { state } = useMembership();
  const watch = () => navigate(publicWatchDestination(state));

  return (
    <section id="discover" className="container mx-auto space-y-8 px-4 py-8 md:py-12">
      <TMDBRow title="Popular Movies" action="discover" mediaType="movie" onSeeMore={() => navigate("/movies")} onSelect={watch} />
      <TMDBRow title="Popular TV Series" action="discover" mediaType="tv" onSeeMore={() => navigate("/tv-series")} onSelect={watch} />
      <TMDBRow title="Anime" action="discover" mediaType="tv" genreId={16} originalLanguage="ja" onSeeMore={() => navigate("/tv-series")} onSelect={watch} />
      <div className="space-y-2">
        <div className="flex justify-end"><Link to="/live-sports" className="inline-flex items-center gap-1 text-sm font-medium text-primary">See more <ChevronRight size={14} /></Link></div>
        <FootballHighlights title="FOOTBALL HIGHLIGHTS" limit={6} />
      </div>
    </section>
  );
};

export default DiscoverRows;
