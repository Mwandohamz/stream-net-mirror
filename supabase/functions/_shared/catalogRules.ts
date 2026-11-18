export const MAX_CATALOG_PAGE = 500;
export function positiveInteger(value: unknown, maximum = Number.MAX_SAFE_INTEGER): number {
  if ((typeof value !== "number" && typeof value !== "string") || value === "") throw new TypeError("Invalid integer");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > maximum) throw new TypeError("Invalid integer");
  return number;
}
export function regionCode(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !/^[A-Za-z]{2}$/.test(value)) throw new TypeError("Invalid country code");
  return value.toUpperCase();
}
export function containsTeam(text: string, team: string): boolean {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const name = normalize(team);
  return !!name && ` ${normalize(text)} `.includes(` ${name} `);
}

export interface MatchFixture { id: number; home_team: string; away_team: string }
export function reliableFixture(title: string, fixtures: MatchFixture[]): MatchFixture | undefined {
  const matches = fixtures.filter(fixture => containsTeam(title, fixture.home_team) && containsTeam(title, fixture.away_team));
  return matches.length === 1 ? matches[0] : undefined;
}

export function videoAvailability(status: { embeddable?: boolean; privacyStatus?: string; uploadStatus?: string }): "available" | "blocked" {
  return status.embeddable === true && status.privacyStatus === "public" && status.uploadStatus === "processed" ? "available" : "blocked";
}