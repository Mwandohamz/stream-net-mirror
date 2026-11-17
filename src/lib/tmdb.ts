
import { supabase } from "@/integrations/supabase/client";

export type TMDBMediaType = "movie" | "tv" | "multi";

export interface TMDBTitle {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: "movie" | "tv";
  original_language?: string;
}

export interface TMDBResponse {
  page: number;
  results: TMDBTitle[];
  total_pages: number;
  total_results: number;
}

interface TMDBRequest {
  action: "trending" | "search" | "discover" | "details";
  mediaType: TMDBMediaType;
  page?: number;
  query?: string;
  region?: string;
  providerId?: number;
  year?: number;
  id?: number;
  language?: string;
}

export async function fetchTMDB<T = TMDBResponse>(
  request: TMDBRequest,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(
    "tmdb-catalog",
    { body: request },
  );

  if (error) {
    throw new Error(error.message || "Catalogue request failed");
  }

  if (!data?.success || data.error) {
    throw new Error(data?.error || "Unable to load catalogue");
  }

  return data.data as T;
}

export function getTMDBImage(
  path: string | null | undefined,
  size: "w342" | "w500" | "w780" | "original" = "w500",
): string {
  if (!path) return "/placeholder.svg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getTMDBTitle(item: TMDBTitle): string {
  return item.title || item.name || "Untitled";
}

export function getTMDBYear(item: TMDBTitle): string {
  const date = item.release_date || item.first_air_date;
  return date ? date.slice(0, 4) : "N/A";
}
