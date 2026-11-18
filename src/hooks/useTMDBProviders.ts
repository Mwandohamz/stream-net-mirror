
import { useQuery } from "@tanstack/react-query";
import { useDisplayCurrency } from "@/context/CurrencyContext";
import {
  fetchTMDB,
  type TMDBMediaType,
  type TMDBProviderResponse,
} from "@/lib/tmdb";

export function useTMDBProviders(mediaType: TMDBMediaType) {
  const { country } = useDisplayCurrency();

  return useQuery({
    queryKey: ["tmdb-providers", mediaType, country.iso2],

    queryFn: () =>
      fetchTMDB<TMDBProviderResponse>({
        action: "providers",
        mediaType,
        region: country.iso2,
      }),

    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}
