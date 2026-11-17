
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function tmdbRequest(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  const token = Deno.env.get("TMDB_ACCESS_TOKEN");

  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN is not configured");
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const error = new Error(`TMDB returned ${response.status}`);
    Object.assign(error, { status: response.status });
    throw error;
  }

  return await response.json();
}
