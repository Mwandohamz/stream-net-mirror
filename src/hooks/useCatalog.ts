
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
  providerId?: number;
  enabled?: boolean;
}

export function useCatalog({
  mediaType,
  query = "",
  page = 1,
  providerId,
  enabled = true,
}: UseCatalogOptions) {
  const { country } = useDisplayCurrency();
  const normalizedQuery = query.trim();

  const action = normalizedQuery
    ? "search"
    : providerId
      ? "discover"
      : "trending";

  return useQuery({
    queryKey: [
      "tmdb-catalog",
      mediaType,
      normalizedQuery || action,
      page,
      providerId ?? null,
      providerId ? country.iso2 : null,
    ],

    queryFn: () =>
      fetchTMDB<TMDBResponse>({
        action,
        mediaType,
        page,
        ...(normalizedQuery ? { query: normalizedQuery } : {}),
        ...(providerId ? {
          providerId,
          region: country.iso2,
        } : {}),
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
