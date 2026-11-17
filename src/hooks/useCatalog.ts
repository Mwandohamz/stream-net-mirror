
import { useQuery } from "@tanstack/react-query";
import { useDisplayCurrency } from "@/context/CurrencyContext";
import {
  fetchTMDB,
  type TMDBMediaType,
  type TMDBResponse,
} from "@/lib/tmdb";

interface UseCatalogOptions {
  mediaType: TMDBMediaType;
  query?: string;
  page?: number;
  enabled?: boolean;
}

export function useCatalog({
  mediaType,
  query = "",
  page = 1,
  enabled = true,
}: UseCatalogOptions) {
  const { country } = useDisplayCurrency();
  const region = country.iso2;
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: [
      "tmdb-catalog",
      mediaType,
      normalizedQuery || "trending",
      page,
      region,
    ],

    queryFn: () =>
      fetchTMDB<TMDBResponse>({
        action: normalizedQuery ? "search" : "trending",
        mediaType,
        page,
        ...(normalizedQuery ? { query: normalizedQuery } : {}),
        region,
      }),

    enabled,

    staleTime: normalizedQuery
      ? 3 * 60 * 60 * 1000
      : 12 * 60 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}
