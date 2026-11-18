
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Video } from "lucide-react";

interface Highlight {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  channel_title: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  competition_code: string | null;
  match_label: string | null;
  fixture_id: number | null;
}

interface Props {
  competition?: string;
  title?: string;
  limit?: number;
}

const FootballHighlights = ({
  competition,
  title = "LATEST FOOTBALL HIGHLIGHTS",
  limit = 12,
}: Props) => {
  const [videos, setVideos] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  const loadHighlights = async () => {
    setLoading(true);
    setError(false);

    const { data, error: invokeError } =
      await supabase.functions.invoke("get-football-highlights", {
        body: competition ? { competition } : {},
      });

    if (invokeError || !data?.success) {
      setError(true);
      setVideos([]);
    } else {
      setVideos((data.highlights || []).slice(0, limit));
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadHighlights();
  }, [competition, limit]);

  const formatDate = (date: string | null) => {
    if (!date) return "Recently added";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "Recently added"
      : parsed.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Video size={17} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              Football videos
            </span>
          </div>
          <h2 className="netflix-title text-xl text-foreground md:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Match highlights and football moments from verified channels.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadHighlights()}
          disabled={loading}
          className="shrink-0 gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="aspect-video animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Video className="text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">
              Highlights are temporarily unavailable.
            </p>
            <Button variant="outline" size="sm" onClick={loadHighlights}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && videos.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Video size={30} className="text-muted-foreground" />
            <p className="font-medium text-foreground">
              No highlights available yet
            </p>
            <p className="text-xs text-muted-foreground">
              New videos will appear here after they are reviewed and published.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && videos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="overflow-hidden border-border bg-card"
            >
              <div className="relative aspect-video bg-black">
                {playing === video.id ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtube_video_id)}?autoplay=1&rel=0`}
                    title={video.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(video.id)}
                    className="group absolute inset-0 h-full w-full"
                    aria-label={`Play ${video.title}`}
                  >
                    {video.thumbnail_url && (
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <Play size={24} className="ml-1 fill-current" />
                      </span>
                    </div>
                  </button>
                )}
              </div>

              <CardContent className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {video.competition_code && (
                    <Badge variant="secondary">
                      {video.competition_code}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(video.published_at)}
                  </span>
                </div>

                <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                  {video.match_label || video.title}
                </h3>

                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {video.channel_title || "Football highlights"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default FootballHighlights;
